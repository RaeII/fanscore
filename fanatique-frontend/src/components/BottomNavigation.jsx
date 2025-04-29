import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, User, Heart, MessageCircle, Trophy, Settings, 
  Store, Calendar, ChevronUp, X, Wallet, ChevronRight, ChevronLeft, Menu
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useUserContext } from '../hooks/useUserContext';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userClubsData } = useUserContext();
  const [activeItem, setActiveItem] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showClubOptions, setShowClubOptions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Get the heart club data
  const heartClub = userClubsData?.heart_club?.club;

  // Set active item based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) {
      setActiveItem('home');
    } else if (path.startsWith('/perfil') || path.startsWith('/profile')) {
      setActiveItem('profile');
    } else if (path.includes('/forum')) {
      setActiveItem('forum');
    } else if (path.startsWith('/clubs/') && heartClub && path.includes(heartClub.id)) {
      setActiveItem('club');
    } else if (path.includes('/matches')) {
      setActiveItem('matches');
    } else if (path.includes('/shop')) {
      setActiveItem('shop');
    } else if (path.includes('/settings')) {
      setActiveItem('settings');
    } else if (path.includes('/buy-fantokens')) {
      setActiveItem('wallet');
    }
  }, [location, heartClub]);

  // Fechar opções do clube quando mudar de rota
  useEffect(() => {
    setShowClubOptions(false);
    setIsMobileMenuOpen(false);
  }, [location]);

  // Opções do clube para mobile
  const clubOptions = [
    {
      id: 'club',
      label: 'Meu Clube',
      icon: <Heart size={20} />,
      onClick: () => heartClub ? navigate(`/clubs/${heartClub.id}`) : navigate('/dashboard'),
    },
    {
      id: 'matches',
      label: 'Partidas',
      icon: <Trophy size={20} />,
      onClick: () => navigate('/matches'),
    }
  ];

  // Itens de navegação para mobile
  const mobileNavItems = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home size={20} />,
      onClick: () => navigate('/dashboard'),
    },
    {
      id: 'forum',
      label: 'Forum',
      icon: <MessageCircle size={20} />,
      onClick: () => heartClub ? navigate(`/clubs/${heartClub.id}/forum`) : navigate('/dashboard'),
      disabled: !heartClub,
    },
    {
      id: 'heartClub',
      label: 'Meu Clube',
      icon: <Heart size={20} />,
      onClick: () => {
        setShowClubOptions(!showClubOptions);
      },
      disabled: !heartClub,
    },
    {
      id: 'wallet',
      label: 'Carteira',
      icon: <Wallet size={20} />,
      onClick: () => navigate('/buy-fantokens'),
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: <User size={20} />,
      onClick: () => navigate('/profile'),
    },
  ];

  // Itens de navegação para desktop (incluindo Meu Clube e Partidas diretamente)
  const desktopNavItems = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home size={20} />,
      onClick: () => navigate('/dashboard'),
    },
    {
      id: 'club',
      label: 'Meu Clube',
      icon: <Heart size={20} />,
      onClick: () => heartClub ? navigate(`/clubs/${heartClub.id}`) : navigate('/dashboard'),
      disabled: !heartClub,
    },
    {
      id: 'matches',
      label: 'Partidas',
      icon: <Trophy size={20} />,
      onClick: () => navigate('/matches'),
    },
    {
      id: 'forum',
      label: 'Forum',
      icon: <MessageCircle size={20} />,
      onClick: () => heartClub ? navigate(`/clubs/${heartClub.id}/forum`) : navigate('/dashboard'),
      disabled: !heartClub,
    },
    {
      id: 'wallet',
      label: 'Carteira',
      icon: <Wallet size={20} />,
      onClick: () => navigate('/buy-fantokens'),
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: <User size={20} />,
      onClick: () => navigate('/profile'),
    },
  ];

  return (
    <>
      {/* Overlay para fechar o menu mobile quando aberto */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Botão hamburguer para mobile */}
      <button
        className="fixed top-4 left-4 z-50 rounded-full bg-white dark:bg-[#150924] p-2 shadow-md md:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <Menu size={24} className="text-primary dark:text-white" />
      </button>

      {/* Mobile slide-in menu */}
      <div 
        className={cn(
          "fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-[#0d0117] shadow-lg z-50 transition-transform duration-300 md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col py-4">
          <div className="px-4 mb-6 mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary dark:text-white">Fanatique</h2>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} className="text-primary dark:text-white" />
              </button>
            </div>
          </div>
          
          <nav className="flex-1 overflow-y-auto px-3">
            {mobileNavItems.map((item) => (
              <div key={item.id}>
                <button
                  className={cn(
                    'w-full flex items-center py-3 px-4 mb-1 rounded-lg transition-all',
                    (activeItem === item.id || (item.id === 'heartClub' && (activeItem === 'club' || activeItem === 'matches')))
                      ? 'bg-secondary text-white'
                      : 'text-primary/80 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10',
                    item.disabled && 'opacity-40 cursor-not-allowed'
                  )}
                  onClick={item.onClick}
                  disabled={item.disabled}
                >
                  {item.icon}
                  <span className="ml-3 font-medium">{item.label}</span>
                  {item.id === 'heartClub' && (
                    <ChevronRight 
                      size={16} 
                      className={cn(
                        "ml-auto transition-transform",
                        showClubOptions && "rotate-90"
                      )} 
                    />
                  )}
                </button>
                
                {/* Submenu para clube no mobile */}
                {showClubOptions && item.id === 'heartClub' && (
                  <div className="pl-10 mb-2">
                    {clubOptions.map((option) => (
                      <button
                        key={option.id}
                        className={cn(
                          'w-full flex items-center py-2 px-4 rounded-lg transition-all',
                          activeItem === option.id
                            ? 'text-secondary font-medium'
                            : 'text-primary/70 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10'
                        )}
                        onClick={option.onClick}
                      >
                        {option.icon}
                        <span className="ml-3">{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom mobile navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0d0117] shadow-lg border-t border-gray-200 dark:border-gray-800 z-40 md:hidden">
        <nav className="flex justify-around items-center h-16">
          {mobileNavItems.map((item) => (
            <button
              key={item.id}
              className={cn(
                'flex flex-col items-center justify-center px-2 py-1 w-full h-full relative',
                (activeItem === item.id || (item.id === 'heartClub' && (activeItem === 'club' || activeItem === 'matches')))
                  ? 'text-secondary'
                  : 'text-primary/70 dark:text-white/70',
                item.disabled && 'opacity-40',
                showClubOptions && item.id === 'heartClub' && 'text-secondary'
              )}
              onClick={item.onClick}
              disabled={item.disabled}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Desktop side navigation */}
      <div 
        className={cn(
          "fixed top-0 left-0 bottom-0 bg-white/90 dark:bg-[#0d0117]/90 shadow-lg backdrop-blur-sm border-r border-gray-200 dark:border-gray-800 z-50 transition-all duration-300 hidden md:block",
          isExpanded ? "w-64" : "w-20"
        )}
      >
        <div className="h-full flex flex-col p-3">
          <div className={cn(
            "flex items-center px-3 py-5 mb-4",
            !isExpanded && "justify-center"
          )}>
            {isExpanded ? (
              <h2 className="text-xl font-bold text-primary dark:text-white">Fanatique</h2>
            ) : (
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold">F</div>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto">
            {desktopNavItems.map((item) => (
              <button
                key={item.id}
                className={cn(
                  'w-full flex items-center py-3 mb-2 rounded-lg transition-all',
                  isExpanded ? 'px-4' : 'px-0 justify-center',
                  activeItem === item.id
                    ? 'bg-secondary text-white'
                    : 'text-primary/80 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10',
                  item.disabled && 'opacity-40 cursor-not-allowed'
                )}
                onClick={item.onClick}
                disabled={item.disabled}
                title={!isExpanded ? item.label : undefined}
              >
                {item.icon}
                {isExpanded && (
                  <span className="ml-3 font-medium">{item.label}</span>
                )}
              </button>
            ))}
          </nav>
          
          {/* Botão para expandir/recolher a barra lateral */}
          <button 
            className="mx-auto mt-4 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-primary dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </div>

      {/* Padding para compensar a barra lateral no desktop */}
      <div className="hidden md:block md:w-64 shrink-0 transition-all duration-300">
        <div className={cn(
          "transition-all duration-300",
          isExpanded ? "w-64" : "w-20"
        )}></div>
      </div>

      {/* Padding para o conteúdo no mobile */}
      <div className="h-16 md:h-0 w-full block md:hidden"></div>
    </>
  );
} 