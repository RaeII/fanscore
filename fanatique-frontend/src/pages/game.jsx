import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWalletContext } from '../hooks/useWalletContext';
import { 
  ChevronRight, 
  Star, 
  Calendar, 
  MapPin, 
  Loader2, 
  ShoppingBag, 
  Trophy, 
  Ticket, 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  Lock,
  Timer,
  CircleAlert
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { showError } from '../lib/toast';
import clubApi from '../api/club';
import matchApi from '../api/match';
import { completeQuest } from '../data/mock-data';

// QuestStatusChip component
const QuestStatusChip = ({ status }) => {
  switch (status) {
    case 'AVAILABLE':
      return (
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/80 text-white">
          Available
        </div>
      );
    case 'IN_PROGRESS':
      return (
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/80 text-white">
          <Clock size={12} className="mr-1" />
          In Progress
        </div>
      );
    case 'COMPLETED':
      return (
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/80 text-white">
          <CheckCircle size={12} className="mr-1" />
          Completed
        </div>
      );
    case 'LOCKED':
      return (
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/80 text-white">
          <Lock size={12} className="mr-1" />
          Locked
        </div>
      );
    default:
      return null;
  }
};

export default function GamePage() {
  const navigate = useNavigate();
  const { clubId, gameId } = useParams();
  const { isAuthenticated, getUserData } = useWalletContext();
  const [loading, setLoading] = useState(true);
  const [gameInfo, setGameInfo] = useState(null);
  const [club, setClub] = useState(null);
  const [quests, setQuests] = useState([]);
  const [questsLoading, setQuestsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Mock game stats for UI display
  const gameStats = {
    possession: { home: 60, away: 40 },
    shots: { home: 12, away: 8 },
    shotsOnTarget: { home: 6, away: 3 },
    corners: { home: 5, away: 3 },
    fouls: { home: 7, away: 9 }
  };
  
  // Mock timeline events
  const timelineEvents = [
    { time: '12\'', type: 'goal', team: 'home', player: 'Roberto Silva', description: 'Goal! Roberto Silva scores with a header from the center of the box.' },
    { time: '26\'', type: 'yellow', team: 'away', player: 'Carlos Mendez', description: 'Carlos Mendez receives a yellow card for a harsh tackle.' },
    { time: '37\'', type: 'goal', team: 'away', player: 'Diego Torres', description: 'Goal! Diego Torres equalizes with a powerful shot from outside the box.' },
    { time: '65\'', type: 'goal', team: 'home', player: 'Roberto Silva', description: 'Goal! Roberto Silva scores his second with a penalty kick.' },
  ];

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        if (!isAuthenticated) {
          console.log('GamePage: User not authenticated, redirecting to /app');
          navigate('/app');
          return;
        }

        setLoading(true);

        // Get user data to verify authentication
        await getUserData();

        if (clubId && gameId) {
          // Load club data
          await fetchClubById(clubId);
          
          // Load game data
          await loadGameInfo(gameId);
          
          // Fetch quests
          await fetchQuests(clubId);
        } else {
          // Redirect to dashboard if no clubId or gameId is provided
          navigate('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load game data');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [isAuthenticated, navigate, getUserData, clubId, gameId]);

  const fetchClubById = async (id) => {
    try {
      // Get club details
      const clubData = await clubApi.getClubById(id);
      if (clubData) {
        setClub(clubData);
      } else {
        showError('Club not found');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching club by ID:', error);
      showError('Failed to load club details');
      navigate('/dashboard');
    }
  };

  const loadGameInfo = async (id) => {
    try {
      const game = await matchApi.getMatchById(id);
      if (!game) {
        showError('Game not found');
        navigate(`/clubs/${clubId}`);
        return;
      }
      
      // Check if the current club is playing in this game
      const isParticipating = game.home_club_id === parseInt(clubId) || game.away_club_id === parseInt(clubId);
      
      if (!isParticipating) {
        showError('Your club is not participating in this game');
        navigate(`/clubs/${clubId}`);
        return;
      }
      
      // Check if the current club is the home team (for display purposes)
      const isHomeTeam = game.home_club_id === parseInt(clubId);
      
      setGameInfo({
        ...game,
        is_home_team: isHomeTeam
      });
    } catch (error) {
      console.error('Error loading game info:', error);
      showError('Failed to load game information');
      navigate(`/clubs/${clubId}`);
    }
  };

  // Fetch quests
  const fetchQuests = async (clubId) => {
    try {
      setQuestsLoading(true);
      // const clubQuests = getAvailableQuestsForClub(clubId);
      // setQuests(clubQuests);
    } catch (error) {
      console.error('Error fetching quests:', error);
      setQuests([]);
    } finally {
      setQuestsLoading(false);
    }
  };
  
  // Handle quest completion
  const handleCompleteQuest = (questId) => {
    const completedQuest = completeQuest(clubId, questId);
    if (completedQuest) {
      // Update the quest in state
      setQuests(quests.map(q => q.id === questId ? completedQuest : q));
    }
  };

  // Filter quests by status
  const filteredQuests = quests.filter(quest => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'available') return quest.status === 'AVAILABLE';
    if (activeFilter === 'inProgress') return quest.status === 'IN_PROGRESS';
    if (activeFilter === 'completed') return quest.status === 'COMPLETED';
    return true;
  });

  const handleBackToDashboard = () => {
    navigate(`/clubs/${clubId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-secondary" />
          <p className="mt-4 text-primary/70 dark:text-white/70">Loading game data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fafafa] dark:bg-[#0d0117]">
      {/* Game Header */}
      <div className="relative bg-primary overflow-hidden">
        {/* Blurred stadium background */}
        {gameInfo && gameInfo?.stadium?.image && (
          <div
            className="absolute inset-0 opacity-80 bg-no-repeat bg-center"
            style={{
              backgroundImage: `url(${gameInfo.stadium.image})`,
              backgroundSize: '150%',
              filter: 'blur(30px)'
            }}
          />
        )}
        <div className="container mx-auto px-4 py-10 relative z-10">
          {/* Back button */}
          <button
            onClick={handleBackToDashboard}
            className="flex items-center text-white/80 hover:text-white mb-6"
          >
            <ArrowLeft size={18} className="mr-1" />
            <span>Back to Club</span>
          </button>

          {/* Game Info */}
          {gameInfo && (
            <div className="text-white flex flex-col items-center text-center">
              <div className="relative flex items-center justify-center mb-4">
                <div className="flex items-center">
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mr-4">
                    {gameInfo.home_club_image ? (
                      <img 
                        src={gameInfo.home_club_image} 
                        alt={gameInfo.home_club_name} 
                        className="w-16 h-16 object-contain rounded-full"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-white/20" />
                    )}
                  </div>
                  <div className="text-4xl font-bold mx-6">
                    <span className="text-white">{gameInfo.home_score || '0'}</span>
                    <span className="text-white/50 mx-2">-</span>
                    <span className="text-white">{gameInfo.away_score || '0'}</span>
                  </div>
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center ml-4">
                    {gameInfo.away_club_image ? (
                      <img 
                        src={gameInfo.away_club_image} 
                        alt={gameInfo.away_club_name} 
                        className="w-16 h-16 object-contain rounded-full"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-white/20" />
                    )}
                  </div>
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center animate-pulse shadow-md">
                  <div className="h-2 w-2 rounded-full bg-white mr-1"></div>
                  LIVE
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold">{gameInfo.home_club_name} vs {gameInfo.away_club_name}</h1>
                <div className="flex items-center justify-center mt-2">
                  <MapPin size={18} className="text-white/70 mr-1" />
                  <span>{gameInfo.stadium_name}</span>
                </div>
                <div className="flex items-center justify-center mt-1">
                  <Timer size={18} className="text-white/70 mr-1" />
                  <span>58' - Second Half</span>
                </div>
              </div>
              <p className="mt-4 text-white/80 max-w-2xl mx-auto">
                {gameInfo.description || 'Live match in progress'}
              </p>
              
              <div className="flex flex-wrap gap-3 justify-center mt-4">
                <Button 
                  variant="default"
                  size="sm" 
                  className="bg-white/30 hover:bg-white/40 text-white border-none"
                  onClick={() => navigate(`/stadium-orders/${clubId}/${gameId}`, { state: { club } })}
                >
                  <ShoppingBag size={16} className="mr-2" />
                  Order Food & Drinks
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Match Stats Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-primary dark:text-white mb-4">Match Statistics</h2>
          
          <div className="bg-white dark:bg-[#150924] rounded-lg p-6 shadow-sm">
            {/* Possession */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-primary/70 dark:text-white/70 mb-1">
                <span>{gameStats.possession.home}%</span>
                <span>Possession</span>
                <span>{gameStats.possession.away}%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${gameStats.possession.home}%` }}
                ></div>
              </div>
            </div>
            
            {/* Shots */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-primary/70 dark:text-white/70 mb-1">
                <span>{gameStats.shots.home}</span>
                <span>Shots</span>
                <span>{gameStats.shots.away}</span>
              </div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${(gameStats.shots.home / (gameStats.shots.home + gameStats.shots.away)) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Shots on Target */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-primary/70 dark:text-white/70 mb-1">
                <span>{gameStats.shotsOnTarget.home}</span>
                <span>Shots on Target</span>
                <span>{gameStats.shotsOnTarget.away}</span>
              </div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${(gameStats.shotsOnTarget.home / (gameStats.shotsOnTarget.home + gameStats.shotsOnTarget.away)) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Additional Stats in Grid */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-sm font-medium text-primary dark:text-white">Corners</span>
                <div className="flex space-x-3">
                  <span className="font-bold text-primary dark:text-white">{gameStats.corners.home}</span>
                  <span className="text-primary/50 dark:text-white/50">|</span>
                  <span className="font-bold text-primary dark:text-white">{gameStats.corners.away}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-sm font-medium text-primary dark:text-white">Fouls</span>
                <div className="flex space-x-3">
                  <span className="font-bold text-primary dark:text-white">{gameStats.fouls.home}</span>
                  <span className="text-primary/50 dark:text-white/50">|</span>
                  <span className="font-bold text-primary dark:text-white">{gameStats.fouls.away}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Match Timeline */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-primary dark:text-white mb-4">Match Timeline</h2>
          
          <div className="bg-white dark:bg-[#150924] rounded-lg p-6 shadow-sm">
            <div className="space-y-4">
              {timelineEvents.map((event, index) => (
                <div 
                  key={index} 
                  className={`flex items-start ${event.team === 'home' ? '' : 'flex-row-reverse'}`}
                >
                  <div className="flex-shrink-0 w-16 text-center mt-0.5">
                    <span className="inline-block px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-800 rounded-md">
                      {event.time}
                    </span>
                  </div>
                  
                  <div className="mx-2 flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      event.type === 'goal' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                        : event.type === 'yellow' 
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    }`}>
                      {event.type === 'goal' ? (
                        <Star size={20} />
                      ) : event.type === 'yellow' ? (
                        <CircleAlert size={20} />
                      ) : (
                        <CircleAlert size={20} />
                      )}
                    </div>
                    <div className="h-full w-0.5 bg-gray-200 dark:bg-gray-700 my-1"></div>
                  </div>
                  
                  <div className={`flex-1 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg ${
                    event.team === 'home' ? 'rounded-tl-none' : 'rounded-tr-none'
                  }`}>
                    <p className="font-medium text-primary dark:text-white">
                      {event.player}
                    </p>
                    <p className="text-sm text-primary/70 dark:text-white/70 mt-1">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      
        {/* Game Quests Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-primary dark:text-white">Game Quests</h2>
          <p className="text-primary/70 dark:text-white/70 mt-1">
            Complete match-specific quests to earn points and unlock rewards.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button 
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('all')}
            className={`
              rounded-full font-medium 
              ${activeFilter === 'all' 
                ? 'bg-primary text-white shadow-md' 
                : 'border-primary/20 dark:border-white/20 text-primary dark:text-white/70 hover:bg-primary/10 dark:hover:bg-white/10'}
            `}
          >
            All
          </Button>
          <Button 
            variant={activeFilter === 'available' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('available')}
            className={`
              rounded-full font-medium
              ${activeFilter === 'available' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'border-primary/20 dark:border-white/20 text-primary dark:text-white/70 hover:bg-primary/10 dark:hover:bg-white/10'}
            `}
          >
            Available
          </Button>
          <Button 
            variant={activeFilter === 'inProgress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('inProgress')}
            className={`
              rounded-full font-medium
              ${activeFilter === 'inProgress' 
                ? 'bg-orange-500 text-white shadow-md' 
                : 'border-primary/20 dark:border-white/20 text-primary dark:text-white/70 hover:bg-primary/10 dark:hover:bg-white/10'}
            `}
          >
            In Progress
          </Button>
          <Button 
            variant={activeFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('completed')}
            className={`
              rounded-full font-medium
              ${activeFilter === 'completed' 
                ? 'bg-green-500 text-white shadow-md' 
                : 'border-primary/20 dark:border-white/20 text-primary dark:text-white/70 hover:bg-primary/10 dark:hover:bg-white/10'}
            `}
          >
            Completed
          </Button>
        </div>

        {questsLoading ? (
          <div className="flex justify-center items-center my-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredQuests.length === 0 ? (
          <div className="text-center my-12">
            <p className="text-lg text-primary/70 dark:text-white/70">No quests available for this game</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuests.map((quest) => (
              <div 
                key={quest.id}
                className="relative flex flex-col h-[420px] w-full rounded-lg bg-white dark:bg-[#161622] p-6 tracking-tight overflow-hidden cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-[#1D1D2D] active:scale-[0.99] group"
              >
                {/* Quest image as background */}
                <div className="quest-image absolute inset-0">
                  <img
                    src={quest.image}
                    alt={quest.name}
                    className="h-full w-full object-cover transition-all duration-300 group-hover:scale-[1.02] group-hover:opacity-95"
                  />
                  {/* Full overlay gradient from bottom to top */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#161622] via-[#161622]/90 to-black/40"></div>
                </div>
                
                {/* Top section with status and points */}
                <div className="z-10 flex justify-between">
                  <QuestStatusChip status={quest.status} />
                  <div className="flex items-center px-2 py-1 rounded-full bg-black/50 text-white text-xs font-semibold">
                    <Star size={14} className="text-yellow-400 mr-1.5" fill="#FFCC00" />
                    {quest.points} pts
                  </div>
                </div>
                
                {/* Main content */}
                <div className="z-10 flex flex-col justify-between mt-auto h-[45%]">
                  <div className="flex flex-col mt-6">
                    <h2 className="text-xl font-bold text-white line-clamp-2 mb-2">
                      {quest.name}
                    </h2>
                    
                    <p className="text-sm text-white/80 line-clamp-2 mb-6">
                      {quest.description}
                    </p>
                  </div>
                  
                  {/* Bottom section */}
                  <div className="flex flex-col gap-2 mt-auto">
                    <div className="text-xs text-white/70">
                      <span className="font-semibold text-white/90">Requirements:</span> {quest.requirements}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      {/* Participant count */}
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-white">
                          {quest.status === 'COMPLETED' ? (
                            <div className="flex items-center text-green-400">
                              <CheckCircle size={14} className="mr-1" />
                              <span>Completed</span>
                            </div>
                          ) : quest.progress ? (
                            <div className="flex flex-col">
                              <span className="leading-none">{quest.progress.current}/{quest.progress.total}</span>
                              <span className="text-xs font-medium text-white/70">Progress</span>
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="leading-none">Available</span>
                              <span className="text-xs font-medium text-white/70">Status</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Complete button */}
                      {quest.status === 'AVAILABLE' || quest.status === 'IN_PROGRESS' ? (
                        <Button 
                          variant="default"
                          size="sm"
                          className="whitespace-nowrap bg-primary hover:bg-primary/90 text-white px-4"
                          onClick={() => handleCompleteQuest(quest.id)}
                        >
                          {quest.status === 'IN_PROGRESS' ? 'Update' : 'Complete'}
                        </Button>
                      ) : quest.status === 'COMPLETED' ? (
                        <div className="text-xs font-medium text-white/70">
                          {new Date(quest.completedAt).toLocaleDateString()}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 