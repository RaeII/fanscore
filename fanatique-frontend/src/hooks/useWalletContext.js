import { useContext, useEffect } from 'react';
import { WalletContext } from '../contexts/WalletContextDef';

// Hook para usar o contexto
export function useWalletContext() {
  const context = useContext(WalletContext);
  
  if (!context) {
    throw new Error('useWalletContext deve ser usado dentro de um WalletProvider');
  }
  
  // Efeito para verificar status da carteira quando o hook é usado
  useEffect(() => {
    // Console log para depuração
/*     if (context.isInitialized) {
      console.log('useWalletContext: Status atual:', {
        account: context.account ? context.account.slice(0, 6) + '...' + context.account.slice(-4) : null,
        isConnected: context.isConnected,
        isAuthenticated: context.isAuthenticated,
      });
    } */
  }, [context.isInitialized, context.account, context.isAuthenticated, context.isConnected]);
  
  return context;
} 