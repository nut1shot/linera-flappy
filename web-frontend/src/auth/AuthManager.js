import { AUTH_CONFIG, DEFAULT_ACCOUNTS } from '../constants/GameConstants.js';
import { TimeUtils } from '../utils/TimeUtils.js';

export class AuthManager {
  constructor(lineraClient) {
    this.lineraClient = lineraClient;
    this.currentUser = null;
    this.isAuthenticated = false;
    this.sessionExpiry = null;
    // Account lockout removed per user request
    
    // Initialize default accounts on blockchain
    this.initializeDefaultAccounts();
  }

  async initializeDefaultAccounts() {
    // Default accounts are now created during blockchain app instantiation
    // Admin account is created with the leaderboard chain setup
    // Demo account will be created on first login attempt
  }

  async generateHash(username, password) {
    // Deterministic hash for blockchain authentication
    // Using username as salt to ensure same hash for same credentials
    const data = username + password + username; // Use username as deterministic salt
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex; // Return consistent hash for blockchain
  }

  generateSalt() {
    const array = new Uint8Array(AUTH_CONFIG.SECURITY.SALT_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Local storage methods for session management and login attempts
  getStoredUsers() {
    // Users are now stored on blockchain, this is kept for backward compatibility
    return {};
  }

  saveUser() {
    // Users are now stored on blockchain, this method is deprecated
    console.warn('saveUser is deprecated - users are stored on blockchain');
  }

  // Account lockout functionality removed per user request

  async createUser() {
    // User creation is now handled by blockchain loginOrRegister operation
    // This method is kept for backward compatibility but not used
    console.warn('createUser is deprecated - use loginOrRegister instead');
    return null;
  }

  async login(username, password) {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    // Account lockout removed per user request

    try {
      // Generate hash for blockchain authentication
      const hash = await this.generateHash(username, password);
      
      // Call blockchain loginOrRegister operation
      await this.lineraClient.loginOrRegister(username, hash);
      
      // Get the result from blockchain
      const loginResult = await this.lineraClient.getLoginResult();
      
      if (!loginResult || !loginResult.success) {
        throw new Error(loginResult?.message || 'Authentication failed');
      }

      // Successful login
      
      // Set session with blockchain user data
      this.currentUser = {
        username: loginResult.user.username,
        role: loginResult.user.role,
        createdAt: loginResult.user.createdAt,
        chainId: loginResult.user.chainId,
        lastLogin: new Date().toISOString(),
        credentialsHash: hash // Store hash for re-authentication
      };
      
      
      this.isAuthenticated = true;
      this.sessionExpiry = Date.now() + AUTH_CONFIG.SESSION.DURATION_MS;
      
      // Store session locally
      this.saveSession();
      
      return {
        username: this.currentUser.username,
        role: this.currentUser.role,
        lastLogin: this.currentUser.lastLogin,
        isNewUser: loginResult.is_new_user
      };
      
    } catch (error) {
      throw error;
    }
  }

  logout() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.sessionExpiry = null;
    
    // Clear session storage
    localStorage.removeItem(AUTH_CONFIG.STORAGE.SESSION_KEY);
    
    // Clear wallet data when user logs out
    if (this.lineraClient && this.lineraClient.clearWalletData) {
      this.lineraClient.clearWalletData();
    }
  }

  saveSession() {
    const session = {
      username: this.currentUser.username,
      role: this.currentUser.role,
      lastLogin: this.currentUser.lastLogin,
      expiry: this.sessionExpiry,
      // Store credentials hash for automatic re-authentication
      credentialsHash: this.currentUser.credentialsHash
    };
    
    localStorage.setItem(AUTH_CONFIG.STORAGE.SESSION_KEY, JSON.stringify(session));
  }

  async loadSession() {
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

    try {
      // Re-authenticate automatically using stored credentials hash
      // This is necessary because the chain ID changes on refresh
      if (sessionData.credentialsHash) {
        
        // Call blockchain loginOrRegister operation with stored hash
        await this.lineraClient.loginOrRegister(sessionData.username, sessionData.credentialsHash);
        
        // Get the result from blockchain
        const loginResult = await this.lineraClient.getLoginResult();
        
        if (!loginResult || !loginResult.success) {
          localStorage.removeItem(AUTH_CONFIG.STORAGE.SESSION_KEY);
          return false;
        }

        // Restore session with blockchain data
        this.currentUser = {
          username: loginResult.user.username,
          role: loginResult.user.role,
          createdAt: loginResult.user.createdAt,
          chainId: loginResult.user.chainId,
          lastLogin: sessionData.lastLogin,
          credentialsHash: sessionData.credentialsHash
        };
        
        this.isAuthenticated = true;
        this.sessionExpiry = sessionData.expiry;
        
        return {
          username: this.currentUser.username,
          role: this.currentUser.role,
          lastLogin: this.currentUser.lastLogin
        };
      } else {
        // No credentials hash stored, can't re-authenticate
        localStorage.removeItem(AUTH_CONFIG.STORAGE.SESSION_KEY);
        return false;
      }
      
    } catch (error) {
      console.error('Failed to re-authenticate session with blockchain:', error);
      localStorage.removeItem(AUTH_CONFIG.STORAGE.SESSION_KEY);
      return false;
    }
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
    return this.isAuthenticated && this.currentUser && this.currentUser.role === 'ADMIN';
  }

  async changePassword(username, currentPassword, newPassword) {
    if (!this.isAuthenticated || this.currentUser.username !== username) {
      throw new Error('Not authorized to change password');
    }

    if (newPassword.length < AUTH_CONFIG.LOGIN.MIN_PASSWORD_LENGTH) {
      throw new Error(`New password must be at least ${AUTH_CONFIG.LOGIN.MIN_PASSWORD_LENGTH} characters long`);
    }

    try {
      // Verify current password by attempting login
      const currentHash = await this.generateHash(username, currentPassword);
      await this.lineraClient.loginOrRegister(username, currentHash);
      
      const currentLoginResult = await this.lineraClient.getLoginResult();
      if (!currentLoginResult || !currentLoginResult.success) {
        throw new Error('Current password is incorrect');
      }

      // Change password by registering with new hash
      const newHash = await this.generateHash(username, newPassword);
      await this.lineraClient.loginOrRegister(username, newHash);
      
      return true;
    } catch (error) {
      throw new Error('Failed to change password: ' + error.message);
    }
  }

  deleteUser(username) {
    if (!this.isAdmin()) {
      throw new Error('Only admins can delete users');
    }

    if (username === 'admin') {
      throw new Error('Cannot delete admin account');
    }

    // User deletion is not implemented in the blockchain contract
    // This would require a new operation to be added to the smart contract
    throw new Error('User deletion not supported in blockchain version');
  }

  listUsers() {
    if (!this.isAdmin()) {
      throw new Error('Only admins can list users');
    }

    // User listing is not implemented in the blockchain contract
    // This would require a new query to be added to the smart contract
    throw new Error('User listing not supported in blockchain version');
  }

  // Utility method to check if username is available
  async isUsernameAvailable() {
    // Username availability is checked during login/register on blockchain
    // This method is kept for UI validation but always returns true
    return true; // Blockchain will handle duplicate checking
  }

  // Login attempts tracking removed per user request
  getRemainingLoginAttempts() {
    return Infinity; // No limits on login attempts
  }
}