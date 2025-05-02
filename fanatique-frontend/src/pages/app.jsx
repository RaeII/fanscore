import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../hooks/useWalletContext';
import { Button } from '../components/ui-v2/Button';
import { Input } from '../components/ui/input';
import { Loader2, Wallet } from 'lucide-react';
import { showError, showSuccess } from '../lib/toast';
import { Cta11 } from '../components/ui/cta11';

export default function AppPage() {
  const navigate = useNavigate();
  const {
    account,
    signing,
    disconnectWallet,
    registerWithSignature,
    connectWallet,
    requestSignature,
    checkWalletExists,
    isAuthenticated,
    isConnected
  } = useWalletContext();

  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [userName, setUserName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loginCancelled, setLoginCancelled] = useState(false);

  // Função para verificar se o usuário está cadastrado
  const checkIfUserRegistered = useCallback(async () => {
    try {
      setLoading(true);
      setLoginCancelled(false);
      
      if (!account) {
        setLoading(false);
        return;
      }
      
      // Verifica se o usuário já está cadastrado
      const walletCheck = await checkWalletExists();
      
      if (!walletCheck.success) {
        showError(walletCheck.message || 'Erro ao verificar cadastro');
        setLoading(false);
        return;
      }
      
      
      // Se o usuário não estiver cadastrado, exibe o formulário de registro
      setShowRegister(!walletCheck.exists);
      
      // Se o usuário já estiver cadastrado, solicita a assinatura automaticamente
      if (walletCheck.exists) {
        
        const loggedIn = await requestSignature();
        
        if (loggedIn) {
          
          // Aguarda um pouco para garantir que os dados estejam persistidos
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Se chegamos aqui com sucesso, o contexto já deve ter atualizado o estado
          navigate('/dashboard');
          return;
        } else {
          console.log('App: Falha no login, exibindo botão para tentar novamente');
          setLoginCancelled(true);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Erro ao verificar cadastro:", error);
      showError('Erro ao verificar se o usuário está cadastrado');
      setLoading(false);
    }
  }, [account, checkWalletExists, requestSignature, navigate]);

  // Verificar se o usuário já está autenticado e redirecionar para o dashboard
  useEffect(() => {
    (async () => {
      if (isAuthenticated) {
        navigate('/dashboard');
        return;
      }
      
      // Se já está conectado mas não autenticado, verifica registro
      if (isConnected && account) {
        await checkIfUserRegistered();
      } else {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, isConnected, account, navigate, checkIfUserRegistered]);

  // Função para apenas conectar a carteira
  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      setLoginCancelled(false);
      
      // Conectar a carteira
      const connected = await connectWallet();
      
      if (!connected || !isConnected) {
        setLoading(false);
        return;
      }
      
      // Se já está autenticado, redireciona para o dashboard
      if (isAuthenticated) {
        console.log('Usuário já autenticado, redirecionando para dashboard');
        navigate('/dashboard');
        return;
      }
      
      // Após conectar com sucesso, verifica se o usuário está cadastrado
      await checkIfUserRegistered();
    } catch (error) {
      console.error("Erro ao conectar carteira:", error);
      showError('Erro ao conectar carteira');
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!userName.trim()) {
      showError('Por favor, informe seu nome de usuário');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Registra o usuário e faz a assinatura em um único passo
      const success = await registerWithSignature(userName);
      
      if (success) {
        showSuccess('Cadastro realizado com sucesso!');
        
        // Aguarda um pouco para garantir persistência
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Navega para o dashboard
        navigate('/dashboard');
      } else {
        // Se não teve sucesso, provavelmente o usuário cancelou a assinatura
        setLoginCancelled(true);
      }
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      showError(error.response?.data?.message || 'Erro ao cadastrar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  // Mostra a tela de loading
  if (loading || signing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-secondary" />
        <p className="mt-4 text-xl text-primary/70 dark:text-white/70">
          {loading ? 'Carregando...' : signing ? 'Validando assinatura...' : ''}
        </p>
      </div>
    );
  }

  // Se não tiver conta conectada, mostra a interface inicial para conectar carteira
  if (!isConnected || !account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] "
      >
        <Cta11 
          heading={loginCancelled ? "Login Cancelado" : "Bem-vindo ao Fanatique"}
          description="Conecte sua carteira Chiliz para entrar na plataforma e aproveitar uma experiência única nos estádios."
          buttons={{
            primary: {
              text: "Conectar Carteira",
              onClick: handleConnectWallet,
              icon: <Wallet size={18} />
            }
          }}
        />
      </div>
    );
  }

  // Se o login foi cancelado mas a carteira continua conectada
  if (loginCancelled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
        <div className="w-full max-w-md p-8 bg-tertiary rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-primary dark:text-white mb-6">Login Canceladoooo</h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Você precisa assinar a mensagem para entrar na plataforma.
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={checkIfUserRegistered} 
              className="w-full bg-secondary text-white"
            >
              Tentar Novamente
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                disconnectWallet();
                setLoginCancelled(false);
              }}
              className="w-full"
            >
              Desconectar Carteira
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Mostra o formulário de registro se o usuário não estiver cadastrado
  if (showRegister) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
        <div className="w-full max-w-md p-8 bg-tertiary rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-primary dark:text-white mb-6">Cadastre-se no Fanatique</h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Você está conectado com uma carteira nova! Para continuar, digite seu nome de usuário e assine a mensagem de verificação.
          </p>
          
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-primary/80 dark:text-white/80">
                Nome de usuário
              </label>
              <Input
                id="username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Digite seu nome de usuário"
                required
                className="w-full"
                autoFocus
              />
            </div>
            
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  disconnectWallet();
                  setShowRegister(false);
                }}
                disabled={submitting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-secondary text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando
                  </>
                ) : (
                  'Cadastrar'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Exibe tela para usuários não cadastrados
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
      <div className="w-full max-w-md p-8 bg-secondary rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-6">Verificando cadastro...</h1>

        <Button
          onClick={checkIfUserRegistered}
          text="Continuar"
        />
      </div>
    </div>
  );
} 