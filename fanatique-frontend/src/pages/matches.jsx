import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserContext } from '../hooks/useUserContext';
import { 
  Calendar,
  Trophy,
  MapPin, 
  Loader2, 
  ArrowLeft,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { showError } from '../lib/toast';
import matchApi from '../api/match';
import MatchCard from '../components/MatchCard';

export default function MatchesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('matches');
  const { userClubsData } = useUserContext();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState({
    upcoming: [],
    past: []
  });
  
  // Get the heart club data
  const heartClub = userClubsData?.heart_club?.club;

  useEffect(() => {
    const fetchMatches = async () => {
      if (!heartClub) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Get matches for the user's heart club
        const clubMatches = await matchApi.getMatchesByClubId(heartClub.id);
        
        // Sort matches into upcoming and past
        const now = new Date();
        const upcoming = [];
        const past = [];
        
        clubMatches.forEach(match => {
          const matchDate = new Date(match.date);
          if (matchDate > now) {
            upcoming.push(match);
          } else {
            past.push(match);
          }
        });
        
        // Sort upcoming matches by date (ascending)
        upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Sort past matches by date (descending)
        past.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setMatches({
          upcoming,
          past
        });
      } catch (error) {
        console.error('Error fetching matches:', error);
        showError(t('matches.errors.failedToLoad', 'Failed to load matches'));
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [heartClub, t]);

  const handleMatchClick = (match) => {
    navigate(`/clubs/${heartClub.id}/game/${match.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-secondary" />
          <p className="mt-4 text-primary/70 dark:text-white/70">{t('matches.loading', 'Loading matches...')}</p>
        </div>
      </div>
    );
  }

  if (!heartClub) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#fafafa] dark:bg-[#0d0117] flex flex-col items-center justify-center p-4">
        <Trophy size={64} className="text-primary/30 dark:text-white/30 mb-4" />
        <h1 className="text-xl font-bold text-primary dark:text-white mb-2">{t('matches.noHeartClub.title', 'No Heart Club Selected')}</h1>
        <p className="text-center text-primary/70 dark:text-white/70 mb-6">
          {t('matches.noHeartClub.description', 'You need to select a heart club to view matches.')}
        </p>
        <Button onClick={() => navigate('/dashboard')}>
          {t('matches.noHeartClub.goToDashboard', 'Go to Dashboard')}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          {/* <Button
            variant="normal"
            size="icon"
            onClick={handleBackButton}
            className="mr-2"
          >
            <ArrowLeft size={20} />
          </Button> */}
          <h1 className="text-2xl font-bold text-primary dark:text-white">
            {t('matches.title', '{{clubName}} Matches', { clubName: heartClub.name })}
          </h1>
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList className="w-full mb-6 bg-background-overlay">
            <TabsTrigger value="upcoming" className="flex-1">
              <Clock className="mr-2 h-4 w-4" />
              {t('matches.tabs.upcoming', 'Upcoming')}
            </TabsTrigger>
            <TabsTrigger value="past" className="flex-1 bg-background-overlay">
              <Trophy className="mr-2 h-4 w-4" />
              {t('matches.tabs.past', 'Past')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming">
            {matches.upcoming.length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto text-primary/30 dark:text-white/30 mb-4" />
                <p className="text-primary/70 dark:text-white/70">{t('matches.noUpcoming', 'No upcoming matches found')}</p>
              </div>
            ) : (
              <div>
                {matches.upcoming.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    club={heartClub}
                    isPast={false}
                    isLive={false}
                    onClick={() => handleMatchClick(match)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past">
            {matches.past.length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto text-primary/30 dark:text-white/30 mb-4" />
                <p className="text-primary/70 dark:text-white/70">{t('matches.noPast', 'No past matches found')}</p>
              </div>
            ) : (
              <div>
                {matches.past.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    club={heartClub}
                    isPast={true}
                    isLive={false}
                    onClick={() => handleMatchClick(match)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 