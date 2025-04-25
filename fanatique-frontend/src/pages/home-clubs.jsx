import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useWalletContext } from '../hooks/useWalletContext';
import { ChevronRight, Star, Calendar, MapPin, Loader2, ShoppingBag, Trophy, Ticket, ArrowLeft, Heart, UserPlus, UserCheck, CheckCircle, Clock, Lock, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { showError } from '../lib/toast';
import clubApi from '../api/club';
import userClubApi from '../api/user_club';
import { useUserContext } from '../hooks/useUserContext';
import matchApi from '../api/match';

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

export default function HomeClubsPage() {
  const navigate = useNavigate();
  const { clubId } = useParams();
  const location = useLocation();
  const { isAuthenticated, getUserData } = useWalletContext();
  const [loading, setLoading] = useState(true);
  const [userClubStats, setUserClubStats] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [liveGame, setLiveGame] = useState(null);
  const [isHeartClub, setIsHeartClub] = useState(false);
  const [hasHeartClub, setHasHeartClub] = useState(false);
  const [heartClubLoading, setHeartClubLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const { isUserHeartClub, hasUserHeartClub, isFollowingClub, updateUserClubsData } = useUserContext();

  // Get the tab from URL query parameter or default to 'overview'
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');

  // Tab state
  const [activeTab, setActiveTab] = useState(tabParam || 'overview');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'available', 'inProgress', 'completed'

  // Check if user is authenticated and load data
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        if (!isAuthenticated) {
          console.log('HomeClubs: User not authenticated, redirecting to /app');
          navigate('/app');
          return;
        }

        setLoading(true);

        // Get user data - we call this to verify authentication
        await getUserData();

        if (clubId) {
          // Load specific club by ID
          await fetchClubById(clubId);
          // Check if there's a live game
          await checkLiveGame(clubId);
          // Check if user is following this club
          await checkIfFollowing(clubId);
        } else {
          // Redirect to dashboard if no clubId is provided
          navigate('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load club data');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [isAuthenticated, navigate, getUserData, clubId]);

  const checkIfFollowing = async (clubId) => {
    try {
      // In a real app, this would be an API call to check if user is following this club
      // For demo purposes, we'll mock this with local storage
      setIsFollowing(isFollowingClub(clubId));
    } catch (error) {
      console.error('Error checking following status:', error);
      setIsFollowing(false);
    }
  };

  const toggleFollow = async () => {
    try {
      setFollowLoading(true);
      
      // In a real app, this would be an API call to follow/unfollow the club
      // For demo purposes, we'll use local storage
      if (isFollowing) {
        // Unfollow this club
        await userClubApi.removeClubAssociation(clubId);
        setIsFollowing(false);
        // showSuccess(`You are no longer following ${selectedClub.name}`);
      } else {
        // Follow this club
        await userClubApi.addClubAssociation(clubId, 2);
        setIsFollowing(true);
        // showSuccess(`You are now following ${selectedClub.name}`);
      }
      updateUserClubsData();
    } catch (error) {
      console.error('Error toggling follow:', error);
      showError('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const fetchClubById = async (id) => {
    try {
      // Get club details
      const clubData = await clubApi.getClubById(id);
      if (clubData) {
        setSelectedClub(clubData);

        // Fetch events for the club
        await fetchClubEvents(id);

        // Fetch user stats for this club
        await fetchUserClubStats(id);
        
        // Check if this is the user's heart club
        await checkIfHeartClub(id);
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

  const fetchUserClubStats = async (clubId) => {
    try {
      const userStats = await clubApi.getUserClubStats(clubId);
      if (userStats) {
        setUserClubStats(userStats);
      }
    } catch (error) {
      console.error('Error fetching user club stats:', error);
      // Don't redirect on stats error, just set default values
      setUserClubStats({
        points: 0,
        quests: 0,
        orders: 0,
        tickets: 0
      });
    }
  };

  const fetchClubEvents = async (clubId) => {
    try {
      const events = await clubApi.getClubEvents(clubId);
      if (events) {
        setUpcomingEvents(events);
      }
    } catch (error) {
      console.error('Error fetching club events:', error);
      setUpcomingEvents([]);
    }
  };

  const checkLiveGame = async (clubId) => {
    try {
      const clubGames = await matchApi.getMatchesByClub(clubId);
      console.log(clubGames);
      if (clubGames.length > 0) {
        // If a game is found where the club is participating, set it
        const clubGame = clubGames[0];
        const isCurrentClubHomeTeam = clubGame.home_club_id === clubId;

        setLiveGame({
          ...clubGame,
          isHomeTeam: isCurrentClubHomeTeam
        });
      } else {
        // No live game found for this club
        setLiveGame(null);
      }
    } catch (error) {
      console.error('Error checking for live game:', error);
      setLiveGame(null);
    }
  };

  const checkIfHeartClub = async (clubId) => {
    try {
      // In a real app, this would be an API call to check if this is the user's heart club
      // For demo purposes, we'll mock this with local storage
      setIsHeartClub(isUserHeartClub(clubId));
      setHasHeartClub(hasUserHeartClub(clubId));
    } catch (error) {
      console.error('Error checking heart club status:', error);
      setIsHeartClub(false);
    }
  };

  const toggleHeartClub = async () => {
    try {
      setHeartClubLoading(true);
      
      // In a real app, this would be an API call to set/unset the heart club
      // For demo purposes, we'll use local storage
      const hasHeartClub = hasUserHeartClub();
      
      if (isHeartClub) {
        // Remove this club as heart club
        await userClubApi.removeClubAssociation(clubId);
        setIsHeartClub(false);
        setHasHeartClub(false);
        // localStorage.removeItem('heartClubId');
        // showSuccess(`${selectedClub.name} is no longer your heart club`);
      } else {
        // Check if user already has a heart club
        if (hasHeartClub) {
          showError('You already have a heart club. You can only have one heart club at a time.');
        } else {
          // Set this club as heart club
          await userClubApi.addClubAssociation(clubId, 1);
          // localStorage.setItem('heartClubId', clubId);
          setIsHeartClub(true);
          // showSuccess(`${selectedClub.name} is now your heart club!`);
        }
      }
      updateUserClubsData();
    } catch (error) {
      console.error('Error toggling heart club:', error);
      showError('Failed to update heart club status');
    } finally {
      setHeartClubLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-secondary" />
          <p className="mt-4 text-primary/70 dark:text-white/70">Loading club data...</p>
        </div>
      </div>
    );
  }
  console.log('liveGame', liveGame);
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fafafa] dark:bg-[#0d0117]">
      {/* Club Header */}
      <div className="relative bg-primary overflow-hidden">
        {/* Blurred logo background */}
        {selectedClub && selectedClub.image && (
          <div
            className="absolute inset-0 opacity-30 bg-no-repeat bg-center"
            style={{
              backgroundImage: `url(${selectedClub.image})`,
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
            <span>Back to Clubs</span>
          </button>

          {/* Club Info */}
          {selectedClub && (
            <div className="text-white flex flex-col items-center text-center">
              <div className="relative">
                {selectedClub.image ? (
                  <img
                    src={selectedClub.image}
                    alt={selectedClub.name}
                    className="w-28 h-28 rounded-full mb-4 border-4 border-white/20"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-white/20 mb-4" />
                )}
                {liveGame && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center animate-pulse shadow-md">
                    <div className="h-2 w-2 rounded-full bg-white mr-1"></div>
                    LIVE
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{selectedClub.name}</h1>
                <div className="flex items-center justify-center mt-2">
                  <Star size={18} className="text-yellow-400 mr-1" />
                  <span>{selectedClub.fanCount || 0} fans</span>
                </div>
              </div>
              <p className="mt-4 text-white/80 max-w-2xl mx-auto">{selectedClub.description || ''}</p>
              
              <div className="flex flex-wrap gap-3 justify-center mt-4">
                {/* Heart Club Button */}
                {(hasHeartClub && isHeartClub || !hasHeartClub) && (
                  <Button 
                    variant={isHeartClub ? "secondary" : "default"}
                    size="sm" 
                    className={`${isHeartClub ? '' : 'bg-white/30 hover:bg-white/40 text-white border-none'}`}
                    onClick={toggleHeartClub}
                    disabled={heartClubLoading}
                  >
                    <Heart size={16} className={`mr-2 ${isHeartClub ? 'fill-white' : ''}`} />
                    {heartClubLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isHeartClub ? (
                      "Heart Club"
                    ) : (
                      "Heart Club"
                    )}
                  </Button>
                )}
                
                {/* Follow Button - shows when the club is not the heart club or when heart club button is not showing */}
                {(!isHeartClub || (hasHeartClub && !isHeartClub)) && (
                  <Button 
                    variant="default"
                    size="sm" 
                    className="bg-white/30 hover:bg-white/40 text-white border-none"
                    onClick={toggleFollow}
                    disabled={followLoading}
                  >
                    {isFollowing ? (
                      <UserCheck size={16} className="mr-2 fill-white" />
                    ) : (
                      <UserPlus size={16} className="mr-2" />
                    )}
                    {followLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isFollowing ? (
                      "Following"
                    ) : (
                      "Follow"
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Stats */}
      <div className="container mx-auto px-4 -mt-6 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<Trophy size={24} className="text-secondary" />}
            title="Points"
            value={userClubStats?.points || "0"}
            label="accumulated points"
          />
          <StatCard
            icon={<Star size={24} className="text-secondary" />}
            title="Quests"
            value={userClubStats?.quests || "0"}
            label="completed"
          />
          <StatCard
            icon={<ShoppingBag size={24} className="text-secondary" />}
            title="Orders"
            value={userClubStats?.orders || "0"}
            label="made"
          />
          <StatCard
            icon={<Ticket size={24} className="text-secondary" />}
            title="Tickets"
            value={userClubStats?.tickets || "0"}
            label="purchased"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="container mx-auto px-4 mt-6 mb-2">
        <div className="flex space-x-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
          <Button 
            variant="ghost" 
            size="sm"
            className={`rounded-none border-b-2 px-4 ${
              activeTab === 'overview'
                ? 'border-secondary text-secondary font-semibold'
                : 'border-transparent text-primary/70 dark:text-white/70'
            }`}
            onClick={() => {
              setActiveTab('overview');
              navigate(`/clubs/${clubId}`);
            }}
          >
            Overview
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className={`rounded-none border-b-2 px-4 ${
              activeTab === 'events'
                ? 'border-secondary text-secondary font-semibold'
                : 'border-transparent text-primary/70 dark:text-white/70'
            }`}
            onClick={() => {
              setActiveTab('events');
              navigate(`/clubs/${clubId}?tab=events`);
            }}
          >
            Events
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className={`rounded-none border-b-2 px-4 ${
              activeTab === 'news'
                ? 'border-secondary text-secondary font-semibold'
                : 'border-transparent text-primary/70 dark:text-white/70'
            }`}
            onClick={() => {
              setActiveTab('news');
              navigate(`/clubs/${clubId}?tab=news`);
            }}
          >
            News
          </Button>
          <Button
            variant="ghost" 
            size="sm"
            className={`rounded-none border-b-2 px-4 ${
              activeTab === 'forum'
                ? 'border-secondary text-secondary font-semibold'
                : 'border-transparent text-primary/70 dark:text-white/70'
            }`}
            onClick={() => {
              setActiveTab('forum');
              navigate(`/clubs/${clubId}/forum`);
            }}
          >
            Forum
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-2 pb-20">
        {/* Live Game Banner - Always show regardless of tab */}
        {liveGame && (
          <div className="relative bg-gradient-to-r from-primary to-secondary text-white rounded-lg p-4 mb-4 shadow-sm overflow-hidden">
            {/* Stadium image background */}
            {liveGame?.stadium?.image && (
              <div className="absolute inset-0">
                <img 
                  src={liveGame?.stadium?.image} 
                  alt={liveGame.stadium.name} 
                  className="w-full h-full object-cover"
                />
                {/* Gradient overlay to ensure text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/90"></div>
              </div>
            )}
            <div className="flex items-center justify-between relative z-10">
              <div>
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
                  <span className="text-xs font-medium uppercase">Live Now</span>
                </div>
                <h3 className="font-medium mt-1">{liveGame.home_club.name} vs {liveGame.away_club.name}</h3>
                <p className="text-sm mt-1">Score: 0 - 0</p>
                <p className="text-xs mt-1">Stadium: {liveGame.stadium.name}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/game/${clubId}/${liveGame.id}`, { state: { club: selectedClub } })}
                >
                  View Game
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => navigate(`/stadium-orders/${clubId}/${liveGame.id}`, { state: { club: selectedClub } })}
                >
                  Order Food & Drinks
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab content */}
        {activeTab === 'overview' && (
          <>
            {/* Upcoming Events */}
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-primary dark:text-white">Upcoming Events</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-secondary"
                  onClick={() => setActiveTab('events')}
                >
                  View All <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>

              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className="bg-white dark:bg-[#150924] rounded-lg p-4 shadow-sm"
                    >
                      <h3 className="font-medium text-primary dark:text-white">{event.title}</h3>
                      <div className="flex items-center text-sm text-primary/70 dark:text-white/70 mt-2">
                        <Calendar size={16} className="mr-1" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-sm text-primary/70 dark:text-white/70 mt-1">
                        <MapPin size={16} className="mr-1" />
                        <span>{event.location}</span>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-[#150924] rounded-lg p-6 text-center shadow-sm">
                  <p className="text-primary/70 dark:text-white/70">No upcoming events for this club</p>
                </div>
              )}
            </section>

            {/* Fan Activities */}
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-primary dark:text-white">Fan Activities</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="bg-white dark:bg-[#150924] rounded-lg p-4 shadow-sm flex flex-col items-center text-center cursor-pointer"
                  onClick={() => {
                    setActiveTab('quests');
                    navigate(`/clubs/${clubId}?tab=quests`);
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-2">
                    <Star size={24} className="text-secondary" />
                  </div>
                  <h3 className="font-medium text-primary dark:text-white">Quests</h3>
                  <p className="text-sm text-primary/70 dark:text-white/70 mt-1">Complete challenges and earn rewards</p>
                </div>

                <div
                  className="bg-white dark:bg-[#150924] rounded-lg p-4 shadow-sm flex flex-col items-center text-center cursor-pointer"
                  onClick={() => navigate(`/pedidos?clubId=${selectedClub.id}`)}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-2">
                    <ShoppingBag size={24} className="text-secondary" />
                  </div>
                  <h3 className="font-medium text-primary dark:text-white">Stadium Orders</h3>
                  <p className="text-sm text-primary/70 dark:text-white/70 mt-1">Order food and drinks without waiting in line</p>
                </div>
              </div>
            </section>

            {/* Club News */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-primary dark:text-white">Latest News</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-secondary"
                  onClick={() => setActiveTab('news')}
                >
                  View All <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>

              <div className="space-y-3">
                {selectedClub?.news?.length > 0 ? (
                  selectedClub.news.slice(0, 2).map((item, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-[#150924] rounded-lg overflow-hidden shadow-sm"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-40 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h3 className="font-medium text-primary dark:text-white">{item.title}</h3>
                        <p className="text-sm text-primary/70 dark:text-white/70 mt-1 line-clamp-2">
                          {item.summary}
                        </p>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-xs text-primary/60 dark:text-white/60">
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-secondary"
                            onClick={() => navigate(`/news/${item.id}`)}
                          >
                            Read More
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white dark:bg-[#150924] rounded-lg p-6 text-center shadow-sm">
                    <p className="text-primary/70 dark:text-white/70">No news available for this club</p>
                  </div>
                )}
              </div>
            </section>

            {/* New Forum Banner */}
            <div className="bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-lg p-4 mb-6 shadow-md border border-indigo-500/30">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-500/30 p-3 rounded-full">
                  <MessageCircle size={24} className="text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Club Forum Now Available!</h3>
                  <p className="text-sm text-gray-300 mb-2">Join the conversation with other fans of {selectedClub.name}</p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-indigo-500/50 hover:bg-indigo-500/20 text-indigo-200"
                    onClick={() => navigate(`/clubs/${clubId}/forum`)}
                  >
                    Visit Forum
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Quests Tab */}
        {activeTab === 'quests' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-primary dark:text-white">Club Quests</h2>
              <p className="text-primary/70 dark:text-white/70 mt-1">
                Complete quests to earn points and unlock rewards for your club.
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
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-primary dark:text-white">All Events</h2>
              <p className="text-primary/70 dark:text-white/70 mt-1">
                View all upcoming events for {selectedClub?.name}.
              </p>
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white dark:bg-[#150924] rounded-lg p-4 shadow-sm"
                  >
                    <h3 className="font-medium text-primary dark:text-white">{event.title}</h3>
                    <div className="flex items-center text-sm text-primary/70 dark:text-white/70 mt-2">
                      <Calendar size={16} className="mr-1" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-sm text-primary/70 dark:text-white/70 mt-1">
                      <MapPin size={16} className="mr-1" />
                      <span>{event.location}</span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#150924] rounded-lg p-6 text-center shadow-sm">
                <p className="text-primary/70 dark:text-white/70">No upcoming events for this club</p>
              </div>
            )}
          </div>
        )}

        {/* News Tab */}
        {activeTab === 'news' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-primary dark:text-white">All News</h2>
              <p className="text-primary/70 dark:text-white/70 mt-1">
                Latest news and updates from {selectedClub?.name}.
              </p>
            </div>

            <div className="space-y-3">
              {selectedClub?.news?.length > 0 ? (
                selectedClub.news.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-[#150924] rounded-lg overflow-hidden shadow-sm"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-medium text-primary dark:text-white">{item.title}</h3>
                      <p className="text-sm text-primary/70 dark:text-white/70 mt-1 line-clamp-3">
                        {item.summary}
                      </p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-xs text-primary/60 dark:text-white/60">
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-secondary"
                          onClick={() => navigate(`/news/${item.id}`)}
                        >
                          Read More
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-[#150924] rounded-lg p-6 text-center shadow-sm">
                  <p className="text-primary/70 dark:text-white/70">No news available for this club</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, label }) {
  return (
    <div className="bg-white dark:bg-[#150924] p-4 rounded-lg shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/5 dark:bg-primary/20">
          {icon}
        </div>
        <div>
          <h3 className="text-xs font-medium text-primary/60 dark:text-white/60">{title}</h3>
          <p className="text-xl font-bold text-primary dark:text-white">{value}</p>
          <p className="text-xs text-primary/60 dark:text-white/60">{label}</p>
        </div>
      </div>
    </div>
  );
} 