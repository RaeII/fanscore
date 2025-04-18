import { Button } from './ui/button'
import { cn } from '../lib/utils'
import { X } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'

export function WalletConnect({ className }) {
  const {
    account,
    connecting,
    signing,
    verified,
    connectWallet,
    disconnectWallet
  } = useWallet()

  if (account) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button 
          size="md"
          className={cn(
            "relative group pr-10 pl-10 pt-2 pb-2",
            verified ? "bg-primary text-white" : "bg-amber-500 text-white"
          )}
        >
          <span className="text-sm font-medium text-center">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
          <div 
            className="absolute right-3 hidden group-hover:flex items-center justify-center cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              disconnectWallet();
            }}
          >
            <X size={18} className="text-[#f24952]" />
          </div>
        </Button>
        
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Button
        onClick={connectWallet}
        disabled={connecting || signing}
        className="bg-primary text-white"

      >
        {connecting ? 'Conectando...' : signing ? 'Validando...' : 'Conectar Carteira'}
      </Button>
    </div>
  )
} 