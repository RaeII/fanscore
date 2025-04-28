import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User, Heart, MessageCircle, Trophy, Settings, Store, Calendar, ChevronUp, X, Wallet } from 'lucide-react';
import { cn } from '../lib/utils';
import { useUserContext } from '../hooks/useUserContext';

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userClubsData } = useUserContext();
  const [activeItem, setActiveItem] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showClubOptions, setShowClubOptions] = useState(false);
  
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
      setActiveItem('heartClub');
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
  }, [location]);

  // Opções do clube
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

  // Mobile nav items - limited set
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
      onClick: () => navigate(`/clubs/${heartClub.id}/forum`),
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
    }
  ];

  // Desktop nav items - expanded set with more options
  const desktopNavItems = [
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

  return (
    <>
      {/* Mobile bottom navigation - traditional tab bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0d0117] shadow-lg border-t border-gray-200 dark:border-gray-800 z-50 md:hidden">
        <nav className="flex justify-around items-center h-16">
          {mobileNavItems.map((item) => (
            <button
              key={item.id}
              className={cn(
                'flex flex-col items-center justify-center px-2 py-1 w-full h-full relative',
                activeItem === item.id
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
        
        {/* Menu de opções do clube (mobile) */}
        {showClubOptions && (
          <div className="absolute bottom-20 left-0 right-0 flex justify-center items-center z-50 px-4">
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-3">
              {clubOptions.map((option) => (
                <button
                  key={option.id}
                  className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-full bg-white/10 dark:bg-[#221130] shadow-lg border border-gray-700',
                    activeItem === option.id
                      ? 'text-secondary border-secondary'
                      : 'text-primary/70 dark:text-white/90'
                  )}
                  onClick={option.onClick}
                  title={option.label}
                >
                  {option.icon}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Desktop dock-style navigation - always visible and centered */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 hidden md:block">
        <div className={cn(
          'relative rounded-full bg-white/90 dark:bg-[#150924]/90 shadow-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700 transition-all duration-300',
          isExpanded ? 'py-3 px-4' : 'py-2 px-3'
        )}>
          {/* Expand/collapse button */}
          <button 
            className={cn(
              "absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white dark:bg-[#150924] rounded-full w-7 h-7 flex items-center justify-center shadow-md border border-gray-200 dark:border-gray-700 text-primary/70 dark:text-white/70 transition-transform duration-300",
              isExpanded && "rotate-180"
            )}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronUp size={16} />
          </button>

          <nav className="flex items-center space-x-1">
            {desktopNavItems.map((item) => (
              <button
                key={item.id}
                className={cn(
                  'flex items-center rounded-full transition-all duration-200 relative',
                  isExpanded ? 'px-4 py-2' : 'p-2',
                  activeItem === item.id
                    ? 'text-white bg-secondary shadow-md'
                    : 'text-primary/70 dark:text-white/70 hover:bg-primary/10 dark:hover:bg-white/10',
                  item.disabled && 'opacity-40 cursor-not-allowed',
                  showClubOptions && item.id === 'heartClub' && 'text-white bg-secondary'
                )}
                onClick={item.onClick}
                disabled={item.disabled}
                title={item.label}
              >
                {item.icon}
                {isExpanded && (
                  <span className="ml-2 text-sm font-medium">{item.label}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Menu de opções do clube (desktop) */}
        {showClubOptions && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-50">
            <div className="flex gap-3">
              {clubOptions.map((option) => (
                <button
                  key={option.id}
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full bg-white/10 dark:bg-[#221130] shadow-lg backdrop-blur-sm border border-gray-700',
                    activeItem === option.id
                      ? 'text-secondary border-secondary'
                      : 'text-primary/70 dark:text-white/90'
                  )}
                  onClick={option.onClick}
                  title={option.label}
                >
                  {option.icon}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add bottom padding for mobile to prevent content being hidden behind the nav bar */}
      <div className="h-16 md:h-0 w-full"></div>
    </>
  );
} 