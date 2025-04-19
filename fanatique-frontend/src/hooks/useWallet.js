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

  // Funções adicionais para verificar o token JWT e obter dados do usuário
  const hasValidToken = useCallback(() => {
    const savedToken = localStorage.getItem('auth_token');
    return !!savedToken && verified;
  }, [verified]);

  const getUserData = useCallback(async () => {
    if (!hasValidToken()) {
      return null;
    }

    try {
      const response = await api.get('/user');
      if (response.data && response.data.success) {
        return response.data.content;
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      
      // Se o token expirou ou é inválido, limpa os dados de autenticação
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('wallet_address');
        delete api.defaults.headers.common['Authorization'];
        setToken(null);
        setVerified(false);
      }
      
      return null;
    }
  }, [hasValidToken]);

  // Função para verificar o status de autenticação - Movida para antes do useEffect que a utiliza
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
  }, [checkAuthStatus]);

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
  const validateWalletInternal = async (walletAddress, name = undefined) => {
    if (!walletAddress) {
      return false;
    }

    try {
      setSigning(true);
      
      // Mensagem para assinatura
      const mensagem = `Validação de carteira no Fanatique: ${walletAddress}`;
      
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
      // Se o nome for fornecido, também envia para criar novo usuário
      const response = await api.post('/wallet/signature', {
        address: walletAddress,
        message: mensagem,
        signature,
        name
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
  const connectWallet = useCallback(async (forceValidation = false) => {
    try {
      setConnecting(true);
      
      // Verifica e adiciona a rede se necessário
      const redeCorreta = await verificarRede();
      if (!redeCorreta) {
        setConnecting(false);
        return false;
      }
      
      // Verifica se MetaMask está disponível
      if (!window.ethereum) {
        showError('MetaMask não detectada! Por favor, instale a extensão para continuar.');
        setConnecting(false);
        return false;
      }
      
      // Se já está conectado e tem token, apenas retorna, a menos que forceValidation seja true
      if (account && verified && !forceValidation) {
        setConnecting(false);
        return true;
      }
      
      try {
        // Solicita as contas ao usuário
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length === 0) {
          showError('Nenhuma conta encontrada ou acesso negado');
          setConnecting(false);
          return false;
        }
        
        // Define a conta conectada
        const currentAccount = accounts[0];
        setAccount(currentAccount);
        
        // Verifica token no localStorage e valida se for o mesmo endereço
        const savedToken = localStorage.getItem('auth_token');
        const savedWallet = localStorage.getItem('wallet_address');
        
        if (savedToken && savedWallet && 
            savedWallet.toLowerCase() === currentAccount.toLowerCase() && 
            !forceValidation) {
          // Se o token já existe, configura o header do axios
          api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
          setToken(savedToken);
          setVerified(true);
          return true;
        } else {
          // Se não tem token ou é outro endereço ou forceValidation=true, faz a validação
          const validated = await validateRef.current(currentAccount);
          return validated;
        }
      } catch (error) {
        if (error.code === 4001) {
          // Usuário rejeitou a conexão
          showError('Você recusou a conexão com a carteira');
        } else {
          showError('Erro ao conectar com a carteira: ' + (error.message || 'Erro desconhecido'));
        }
        console.error('Erro ao conectar carteira:', error);
        setConnecting(false);
        return false;
      }
    } catch (error) {
      console.error('Erro ao conectar carteira:', error);
      showError('Erro ao conectar carteira: ' + (error.message || 'Erro desconhecido'));
      setConnecting(false);
      return false;
    } finally {
      setConnecting(false);
    }
  }, [account, verified, verificarRede]);

  // Verificar validade do token em intervalos regulares
  useEffect(() => {
    // Verificar a autenticação periodicamente (a cada 5 minutos)
    const checkAuthStatus = async () => {
      if (token && verified) {
        const user = await getUserData();
        if (!user) {
          // Token inválido, desconectar
          await disconnectRef.current();
        }
      }
    };

    // Iniciar verificação periódica
    const interval = setInterval(checkAuthStatus, 5 * 60 * 1000); // 5 minutos
    
    // Verificar uma vez no início
    checkAuthStatus();
    
    return () => clearInterval(interval);
  }, [token, verified, getUserData]);

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

  // Função para registrar e autenticar com assinatura em um único passo
  const registerWithSignature = useCallback(async (userName) => {
    if (!account) {
      showError('Nenhuma carteira conectada');
      return false;
    }

    if (!userName || userName.trim() === '') {
      showError('Nome de usuário é obrigatório');
      return false;
    }

    try {
      // Validar com o nome de usuário
      return await validateRef.current(account, userName);
    } catch (error) {
      console.error('Erro ao registrar com assinatura:', error);
      showError('Erro ao registrar: ' + (error.message || 'Erro desconhecido'));
      return false;
    }
  }, [account]);

  // Função para verificar se a carteira já está cadastrada
  const checkWalletExists = useCallback(async (walletAddress) => {
    try {
      // Se não for fornecido um endereço, usa a carteira conectada
      const address = walletAddress || account;
      
      if (!address) {
        return { success: false, exists: false, message: 'Nenhuma carteira conectada' };
      }
      
      const response = await api.get(`/wallet/check/${address}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar existência da carteira:', error);
      return { 
        success: false, 
        exists: false, 
        message: error.response?.data?.message || 'Erro ao verificar carteira' 
      };
    }
  }, [account]);

  // Função para apenas conectar a carteira, sem solicitar assinatura
  const connectWalletOnly = useCallback(async () => {
    try {
      setConnecting(true);
      
      // Verifica e adiciona a rede se necessário
      const redeCorreta = await verificarRede();
      if (!redeCorreta) {
        setConnecting(false);
        return { success: false, message: 'Falha ao conectar à rede correta' };
      }
      
      // Verifica se MetaMask está disponível
      if (!window.ethereum) {
        showError('MetaMask não detectada! Por favor, instale a extensão para continuar.');
        setConnecting(false);
        return { success: false, message: 'MetaMask não detectada' };
      }
      
      try {
        // Solicita as contas ao usuário
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length === 0) {
          showError('Nenhuma conta encontrada ou acesso negado');
          setConnecting(false);
          return { success: false, message: 'Nenhuma conta encontrada' };
        }
        
        // Define a conta conectada
        const currentAccount = accounts[0];
        setAccount(currentAccount);
        
        // Verifica token no localStorage
        const savedToken = localStorage.getItem('auth_token');
        const savedWallet = localStorage.getItem('wallet_address');
        
        // Se já tem token válido para essa carteira, configura
        if (savedToken && savedWallet && 
            savedWallet.toLowerCase() === currentAccount.toLowerCase()) {
          api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
          setToken(savedToken);
          setVerified(true);
          return { 
            success: true, 
            address: currentAccount, 
            isAuthenticated: true 
          };
        }
        
        // Retorna sucesso, mas indicando que não está autenticado
        return { 
          success: true, 
          address: currentAccount, 
          isAuthenticated: false 
        };
      } catch (error) {
        if (error.code === 4001) {
          // Usuário rejeitou a conexão
          showError('Você recusou a conexão com a carteira');
        } else {
          showError('Erro ao conectar com a carteira: ' + (error.message || 'Erro desconhecido'));
        }
        console.error('Erro ao conectar carteira:', error);
        setConnecting(false);
        return { success: false, message: 'Conexão rejeitada ou erro' };
      }
    } catch (error) {
      console.error('Erro ao conectar carteira:', error);
      showError('Erro ao conectar carteira: ' + (error.message || 'Erro desconhecido'));
      setConnecting(false);
      return { success: false, message: 'Erro desconhecido ao conectar' };
    } finally {
      setConnecting(false);
    }
  }, [verificarRede]);

  // Função para solicitar assinatura para um endereço já conectado
  const requestSignature = useCallback(async (walletAddress = null) => {
    // Usa o endereço fornecido ou o endereço da carteira já conectada
    const address = walletAddress || account;
    
    if (!address) {
      showError('Nenhuma carteira conectada');
      return false;
    }
    
    try {
      // Valida usando apenas assinatura (sem nome)
      return await validateRef.current(address);
    } catch (error) {
      console.error('Erro ao solicitar assinatura:', error);
      showError('Erro ao solicitar assinatura: ' + (error.message || 'Erro desconhecido'));
      return false;
    }
  }, [account]);

  // Função para conectar carteira e verificar registro em uma única operação
  const connectAndCheckRegistration = useCallback(async () => {
    try {
      // Primeiro apenas conecta a carteira (sem solicitar assinatura)
      const connectResult = await connectWalletOnly();
      
      if (!connectResult.success) {
        return { success: false, message: connectResult.message || 'Falha ao conectar carteira' };
      }
      
      // Se já está autenticado, retorna sucesso
      if (connectResult.isAuthenticated) {
        return { success: true, needsRegistration: false, isAuthenticated: true };
      }
      
      // Verifica se a carteira já está cadastrada
      const walletCheck = await checkWalletExists();
      
      if (!walletCheck.success) {
        return { success: false, message: walletCheck.message || 'Erro ao verificar registro' };
      }
      
      // Retorna o resultado da verificação
      return { 
        success: true, 
        needsRegistration: !walletCheck.exists, 
        isAuthenticated: false,
        address: connectResult.address
      };
    } catch (error) {
      console.error('Erro ao conectar e verificar registro:', error);
      return { 
        success: false, 
        message: error.message || 'Erro ao conectar e verificar registro'
      };
    }
  }, [connectWalletOnly, checkWalletExists]);

  return {
    account,
    connecting,
    signing,
    verified,
    token,
    refreshingToken,
    connectWallet,
    disconnectWallet,
    hasValidToken,
    getUserData,
    checkAuthStatus,
    renewToken,
    registerWithSignature,
    checkWalletExists,
    connectAndCheckRegistration,
    connectWalletOnly,
    requestSignature
  };
} 