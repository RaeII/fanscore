import { Outlet } from 'react-router-dom'
import { Header } from './header'
import BottomNavigation from './BottomNavigation'
import { useWalletContext } from '../hooks/useWalletContext'

export function Layout() {
  const { isAuthenticated } = useWalletContext();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      {isAuthenticated && <BottomNavigation />}
    </div>
  )
} 