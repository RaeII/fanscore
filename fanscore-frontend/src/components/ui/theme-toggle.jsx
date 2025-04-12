import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'
import { cn } from '../../lib/utils'

export function ThemeToggle({ className }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  })

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center bg-[#fafafa] dark:bg-primary/20 text-primary dark:text-white transition-colors",
        className
      )}
      aria-label={`Alternar para modo ${theme === 'light' ? 'escuro' : 'claro'}`}
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  )
} 