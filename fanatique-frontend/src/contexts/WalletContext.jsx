import { useState, useEffect, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { metaMask } from 'wagmi/connectors';
import api from '../lib/api';
import { showError, showSuccess, showInfo } from '../lib/toast';
import { WalletContext } from './WalletContextDef';

// Provider que envolverá a aplicação
export function WalletProvider({ children }) {
  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  
  // Estado local para armazenar informações de autenticação
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [token, setToken] = useState(null);
  const [signing, setSigning] = useState(false);
  
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
        setIsAuthenticated(true);
        
        console.log('WalletContext: Autenticação restaurada do localStorage');
      } else {
        setIsAuthenticated(false);
        console.log('WalletContext: Sem dados de autenticação no localStorage');
      }
      
      setIsInitialized(true);
    };
    
    checkAuth();
  }, []);
  
  // Atualiza o estado com base nas mudanças da carteira
  useEffect(() => {
    if (isConnected && address) {
      console.log('WalletContext: Carteira conectada -', address);
      
      // Verifica se tem token salvo para esta carteira
      const savedToken = localStorage.getItem('auth_token');
      const savedWallet = localStorage.getItem('wallet_address');
      
      if (savedToken && savedWallet && savedWallet.toLowerCase() === address.toLowerCase()) {
        // Configura o token na API
        api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
        setToken(savedToken);
        setIsAuthenticated(true);
        console.log('WalletContext: Token restaurado para a carteira conectada');
      }
    } else if (!isConnected) {
      console.log('WalletContext: Carteira desconectada');
    }
  }, [address, isConnected]);
  
  // Função para conectar a carteira
  const connectWallet = useCallback(async () => {
    try {
      await connectAsync({ connector: metaMask() });
      return true;
    } catch (err) {
      console.error('Erro ao conectar carteira:', err);
      if (err.code === 4001) {
        showError('Você recusou a conexão com a carteira');
      } else {
        showError('Erro ao conectar com a carteira: ' + (err.message || 'Erro desconhecido'));
      }
      return false;
    }
  }, [connectAsync]);
  
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
  
  // Função para desconectar a carteira
  const disconnectWallet = useCallback(async () => {
    try {
      await disconnectAsync();
      clearAuthCredentials();
      return true;
    } catch (err) {
      console.error('Erro ao desconectar carteira:', err);
      showError('Falha ao desconectar a carteira.');
      return false;
    }
  }, [disconnectAsync, clearAuthCredentials]);
  
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
  
  // Função para assinar mensagem e autenticar
  const requestSignature = useCallback(async (name = undefined) => {
    if (!address) {
      showError('Conecte primeiro sua carteira');
      return false;
    }
    
    try {
      setSigning(true);
      
      // Mensagem para assinatura
      const mensagem = `Validação de carteira no Fanatique: ${address}`;
      
      // Solicita assinatura ao usuário
      showInfo('Por favor, assine a mensagem para entrar na plataforma');
      
      // Solicita assinatura usando wagmi
      const signature = await signMessageAsync({ message: mensagem });
      
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
  }, [address, signMessageAsync, setAuthCredentials]);
  
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
      await connectWallet();
      
      if (!address) {
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