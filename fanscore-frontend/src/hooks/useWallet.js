import { useState, useCallback, useEffect, useRef } from 'react';
import { createConfig, http } from 'wagmi';
import { metaMask } from 'wagmi/connectors';
import api from '../lib/api';
import { showError, showSuccess, showInfo } from '../lib/toast';

// Definindo a rede de teste Chiliz (Spicy)
const chilizTestnet = {
  id: 88882,
  name: 'Chiliz Spicy Testnet',
  network: 'chiliz-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'CHZ',
    symbol: 'CHZ',
  },
  rpcUrls: {
    public: { http: ['https://spicy-rpc.chiliz.com/'] },
    default: { http: ['https://spicy-rpc.chiliz.com/'] },
  },
  blockExplorers: {
    default: { name: 'Spicy Block Explorer', url: 'https://testnet.chiliscan.com/' },
  },
};

const wagmiConfig = createConfig({
  chains: [chilizTestnet],
  connectors: [
    metaMask()
  ],
  transports: {
    [chilizTestnet.id]: http()
  }
});

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [signing, setSigning] = useState(false);
  const [verified, setVerified] = useState(false);
  const [token, setToken] = useState(null);
  const [refreshingToken, setRefreshingToken] = useState(false);

  // Referências para evitar dependências circulares entre as funções
  const disconnectRef = useRef(null);
  const validateRef = useRef(null);
  const renewTokenRef = useRef(null);

  // Verificar se a carteira e o token já estão disponíveis ao carregar
  useEffect(() => {
    const checkConnection = async () => {
      // Verificar se há token no localStorage
      const savedToken = localStorage.getItem('auth_token');
      const savedWallet = localStorage.getItem('wallet_address');
      
      if (savedToken && savedWallet && window.ethereum) {
        // Verifica se o endereço salvo corresponde ao endereço atual da MetaMask
        if (window.ethereum.selectedAddress && 
            window.ethereum.selectedAddress.toLowerCase() === savedWallet.toLowerCase()) {
          setAccount(window.ethereum.selectedAddress);
          setToken(savedToken);
          setVerified(true);
          
          // Configura o token no cabeçalho do axios para todas as futuras requisições
          api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
          
          // Verificar imediatamente se o token está válido
          checkAuthStatus();
        } else {
          // Se o endereço não corresponder, limpa o armazenamento
          localStorage.removeItem('auth_token');
          localStorage.removeItem('wallet_address');
        }
      }
    };

    checkConnection();
  }, []);

  // Função para verificar se a carteira está na rede correta
  const verificarRede = useCallback(async () => {
    if (!window.ethereum) {
      showError('MetaMask não detectada!');
      return false;
    }

    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      // Verifica se está na rede correta
      if (parseInt(chainId, 16) !== chilizTestnet.id) {
        // Tenta adicionar/trocar para a rede Chiliz Testnet
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${chilizTestnet.id.toString(16)}` }],
          });
          return true;
        } catch (switchError) {
          // Se a rede não existe na carteira, tenta adicioná-la
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: `0x${chilizTestnet.id.toString(16)}`,
                    chainName: chilizTestnet.name,
                    nativeCurrency: chilizTestnet.nativeCurrency,
                    rpcUrls: [chilizTestnet.rpcUrls.default.http[0]],
                    blockExplorerUrls: [chilizTestnet.blockExplorers.default.url],
                  },
                ],
              });
              return true;
            } catch (addError) {
              console.error('Erro ao adicionar rede:', addError);
              showError('Não foi possível adicionar a rede Chiliz Testnet');
              return false;
            }
          } else {
            console.error('Erro ao trocar de rede:', switchError);
            showError('Não foi possível trocar para a rede Chiliz Testnet');
            return false;
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Erro ao verificar rede:', error);
      return false;
    }
  }, []);

  // Função para desconectar carteira
  const disconnectWallet = useCallback(async () => {
    try {
      if (account) {
        const connector = wagmiConfig.connectors[0];
        await connector.disconnect();
        setAccount(null);
        setVerified(false);
        setToken(null);
        
        // Limpar o token do localStorage e dos cabeçalhos do axios
        localStorage.removeItem('auth_token');
        localStorage.removeItem('wallet_address');
        delete api.defaults.headers.common['Authorization'];
      }
    } catch (err) {
      console.error('Erro ao desconectar:', err);
      showError('Falha ao desconectar a carteira.');
    }
  }, [account]);

  // Atribuir à referência após a definição
  disconnectRef.current = disconnectWallet;

  // Função interna para assinar a mensagem e validar a carteira
  const validateWalletInternal = async (walletAddress) => {
    if (!walletAddress) {
      return false;
    }

    try {
      setSigning(true);
      
      // Mensagem para assinatura
      const mensagem = `Validação de carteira no FanScore: ${walletAddress}`;
      
      // Solicita assinatura ao usuário
      showInfo('Por favor, assine a mensagem para entrar na plataforma');
      
      // Solicita assinatura
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [
          mensagem,
          walletAddress
        ]
      });
      
      // Envia a assinatura para o backend para validação
      const response = await api.post('/wallet/signature', {
        address: walletAddress,
        message: mensagem,
        signature
      });
      
      // Verifica se a validação foi bem-sucedida
      if (response.data.content && response.data.content.success) {
        const { token } = response.data.content;
        
        if (token) {
          // Armazena o token e o endereço da carteira
          localStorage.setItem('auth_token', token);
          localStorage.setItem('wallet_address', walletAddress);
          
          // Configura o token no header do axios para futuras requisições
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Atualiza o estado
          setToken(token);
          setVerified(true);
          
          showSuccess('Login realizado com sucesso!');
          return true;
        } else {
          showError('Autenticação falhou: Token não recebido');
          if (disconnectRef.current) {
            await disconnectRef.current();
          }
          return false;
        }
      } else {
        showError('Falha na validação: ' + (response.data.message || 'Erro desconhecido'));
        // Se a validação falhar, desconectar a carteira
        if (disconnectRef.current) {
          await disconnectRef.current();
        }
        return false;
      }
    } catch (err) {
      console.error('Erro ao validar carteira:', err);
      if (err.code === 4001) { // Usuário rejeitou a assinatura
        showError('Assinatura cancelada pelo usuário. É necessário assinar para entrar na plataforma.');
      } else {
        showError('Falha no login: ' + (err.message || 'Erro desconhecido'));
      }
      // Se ocorrer algum erro, desconectar a carteira
      if (disconnectRef.current) {
        await disconnectRef.current();
      }
      return false;
    } finally {
      setSigning(false);
    }
  };

  // Atribuir à referência após a definição
  validateRef.current = validateWalletInternal;

  // Função para conectar carteira
  const connectWallet = useCallback(async () => {
    try {
      setConnecting(true);
      
      // Verifica e adiciona a rede se necessário
      const redeCorreta = await verificarRede();
      if (!redeCorreta) {
        setConnecting(false);
        return;
      }
      
      const connector = wagmiConfig.connectors[0];
      
      const result = await connector.connect();
      const walletAddress = result.accounts[0];
      setAccount(walletAddress);
      
      // Inicia o processo de validação automaticamente
      if (validateRef.current) {
        await validateRef.current(walletAddress);
      }
    } catch (err) {
      console.error('Erro ao conectar carteira:', err);
      showError('Falha ao conectar carteira');
    } finally {
      setConnecting(false);
    }
  }, [verificarRede]);

  // Versão pública da função de validação (mantida para compatibilidade)
  const validateWallet = useCallback(async () => {
    if (!account) {
      showError('Carteira não conectada!');
      return false;
    }
    if (validateRef.current) {
      return validateRef.current(account);
    }
    return false;
  }, [account]);

  // Função para renovar o token quando ele expirar
  const renewToken = useCallback(async () => {
    // Verifica se temos uma carteira conectada
    if (!account) {
      return false;
    }

    try {
      setRefreshingToken(true);
      showInfo('Sua sessão expirou. Assinando novamente para renovar...');
      
      // Executar validação da carteira novamente
      if (validateRef.current) {
        const success = await validateRef.current(account);
        if (success) {
          showSuccess('Sessão renovada com sucesso!');
          return true;
        } else {
          showError('Não foi possível renovar sua sessão. Por favor, conecte novamente.');
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      showError('Erro ao renovar sessão');
      return false;
    } finally {
      setRefreshingToken(false);
    }
  }, [account]);
  
  // Atribuir à referência após a definição
  renewTokenRef.current = renewToken;

  // Interceptor para tratar tokens expirados em qualquer requisição
  useEffect(() => {
    // Adicionar um interceptor para todas as requisições
    const responseInterceptor = api.interceptors.response.use(
      response => response,
      async error => {
        // Verificar se é um erro de token expirado
        const isTokenExpiredError = error.response && 
          error.response.status === 401 && 
          error.response.data && 
          (error.response.data.code === 'TOKEN_EXPIRED' || 
           (error.response.data.message && error.response.data.message.includes('expirado')));
        
        if (isTokenExpiredError) {
          try {
            // Verificar se já não está renovando o token e se tem uma carteira conectada
            if (!refreshingToken && account && renewTokenRef.current) {
              // Tentar renovar o token
              const tokenRenewed = await renewTokenRef.current();
              
              if (tokenRenewed) {
                // Se o token foi renovado com sucesso, repetir a requisição original
                const newToken = localStorage.getItem('auth_token');
                
                if (newToken) {
                  // Atualizar o cabeçalho com o novo token
                  error.config.headers['Authorization'] = `Bearer ${newToken}`;
                  
                  // Repetir a requisição com o novo token
                  return api(error.config);
                }
              } else {
                // Se não conseguiu renovar, limpar a sessão
                if (disconnectRef.current) {
                  await disconnectRef.current();
                }
              }
            }
          } catch (renewError) {
            console.error('Erro ao renovar token automaticamente:', renewError);
          }
        }
        
        // Se não conseguiu renovar o token, propaga o erro
        return Promise.reject(error);
      }
    );
    
    // Limpeza do interceptor quando o componente for desmontado
    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [account, refreshingToken]);

  // Função para verificar o status de autenticação
  const checkAuthStatus = useCallback(async () => {
    if (!token) {
      return { authenticated: false, message: 'Não autenticado' };
    }

    try {
      // Chamar a rota protegida para verificar a autenticação
      const response = await api.get('/wallet/me');
      return { 
        authenticated: true, 
        wallet: response.data.content.wallet,
        user_id: response.data.content.user_id
      };
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      
      // Verificar se é um erro de token expirado
      const isTokenExpiredError = error.response && 
        error.response.status === 401 && 
        error.response.data && 
        (error.response.data.code === 'TOKEN_EXPIRED' || 
         (error.response.data.message && error.response.data.message.includes('expirado')));
      
      // Se for um erro de token expirado, tenta renovar
      if (isTokenExpiredError) {
        // Tentar renovar o token
        if (account && renewTokenRef.current && !refreshingToken) {
          const tokenRenewed = await renewTokenRef.current();
          if (tokenRenewed) {
            // Se conseguiu renovar, informa que está autenticado
            return { authenticated: true, message: 'Token renovado com sucesso' };
          }
        }
      }
      
      // Para outros erros 401/403, limpa a sessão
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        // Limpar os dados da sessão apenas se não estiver tentando renovar o token
        if (!refreshingToken) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('wallet_address');
          delete api.defaults.headers.common['Authorization'];
          
          // Resetar o estado
          setToken(null);
          setVerified(false);
          if (account) {
            // Manter conta conectada mas não autenticada
            showError('Sessão expirada. Por favor, autentique-se novamente.');
          }
        }
      }
      
      return { authenticated: false, message: 'Erro de autenticação' };
    }
  }, [token, account, refreshingToken]);

  return {
    account,
    connecting,
    signing,
    verified,
    token,
    refreshingToken,
    connectWallet,
    disconnectWallet,
    validateWallet,
    checkAuthStatus,
    renewToken
  };
} 