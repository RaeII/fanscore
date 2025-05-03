import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import api from '../lib/api';
import { showError, showSuccess, showInfo } from '../lib/toast';
import { WalletContext } from './WalletContextDef';

// Configuração da rede Chiliz
const NETWORK_ID_CHILIZ = import.meta.env.VITE_NETWORK_ID_MOOBEAM;
const CHAIN_NAME = import.meta.env.VITE_CHAIN_NAME;
const RPC_URL = import.meta.env.VITE_RPC_URL;
const SYMBOL = import.meta.env.VITE_SYMBOL;
const BLOCK_EXPLORER_URL = import.meta.env.VITE_BLOCK_EXPLORER_URL;

const networkData = {
  chainId: NETWORK_ID_CHILIZ,
  chainName: CHAIN_NAME,
  rpcUrls: [RPC_URL],
  nativeCurrency: {
    name: SYMBOL,
    symbol: SYMBOL,
    decimals: 18
  }
};

console.log("networkData", networkData);

if (BLOCK_EXPLORER_URL) {
  networkData.blockExplorerUrls = [BLOCK_EXPLORER_URL];
}

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
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

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
      setToken(null);
      setIsAuthenticated(false);
      return true;
    } catch (error) {
      console.error('WalletContext: Erro ao remover credenciais', error);
      return false;
    }
  }, []);
  
  // Verifica a rede atual e troca ou adiciona se necessário
  const checkNetwork = useCallback(async () => {
    if (!window.ethereum) return false;
    
    try {
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (currentChainId !== NETWORK_ID_CHILIZ) {
        showInfo('Você precisa estar na rede Chiliz para continuar');
        
        try {
          // Tenta trocar para a rede Chiliz
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: NETWORK_ID_CHILIZ }]
          });
          
          setIsCorrectNetwork(true);
          return true;
        } catch (switchError) {
          // Se a rede não existe na carteira (erro 4902), tenta adicionar
          if (switchError.code === 4902) {
            try {
              // Adiciona a rede Chiliz
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [networkData]
              });
              
              setIsCorrectNetwork(true);
              return true;
            } catch (addError) {
              if (addError.code === 4001) {
                showError('Você precisa adicionar a rede Chiliz para continuar');
              } else {
                showError('Erro ao adicionar a rede Chiliz');
              }
              setIsCorrectNetwork(false);
              return false;
            }
          } else if (switchError.code === 4001) {
            showError('Você precisa trocar para a rede Chiliz para continuar');
            setIsCorrectNetwork(false);
            return false;
          } else {
            showError('Erro ao trocar para a rede Chiliz');
            setIsCorrectNetwork(false);
            return false;
          }
        }
      } else {
        setIsCorrectNetwork(true);
        return true;
      }
    } catch (error) {
      console.error('Erro ao verificar rede:', error);
      setIsCorrectNetwork(false);
      return false;
    }
  }, []);
  
  // Função explícita para adicionar a rede Chiliz
  const addChilizNetwork = useCallback(async () => {
    if (!window.ethereum) {
      showError('MetaMask não está instalada. Por favor, instale-a para continuar.');
      return false;
    }
    
    try {
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (currentChainId === NETWORK_ID_CHILIZ) {
        showInfo('Você já está na rede Chiliz');
        setIsCorrectNetwork(true);
        return true;
      }
      
      // Tenta adicionar a rede Chiliz
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkData]
      });
      
      // Troca para a rede Chiliz
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_ID_CHILIZ }]
      });
      
      showSuccess('Rede Chiliz adicionada com sucesso!');
      setIsCorrectNetwork(true);
      return true;
    } catch (error) {
      if (error.code === 4001) {
        showError('Operação cancelada pelo usuário');
      } else {
        showError('Erro ao adicionar a rede Chiliz');
        console.error('Erro ao adicionar rede Chiliz:', error);
      }
      setIsCorrectNetwork(false);
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
  
  // Função para lidar com a mudança de rede
  const handleChainChanged = useCallback((chainId) => {
    if (chainId !== NETWORK_ID_CHILIZ) {
      setIsCorrectNetwork(false);
      showError('Troque para a rede Chiliz para continuar usando a aplicação');
    } else {
      setIsCorrectNetwork(true);
    }
  }, []);
  
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
          // Atualiza o estado
          setToken(savedToken);
          setAddress(savedWallet);
          setIsAuthenticated(true);
          setIsConnected(true);
          
          // Verifica a rede atual
          await checkNetwork();
          
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
      window.ethereum.on('chainChanged', handleChainChanged);
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
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [handleAccountsChanged, handleChainChanged, handleDisconnect, provider, getSigner, checkNetwork]);
  
  // Função para conectar a carteira
  const connectWallet = useCallback(async () => {
    console.log("Iniciando processo de conexão da carteira...");
    
    if (!window.ethereum) {
      console.error("MetaMask não está instalado");
      showError('MetaMask não está instalado. Por favor, instale a extensão MetaMask para continuar.');
      window.open('https://metamask.io/download/', '_blank', 'noopener,noreferrer');
      return false;
    }
    
    try {
      setConnecting(true);
      console.log("Definindo flag connecting=true");
      
      // Inicializa o provider se necessário
      if (!provider) {
        console.log("Inicializando provider...");
        try {
          const ethersProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(ethersProvider);
          console.log("Provider inicializado com sucesso");
        } catch (providerError) {
          console.error("Erro ao inicializar provider:", providerError);
          throw providerError;
        }
      } else {
        console.log("Provider já existente, pulando inicialização");
      }
      
      // Solicita acesso às contas do MetaMask
      console.log("Solicitando acesso às contas do MetaMask...");
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      console.log("Contas retornadas pelo MetaMask:", accounts);
      
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        console.log("Carteira conectada com sucesso:", accounts[0]);
        
        // Verifica a rede atual e troca se necessário
        const networkCorrect = await checkNetwork();
        if (!networkCorrect) {
          console.log("Rede incorreta, tentando trocar...");
          showInfo('É necessário estar na rede Chiliz para usar o aplicativo');
        }
        
        // Obter o signer após conectar a carteira
        console.log("Obtendo signer...");
        await getSigner();
        console.log("Signer obtido com sucesso");
        
        return true;
      } else {
        console.error("Nenhuma conta encontrada no MetaMask");
        showError('Nenhuma conta encontrada. Por favor, verifique o MetaMask.');
        return false;
      }
    } catch (err) {
      console.error("Erro detalhado ao conectar carteira:", err);
      
      if (err.code === 4001) {
        // Usuário recusou a conexão
        console.log("Usuário recusou a conexão");
        showError('Você recusou a conexão com a carteira');
      } else {
        showError('Erro ao conectar com a carteira: ' + (err.message || 'Erro desconhecido'));
      }
      
      return false;
    } finally {
      console.log("Finalizando processo de conexão, definindo connecting=false");
      setConnecting(false);
    }
  }, [provider, getSigner, checkNetwork]);
  
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
      showError('MetaMask não está instalada');
      return false;
    }
    
    // Verifica se já está assinando
    if (signing) {
      console.log('Uma solicitação de assinatura já está em andamento');
      return false;
    }
    
    // Verifica se está na rede correta
    if (!isCorrectNetwork) {
      const networkOk = await checkNetwork();
      if (!networkOk) {
        showError('Você precisa estar na rede Chiliz para assinar a mensagem');
        return false;
      }
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
          console.log('Usuário cancelou a assinatura');
          showError('Assinatura cancelada pelo usuário. É necessário assinar para entrar na plataforma.');
          return { cancelled: true, success: false };
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
        return { cancelled: true, success: false };
      } else {
        showError('Falha no login: ' + (err.message || 'Erro desconhecido'));
      }
      return false;
    } finally {
      setSigning(false);
    }
  }, [address, setAuthCredentials, checkIfMetaMaskAvailable, signing, isCorrectNetwork, checkNetwork]);
  
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
    
    // Verifica se está na rede correta antes de registrar
    if (!isCorrectNetwork) {
      const networkOk = await checkNetwork();
      if (!networkOk) {
        showError('Você precisa estar na rede Chiliz para registrar');
        return false;
      }
    }

    return await requestSignature(userName);
  }, [address, requestSignature, isCorrectNetwork, checkNetwork]);
  
  // Verifica se a carteira já está cadastrada
  const checkWalletExists = useCallback(async () => {
    try {
      if (!address) {
        return { success: false, exists: false, message: 'Nenhuma carteira conectada' };
      }

      console.log("2-  checkWalletExists address", address);
      
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
      
      // Verifica se está na rede correta
      if (!isCorrectNetwork) {
        const networkOk = await checkNetwork();
        if (!networkOk) {
          return { 
            success: false, 
            message: 'É necessário estar na rede Chiliz para usar o aplicativo' 
          };
        }
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
  }, [connectWallet, address, isAuthenticated, checkWalletExists, connecting, isCorrectNetwork, checkNetwork]);
  
  // Define os valores compartilhados
  const contextValue = {
    account: address,
    isConnected,
    isAuthenticated,
    isInitialized,
    isCorrectNetwork,
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
    getSigner,
    checkNetwork,
    addChilizNetwork
  };
  
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
} 