import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../hooks/useWalletContext';
import { Button } from '../components/ui-v2/Button';
import { Input } from '../components/ui/input';
import { Loader2, Wallet } from 'lucide-react';
import { showError, showSuccess } from '../lib/toast';
import { Cta11 } from '../components/ui/cta11';
import { MetaMaskDebug } from '../components/MetaMaskDebug';

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
    isConnected,
    isChilizNetwork,
    ensureChilizNetwork
  } = useWalletContext();

  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [userName, setUserName] = useState('');
  const [userNameError, setUserNameError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loginCancelled, setLoginCancelled] = useState(false);
  const [networkLoading, setNetworkLoading] = useState(false);

  // Regex para validar caracteres permitidos no nome de usuário
  const validCharsRegex = /^[a-zA-Z0-9_]+$/;
  
  // Contador de tentativas de assinatura
  const [signAttempts, setSignAttempts] = useState(0);

  // Função para verificar se o usuário está cadastrado
  const checkIfUserRegistered = useCallback(async () => {
    try {
      setLoading(true);
      
      // Verifica se o usuário já cancelou muitas vezes
      if (signAttempts >= 2) {
        setLoginCancelled(true);
        setLoading(false);
        return;
      }
      
      // Reseta o flag de cancelamento apenas se for a primeira tentativa
      if (signAttempts === 0) {
        setLoginCancelled(false);
      }
      
      if (!account) {
        setLoading(false);
        return;
      }
      
      // Verifica se o usuário já está cadastrado antes de verificar a rede
      // Isso evita verificações de rede desnecessárias
      const walletCheck = await checkWalletExists();
      console.log("1- walletCheck", walletCheck);
      
      if (!walletCheck.success) {
        showError(walletCheck.message || 'Erro ao verificar cadastro');
        setLoading(false);
        return;
      }
      
      // Se o usuário não estiver cadastrado, exibe o formulário de registro
      if (!walletCheck.exists) {
        setShowRegister(true);
        setLoading(false);
        return;
      }
      
      // Só verifica a rede se o usuário já estiver cadastrado
      // Isso evita solicitações duplicadas
      if (!isChilizNetwork) {
        setNetworkLoading(true);
        const networkCorrect = await ensureChilizNetwork();
        setNetworkLoading(false);
        
        if (!networkCorrect) {
          showError("Você precisa estar na rede Chiliz para continuar");
          setLoginCancelled(true);
          setLoading(false);
          return;
        }
      }
      
      // Incrementa o contador de tentativas de assinatura
      setSignAttempts(prev => prev + 1);
      
      // Solicita assinatura apenas uma vez
      const result = await requestSignature();
      
      // Verifica se o login foi bem-sucedido
      if (result === true) {
        // Aguarda um pouco para garantir que os dados estejam persistidos
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Se chegamos aqui com sucesso, o contexto já deve ter atualizado o estado
        navigate('/dashboard');
        return;
      } else {
        console.log('App: Falha no login, exibindo botão para tentar novamente');
        
        // Se o usuário cancelou explicitamente ou houve erro de spam, incrementamos a contagem
        if (result && (result.cancelled || result.spamBlocked)) {
          console.log('Login falhou:', result);
          
          if (result.spamBlocked) {
            // Para erros de spam, aguarda um pouco mais antes de permitir nova tentativa
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          
          setSignAttempts(prev => prev + 1);
        }
        
        setLoginCancelled(true);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Erro ao verificar cadastro:", error);
      showError('Erro ao verificar se o usuário está cadastrado');
      setLoading(false);
    }
  }, [account, checkWalletExists, requestSignature, navigate, signAttempts, isChilizNetwork, ensureChilizNetwork]);

  // Verificar se o usuário já está autenticado e redirecionar para o dashboard
  useEffect(() => {
    const init = async () => {
      // Se já está autenticado, redireciona diretamente para o dashboard
      if (isAuthenticated) {
        navigate('/dashboard');
        return;
      }
      
      // Se já está conectado mas não autenticado, verifica registro
      // Mas só se não estiver no modo de login cancelado
      if (isConnected && account && !loginCancelled) {
        await checkIfUserRegistered();
      } else {
        setLoading(false);
      }
    };
    
    init();
  }, [isAuthenticated, isConnected, account, navigate, checkIfUserRegistered, loginCancelled]);

  // Função para apenas conectar a carteira
  const handleConnectWallet = async () => {
    try {
      // Evita múltiplas tentativas enquanto está carregando
      if (loading || signing || networkLoading) {
        return;
      }
      
      setLoading(true);
      setLoginCancelled(false);
      // Reseta o contador de tentativas ao conectar a carteira
      setSignAttempts(0);
      
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
      
      // Aguarda um pouco antes de prosseguir para dar tempo para a MetaMask processar
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
    
    if (!validCharsRegex.test(userName)) {
      showError('Nome de usuário deve conter apenas letras, números e underscore (_)');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Aguarda um momento antes de prosseguir
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Registra o usuário e faz a assinatura em um único passo
      const result = await registerWithSignature(userName);
      
      // Verifica se o resultado foi sucesso (true) ou objeto de erro
      if (result === true) {
        showSuccess('Cadastro realizado com sucesso!');
        
        // Aguarda um pouco para garantir persistência
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Navega para o dashboard
        navigate('/dashboard');
      } else {
        // Se não teve sucesso, pode ser por diversos motivos
        if (result && result.cancelled) {
          console.log('Usuário cancelou o registro');
          setSignAttempts(prev => prev + 1);
        } else if (result && result.spamBlocked) {
          console.log('Registro bloqueado por spam filter');
          // Aguarda um pouco mais para erros de spam
          await new Promise(resolve => setTimeout(resolve, 3000));
          setSignAttempts(prev => prev + 1);
        }
        
        setLoginCancelled(true);
      }
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      showError(error.response?.data?.message || 'Erro ao cadastrar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUserNameChange = (e) => {
    const value = e.target.value;
    setUserName(value);
    
    if (!value.trim()) {
      setUserNameError('');
    } else if (!validCharsRegex.test(value)) {
      setUserNameError('Nome de usuário deve conter apenas letras, números e underscore (_)');
    } else {
      setUserNameError('');
    }
  };

  // Mostra a tela de loading
  if (loading || signing || networkLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-secondary" />
        <p className="mt-4 text-xl text-primary/70 dark:text-white/70">
          {loading ? 'Carregando...' : signing ? 'Validando assinatura...' : networkLoading ? 'Verificando rede Chiliz...' : ''}
        </p>
      </div>
    );
  }

  // Se não tiver conta conectada, mostra a interface inicial para conectar carteira
  if (!isConnected || !account || loginCancelled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] "
      >
        <Cta11 
          heading={loginCancelled ? "Login Cancelado" : "Bem-vindo ao Fanatique"}
          description="Conecte sua carteira Chiliz para entrar na plataforma e aproveitar uma experiência única nos estádios."
          buttons={{
            primary: {
              text: "Login MetaMask",
              onClick: handleConnectWallet,
              icon: <Wallet size={18} />
            }
          }}
        />
{/*         <div className="container mx-auto max-w-md">
          <MetaMaskDebug />
        </div> */}
      </div>
    );
  }


  // Mostra o formulário de registro se o usuário não estiver cadastrado
  if (showRegister) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
        <div className="w-full max-w-md p-8 bg-black rounded-lg shadow-md">
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
                onChange={handleUserNameChange}
                placeholder="Digite seu nome de usuário"
                required
                className="w-ful"
                autoFocus
              />
              {userNameError && (
                <p className="text-sm text-red-500 mt-1">{userNameError}</p>
              )}
            </div>
            
            <div className="flex gap-4">
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  disconnectWallet();
                  setShowRegister(false);
                }}
                disabled={submitting}
                className="flex-1 bg-secondary text-white"
                text="Cancelar"
              />
              <Button
                type="submit"
                disabled={submitting || !!userNameError || !userName.trim()}
                className="flex-1 bg-primary text-white"
                text={submitting ? "Processando" : "Cadastrar"}
                icon={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              />
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