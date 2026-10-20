// Centralized API Client for HackFlow
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Fetches hackathons dynamically (live fetched from Unstop / Devfolio via TinyFish)
 */
export async function getHackathons(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.platform && filters.platform !== 'all') params.append('platform', filters.platform);
    if (filters.mode && filters.mode !== 'all') params.append('mode', filters.mode);

    const url = `${API_BASE_URL}/hackathons${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching hackathons:', err);
    throw err;
  }
}

/**
 * Triggers live crawler with TinyFish on Unstop/Devfolio for a specific keyword
 */
export async function fetchLiveHackathons(query = '') {
  try {
    const res = await fetch(`${API_BASE_URL}/hackathons/fetch-live`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || `HTTP ${res.status}`);
    return result;
  } catch (err) {
    console.error('Error in live hackathon fetch:', err);
    throw err;
  }
}

/**
 * Executes Autonomous Form Filling & Registration on Hackathon portal via TinyFish
 */
export async function autoRegisterWithTinyFish({ hackathonId, hackathonTitle, hackathonUrl, participantData }) {
  try {
    const res = await fetch(`${API_BASE_URL}/hackathons/auto-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hackathonId, hackathonTitle, hackathonUrl, participantData })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || `HTTP ${res.status}`);
    return result;
  } catch (err) {
    console.error('Error in TinyFish auto-registration:', err);
    throw err;
  }
}

/**
 * Fetches user's personal profile (private)
 */
export async function getMyProfile() {
  try {
    const res = await fetch(`${API_BASE_URL}/my-profile`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching profile:', err);
    throw err;
  }
}

/**
 * Updates user's personal profile
 */
export async function updateMyProfile(data) {
  try {
    const res = await fetch(`${API_BASE_URL}/my-profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || `HTTP ${res.status}`);
    return result;
  } catch (err) {
    console.error('Error updating profile:', err);
    throw err;
  }
}

/**
 * Adds an active participating hackathon to the user profile
 */
export async function addParticipatingHackathon(data) {
  try {
    const res = await fetch(`${API_BASE_URL}/my-profile/hackathons/add-participating`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || `HTTP ${res.status}`);
    return result;
  } catch (err) {
    console.error('Error adding participating hackathon:', err);
    throw err;
  }
}

/**
 * Fetches all upcoming rounds exclusively for hackathons user is participating in
 */
export async function getMyCalendarRounds() {
  try {
    const res = await fetch(`${API_BASE_URL}/calendar/my-rounds`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching personal calendar rounds:', err);
    throw err;
  }
}

/**
 * Teams & Matchmaking API
 */
export async function getTeams() {
  try {
    const res = await fetch(`${API_BASE_URL}/teams`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching teams:', err);
    throw err;
  }
}

export async function createTeam(teamData) {
  try {
    const res = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamData)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || `HTTP ${res.status}`);
    return result;
  } catch (err) {
    console.error('Error creating team:', err);
    throw err;
  }
}

export async function matchTeams({ userSkills, desiredRole }) {
  try {
    const res = await fetch(`${API_BASE_URL}/teams/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userSkills, desiredRole })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || `HTTP ${res.status}`);
    return result;
  } catch (err) {
    console.error('Error matching teams:', err);
    throw err;
  }
}

export async function sendTeamRequest({ team_id, note }) {
  try {
    const res = await fetch(`${API_BASE_URL}/teams/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team_id, note })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || `HTTP ${res.status}`);
    return result;
  } catch (err) {
    console.error('Error sending team request:', err);
    throw err;
  }
}

export async function getTeamRequests() {
  try {
    const res = await fetch(`${API_BASE_URL}/teams/requests`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching team requests:', err);
    throw err;
  }
}

export { API_BASE_URL };
