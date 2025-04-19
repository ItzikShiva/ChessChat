import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const tournamentService = {
  // Get all tournaments
  getTournaments: async () => {
    const response = await axios.get(`${API_URL}/tournaments`);
    return response.data;
  },

  // Get tournament details
  getTournamentDetails: async (tournamentId) => {
    const response = await axios.get(`${API_URL}/tournaments/${tournamentId}`);
    return response.data;
  },

  // Create a new tournament
  createTournament: async (tournamentData) => {
    const response = await axios.post(`${API_URL}/tournaments`, tournamentData);
    return response.data;
  },

  // Register for a tournament
  registerForTournament: async (tournamentId) => {
    const response = await axios.post(`${API_URL}/tournaments/${tournamentId}/register`);
    return response.data;
  },

  // Get tournament matches
  getTournamentMatches: async (tournamentId) => {
    const response = await axios.get(`${API_URL}/tournaments/${tournamentId}/matches`);
    return response.data;
  },

  // Start a tournament
  startTournament: async (tournamentId) => {
    const response = await axios.post(`${API_URL}/tournaments/${tournamentId}/start`);
    return response.data;
  }
};

export default tournamentService; 