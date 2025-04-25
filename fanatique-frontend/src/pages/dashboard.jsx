import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../hooks/useWalletContext';
import { Trophy, Star, Ticket, ShoppingBag, User, Volleyball as Football, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import clubApi from '../api/club';
import QuestScope from '../enum/QuestScope';
import Quests from '../components/quests';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { 
    account, 
    disconnectWallet, 
    clearAuthCredentials, 
    isAuthenticated,
    isConnected, 
    connectWallet
  } = useWalletContext();
  const [loading, setLoading] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [liveGameClubs, setLiveGameClubs] = useState([]);

  // Efeito para garantir que a carteira esteja conectada
  useEffect(() => {
    const ensureWalletConnected = async () => {
      // Se não temos uma conta mas temos autenticação, tente conectar a carteira
      if (!isConnected && isAuthenticated) {
        console.log('Dashboard: Usuário autenticado, mas carteira não está conectada. Reconectando...');
        await connectWallet();
      }
    };

    ensureWalletConnected();
  }, [account, isAuthenticated, isConnected, connectWallet]);

  useEffect(() => {
    // Verificar se o usuário está autenticado usando o contexto
    if (!isAuthenticated) {
      console.log('Dashboard: Usuário não autenticado, redirecionando para /app');
      navigate('/app');
      return;
    }

    console.log('Dashboard: Usuário autenticado via contexto, buscando dados');
    const fetchClubs = async () => {
      try {
        setLoading(true);
        const clubs = await clubApi.getClubs();
        setClubs(clubs);
        
        // Mock data for clubs with live games - in a real app this would come from an API
        // This simulates a club ID to club name mapping
        const clubNames = {
          '1': 'FC Barcelona',
          '2': 'Real Madrid',
          '3': 'Manchester United',
          '4': 'Vasco'
        };
        
        // Check which clubs have live games
        const mockAvailableGames = [
          {
            id: 'game-123',
            homeTeam: 'FC Barcelona',
            awayTeam: 'Real Madrid',
            status: 'LIVE',
          },
          {
            id: 'game-456',
            homeTeam: 'Manchester United',
            awayTeam: 'Liverpool FC',
            status: 'LIVE',
          },
          {
            id: 'game-789',
            homeTeam: 'Vasco',
            awayTeam: 'Flamengo',
            status: 'LIVE',
          }
        ];
        
        // Find clubs that have live games
        const liveClubIds = clubs.filter(club => {
          const clubName = clubNames[club.id];
          return mockAvailableGames.some(game => 
            game.homeTeam === clubName || game.awayTeam === clubName
          );
        }).map(club => club.id);
        
        setLiveGameClubs(liveClubIds);
      } catch (error) {
        console.error('Erro ao buscar clubes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, [isAuthenticated, navigate, clearAuthCredentials]);

  const handleSelectClub = (clubId) => {
    navigate(`/clubs/${clubId}`);
  };

  const isClubLive = (clubId) => {
    return liveGameClubs.includes(clubId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  //CONTEÚDO PRINCIPAL DO DASHBOARD
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fafafa] dark:bg-[#0d0117]">
      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-primary dark:text-white">Escolha um Clube</h1>
          <Button 
            variant="outline"
            className="text-primary border-primary hover:bg-primary/10 dark:text-white dark:border-white dark:hover:bg-white/10"
            onClick={() => disconnectWallet()}
          >
            <LogOut size={16} className="mr-2" />
            Sair
          </Button>
        </div>

        <p className="text-primary/70 dark:text-white/70 mb-5">
          Selecione um clube para ver detalhes, eventos, notícias e muito mais.
        </p>

        {/* Horizontal scrollable clubs */}
        <div className="overflow-x-auto pb-4 mb-8">
          <div className="flex space-x-4 min-w-max">
            {clubs.length > 0 ? (
              clubs.map(club => (
                <div 
                  key={club.id} 
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => handleSelectClub(club.id)}
                >
                  <div className="relative w-20 h-20">
                    <div className="w-full h-full rounded-full bg-white dark:bg-[#150924] shadow-sm overflow-hidden mb-2 transition-transform hover:scale-110 border-2 border-transparent hover:border-secondary">
                      {club.image ? (
                        <img 
                          src={club.image} 
                          alt={club.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5 dark:bg-primary/20 text-primary/50 dark:text-white/50">
                          <Football size={30} />
                        </div>
                      )}
                    </div>
                    {isClubLive(club.id) && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center animate-pulse shadow-md">
                        <div className="h-2 w-2 rounded-full bg-white mr-1"></div>
                        LIVE
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-primary dark:text-white text-center w-24 truncate mt-2">
                    {club.name}
                  </p>
                </div>
              ))
            ) : (
              <div className="w-full py-8 text-center">
                <Football size={36} className="mx-auto text-primary/30 dark:text-white/30 mb-2" />
                <p className="text-primary/70 dark:text-white/70">
                  Nenhum clube disponível
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Featured Clubs
        <h2 className="text-xl font-bold text-primary dark:text-white mb-4">Clubes em Destaque</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {clubs.slice(0, 3).map(club => (
            <div 
              key={club.id} 
              className="bg-white dark:bg-[#150924] rounded-lg overflow-hidden shadow-sm cursor-pointer hover:shadow-md"
              onClick={() => handleSelectClub(club.id)}
            >
              <div className="h-32 bg-gray-200 dark:bg-gray-700 relative">
                {club.image ? (
                  <img 
                    src={club.image} 
                    alt={club.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-primary/30 dark:text-white/30">
                    <Football size={36} />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-primary dark:text-white">{club.name}</h3>
                <div className="flex items-center mt-1">
                  <Star size={14} className="text-yellow-400 mr-1" />
                  <span className="text-xs text-primary/70 dark:text-white/70">{club.fanCount || 0} fãs</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full mt-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectClub(club.id);
                  }}
                >
                  Ver Detalhes
                </Button>
              </div>
            </div>
          ))}
        </div> */}
        <Quests questScope={QuestScope.GENERAL} />
        {/* <h2 className="text-xl font-bold text-primary dark:text-white mb-4">Ações Rápidas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard 
            icon={<ShoppingBag size={36} className="text-secondary" />}
            title="Fazer Pedido"
            description="Peça comidas e bebidas sem pegar fila"
            buttonText="Pedir Agora"
            onClick={() => navigate('/pedidos')}
          />
          <ActionCard 
            icon={<Trophy size={36} className="text-secondary" />}
            title="Completar Quests"
            description="Ganhe pontos completando missões"
            buttonText="Ver Quests"
            onClick={() => navigate('/quests')}
          />
          <ActionCard 
            icon={<User size={36} className="text-secondary" />}
            title="Meu Perfil"
            description="Veja e edite suas informações"
            buttonText="Ver Perfil"
            onClick={() => navigate('/perfil')}
          />
        </div> */}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, label }) {
  return (
    <div className="bg-white dark:bg-[#150924] p-6 rounded-lg shadow-sm">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-primary/5 dark:bg-primary/20">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-medium text-primary/60 dark:text-white/60">{title}</h3>
          <p className="text-2xl font-bold text-primary dark:text-white">{value}</p>
          <p className="text-xs text-primary/60 dark:text-white/60">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, description, buttonText, onClick }) {
  return (
    <div className="bg-white dark:bg-[#150924] p-6 rounded-lg shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="p-4 rounded-full bg-primary/5 dark:bg-primary/20 mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-medium text-primary dark:text-white mb-2">{title}</h3>
        <p className="text-primary/70 dark:text-white/70 mb-6">{description}</p>
        <Button 
          variant="secondary"
          className="w-full"
          onClick={onClick}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
} 