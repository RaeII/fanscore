import { Link } from 'react-router-dom'
import { Ticket } from 'lucide-react'
import { ThemeToggle } from './ui/theme-toggle'
import { LanguageSwitcher } from './LanguageSwitcher'
import { cn } from '../lib/utils'
import { useWalletContext } from '../hooks/useWalletContext';


export function Header({ className }) {
  const { isAuthenticated } = useWalletContext();
  // const navigate = useNavigate();
  // const location = useLocation();
  // const { 
  //   isAuthenticated, 
  // } = useWalletContext();
  
  // // Verifica se está na página app ou em subpáginas do app
  // const isAppRoute = location.pathname.startsWith('/app') || location.pathname.startsWith('/dashboard');

  // const handleAccessApp = () => {
  //   // Se o usuário estiver autenticado, redireciona para dashboard, caso contrário para app
  //   const destination = isAuthenticated ? '/dashboard' : '/app';
  //   navigate(destination);
  // };

  return (
    <header className={cn("border-b border-secondary/10 dark:border-white/10 bg-background sticky top-0 z-50", className)}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2 text-primary dark:text-white">
          <span className="font-bold text-text-adaptive text-xl">
            <img src="/logo-header.png" alt="Fanatique"style={{width:"11.5rem", height:"auto"}} />
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
} 