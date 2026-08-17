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

  let data;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    const err = new Error(`Server error (${res.status})`);
    err.status = res.status;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}

const ApiClient = {
  // ─── Auth ──────────────────────────────────────────────────────────────────
  async register(username, password) {
    const data = await request('POST', '/auth/register', { username, password });
    if (data.token) setToken(data.token);
    return data;
  },

  async login(username, password) {
    const data = await request('POST', '/auth/login', { username, password });
    if (data.token) setToken(data.token);
    return data;
  },

  async me() {
    return request('GET', '/auth/me');
  },

  async getMe() {
    return this.me();
  },

  logout() {
    clearToken();
  },

  isLoggedIn() {
    return !!getToken();
  },

  // ─── Game state ────────────────────────────────────────────────────────────
  async createCharacter(name, appearance) {
    return request('POST', '/game/characters', { name, appearance });
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

  async deleteCharacter(id) {
    return request('DELETE', `/game/characters/${id}`);
  },

  async saveBeast(characterId, payload) {
    return request('PUT', `/game/characters/${characterId}/beast`, payload);
  },

  async savePet(characterId, petData) {
    return request('POST', `/game/characters/${characterId}/pets`, petData);
  },

  async listPets(characterId) {
    return request('GET', `/game/characters/${characterId}/pets`);
  },

  async updatePet(characterId, petId, data) {
    return request('PUT', `/game/characters/${characterId}/pets/${petId}`, data);
  },

  async updateEquipment(characterId, data) {
    return request('PUT', `/game/characters/${characterId}/equipment`, data);
  },

  async awardXp(characterId, xp) {
    return request('POST', `/game/characters/${characterId}/award-xp`, { xp });
  },

  async awardItem(characterId, itemId) {
    return request('POST', `/game/characters/${characterId}/award-item`, { itemId });
  },

  async awardGold(characterId, gold) {
    return request('POST', `/game/characters/${characterId}/award-gold`, { gold });
  },

  async purchase(characterId, itemId, price) {
    return request('POST', `/game/characters/${characterId}/purchase`, { itemId, price });
  },

  async updateBestiary(characterId, { seen = [], caught = [] }) {
    return request('POST', `/game/characters/${characterId}/update-bestiary`, { seen, caught });
  },

  async updateQuestFlags(characterId, flags) {
    return request('POST', `/game/characters/${characterId}/quest-flags`, flags);
  },

  async evolvePet(characterId, petId, newSpecies, stats = {}) {
    return request('POST', `/game/characters/${characterId}/pets/${petId}/evolve`, { newSpecies, ...stats });
  },

  // ─── Battle ────────────────────────────────────────────────────────────────
  async submitPveResult(payload) {
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
