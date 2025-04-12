import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'

import { Layout } from './components/layout'
import HomePage from './pages/home'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: 'quests',
        element: <div className="container mx-auto px-4 py-16">Página de Quests em breve...</div>
      },
      {
        path: 'clubes',
        element: <div className="container mx-auto px-4 py-16">Página de Clubes em breve...</div>
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
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
  </StrictMode>,
)
