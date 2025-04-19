import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Ticket } from 'lucide-react'
import { ThemeToggle } from './ui/theme-toggle'
import { Button } from './ui/button'
import { cn } from '../lib/utils'
import { useWalletContext } from '../hooks/useWalletContext'
import { useEffect } from 'react'

export function Header({ className }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    isAuthenticated, 
    account, 
    checkWalletExists, 
    requestSignature,
    connecting,
    signing,
    isInitialized
  } = useWalletContext();
  
  // Verifica se está na página app ou em subpáginas do app
  const isAppRoute = location.pathname.startsWith('/app') || location.pathname.startsWith('/dashboard');

  // Efeito para verificar se o usuário já tem carteira conectada, está cadastrado, 
  // mas não está autenticado (não tem token)
  useEffect(() => {
    const checkAndRequestSignature = async () => {
      // Se temos conta conectada mas não estamos autenticados
      if (isInitialized && account && !isAuthenticated && !connecting && !signing) {
        // Verificar se a carteira já está cadastrada
        const walletCheck = await checkWalletExists();
        
        if (walletCheck?.success && walletCheck?.exists) {
          console.log('Header: Carteira conectada e cadastrada, solicitando assinatura');
          // Solicitar assinatura automaticamente
          await requestSignature();
        }
      }
    };
    
    checkAndRequestSignature();
  }, [isInitialized, account, isAuthenticated, connecting, signing, checkWalletExists, requestSignature]);

  const handleAccessApp = () => {
    // Se o usuário estiver autenticado, redireciona para dashboard, caso contrário para app
    const destination = isAuthenticated ? '/dashboard' : '/app';
    navigate(destination);
  };

  return (
    <header className={cn("border-b border-primary/10 dark:border-white/10 bg-[#fafafa] dark:bg-[#0d0117] sticky top-0 z-50", className)}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-primary dark:text-white">
          <Ticket size={24} className="text-secondary" />
          <span className="font-bold text-xl">Fanatique</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {!isAppRoute && (
              <Button 
                onClick={handleAccessApp}
                className="bg-secondary text-white hover:bg-secondary/90"
              >
                {isAuthenticated ? 'Meu Dashboard' : 'Acessar App'}
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
} 