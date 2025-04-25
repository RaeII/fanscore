import api from "../lib/api";

// Mock data for development
const mockMatches = {
  '1': [
    {
      id: 1,
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days in future
      status: 'scheduled',
      home_club_id: 1,
      away_club_id: 2,
      home_club: {
        id: 1,
        name: 'FC Barcelona',
        logo_url: 'https://placehold.co/200/purple/white?text=FCB'
      },
      away_club: {
        id: 2,
        name: 'Real Madrid',
        logo_url: 'https://placehold.co/200/white/black?text=RM'
      },
      stadium: {
        id: 1,
        name: 'Camp Nou',
        location: 'Barcelona, Spain'
      }
    },
    {
      id: 2,
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      status: 'completed',
      home_club_id: 1,
      away_club_id: 3,
      home_club: {
        id: 1,
        name: 'FC Barcelona',
        logo_url: 'https://placehold.co/200/purple/white?text=FCB'
      },
      away_club: {
        id: 3,
        name: 'Atletico Madrid',
        logo_url: 'https://placehold.co/200/red/white?text=ATM'
      },
      stadium: {
        id: 1,
        name: 'Camp Nou',
        location: 'Barcelona, Spain'
      },
      score: {
        home: 2,
        away: 1
      }
    },
    {
      id: 3,
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      status: 'completed',
      home_club_id: 4,
      away_club_id: 1,
      home_club: {
        id: 4,
        name: 'Valencia',
        logo_url: 'https://placehold.co/200/orange/white?text=VCF'
      },
      away_club: {
        id: 1,
        name: 'FC Barcelona',
        logo_url: 'https://placehold.co/200/purple/white?text=FCB'
      },
      stadium: {
        id: 2,
        name: 'Mestalla',
        location: 'Valencia, Spain'
      },
      score: {
        home: 0,
        away: 3
      }
    }
  ]
};

const getMatchesByClub = async (clubId) => {
  const response = await api.get(`/match/club/${clubId}`);
  return response.data.content;
};

const getMatchesByStadium = async (stadiumId) => {
  const response = await api.get(`/match/stadium/${stadiumId}`);
  return response.data.content;
};

const getMatchById = async (id) => {
  const response = await api.get(`/match/${id}`);
  return response.data.content;
};

const getMatches = async () => {
  const response = await api.get(`/match`);
  return response.data.content;
};

/**
 * Get all matches for a specific club with mock data for development
 * @param {string|number} clubId - The ID of the club
 * @returns {Promise<Array>} - Array of match data
 */
const getMatchesByClubId = async (clubId) => {
  try {
    // For production, uncomment the following line
    // return getMatchesByClub(clubId);
    
    // Using mock data for development
    const clubMatches = mockMatches[clubId] || [];
    
    // For demo purposes, if club doesn't have matches, return Barca's matches
    if (clubMatches.length === 0 && mockMatches['1']) {
      return mockMatches['1'].map(match => {
        // Make a copy of the Barcelona match but change IDs to match requested club
        const newMatch = {...match};
        if (newMatch.home_club_id === 1) {
          newMatch.home_club_id = parseInt(clubId);
          newMatch.home_club = {
            id: parseInt(clubId),
            name: `Club ${clubId}`,
            logo_url: `https://placehold.co/200/purple/white?text=C${clubId}`
          };
        }
        return newMatch;
      });
    }
    
    return clubMatches;
  } catch (error) {
    console.error('Error fetching club matches:', error);
    throw error;
  }
};

export default {
  getMatchesByClub,
  getMatchesByStadium,
  getMatchById,
  getMatches,
  getMatchesByClubId
};


