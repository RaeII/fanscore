import { Link } from 'react-router-dom'
import { Ticket } from 'lucide-react'
import { ThemeToggle } from './ui/theme-toggle'
import { cn } from '../lib/utils'

export function Header({ className }) {
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
    <header className={cn("border-b border-primary/10 dark:border-white/10 bg-background sticky top-0 z-50", className)}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-primary dark:text-white">
          <Ticket size={24} className="text-secondary" />
          <span className="font-bold text-text-adaptive text-xl">Fanatique</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
} 