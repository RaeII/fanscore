import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../hooks/useUserContext';
import { useWalletContext } from '../hooks/useWalletContext';
import { User, Trophy, Star, ShoppingBag, Ticket, Heart, UserCheck, Calendar, Clock, Settings, Edit, Loader2, Award, BadgeCheck, Lock, CheckCircle2, Medal, Target, Crown, Gift } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { showSuccess, showError } from '../lib/toast';
import userApi from '../api/user';
import clubApi from '../api/club';

// StatCard component for displaying user metrics
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

// Club Card component for displaying clubs the user follows
function ClubCard({ club, isHeartClub }) {
  return (
    <div className="bg-white dark:bg-[#150924] p-4 rounded-lg shadow-sm flex items-center gap-4">
      <div className="h-14 w-14 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
        {club.image ? (
          <img src={club.image} alt={club.club_name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400">
            <User size={24} />
          </div>
        )}
      </div>
      <div className="flex-grow">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-primary dark:text-white">{club.name}</h3>
          {isHeartClub && (
            <div className="p-0.5 rounded-full bg-red-100 dark:bg-red-900/20">
              <Heart size={14} className="text-red-500 fill-red-500" />
            </div>
          )}
        </div>
        {/* <p className="text-xs text-primary/60 dark:text-white/60">
          {club.club_type_name}
        </p> */}
      </div>
    </div>
  );
}

// Achievement Card component
function AchievementCard({ achievement }) {
  return (
    <div className={`bg-white dark:bg-[#150924] p-4 rounded-lg shadow-sm border ${achievement.completed ? 'border-green-500/30' : 'border-gray-300/30 dark:border-white/10'}`}>
      <div className="flex items-start gap-4">
        <div className={`h-16 w-16 rounded-lg flex-shrink-0 flex items-center justify-center ${achievement.completed ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
          <div className="relative">
            {achievement.icon}
            {achievement.completed ? (
              <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-0.5">
                <BadgeCheck size={16} className="text-white" />
              </div>
            ) : (
              <div className="absolute -bottom-2 -right-2 bg-gray-500 rounded-full p-0.5">
                <Lock size={16} className="text-white" />
              </div>
            )}
          </div>
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className={`text-base font-semibold ${achievement.completed ? 'text-primary dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                {achievement.title}
              </h3>
              <p className={`text-xs ${achievement.completed ? 'text-primary/60 dark:text-white/60' : 'text-gray-500 dark:text-gray-400'}`}>
                {achievement.description}
              </p>
            </div>
            {achievement.completedDate && (
              <span className="text-xs text-green-600 dark:text-green-400">
                {achievement.completedDate}
              </span>
            )}
          </div>
          
          {!achievement.completed && achievement.progress && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>{achievement.progress.current}/{achievement.progress.required}</span>
                <span>{Math.round((achievement.progress.current / achievement.progress.required) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary dark:bg-primary rounded-full" 
                  style={{ width: `${(achievement.progress.current / achievement.progress.required) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { userData, loading, error, userClubsData, updateUserData } = useUserContext();
  const { isAuthenticated } = useWalletContext();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalStats, setTotalStats] = useState({
    points: 0,
    quests: 0, 
    orders: 0,
    tickets: 0
  });
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock achievements data
  const achievements = [
    {
      id: 1,
      title: "First Steps",
      description: "Complete your first quest",
      completed: true,
      completedDate: "Jan 15, 2023",
      icon: <CheckCircle2 size={28} className="text-green-500" />,
      rarity: "common"
    },
    {
      id: 2,
      title: "Club Explorer",
      description: "Follow 3 different clubs",
      completed: true,
      completedDate: "Feb 3, 2023",
      icon: <Heart size={28} className="text-red-500" />,
      rarity: "common"
    },
    {
      id: 3,
      title: "Quest Master",
      description: "Complete 10 quests",
      completed: false,
      progress: {
        current: 7,
        required: 10
      },
      icon: <Target size={28} className="text-blue-500" />,
      rarity: "uncommon"
    },
    {
      id: 4,
      title: "Ticket Collector",
      description: "Purchase 5 tickets to events",
      completed: false,
      progress: {
        current: 2,
        required: 5
      },
      icon: <Ticket size={28} className="text-purple-500" />,
      rarity: "uncommon"
    },
    {
      id: 5,
      title: "Loyal Fan",
      description: "Follow the same heart club for 30 days",
      completed: true,
      completedDate: "Mar 10, 2023",
      icon: <Medal size={28} className="text-yellow-500" />,
      rarity: "rare"
    },
    {
      id: 6,
      title: "Early Supporter",
      description: "Be one of the first 1000 users to join the platform",
      completed: true,
      completedDate: "Dec 1, 2022",
      icon: <Trophy size={28} className="text-amber-500" />,
      rarity: "legendary"
    },
    {
      id: 7,
      title: "Point Hoarder",
      description: "Accumulate 10,000 points across all clubs",
      completed: false,
      progress: {
        current: 3250,
        required: 10000
      },
      icon: <Star size={28} className="text-yellow-500" />,
      rarity: "epic"
    },
    {
      id: 8,
      title: "Merch Enthusiast",
      description: "Purchase 3 different merchandise items",
      completed: false,
      progress: {
        current: 1,
        required: 3
      },
      icon: <ShoppingBag size={28} className="text-green-500" />,
      rarity: "uncommon"
    },
    {
      id: 9,
      title: "Royalty",
      description: "Reach the highest fan tier in any club",
      completed: false,
      icon: <Crown size={28} className="text-amber-500" />,
      rarity: "legendary"
    },
    {
      id: 10,
      title: "Lucky Winner",
      description: "Win a giveaway or contest",
      completed: true,
      completedDate: "Apr 5, 2023",
      icon: <Gift size={28} className="text-pink-500" />,
      rarity: "rare"
    }
  ];
  
  // Calculate achievement progress stats
  const achievementStats = {
    total: achievements.length,
    completed: achievements.filter(a => a.completed).length,
    percentage: Math.round((achievements.filter(a => a.completed).length / achievements.length) * 100)
  };

  // Set form data when user data changes
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
      });
    }
  }, [userData]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Fetch total stats across all clubs
  useEffect(() => {
    const fetchTotalStats = async () => {
      if (!userClubsData?.clubs?.length) {
        return;
      }
      
      let points = 0;
      let quests = 0;
      let orders = 0;
      let tickets = 0;
      
      for (const club of userClubsData.clubs) {
        try {
          const stats = await clubApi.getUserClubStats(club.club_id);
          if (stats) {
            points += parseInt(stats.points || 0);
            quests += parseInt(stats.quests || 0);
            orders += parseInt(stats.orders || 0);
            tickets += parseInt(stats.tickets || 0);
          }
        } catch (error) {
          console.error(`Error fetching stats for club ${club.club_id}:`, error);
        }
      }
      
      setTotalStats({
        points,
        quests,
        orders,
        tickets
      });
    };
    
    fetchTotalStats();
  }, [userClubsData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await userApi.updateUserProfile(formData);
      await updateUserData();
      setEditMode(false);
      showSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive text-destructive">
          <p className="font-semibold">Error loading profile</p>
          <p className="text-sm">{error}</p>
          <Button 
            className="mt-4"
            onClick={updateUserData}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="p-4 rounded-lg bg-background/50 border border-border">
          <p className="text-muted-foreground">User profile not available</p>
        </div>
      </div>
    );
  }

  const registrationDate = userData.register_date ? new Date(userData.register_date).toLocaleDateString() : 'N/A';

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Profile Header */}
      <div className="mb-8">
        <div className="rounded-xl overflow-hidden mb-6 bg-gradient-to-r from-primary to-secondary/80 p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center text-white">
              <User size={48} />
            </div>
            
            <div className="flex-grow text-center md:text-left">
              {editMode ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-xs text-white/80 mb-1">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded-md border border-white/20 bg-white/10 text-white"
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-white text-primary hover:bg-white/90"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Save
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setEditMode(false)}
                      className="border-white text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-white mb-1">{userData.name}</h1>
                  <p className="text-sm text-white/80 mb-4">{userData.wallet_address}</p>
                  
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center text-white/80 text-sm">
                      <Calendar size={16} className="mr-2" />
                      Joined: {registrationDate}
                    </div>
                    {userData.update_date && (
                      <div className="flex items-center text-white/80 text-sm">
                        <Clock size={16} className="mr-2" />
                        Last updated: {new Date(userData.update_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="mt-4 border-white text-white hover:bg-white/10"
                    onClick={() => setEditMode(true)}
                  >
                    <Edit size={16} className="mr-2" />
                    Edit Profile
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Trophy size={24} className="text-secondary" />}
          title="Points"
          value={totalStats.points || "0"}
          label="total points"
        />
        <StatCard
          icon={<Star size={24} className="text-secondary" />}
          title="Quests"
          value={totalStats.quests || "0"}
          label="completed"
        />
        <StatCard
          icon={<ShoppingBag size={24} className="text-secondary" />}
          title="Orders"
          value={totalStats.orders || "0"}
          label="made"
        />
        <StatCard
          icon={<Ticket size={24} className="text-secondary" />}
          title="Tickets"
          value={totalStats.tickets || "0"}
          label="purchased"
        />
      </div>
      
      {/* Achievement Progress */}
      <div className="mb-8 bg-white dark:bg-[#150924] p-4 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/5 dark:bg-primary/20">
              <Award size={24} className="text-secondary" />
            </div>
            <div>
              <h3 className="text-xs font-medium text-primary/60 dark:text-white/60">Achievements</h3>
              <p className="text-xl font-bold text-primary dark:text-white">{achievementStats.completed}/{achievementStats.total}</p>
            </div>
          </div>
          <div className="flex-grow max-w-md">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-primary/70 dark:text-white/70">Progress</span>
              <span className="text-primary/70 dark:text-white/70">{achievementStats.percentage}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary dark:bg-primary rounded-full" 
                style={{ width: `${achievementStats.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="overview" className="flex-grow">Overview</TabsTrigger>
          <TabsTrigger value="achievements" className="flex-grow">Achievements</TabsTrigger>
          <TabsTrigger value="clubs" className="flex-grow">My Clubs</TabsTrigger>
          <TabsTrigger value="settings" className="flex-grow">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white dark:bg-[#150924] p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-primary dark:text-white mb-4">Account Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-primary/60 dark:text-white/60">Name</h3>
                    <p className="text-primary dark:text-white">{userData.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-primary/60 dark:text-white/60">Wallet Address</h3>
                    <p className="text-primary dark:text-white font-mono text-sm truncate">{userData.wallet_address}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-primary/60 dark:text-white/60">Registration Date</h3>
                    <p className="text-primary dark:text-white">{registrationDate}</p>
                  </div>
                  {userData.update_date && (
                    <div>
                      <h3 className="text-sm font-medium text-primary/60 dark:text-white/60">Last Updated</h3>
                      <p className="text-primary dark:text-white">{new Date(userData.update_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-[#150924] p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-primary dark:text-white">Heart Club</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/clubs')}
                >
                  Manage Clubs
                </Button>
              </div>
              
              {userClubsData?.heart_club ? (
                <ClubCard 
                  club={userClubsData.heart_club.club}
                  isHeartClub={true}
                />
              ) : (
                <div className="p-4 rounded-lg border border-dashed border-primary/20 dark:border-white/20 text-center">
                  <p className="text-primary/70 dark:text-white/70 mb-3">You haven't selected a Heart Club yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/clubs')}
                  >
                    <Heart size={16} className="mr-2" />
                    Select Heart Club
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="achievements" className="space-y-6">
          <div className="bg-white dark:bg-[#150924] p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-primary dark:text-white">Achievements</h2>
              <div className="flex items-center gap-2">
                <div className="w-40 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary dark:bg-primary rounded-full" 
                    style={{ width: `${achievementStats.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-primary/70 dark:text-white/70">
                  {achievementStats.completed}/{achievementStats.total}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Rarity filter buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button variant="outline" size="sm" className="bg-primary/10 dark:bg-primary/30 border-primary/40 dark:border-primary/60 text-primary dark:text-white font-medium">
                  All
                </Button>
                <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Common</Button>
                <Button variant="outline" size="sm" className="border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">Uncommon</Button>
                <Button variant="outline" size="sm" className="border-purple-300 dark:border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20">Rare</Button>
                <Button variant="outline" size="sm" className="border-pink-300 dark:border-pink-600 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20">Epic</Button>
                <Button variant="outline" size="sm" className="border-amber-300 dark:border-amber-600 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20">Legendary</Button>
              </div>
              
              {/* Achievement cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map(achievement => (
                  <AchievementCard 
                    key={achievement.id}
                    achievement={achievement}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Recent achievements */}
          <div className="bg-white dark:bg-[#150924] p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-primary dark:text-white mb-4">Recently Unlocked</h2>
            
            {achievements.filter(a => a.completed).length > 0 ? (
              <div className="space-y-4">
                {achievements
                  .filter(a => a.completed)
                  .sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate))
                  .slice(0, 3)
                  .map(achievement => (
                    <div key={achievement.id} className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        {achievement.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-primary dark:text-white">{achievement.title}</h4>
                        <p className="text-xs text-primary/60 dark:text-white/60">Unlocked on {achievement.completedDate}</p>
                      </div>
                    </div>
                  ))
                }
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-dashed border-primary/20 dark:border-white/20 text-center">
                <p className="text-primary/70 dark:text-white/70">You haven't unlocked any achievements yet</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="clubs" className="space-y-6">
          <div className="bg-white dark:bg-[#150924] p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-primary dark:text-white">My Clubs</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/clubs')}
              >
                Browse Clubs
              </Button>
            </div>
            
            {userClubsData?.clubs && userClubsData.clubs.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {userClubsData.clubs.map((club) => (
                  <ClubCard 
                    key={club.id}
                    club={club.club}
                    isHeartClub={userClubsData.heart_club?.id === club.id}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-dashed border-primary/20 dark:border-white/20 text-center">
                <p className="text-primary/70 dark:text-white/70 mb-3">You're not following any clubs yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/clubs')}
                >
                  <UserCheck size={16} className="mr-2" />
                  Follow Clubs
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          <div className="bg-white dark:bg-[#150924] p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-primary dark:text-white mb-4">Account Settings</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="settings-name" className="block text-sm font-medium text-primary/80 dark:text-white/80 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  id="settings-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-md border border-primary/20 dark:border-white/20 bg-white dark:bg-[#0D0718]"
                  placeholder="Your display name"
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="mt-2"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Settings size={16} className="mr-2" />}
                Save Changes
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 