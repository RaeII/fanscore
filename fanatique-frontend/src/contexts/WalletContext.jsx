import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import api from '../lib/api';
import { showError, showSuccess, showInfo } from '../lib/toast';
import { WalletContext } from './WalletContextDef';

// Provider que envolverá a aplicação
export function WalletProvider({ children }) {
  // Estados para gerenciar a carteira
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [token, setToken] = useState(null);
  const [signing, setSigning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  // Verifica se o MetaMask está disponível
  const checkIfMetaMaskAvailable = useCallback(() => {
    return window.ethereum && window.ethereum.isMetaMask;
  }, []);
  
  // Obtém um signer para transações
  const getSigner = useCallback(async () => {
    try {
      if (!provider) {
        return null;
      }
      
      if (!isConnected) {
        return null;
      }
      
      // Verifica se já temos um signer válido antes de solicitar um novo
      if (signer) {
        return signer;
      }
      
      const ethSigner = await provider.getSigner();
      setSigner(ethSigner);
      return ethSigner;
    } catch (error) {
      console.error('Erro ao obter signer:', error);
      return null;
    }
  }, [provider, isConnected, signer]);
  
  // Limpa as credenciais
  const clearAuthCredentials = useCallback(() => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('wallet_address');
      delete api.defaults.headers.common['Authorization'];
      setToken(null);
      setIsAuthenticated(false);
      return true;
    } catch (error) {
      console.error('WalletContext: Erro ao remover credenciais', error);
      return false;
    }
  }, []);
  
  // Função para lidar com a mudança de contas no MetaMask
  const handleAccountsChanged = useCallback((accounts) => {
    if (accounts.length === 0) {
      // Usuário desconectou conta
      clearAuthCredentials();
      setIsConnected(false);
      setAddress(null);
      setSigner(null);
    } else if (accounts[0] !== address) {
      // Usuário trocou de conta
      clearAuthCredentials();
      setAddress(accounts[0]);
      setIsConnected(true);
      
      // Atualiza o signer com o novo endereço
      getSigner().catch(console.error);
    }
  }, [address, clearAuthCredentials, getSigner]);
  
  // Função para lidar com a desconexão do MetaMask
  const handleDisconnect = useCallback(() => {
    clearAuthCredentials();
    setIsConnected(false);
    setAddress(null);
    setSigner(null);
  }, [clearAuthCredentials]);
  
  // Verifica o estado de autenticação e restaura se necessário
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Inicializa o provider independente de autenticação
        if (!provider && window.ethereum) {
          try {
            const ethersProvider = new ethers.BrowserProvider(window.ethereum);
            setProvider(ethersProvider);
          } catch (providerError) {
            console.error('Erro ao inicializar provider:', providerError);
            // Continua mesmo com erro no provider
          }
        }
        
        // Verifica se há dados armazenados
        const savedToken = localStorage.getItem('auth_token');
        const savedWallet = localStorage.getItem('wallet_address');
        
        if (savedToken && savedWallet) {
          // Configura o token no cabeçalho da API
          api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
          setToken(savedToken);
          setAddress(savedWallet);
          setIsAuthenticated(true);
          setIsConnected(true);
          
          // Obter o signer após restaurar o estado da carteira
          await getSigner();
        } else {
          setIsAuthenticated(false);
          console.log('WalletContext: Sem dados de autenticação no localStorage');
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setIsInitialized(true);
      }
    };
    
    // Só executa a verificação de autenticação se o window.ethereum estiver disponível
    if (window.ethereum) {
      checkAuth();
      
      // Adicionar listeners para eventos do MetaMask
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
      window.ethereum.on('disconnect', handleDisconnect);
      
      // Define o limite máximo de listeners para evitar avisos
      if (window.ethereum.setMaxListeners) {
        window.ethereum.setMaxListeners(100);
      }
    } else {
      setIsInitialized(true);
    }
    
    return () => {
      // Remover listeners ao desmontar o componente
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', () => {});
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [handleAccountsChanged, handleDisconnect, provider, getSigner]);
  
  // Função para conectar a carteira
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      showError('MetaMask não está instalado. Por favor, instale a extensão MetaMask para continuar.');
      window.open('https://metamask.io/download/', '_blank', 'noopener,noreferrer');
      return false;
    }
    
    try {
      setConnecting(true);
      
      // Inicializa o provider se necessário
      if (!provider) {
        const ethersProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(ethersProvider);
      }
      
      // Solicita acesso às contas do MetaMask
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        
        // Obter o signer após conectar a carteira
        await getSigner();
        
        return true;
      } else {
        showError('Nenhuma conta encontrada. Por favor, verifique o MetaMask.');
        return false;
      }
    } catch (err) {
      
      if (err.code === 4001) {
        // Usuário recusou a conexão
        showError('Você recusou a conexão com a carteira');
      } else if (err.code === -32002) {
        // Já existe uma solicitação em processamento
        showError('Já existe uma solicitação de conexão em processamento. Por favor, aguarde.');
      } else {
        showError('Erro ao conectar com a carteira: ' + (err.message || 'Erro desconhecido'));
      }
      
      return false;
    } finally {
      setConnecting(false);
    }
  }, [provider, getSigner]);
  
  // Função para desconectar a carteira
  const disconnectWallet = useCallback(async () => {
    try {
      // No caso da MetaMask, não é possível desconectar programaticamente
      // Apenas limpamos nossa autenticação interna
      clearAuthCredentials();
      setIsConnected(false);
      setAddress(null);
      setSigner(null);
      return true;
    } catch (err) {
      console.error('Erro ao desconectar carteira:', err);
      // Mesmo com erro, tenta limpar credenciais
      clearAuthCredentials();
      return false;
    }
  }, [clearAuthCredentials]);
  
  // Função para armazenar credenciais
  const setAuthCredentials = useCallback((newToken, walletAddress) => {
    if (newToken && walletAddress) {
      try {
        // Salva no localStorage
        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('wallet_address', walletAddress);
        
        // Configura o token na API
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        // Atualiza o estado
        setToken(newToken);
        setIsAuthenticated(true);
        
        return true;
      } catch (error) {
        console.error('WalletContext: Erro ao salvar credenciais', error);
        return false;
      }
    }
    return false;
  }, []);
  
  // Função para assinar mensagem
  const requestSignature = useCallback(async (name = undefined) => {
    if (!address) {
      showError('Conecte primeiro sua carteira');
      return false;
    }
    
    if (!checkIfMetaMaskAvailable()) {
      showError('MetaMask não está instalado');
      return false;
    }
    
    // Verifica se já está assinando
    if (signing) {
      showError('Já existe uma solicitação de assinatura em andamento. Por favor, aguarde.');
      return false;
    }
    
    try {
      setSigning(true);
      
      // Mensagem para assinatura
      const mensagem = `Validação de carteira no Fanatique: ${address}`;
      
      // Solicita assinatura ao usuário
      showInfo('Por favor, assine a mensagem para entrar na plataforma');
      
      // Solicita assinatura usando MetaMask diretamente
      let signature;
      try {
        signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [mensagem, address]
        });
      } catch (signError) {
        console.error('Erro específico na assinatura:', signError);
        
        // Cancelamento pelo usuário
        if (signError.code === 4001) {
          showError('Assinatura cancelada pelo usuário. É necessário assinar para entrar na plataforma.');
        } else if (signError.code === -32002) {
          showError('Já existe uma solicitação de assinatura em processamento. Por favor, aguarde.');
        } else {
          showError('Falha ao solicitar assinatura. Tente novamente mais tarde.');
        }
        
        return false;
      } finally {
        // Se chegou aqui com erro, já define signing como false
        if (!signature) {
          setSigning(false);
        }
      }
      
      // Envia a assinatura para o backend para validação
      const response = await api.post('/wallet/signature', {
        address: address,
        message: mensagem,
        signature,
        name
      });
      
      // Verifica se a validação foi bem-sucedida
      if (response.data.content && response.data.content.success) {
        const { token: newToken } = response.data.content;
        
        if (newToken) {
          setAuthCredentials(newToken, address);
          showSuccess('Login realizado com sucesso!');
          return true;
        } else {
          showError('Autenticação falhou: Token não recebido');
          return false;
        }
      } else {
        showError('Falha na validação: ' + (response.data.message || 'Erro desconhecido'));
        return false;
      }
    } catch (err) {
      console.error('Erro ao validar carteira:', err);
      if (err.code === 4001) {
        showError('Assinatura cancelada pelo usuário. É necessário assinar para entrar na plataforma.');
      } else {
        showError('Falha no login: ' + (err.message || 'Erro desconhecido'));
      }
      return false;
    } finally {
      setSigning(false);
    }
  }, [address, setAuthCredentials, checkIfMetaMaskAvailable, signing]);
  
  // Registrar com assinatura
  const registerWithSignature = useCallback(async (userName) => {
    if (!address) {
      showError('Nenhuma carteira conectada');
      return false;
    }

    if (!userName || userName.trim() === '') {
      showError('Nome de usuário é obrigatório');
      return false;
    }

    return await requestSignature(userName);
  }, [address, requestSignature]);
  
  // Verifica se a carteira já está cadastrada
  const checkWalletExists = useCallback(async () => {
    try {
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
  }, [address]);
  
  // Obter dados do usuário
  const getUserData = useCallback(async () => {
    if (!isAuthenticated || !token) {
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
        clearAuthCredentials();
      }
      
      return null;
    }
  }, [isAuthenticated, token, clearAuthCredentials]);
  
  // Conectar e verificar registro em uma única operação
  const connectAndCheckRegistration = useCallback(async () => {
    try {
      // Verifica se já está conectando
      if (connecting) {
        return { success: false, message: 'Já existe uma conexão em andamento. Por favor, aguarde.' };
      }
      
      // Primeiro apenas conecta a carteira
      const connected = await connectWallet();
      
      if (!connected || !address) {
        return { success: false, message: 'Falha ao conectar carteira' };
      }
      
      // Se já está autenticado, retorna sucesso
      if (isAuthenticated) {
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
        isAuthenticated: false
      };
    } catch (error) {
      console.error('Erro ao conectar e verificar registro:', error);
      
      // Tratamento específico para o erro de solicitação em processamento
      if (error.code === -32002) {
        return { 
          success: false, 
          message: 'Já existe uma solicitação de conexão em processamento. Por favor, aguarde.'
        };
      }
      
      return { 
        success: false, 
        message: error.message || 'Erro ao conectar e verificar registro'
      };
    }
  }, [connectWallet, address, isAuthenticated, checkWalletExists, connecting]);
  
  // Define os valores compartilhados
  const contextValue = {
    account: address,
    isConnected,
    isAuthenticated,
    isInitialized,
    token,
    signing,
    connecting,
    provider,
    signer,
    connectWallet,
    disconnectWallet,
    requestSignature,
    registerWithSignature,
    checkWalletExists,
    getUserData,
    setAuthCredentials,
    clearAuthCredentials,
    connectAndCheckRegistration,
    getSigner
  };
  
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
} 