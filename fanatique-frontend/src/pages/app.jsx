import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Loader2, Wallet } from 'lucide-react';
import { showError, showSuccess } from '../lib/toast';
import { Cta11 } from '../components/ui/cta11';

export default function AppPage() {
  const navigate = useNavigate();
  const {
    account,
    connecting,
    signing,
    disconnectWallet,
    hasValidToken,
    getUserData,
    registerWithSignature,
    connectWalletOnly,
    requestSignature,
    checkWalletExists
  } = useWallet();

  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [userName, setUserName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);

  // Função para verificar se o usuário está cadastrado
  const checkIfUserRegistered = useCallback(async () => {
    try {
      setLoading(true);
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
          navigate('/dashboard');
          return;
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Erro ao verificar cadastro:", error);
      showError('Erro ao verificar se o usuário está cadastrado');
      setLoading(false);
    }
  }, [account, checkWalletExists, requestSignature, navigate]);

  // Função para apenas conectar a carteira
  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      // Apenas conecta a carteira (sem solicitar assinatura)
      const connectResult = await connectWalletOnly();
      
      if (!connectResult.success) {
        showError(connectResult.message || 'Erro ao conectar carteira');
        setLoading(false);
        return;
      }
      
      // Marca a carteira como conectada
      setWalletConnected(true);
      
      // Se já está autenticado, redireciona para o dashboard
      if (connectResult.isAuthenticated) {
        const userData = await getUserData();
        if (userData) {
          navigate('/dashboard');
          return;
        }
      }
      
      // Após conectar com sucesso, verifica se o usuário está cadastrado
      // e solicita assinatura automaticamente se ele já estiver cadastrado
      await checkIfUserRegistered();
    } catch (error) {
      console.error("Erro ao conectar carteira:", error);
      showError('Erro ao conectar carteira');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Verifica se a carteira está conectada
    async function checkWalletStatus() {
      try {
        setLoading(true);
        
        // Se não há carteira conectada, não faz nada
        if (!account) {
          setLoading(false);
          setWalletConnected(false);
          return;
        }
        
        // Marca a carteira como conectada
        setWalletConnected(true);
        
        // Se já tem token válido, redireciona para o dashboard
        if (hasValidToken()) {
          const userData = await getUserData();
          if (userData) {
            navigate('/dashboard');
            return;
          }
        }
        
        // Verifica se o usuário já está cadastrado
        await checkIfUserRegistered();
      } catch (error) {
        console.error("Erro ao verificar status da carteira:", error);
        setLoading(false);
      }
    }
    
    checkWalletStatus();
  }, [account, hasValidToken, getUserData, navigate, checkIfUserRegistered]);

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
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      showError(error.response?.data?.message || 'Erro ao cadastrar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  // Mostra a tela de loading
  if (loading || connecting || signing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-[#fafafa] dark:bg-[#0d0117]">
        <Loader2 className="h-12 w-12 animate-spin text-secondary" />
        <p className="mt-4 text-xl text-primary/70 dark:text-white/70">
          {loading ? 'Carregando...' : connecting ? 'Conectando à carteira...' : 'Validando assinatura...'}
        </p>
      </div>
    );
  }

  // Se não tiver conta conectada, mostra a interface inicial para conectar carteira
  if (!walletConnected || !account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-[#fafafa] dark:bg-[#0d0117]">
        <Cta11 
          heading="Bem-vindo ao Fanatique"
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

  // Mostra o formulário de registro se o usuário não estiver cadastrado
  if (showRegister) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-[#fafafa] dark:bg-[#0d0117]">
        <div className="w-full max-w-md p-8 bg-white dark:bg-[#150924] rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-primary dark:text-white mb-6">Cadastre-se no Fanatique</h1>
          
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
                  setWalletConnected(false);
                  setShowRegister(false);
                  navigate('/');
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

  // Usuário com carteira conectada e já cadastrado, mas não logado
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-[#fafafa] dark:bg-[#0d0117]">
      <div className="w-full max-w-md p-8 bg-white dark:bg-[#150924] rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-primary dark:text-white mb-6">Processando Login</h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Sua carteira está conectada. Aguarde enquanto processamos seu login.
        </p>
        
        <div className="flex flex-col gap-4 items-center">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solicitando assinatura...
          </p>
          
          <Button
            variant="outline"
            onClick={() => {
              disconnectWallet();
              setWalletConnected(false);
              setShowRegister(false);
              navigate('/');
            }}
            className="mt-4 w-full"
          >
            Cancelar e Desconectar Carteira
          </Button>
        </div>
      </div>
    </div>
  );
} 