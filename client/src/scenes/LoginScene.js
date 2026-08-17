import Phaser from 'phaser';
import ApiClient from '../api/ApiClient.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/Constants.js';

const FORM_HTML = `
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  #sab-auth {
    width: 340px;
    background: #0e0e1a;
    border: 1px solid #2a2a4a;
    padding: 28px 32px 32px;
    font-family: monospace;
    color: #ddeeff;
  }

  .tab-row {
    display: flex;
    margin-bottom: 24px;
    border-bottom: 1px solid #2a2a4a;
  }

  .tab-btn {
    flex: 1;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: #667799;
    font-family: monospace;
    font-size: 13px;
    letter-spacing: 2px;
    padding: 8px 0;
    cursor: pointer;
    transition: color 0.15s;
    margin-bottom: -1px;
  }

  .tab-btn.active {
    color: #aabbff;
    border-bottom-color: #6688ff;
  }

  .tab-btn:hover { color: #ddeeff; }

  .tab-panel { display: none; }
  .tab-panel.active { display: block; }

  label {
    display: block;
    font-size: 11px;
    letter-spacing: 1px;
    color: #667799;
    margin-bottom: 5px;
    margin-top: 14px;
  }

  label:first-child { margin-top: 0; }

  input[type="text"],
  input[type="password"] {
    width: 100%;
    background: #12121e;
    border: 1px solid #2a2a4a;
    color: #ddeeff;
    font-family: monospace;
    font-size: 14px;
    padding: 8px 10px;
    outline: none;
    transition: border-color 0.15s;
  }

  input:focus { border-color: #6688ff; }

  .submit-btn {
    width: 100%;
    margin-top: 20px;
    padding: 10px;
    background: #1e2050;
    border: 1px solid #6688ff;
    color: #aabbff;
    font-family: monospace;
    font-size: 13px;
    letter-spacing: 2px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .submit-btn:hover {
    background: #334488;
    color: #ffffff;
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  #auth-error {
    margin-top: 12px;
    font-size: 12px;
    color: #ff6666;
    min-height: 16px;
    line-height: 1.4;
  }

  .tab-hint {
    font-size: 11px;
    color: #556688;
    line-height: 1.5;
    margin-top: 4px;
  }

  .tab-hint strong {
    color: #8899cc;
  }

  input::placeholder {
    color: #334466;
  }
</style>

<div id="sab-auth">
  <div class="tab-row">
    <button class="tab-btn active" data-tab="login">LOGIN</button>
    <button class="tab-btn" data-tab="register">REGISTER</button>
  </div>

  <div id="tab-login" class="tab-panel active">
    <p class="tab-hint">Enter the username and password you registered with.</p>
    <label>USERNAME</label>
    <input type="text" id="login-username" autocomplete="username" spellcheck="false" placeholder="your username" />
    <label>PASSWORD</label>
    <input type="password" id="login-password" autocomplete="current-password" placeholder="your password" />
    <button class="submit-btn" id="login-btn">LOGIN</button>
    <p class="tab-hint" style="margin-top:14px;">No account? Click <strong>REGISTER</strong> above.</p>
  </div>

  <div id="tab-register" class="tab-panel">
    <p class="tab-hint">Create a new account to start your journey.</p>
    <label>USERNAME</label>
    <input type="text" id="reg-username" autocomplete="username" spellcheck="false" placeholder="choose a username" />
    <label>PASSWORD</label>
    <input type="password" id="reg-password" autocomplete="new-password" placeholder="min. 6 characters" />
    <label>CONFIRM PASSWORD</label>
    <input type="password" id="reg-confirm" autocomplete="new-password" placeholder="repeat password" />
    <button class="submit-btn" id="reg-btn">CREATE ACCOUNT</button>
  </div>

  <div id="auth-error"></div>
</div>
`;

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super('LoginScene');
  }

  create() {
    const cx = GAME_WIDTH / 2;

    // Dark background
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0a0f);

    // Subtle star field
    const gfx = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      gfx.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.1, 0.5));
      gfx.fillRect(x, y, 1, 1);
    }

    // Title
    this.add.text(cx, 110, 'CAPTURE', {
      fontFamily: 'monospace',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#6688ff',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Divider
    const div = this.add.graphics();
    div.lineStyle(1, 0x2a2a4a, 0.8);
    div.lineBetween(cx - 160, 138, cx + 160, 138);

    // DOM form — centered below title
    this._domEl = this.add.dom(cx, GAME_HEIGHT / 2 + 60).createFromHTML(FORM_HTML);
    this._domEl.setOrigin(0.5);

    this._bindForm();

    // If already logged in, skip straight to success state
    if (ApiClient.isLoggedIn()) {
      ApiClient.me().then(data => {
        this._showSuccess(data.user.username);
      }).catch(() => {
        ApiClient.logout();
      });
    }
  }

  _bindForm() {
    const root = this._domEl.node;

    // Tab switching
    root.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        root.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        root.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        root.querySelector(`#tab-${tab}`).classList.add('active');
        this._setError('');
      });
    });

    // Login
    root.querySelector('#login-btn').addEventListener('click', () => this._handleLogin());
    root.querySelector('#login-password').addEventListener('keydown', e => {
      if (e.key === 'Enter') this._handleLogin();
    });

    // Register
    root.querySelector('#reg-btn').addEventListener('click', () => this._handleRegister());
    root.querySelector('#reg-confirm').addEventListener('keydown', e => {
      if (e.key === 'Enter') this._handleRegister();
    });
  }

  async _handleLogin() {
    const root = this._domEl.node;
    const username = root.querySelector('#login-username').value.trim();
    const password = root.querySelector('#login-password').value;

    if (!username || !password) {
      return this._setError('Please enter your username and password.');
    }

    this._setLoading('#login-btn', true);
    this._setError('');

    try {
      const data = await ApiClient.login(username, password);
      this._showSuccess(data.user.username);
    } catch (err) {
      this._setError(err.message || 'Login failed. Please try again.');
    } finally {
      this._setLoading('#login-btn', false);
    }
  }

  async _handleRegister() {
    const root = this._domEl.node;
    const username = root.querySelector('#reg-username').value.trim();
    const password = root.querySelector('#reg-password').value;
    const confirm  = root.querySelector('#reg-confirm').value;

    if (!username || !password) {
      return this._setError('Please enter a username and password.');
    }
    if (password !== confirm) {
      return this._setError('Passwords do not match.');
    }
    if (password.length < 6) {
      return this._setError('Password must be at least 6 characters.');
    }

    this._setLoading('#reg-btn', true);
    this._setError('');

    try {
      const data = await ApiClient.register(username, password);
      this._showSuccess(data.user.username);
    } catch (err) {
      this._setError(err.message || 'Registration failed. Please try again.');
    } finally {
      this._setLoading('#reg-btn', false);
    }
  }

  _setError(msg) {
    const el = this._domEl.node.querySelector('#auth-error');
    if (el) el.textContent = msg;
  }

  _setLoading(selector, loading) {
    const el = this._domEl.node.querySelector(selector);
    if (el) el.disabled = loading;
  }

  async _showSuccess(username) {
    // Hide the form
    this._domEl.setVisible(false);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.text(cx, cy - 60, `Welcome, ${username}!`, {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#aaffcc',
      stroke: '#224433',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Loading indicator while we fetch characters
    const loading = this.add.text(cx, cy, 'Loading...', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#667799',
    }).setOrigin(0.5);

    let characters = [];
    try {
      const data = await ApiClient.listCharacters();
      characters = data.characters || [];
    } catch {
      // Token might be stale; just go to create
      characters = [];
    }

    loading.destroy();

    if (characters.length === 0) {
      this.scene.start('CharacterCreateScene');
      return;
    }

    // Show character select list
    this.add.text(cx, cy - 20, 'Select a character:', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#667799',
    }).setOrigin(0.5);

    const listTop = cy + 8;
    const rowH = 36;

    characters.forEach((char, i) => {
      const rowY = listTop + i * rowH;

      const rowBg = this.add.rectangle(cx, rowY, 280, 30, 0x12121e)
        .setInteractive({ useHandCursor: true });
      const rowBorder = this.add.graphics();
      rowBorder.lineStyle(1, 0x2a2a4a, 1);
      rowBorder.strokeRect(cx - 140, rowY - 15, 280, 30);

      const nameText = this.add.text(cx - 120, rowY, char.name, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ddeeff',
      }).setOrigin(0, 0.5);

      const playText = this.add.text(cx + 60, rowY, '> Play', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#6688ff',
      }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

      const delText = this.add.text(cx + 116, rowY, '🗑', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#663333',
      }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

      rowBg.on('pointerover', () => { nameText.setColor('#ffffff'); playText.setColor('#aabbff'); });
      rowBg.on('pointerout',  () => { nameText.setColor('#ddeeff'); playText.setColor('#6688ff'); });
      rowBg.on('pointerdown', () => {
        localStorage.setItem('sab_char_id', String(char.id));
        this.scene.start('MapScene', { playerLevel: char.level || 1, playerData: char });
      });

      playText.on('pointerdown', (ptr) => {
        ptr.event.stopPropagation();
        localStorage.setItem('sab_char_id', String(char.id));
        this.scene.start('MapScene', { playerLevel: char.level || 1, playerData: char });
      });

      delText.on('pointerover', () => delText.setColor('#ff6666'));
      delText.on('pointerout',  () => delText.setColor('#663333'));
      delText.on('pointerdown', async (ptr) => {
        ptr.event.stopPropagation();
        // Confirm box
        if (!confirm(`Delete "${char.name}"? This cannot be undone.`)) return;
        try {
          await ApiClient.deleteCharacter(char.id);
          this.scene.restart();
        } catch (err) {
          alert('Failed to delete character: ' + err.message);
        }
      });
    });

    const newCharY = listTop + characters.length * rowH + 14;

    const newBtn = this.add.text(cx, newCharY, '+ New Character', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#6688ff',
      backgroundColor: '#12121e',
      padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    newBtn.on('pointerover', () => newBtn.setColor('#aabbff'));
    newBtn.on('pointerout',  () => newBtn.setColor('#6688ff'));
    newBtn.on('pointerdown', () => this.scene.start('CharacterCreateScene'));

    const logoutY = newCharY + 46;
    const logout = this.add.text(cx, logoutY, 'Log out', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#445566',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    logout.on('pointerover', () => logout.setColor('#ff6666'));
    logout.on('pointerout',  () => logout.setColor('#445566'));
    logout.on('pointerdown', () => {
      ApiClient.logout();
      this.scene.restart();
    });
  }
}
