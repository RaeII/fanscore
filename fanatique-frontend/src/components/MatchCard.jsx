import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui-v2/Button';

export default function MatchCard({ 
  match, 
  club, 
  isPast = false, 
  isLive = false, 
  onClick 
}) {
  const navigate = useNavigate();
  const { t } = useTranslation('matches');
  const matchDate = new Date(match.date);

  return (
    <div 
      className="relative gradientBackground text-white rounded-lg p-4 mb-4 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      {/* Stadium image background */}
      <div className="absolute inset-0">
        {match?.stadium?.image && (
          <img 
            src={match.stadium.image} 
            alt={match.stadium.name} 
            className="w-full h-full object-cover"
          />
        )}
        {/* Gradient overlay to ensure text readability */}
        <div className="absolute inset-0 gradientBackground"></div>
      </div>
      
      {/* Status indicator (Live/Completed/Upcoming) and buttons */}
      <div className="flex items-start justify-between relative z-10 mb-2">
        <div className="flex items-center">
          {isLive ? (
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
              <span className="text-xs font-medium uppercase">{t('matchCard.liveNow', 'Live Now')}</span>
            </div>
          ) : isPast ? (
            <div className="flex items-center">
              <CheckCircle size={12} className="mr-1" />
              <span className="text-xs font-medium uppercase">{t('matchCard.completed', 'Completed')}</span>
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
        
        {/* Buttons in top right corner */}
        <div className="flex flex-col gap-2 color-primar" >
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/game/${club.id}/${match.id}`, { state: { club } });
            }}
            text={t('matchCard.buttons.viewGame', 'Ver Jogo')}
          />
          
          {!isPast && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/stadium-orders/${club.id}/${match.id}`, { state: { club } });
              }}
              text={t('matchCard.buttons.orderFood', 'Pedir Comida & Bebidas')}
            />
          )}
        </div>
      </div>
      
      {/* Clubs logos with X in the middle - Now centered in the card */}
      <div className="flex items-center justify-center my-4 relative z-10">
        <div className="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden bg-white p-1">
          {match.home_club.image ? (
            <img 
              src={match.home_club.image} 
              alt={match.home_club.name} 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-500">{match.home_club.name.charAt(0)}</span>
            </div>
          )}
        </div>
        <X className="mx-3" size={20} />
        <div className="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden bg-white p-1">
          {match.away_club.image ? (
            <img 
              src={match.away_club.image} 
              alt={match.away_club.name} 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-500">{match.away_club.name.charAt(0)}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Match details moved to bottom */}
      <div className="flex flex-col items-center justify-center text-center relative z-10">
        <h3 className="font-medium">{match.home_club.name} vs {match.away_club.name}</h3>
        <p className="text-sm mt-1">
          {t('matchCard.score', 'Placar')}: {match.score ? `${match.score.home} - ${match.score.away}` : "0 - 0"}
        </p>
        <p className="text-xs mt-1">{t('matchCard.stadium', 'Estádio')}: {match.stadium.name}</p>
      </div>
    </div>
  );
} 