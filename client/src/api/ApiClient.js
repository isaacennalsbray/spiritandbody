import { API_BASE } from '../config/Constants.js';

function getToken() {
  return localStorage.getItem('sab_token');
}

function setToken(token) {
  localStorage.setItem('sab_token', token);
}

function clearToken() {
  localStorage.removeItem('sab_token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}

const ApiClient = {
  // ─── Auth ──────────────────────────────────────────────────────────────────

  /** Claim a username. Creates account if new, re-issues token if already yours. */
  async claim(username) {
    const data = await request('POST', '/auth/claim', { username });
    if (data.token) setToken(data.token);
    return data;
  },

  async getMe() {
    return request('GET', '/auth/me');
  },

  logout() {
    clearToken();
  },

  isLoggedIn() {
    return !!getToken();
  },

  // ─── Game state ────────────────────────────────────────────────────────────
  async createCharacter(name, heroClass, beastTemplateId) {
    return request('POST', '/game/characters', { name, class: heroClass, beastTemplateId });
  },

  async listCharacters() {
    return request('GET', '/game/characters');
  },

  async loadCharacter(id) {
    return request('GET', `/game/characters/${id}`);
  },

  async saveCharacter(id, payload) {
    return request('PUT', `/game/characters/${id}`, payload);
  },

  async saveBeast(characterId, payload) {
    return request('PUT', `/game/characters/${characterId}/beast`, payload);
  },

  // ─── Battle ────────────────────────────────────────────────────────────────
  async submitPveResult(payload) {
    return request('POST', '/battle/pve/result', payload);
  },

  async postBattleResult(payload) {
    return request('POST', '/battle/pve/result', payload);
  },

  // ─── PvP ───────────────────────────────────────────────────────────────────
  async createChallenge(defenderId) {
    return request('POST', '/pvp/challenges', { defenderId });
  },

  async listChallenges() {
    return request('GET', '/pvp/challenges');
  },

  async acceptChallenge(id) {
    return request('POST', `/pvp/challenges/${id}/accept`);
  },

  async declineChallenge(id) {
    return request('POST', `/pvp/challenges/${id}/decline`);
  },

  async getBattle(id) {
    return request('GET', `/pvp/battles/${id}`);
  },

  async submitTurn(battleId, actions) {
    return request('POST', `/pvp/battles/${battleId}/turn`, { actions });
  },

  async getNotifications() {
    return request('GET', '/pvp/notifications');
  },

  async markNotificationRead(id) {
    return request('POST', `/pvp/notifications/${id}/read`);
  },
};

export default ApiClient;
