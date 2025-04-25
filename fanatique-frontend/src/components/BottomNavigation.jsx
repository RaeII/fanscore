import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User, Heart, MessageCircle, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';
import { useUserContext } from '../hooks/useUserContext';

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userClubsData } = useUserContext();
  const [activeItem, setActiveItem] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Get the heart club data
  const heartClub = userClubsData?.heart_club?.club;

  // Set active item based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) {
      setActiveItem('home');
    } else if (path.startsWith('/perfil')) {
      setActiveItem('profile');
    } else if (path.includes('/forum')) {
      setActiveItem('forum');
    } else if (path.startsWith('/clubs/') && heartClub && path.includes(heartClub.id)) {
      setActiveItem('heartClub');
    } else if (path.includes('/matches')) {
      setActiveItem('matches');
    }
  }, [location, heartClub]);

  // Add scroll listener to control visibility on desktop
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home size={20} />,
      onClick: () => navigate('/dashboard'),
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User size={20} />,
      onClick: () => navigate('/perfil'),
    },
    {
      id: 'heartClub',
      label: 'My Club',
      icon: <Heart size={20} />,
      onClick: () => heartClub ? navigate(`/clubs/${heartClub.id}`) : navigate('/dashboard'),
      disabled: !heartClub,
    },
    {
      id: 'forum',
      label: 'Forum',
      icon: <MessageCircle size={20} />,
      onClick: () => heartClub ? navigate(`/clubs/${heartClub.id}/forum`) : navigate('/dashboard'),
      disabled: !heartClub,
    },
    {
      id: 'matches',
      label: 'Matches',
      icon: <Trophy size={20} />,
      onClick: () => heartClub ? navigate(`/matches`) : navigate('/dashboard'),
      disabled: !heartClub,
    },
  ];

  return (
    <>
      {/* Mobile bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0d0117] shadow-lg border-t border-gray-200 dark:border-gray-800 z-50 md:hidden">
        <nav className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={cn(
                'flex flex-col items-center justify-center px-2 py-1 w-full h-full',
                activeItem === item.id
                  ? 'text-secondary'
                  : 'text-primary/70 dark:text-white/70',
                item.disabled && 'opacity-40'
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

      {/* Desktop floating navigation */}
      <div className={cn(
        'fixed right-6 bottom-6 bg-white dark:bg-[#150924] rounded-full shadow-lg z-50 transition-all duration-300 hidden md:block',
        isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
      )}>
        <nav className="flex items-center p-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={cn(
                'flex items-center justify-center p-3 mx-1 rounded-full transition-colors',
                activeItem === item.id
                  ? 'text-secondary bg-secondary/10'
                  : 'text-primary/70 dark:text-white/70 hover:bg-primary/5 dark:hover:bg-white/10',
                item.disabled && 'opacity-40'
              )}
              onClick={item.onClick}
              disabled={item.disabled}
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        </nav>
      </div>

      {/* Add bottom padding for mobile to prevent content being hidden behind the nav bar */}
      <div className="h-16 md:h-0 w-full"></div>
    </>
  );
} 