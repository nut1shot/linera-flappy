import { AUTH_CONFIG, DEFAULT_ACCOUNTS } from '../constants/GameConstants.js';
import { TimeUtils } from '../utils/TimeUtils.js';

export class AuthManager {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.sessionExpiry = null;
    this.maxLoginAttempts = AUTH_CONFIG.LOGIN.MAX_ATTEMPTS;
    this.lockoutDuration = AUTH_CONFIG.LOGIN.LOCKOUT_DURATION;
    
    // Initialize default accounts
    this.initializeDefaultAccounts();
  }

  async initializeDefaultAccounts() {
    const users = this.getStoredUsers();
    
    // Create admin account if doesn't exist
    if (!users[DEFAULT_ACCOUNTS.ADMIN.username]) {
      await this.createUser(
        DEFAULT_ACCOUNTS.ADMIN.username, 
        DEFAULT_ACCOUNTS.ADMIN.password, 
        DEFAULT_ACCOUNTS.ADMIN.role
      );
    }
    
    // Create demo account if doesn't exist
    if (!users[DEFAULT_ACCOUNTS.DEMO.username]) {
      await this.createUser(
        DEFAULT_ACCOUNTS.DEMO.username, 
        DEFAULT_ACCOUNTS.DEMO.password, 
        DEFAULT_ACCOUNTS.DEMO.role
      );
    }
  }

  async generateHash(username, password) {
    const salt = this.generateSalt();
    const data = username + password + salt;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return { hash: hashHex, salt };
  }

  generateSalt() {
    const array = new Uint8Array(AUTH_CONFIG.SECURITY.SALT_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async verifyPassword(username, password, storedHash, salt) {
    const data = username + password + salt;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest(AUTH_CONFIG.SECURITY.HASH_ALGORITHM, encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex === storedHash;
  }

  getStoredUsers() {
    const users = localStorage.getItem(AUTH_CONFIG.STORAGE.USERS_KEY);
    return users ? JSON.parse(users) : {};
  }

  saveUser(username, userData) {
    const users = this.getStoredUsers();
    users[username] = userData;
    localStorage.setItem(AUTH_CONFIG.STORAGE.USERS_KEY, JSON.stringify(users));
  }

  getLoginAttempts(username) {
    const attempts = localStorage.getItem(`login_attempts_${username}`);
    return attempts ? JSON.parse(attempts) : { count: 0, lastAttempt: null };
  }

  updateLoginAttempts(username, success = false) {
    const attempts = this.getLoginAttempts(username);
    
    if (success) {
      localStorage.removeItem(`login_attempts_${username}`);
    } else {
      attempts.count++;
      attempts.lastAttempt = Date.now();
      localStorage.setItem(`login_attempts_${username}`, JSON.stringify(attempts));
    }
  }

  isAccountLocked(username) {
    const attempts = this.getLoginAttempts(username);
    
    if (attempts.count >= this.maxLoginAttempts) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      return timeSinceLastAttempt < this.lockoutDuration;
    }
    
    return false;
  }

  getAccountLockTimeRemaining(username) {
    const attempts = this.getLoginAttempts(username);
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    const remaining = this.lockoutDuration - timeSinceLastAttempt;
    return Math.max(0, Math.ceil(remaining / 1000 / 60)); // minutes
  }

  async createUser(username, password, role = 'player') {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    if (username.length < AUTH_CONFIG.LOGIN.MIN_USERNAME_LENGTH) {
      throw new Error(`Username must be at least ${AUTH_CONFIG.LOGIN.MIN_USERNAME_LENGTH} characters long`);
    }

    if (password.length < AUTH_CONFIG.LOGIN.MIN_PASSWORD_LENGTH) {
      throw new Error(`Password must be at least ${AUTH_CONFIG.LOGIN.MIN_PASSWORD_LENGTH} characters long`);
    }

    const users = this.getStoredUsers();
    
    if (users[username]) {
      throw new Error('Username already exists');
    }

    const { hash, salt } = await this.generateHash(username, password);
    
    const userData = {
      username,
      passwordHash: hash,
      salt,
      role,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    this.saveUser(username, userData);
    return userData;
  }

  async login(username, password) {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    // Check if account is locked
    if (this.isAccountLocked(username)) {
      const remaining = this.getAccountLockTimeRemaining(username);
      throw new Error(`Account locked. Try again in ${remaining} minutes.`);
    }

    const users = this.getStoredUsers();
    const user = users[username];
    
    if (!user) {
      this.updateLoginAttempts(username, false);
      throw new Error('Invalid username or password');
    }

    const isValid = await this.verifyPassword(username, password, user.passwordHash, user.salt);
    
    if (!isValid) {
      this.updateLoginAttempts(username, false);
      throw new Error('Invalid username or password');
    }

    // Successful login
    this.updateLoginAttempts(username, true);
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    this.saveUser(username, user);
    
    // Set session
    this.currentUser = user;
    this.isAuthenticated = true;
    this.sessionExpiry = Date.now() + AUTH_CONFIG.SESSION.DURATION_MS;
    
    // Store session
    this.saveSession();
    
    return {
      username: user.username,
      role: user.role,
      lastLogin: user.lastLogin
    };
  }

  logout() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.sessionExpiry = null;
    
    // Clear session storage
    localStorage.removeItem(AUTH_CONFIG.STORAGE.SESSION_KEY);
  }

  saveSession() {
    const session = {
      username: this.currentUser.username,
      role: this.currentUser.role,
      expiry: this.sessionExpiry
    };
    
    localStorage.setItem(AUTH_CONFIG.STORAGE.SESSION_KEY, JSON.stringify(session));
  }

  loadSession() {
    const session = localStorage.getItem(AUTH_CONFIG.STORAGE.SESSION_KEY);
    
    if (!session) {
      return false;
    }

    const sessionData = JSON.parse(session);
    
    // Check if session is expired
    if (Date.now() > sessionData.expiry) {
      localStorage.removeItem(AUTH_CONFIG.STORAGE.SESSION_KEY);
      return false;
    }

    // Load user data
    const users = this.getStoredUsers();
    const user = users[sessionData.username];
    
    if (!user) {
      localStorage.removeItem(AUTH_CONFIG.STORAGE.SESSION_KEY);
      return false;
    }

    this.currentUser = user;
    this.isAuthenticated = true;
    this.sessionExpiry = sessionData.expiry;
    
    return {
      username: user.username,
      role: user.role,
      lastLogin: user.lastLogin
    };
  }

  isSessionValid() {
    return this.isAuthenticated && Date.now() < this.sessionExpiry;
  }

  getCurrentUser() {
    return this.currentUser ? {
      username: this.currentUser.username,
      role: this.currentUser.role,
      lastLogin: this.currentUser.lastLogin
    } : null;
  }

  isAdmin() {
    return this.isAuthenticated && this.currentUser && this.currentUser.role === 'admin';
  }

  async changePassword(username, currentPassword, newPassword) {
    if (!this.isAuthenticated || this.currentUser.username !== username) {
      throw new Error('Not authorized to change password');
    }

    if (newPassword.length < AUTH_CONFIG.LOGIN.MIN_PASSWORD_LENGTH) {
      throw new Error(`New password must be at least ${AUTH_CONFIG.LOGIN.MIN_PASSWORD_LENGTH} characters long`);
    }

    const users = this.getStoredUsers();
    const user = users[username];
    
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentValid = await this.verifyPassword(username, currentPassword, user.passwordHash, user.salt);
    
    if (!isCurrentValid) {
      throw new Error('Current password is incorrect');
    }

    // Generate new hash
    const { hash, salt } = await this.generateHash(username, newPassword);
    
    // Update user data
    user.passwordHash = hash;
    user.salt = salt;
    user.lastPasswordChange = new Date().toISOString();
    
    this.saveUser(username, user);
    
    return true;
  }

  deleteUser(username) {
    if (!this.isAdmin()) {
      throw new Error('Only admins can delete users');
    }

    if (username === 'admin') {
      throw new Error('Cannot delete admin account');
    }

    const users = this.getStoredUsers();
    
    if (!users[username]) {
      throw new Error('User not found');
    }

    delete users[username];
    localStorage.setItem(AUTH_CONFIG.STORAGE.USERS_KEY, JSON.stringify(users));
    
    // Clear login attempts
    localStorage.removeItem(`login_attempts_${username}`);
    
    return true;
  }

  listUsers() {
    if (!this.isAdmin()) {
      throw new Error('Only admins can list users');
    }

    const users = this.getStoredUsers();
    return Object.keys(users).map(username => ({
      username,
      role: users[username].role,
      createdAt: users[username].createdAt,
      lastLogin: users[username].lastLogin
    }));
  }

  // Utility method to check if username is available
  isUsernameAvailable(username) {
    const users = this.getStoredUsers();
    return !users[username];
  }

  // Get remaining login attempts
  getRemainingLoginAttempts(username) {
    const attempts = this.getLoginAttempts(username);
    return Math.max(0, this.maxLoginAttempts - attempts.count);
  }
}