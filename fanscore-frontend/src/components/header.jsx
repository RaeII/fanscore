import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { ThemeToggle } from './ui/theme-toggle'
import { WalletConnect } from './wallet-connect'
import { cn } from '../lib/utils'

export function Header({ className }) {
  return (
    <header className={cn("border-b border-primary/10 dark:border-white/10 bg-[#fafafa] dark:bg-[#0d0117] sticky top-0 z-50", className)}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-primary dark:text-white">
          <Trophy size={24} className="text-secondary" />
          <span className="font-bold text-xl">FanScore</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-primary/80 dark:text-white/80 hover:text-primary dark:hover:text-white transition-colors">
              Início
            </Link>
            <Link to="/quests" className="text-primary/80 dark:text-white/80 hover:text-primary dark:hover:text-white transition-colors">
              Quests
            </Link>
            <Link to="/clubes" className="text-primary/80 dark:text-white/80 hover:text-primary dark:hover:text-white transition-colors">
              Clubes
            </Link>
          </nav>
          
          <div className="flex items-center gap-2">
            <WalletConnect />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
} 