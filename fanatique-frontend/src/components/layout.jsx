import { Outlet } from 'react-router-dom'
import { Header } from './header'

export function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="py-6 bg-primary text-white/70 text-sm text-center">
        <div className="container mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} FanScore - Todos os direitos reservados</p>
          <p className="mt-2">Desenvolvido para a rede Chiliz</p>
        </div>
      </footer>
    </div>
  )
} 