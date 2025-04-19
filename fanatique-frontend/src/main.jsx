import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { WagmiConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from './contexts/wagmi'
import './index.css'

import { Layout } from './components/layout'
import { AdminNav } from './components/AdminNav'
import HomePage from './pages/home'
import AppPage from './pages/app'
import DashboardPage from './pages/dashboard'
import AdminClubsPage from './pages/admin-clubs'
import { ThemeProvider } from './components/theme-provider'
import { WalletProvider } from './contexts/WalletContext'
import ProtectedRoute from './components/ProtectedRoute'

// Criar uma instância do QueryClient para o TanStack Query
const queryClient = new QueryClient()

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <>
        <Layout />
        <AdminNav />
      </>
    ),
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: 'app',
        element: <AppPage />
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'quests',
        element: (
          <ProtectedRoute>
            <div className="container mx-auto px-4 py-16">Página de Quests em breve...</div>
          </ProtectedRoute>
        )
      },
      {
        path: 'clubes',
        element: (
          <ProtectedRoute>
            <div className="container mx-auto px-4 py-16">Página de Clubes em breve...</div>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/clubes',
        element: <AdminClubsPage />
      },
      {
        path: 'pedidos',
        element: (
          <ProtectedRoute>
            <div className="container mx-auto px-4 py-16">Página de Pedidos em breve...</div>
          </ProtectedRoute>
        )
      },
      {
        path: 'perfil',
        element: (
          <ProtectedRoute>
            <div className="container mx-auto px-4 py-16">Página de Perfil em breve...</div>
          </ProtectedRoute>
        )
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="fanatique-theme">
      <QueryClientProvider client={queryClient}>
        <WagmiConfig config={wagmiConfig}>
          <WalletProvider>
            <RouterProvider router={router} />
            <Toaster 
              position="top-right"
              gutter={20}
              containerStyle={{
                top: 80,
                right: 20,
              }}
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  style: {
                    background: '#1D7D40',
                  },
                },
                error: {
                  style: {
                    background: '#D92D20',
                  },
                },
              }}
            />
          </WalletProvider>
        </WagmiConfig>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
