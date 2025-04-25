import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';

export default function MatchCard({ 
  match, 
  club, 
  isPast = false, 
  isLive = false, 
  onClick 
}) {
  const navigate = useNavigate();
  const matchDate = new Date(match.date);

  return (
    <div 
      className="relative bg-gradient-to-r from-primary to-secondary text-white rounded-lg p-4 mb-4 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      {/* Stadium image background */}
      {match?.stadium?.image && (
        <div className="absolute inset-0">
          <img 
            src={match.stadium.image} 
            alt={match.stadium.name} 
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/90"></div>
        </div>
      )}
      <div className="flex items-center justify-between relative z-10">
        <div>
          <div className="flex items-center">
            {isLive ? (
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
                <span className="text-xs font-medium uppercase">Live Now</span>
              </div>
            ) : isPast ? (
              <div className="flex items-center">
                <CheckCircle size={12} className="mr-1" />
                <span className="text-xs font-medium uppercase">Completed</span>
              </div>
            ) : (
              <div className="flex items-center">
                <Calendar size={12} className="mr-1" />
                <span className="text-xs font-medium uppercase">
                  {matchDate.toLocaleDateString()} - {matchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            )}
          </div>
          <h3 className="font-medium mt-1">{match.home_club.name} vs {match.away_club.name}</h3>
          <p className="text-sm mt-1">
            Score: {match.score ? `${match.score.home} - ${match.score.away}` : "0 - 0"}
          </p>
          <p className="text-xs mt-1">Stadium: {match.stadium.name}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/game/${club.id}/${match.id}`, { state: { club } });
            }}
          >
            View Game
          </Button>
          {!isPast && (
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/stadium-orders/${club.id}/${match.id}`, { state: { club } });
              }}
            >
              Order Food & Drinks
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 