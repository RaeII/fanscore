import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import api from '../lib/api';
import { showError, showSuccess, showInfo } from '../lib/toast';
import { WalletContext } from './WalletContextDef';

// Dados da rede Chiliz
const NETWORK_ID_CHILIZ = import.meta.env.VITE_NETWORK_ID_CHILIZ;
const CHAIN_NAME = import.meta.env.VITE_CHAIN_NAME;
const RPC_URL = import.meta.env.VITE_RPC_URL;
const SYMBOL = import.meta.env.VITE_SYMBOL;
const BLOCK_EXPLORER_URL = import.meta.env.VITE_BLOCK_EXPLORER_URL;

// Helper para adicionar delay entre requisições
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Controle de tentativas para evitar spam
const NETWORK_CHECK_COOLDOWN = 2000; // 2 segundos entre verificações de rede
let lastNetworkCheck = 0;

// Garantir que o chainId está no formato correto (0x prefixado)
const formatChainId = (chainId) => {
  // Se já é uma string hexadecimal com prefixo 0x, retorna como está
  if (typeof chainId === 'string' && chainId.startsWith('0x')) {
    return chainId;
  }
  
  // Se é um número ou string sem 0x, converte para inteiro e depois para hexadecimal com prefixo 0x
  try {
    const chainIdInt = parseInt(chainId, 10);
    return `0x${chainIdInt.toString(16)}`;
  } catch (e) {
    console.error('Erro ao formatar chainId:', e);
    return chainId; // Retorna o original em caso de erro
  }
};

const networkData = {
  chainId: formatChainId(NETWORK_ID_CHILIZ),
  chainName: CHAIN_NAME,
  rpcUrls: [RPC_URL],
  nativeCurrency: {
    name: SYMBOL,
    symbol: SYMBOL,
    decimals: 18
  }
};

if(BLOCK_EXPLORER_URL) networkData.blockExplorerUrls = [BLOCK_EXPLORER_URL];

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
  const [isChilizNetwork, setIsChilizNetwork] = useState(false);

  // Verifica se o MetaMask está disponível
  const checkIfMetaMaskAvailable = useCallback(() => {
    return window.ethereum && window.ethereum.isMetaMask;
  }, []);
  
  // Verifica a rede conectada
  const checkNetwork = useCallback(async () => {
    if (!window.ethereum) return false;
    
    try {
      // Verifica se passou tempo suficiente desde a última verificação
      const now = Date.now();
      if (now - lastNetworkCheck < NETWORK_CHECK_COOLDOWN) {
        // Se a última verificação foi recente, espera um pouco
        await delay(NETWORK_CHECK_COOLDOWN);
      }
      
      // Atualiza o timestamp da última verificação
      lastNetworkCheck = Date.now();
      
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      const formattedChilizChainId = formatChainId(NETWORK_ID_CHILIZ);
      
      console.log("Rede atual:", currentChainId, "Rede Chiliz:", formattedChilizChainId);
      
      if (currentChainId !== formattedChilizChainId) {
        setIsChilizNetwork(false);
        return false;
      } else {
        setIsChilizNetwork(true);
        return true;
      }
    } catch (error) {
      console.error("Erro ao verificar rede:", error);
      setIsChilizNetwork(false);
      return false;
    }
  }, []);
  
  // Troca para a rede Chiliz
  const switchNetwork = useCallback(async () => {
    try {
      // Adiciona um delay antes de solicitar a troca de rede
      await delay(1000);
      
      const formattedChilizChainId = formatChainId(NETWORK_ID_CHILIZ);
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: formattedChilizChainId }],
      });
      
      // Atualiza o timestamp da última verificação
      lastNetworkCheck = Date.now();
      
      // Aguarda um momento para que a mudança seja processada
      await delay(1000);
      
      setIsChilizNetwork(true);
      return true;
    } catch (error) {
      if (error.code === 4902) {
        // Rede não adicionada, tenta adicionar
        return false;
      }
      if (error.code === 4001) {
        showError('Você precisa trocar para a rede Chiliz para continuar');
        return false;
      }
      if (error.code === 4100) {
        showError('Muitas requisições para a MetaMask. Por favor, aguarde alguns segundos e tente novamente.');
        return false;
      }
      console.error("Erro ao trocar de rede:", error);
      return false;
    }
  }, []);
  
  // Adiciona a rede Chiliz
  const addNetwork = useCallback(async () => {
    try {
      // Adiciona um delay antes de solicitar a adição de rede
      await delay(1500);
      
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkData]
      });
      
      // Aguarda um momento para garantir que a rede foi adicionada
      await delay(1500);
      
      const switched = await switchNetwork();
      if (switched) {
        showSuccess("Rede Chiliz conectada com sucesso!");
        setIsChilizNetwork(true);
        return true;
      }
      
      return false;
    } catch (error) {
      if (error.code === 4001) {
        showError('Você precisa adicionar a rede Chiliz para continuar');
      } else if (error.code === 4100) {
        showError('Muitas requisições para a MetaMask. Por favor, aguarde alguns segundos e tente novamente.');
      } else {
        showError('Erro ao adicionar rede Chiliz. Por favor, tente novamente.');
        console.error("Erro ao adicionar rede:", error);
      }
      return false;
    }
  }, [switchNetwork]);
  
  // Garante que estamos na rede Chiliz
  const ensureChilizNetwork = useCallback(async () => {
    try {
      // Primeiro apenas verifica se já estamos na rede correta
      const isCorrectNetwork = await checkNetwork();
      if (isCorrectNetwork) {
        return true;
      }
      
      // Se não estamos na rede correta, aguarde um momento antes de continuar
      await delay(1000);
      
      // Tenta trocar para a rede Chiliz
      const switched = await switchNetwork();
      if (!switched) {
        // Se não conseguiu trocar, aguarde um momento antes de tentar adicionar
        await delay(1000);
        
        // Se não conseguiu trocar, tenta adicionar a rede
        return await addNetwork();
      }
      return switched;
    } catch (error) {
      if (error.code === 4100) {
        // Se for erro de spam, aguarde mais tempo e tente novamente
        await delay(3000);
        showInfo('Aguardando para evitar bloqueio da MetaMask...');
        try {
          return await checkNetwork();
        } catch (e) {
          console.error('Erro persistente ao verificar rede:', e);
          return false;
        }
      }
      
      console.error('Erro ao garantir rede Chiliz:', error);
      return false;
    }
  }, [checkNetwork, switchNetwork, addNetwork]);
  
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
  
  // Função para lidar com a mudança de rede
  const handleChainChanged = useCallback((chainId) => {
    const formattedChilizChainId = formatChainId(NETWORK_ID_CHILIZ);
    
    if (chainId !== formattedChilizChainId) {
      setIsChilizNetwork(false);
      showError("Troque para a rede Chiliz Spicy para continuar usando o aplicativo");
      
      // Adiciona um pequeno delay antes de solicitar a troca de rede
      setTimeout(() => {
        // Tenta trocar para a rede Chiliz automaticamente
        switchNetwork().catch(error => {
          console.error('Erro ao solicitar troca de rede:', error);
          if (error.code !== 4001) { // Se não for erro de usuário cancelou
            addNetwork().catch(console.error);
          }
        });
      }, 1500);
    } else {
      setIsChilizNetwork(true);
    }
  }, [switchNetwork, addNetwork]);
  
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
          
          // Obter o signer após restaurar o estado da carteira
          await getSigner();
          
          // Verifica a rede atual
          await checkNetwork();
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
  }, [handleAccountsChanged, handleDisconnect, provider, getSigner, handleChainChanged, checkNetwork]);
  
  // Função para conectar a carteira
  const connectWallet = useCallback(async () => {
    console.log("Iniciando processo de conexão da carteira...");
    
    // Evitar múltiplas tentativas de conexão
    if (connecting) {
      console.log("Já existe uma conexão em andamento");
      return false;
    }
    
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
      
      // Adiciona um pequeno delay antes de solicitar contas
      await delay(500);
      
      // Solicita acesso às contas do MetaMask
      console.log("Solicitando acesso às contas do MetaMask...");
      let accounts;
      try {
        accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
      } catch (accountError) {
        if (accountError.code === 4001) {
          // Usuário recusou a conexão
          console.log("Usuário recusou a conexão");
          showError('Você recusou a conexão com a carteira');
        } else if (accountError.code === 4100) {
          // Erro de spam filter
          console.log("Bloqueio por spam filter");
          showError('Muitas requisições para a MetaMask. Por favor, aguarde alguns segundos e tente novamente.');
        } else {
          showError('Erro ao conectar com a carteira: ' + (accountError.message || 'Erro desconhecido'));
        }
        setConnecting(false);
        return false;
      }
      
      console.log("Contas retornadas pelo MetaMask:", accounts);
      
      if (!accounts || accounts.length === 0) {
        console.error("Nenhuma conta encontrada no MetaMask");
        showError('Nenhuma conta encontrada. Por favor, verifique o MetaMask.');
        setConnecting(false);
        return false;
      }
      
      // Define o endereço da conta e atualiza o estado de conexão
      setAddress(accounts[0]);
      setIsConnected(true);
      console.log("Carteira conectada com sucesso:", accounts[0]);
      
      // Adiciona um pequeno delay antes de obter o signer
      await delay(500);
      
      // Obter o signer após conectar a carteira
      console.log("Obtendo signer...");
      await getSigner();
      console.log("Signer obtido com sucesso");
      
      // Agora aguarda mais um momento antes de verificar a rede
      await delay(1000);
      
      // Apenas verifica se a rede está correta, sem tentar trocar
      // Isso evita o erro de spam filter
      const isCorrectNetwork = await checkNetwork();
      if (!isCorrectNetwork) {
        // Não tenta trocar a rede automaticamente aqui
        // Apenas informa ao usuário 
        showError("Você não está na rede Chiliz. Por favor, troque de rede manualmente.");
        setIsChilizNetwork(false);
      } else {
        setIsChilizNetwork(true);
      }
      
      return true;
    } catch (err) {
      console.error("Erro detalhado ao conectar carteira:", err);
      
      if (err.code === 4100) {
        showError('Muitas requisições para a MetaMask. Por favor, aguarde alguns segundos e tente novamente.');
      } else {
        showError('Erro ao conectar com a carteira: ' + (err.message || 'Erro desconhecido'));
      }
      
      return false;
    } finally {
      console.log("Finalizando processo de conexão, definindo connecting=false");
      setConnecting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      showError('MetaMask não está instalado');
      return false;
    }
    
    // Verifica se já está assinando e evita solicitações duplicadas
    if (signing) {
      console.log('Uma solicitação de assinatura já está em andamento');
      return { inProgress: true };
    }
    
    try {
      // Define o estado de assinatura como true no início
      setSigning(true);
      
      // Verifica se a rede está correta ANTES de solicitar a assinatura
      // Isso evita ter que trocar a rede e depois solicitar assinatura novamente
      if (!isChilizNetwork) {
        // Verifica a rede atual sem tentar trocar automaticamente
        const isCorrect = await checkNetwork();
        
        if (!isCorrect) {
          // Informa ao usuário que precisa trocar de rede manualmente
          showError("Para continuar, você precisa trocar para a rede Chiliz manualmente.");
          setSigning(false);
          return false;
        }
      }
      
      // Adiciona um pequeno delay antes de solicitar assinatura
      await delay(1000);
      
      // Mensagem para assinatura - usando um formato padrão para evitar assinaturas múltiplas
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
        } else if (signError.code === 4100) {
          showError('Muitas requisições para a MetaMask. Por favor, aguarde alguns segundos e tente novamente.');
          return { spamBlocked: true, success: false };
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
      
      // Adiciona um pequeno delay antes de enviar a assinatura para o backend
      await delay(500);
      
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
      } else if (err.code === 4100) {
        showError('Muitas requisições para a MetaMask. Por favor, aguarde alguns segundos e tente novamente.');
        return { spamBlocked: true, success: false };
      } else {
        showError('Falha no login: ' + (err.message || 'Erro desconhecido'));
      }
      
      return false;
    } finally {
      // Sempre define signing como false ao finalizar
      setSigning(false);
    }
  }, [address, setAuthCredentials, checkIfMetaMaskAvailable, signing, isChilizNetwork, checkNetwork]);
  
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
    
    // A verificação de rede é feita dentro da função requestSignature
    // Não precisamos fazer essa verificação aqui novamente
    
    return await requestSignature(userName);
  }, [address, requestSignature]);
  
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
      
      // Se já está autenticado, retorna sucesso
      if (isAuthenticated) {
        return { success: true, needsRegistration: false, isAuthenticated: true };
      }
      
      // Verifica se a rede está correta antes de verificar o registro
      if (!isChilizNetwork) {
        return { 
          success: true, 
          needsNetworkChange: true,
          message: 'É necessário trocar para a rede Chiliz'
        };
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
  }, [connectWallet, address, isAuthenticated, checkWalletExists, connecting, isChilizNetwork]);
  
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
    isChilizNetwork,
    BLOCK_EXPLORER_URL,
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
    switchNetwork,
    addNetwork,
    ensureChilizNetwork,
  
  };
  
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
} 