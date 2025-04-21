import { useState, useEffect, useCallback } from 'react';
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
  
  // Verifica se o MetaMask está disponível
  const checkIfMetaMaskAvailable = useCallback(() => {
    return window.ethereum && window.ethereum.isMetaMask;
  }, []);
  
  // Limpa as credenciais
  const clearAuthCredentials = useCallback(() => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('wallet_address');
      delete api.defaults.headers.common['Authorization'];
      setToken(null);
      setIsAuthenticated(false);
      console.log('WalletContext: Credenciais removidas com sucesso');
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
    } else if (accounts[0] !== address) {
      // Usuário trocou de conta
      clearAuthCredentials();
      setAddress(accounts[0]);
      setIsConnected(true);
    }
  }, [address, clearAuthCredentials]);
  
  // Função para lidar com a desconexão do MetaMask
  const handleDisconnect = useCallback(() => {
    clearAuthCredentials();
    setIsConnected(false);
    setAddress(null);
  }, [clearAuthCredentials]);
  
  // Verifica o estado de autenticação e restaura se necessário
  useEffect(() => {
    const checkAuth = async () => {
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
        
        console.log('WalletContext: Autenticação restaurada do localStorage');
      } else {
        setIsAuthenticated(false);
        console.log('WalletContext: Sem dados de autenticação no localStorage');
      }
      
      setIsInitialized(true);
    };
    
    checkAuth();
    
    // Adicionar listeners para eventos do MetaMask
    if (checkIfMetaMaskAvailable()) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
      window.ethereum.on('disconnect', handleDisconnect);
    }
    
    return () => {
      // Remover listeners ao desmontar o componente
      if (checkIfMetaMaskAvailable()) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', () => {});
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [checkIfMetaMaskAvailable, handleAccountsChanged, handleDisconnect]);
  
  // Função para conectar a carteira
  const connectWallet = useCallback(async () => {
    if (!checkIfMetaMaskAvailable()) {
      showError('MetaMask não está instalado. Por favor, instale a extensão MetaMask para continuar.');
      return false;
    }
    
    try {
      setConnecting(true);
      
      // Solicita acesso às contas do MetaMask
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        return true;
      } else {
        showError('Nenhuma conta encontrada. Por favor, verifique o MetaMask.');
        return false;
      }
    } catch (err) {
      console.error('Erro ao conectar carteira:', err);
      
      if (err.code === 4001) {
        // Usuário recusou a conexão
        showError('Você recusou a conexão com a carteira');
      } else {
        showError('Erro ao conectar com a carteira: ' + (err.message || 'Erro desconhecido'));
      }
      
      return false;
    } finally {
      setConnecting(false);
    }
  }, [checkIfMetaMaskAvailable]);
  
  // Função para desconectar a carteira
  const disconnectWallet = useCallback(async () => {
    try {
      // No caso da MetaMask, não é possível desconectar programaticamente
      // Apenas limpamos nossa autenticação interna
      clearAuthCredentials();
      setIsConnected(false);
      setAddress(null);
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
        
        console.log('WalletContext: Credenciais salvas com sucesso');
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
  }, [address, setAuthCredentials, checkIfMetaMaskAvailable]);
  
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
      return { 
        success: false, 
        message: error.message || 'Erro ao conectar e verificar registro'
      };
    }
  }, [connectWallet, address, isAuthenticated, checkWalletExists]);
  
  // Define os valores compartilhados
  const contextValue = {
    account: address,
    isConnected,
    isAuthenticated,
    isInitialized,
    token,
    signing,
    connecting,
    connectWallet,
    disconnectWallet,
    requestSignature,
    registerWithSignature,
    checkWalletExists,
    getUserData,
    setAuthCredentials,
    clearAuthCredentials,
    connectAndCheckRegistration
  };
  
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
} 