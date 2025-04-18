import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Loader2 } from 'lucide-react';
import api from '../lib/api';
import { showError, showSuccess } from '../lib/toast';

export default function AppPage() {
  const navigate = useNavigate();
  const {
    account,
    connecting,
    signing,
    verified,
    connectWallet,
    disconnectWallet,
    hasValidToken,
    getUserData
  } = useWallet();

  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [userName, setUserName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Verifica se a carteira está conectada
    async function checkWalletStatus() {
      try {
        setLoading(true);
        
        // Se não há carteira conectada, solicitamos conexão
        if (!account) {
          const connected = await connectWallet();
          if (!connected) {
            // Se o usuário recusou conexão, voltamos para a home
            navigate('/');
            return;
          }
        }
        
        // Verificamos se temos um JWT válido
        if (hasValidToken()) {
          // Se temos token, carregamos os dados do usuário
          try {
            const userData = await getUserData();
            if (userData) {
              // Usuário autenticado, redireciona para área logada
              navigate('/dashboard');
              return;
            }
          } catch (error) {
            console.error("Erro ao carregar dados do usuário:", error);
          }
        }
        
        // Se não temos token ou falhou ao carregar dados do usuário,
        // verificamos se o usuário já está cadastrado
        try {
          const response = await api.get(`/wallet/check/${account}`);
          
          if (response.data && response.data.exists) {
            // Usuário já cadastrado, só precisa assinar a mensagem
            await connectWallet(true); // true = forçar nova assinatura
            if (verified) {
              navigate('/dashboard');
            }
          } else {
            // Usuário não cadastrado, mostramos formulário de registro
            setShowRegister(true);
          }
        } catch (error) {
          console.error("Erro ao verificar usuário:", error);
          setShowRegister(true);
        }
      } catch (error) {
        console.error("Erro geral:", error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    
    checkWalletStatus();
  }, [account, connectWallet, getUserData, hasValidToken, navigate, verified]);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!userName.trim()) {
      showError('Por favor, informe seu nome de usuário');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Registra o usuário e faz a assinatura
      const response = await api.post('/user', {
        name: userName,
        wallet_address: account
      });
      
      if (response.data && response.data.success) {
        showSuccess('Cadastro realizado com sucesso!');
        
        // Força nova assinatura para login
        await connectWallet(true);
        if (verified) {
          navigate('/dashboard');
        }
      } else {
        showError(response.data.message || 'Erro ao cadastrar usuário');
      }
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      showError(error.response?.data?.message || 'Erro ao cadastrar usuário');
    } finally {
      setSubmitting(false);
    }
  };

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
              />
            </div>
            
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  disconnectWallet();
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

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-[#fafafa] dark:bg-[#0d0117]">
      <div className="text-center">
        <p className="text-xl text-primary/70 dark:text-white/70 mb-4">
          Algo deu errado. Por favor, tente novamente.
        </p>
        <Button
          onClick={() => {
            disconnectWallet();
            navigate('/');
          }}
          className="bg-secondary text-white"
        >
          Voltar para o início
        </Button>
      </div>
    </div>
  );
} 