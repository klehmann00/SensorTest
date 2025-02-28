// AdminManager.js - Handles admin functionality
import { getDatabase, ref, get, set, remove } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';

class AdminManager {
  constructor() {
    this.database = null;
    this.auth = null;
    this.unsubscribeAuth = null;
    console.log('AdminManager initialized');
  }

  // Initialize with Firebase database and optional auth
  initialize(database, auth = null) {
    this.database = database;
    this.auth = auth;
    
    console.log('AdminManager connected to database');
    
    // Set up auth state listener if auth is provided
    if (this.auth) {
      this.unsubscribeAuth = onAuthStateChanged(this.auth, (user) => {
        console.log('Auth state changed in AdminManager');
      });
    }
  }

  // Cleanup resources
  cleanup() {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
      this.unsubscribeAuth = null;
    }
  }

  // Get all users
  async getAllUsers() {
    if (!this.database) {
      console.error('Database not initialized');
      return [];
    }
    
    try {
      const usersRef = ref(this.database, 'users');
      const snapshot = await get(usersRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const usersData = snapshot.val();
      return Object.keys(usersData).map(userId => ({
        id: userId,
        ...usersData[userId]
      }));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  // Get user sessions
  async getUserSessions(userId) {
    if (!this.database || !userId) {
      return [];
    }
    
    try {
      const sessionsRef = ref(this.database, `users/${userId}/sessions`);
      const snapshot = await get(sessionsRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const sessionsData = snapshot.val();
      return Object.keys(sessionsData).map(sessionId => ({
        id: sessionId,
        ...sessionsData[sessionId].metadata
      }));
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  // Set user access
  async setUserAccess(userId, hasAccess) {
    if (!this.database || !userId) {
      console.error('Database not initialized or no userId provided');
      return false;
    }
    
    try {
      const accessRef = ref(this.database, `users/${userId}/access`);
      await set(accessRef, hasAccess);
      console.log(`User ${userId} access set to ${hasAccess}`);
      return true;
    } catch (error) {
      console.error('Error setting user access:', error);
      return false;
    }
  }

  // Set admin status
  async setAdminStatus(userId, isAdmin) {
    if (!this.database || !userId) {
      console.error('Database not initialized or no userId provided');
      return false;
    }
    
    try {
      const adminRef = ref(this.database, `users/${userId}/isAdmin`);
      await set(adminRef, isAdmin);
      console.log(`User ${userId} admin status set to ${isAdmin}`);
      return true;
    } catch (error) {
      console.error('Error setting admin status:', error);
      return false;
    }
  }

  // Delete user
  async deleteUser(userId) {
    if (!this.database || !userId) {
      console.error('Database not initialized or no userId provided');
      return false;
    }
    
    try {
      const userRef = ref(this.database, `users/${userId}`);
      await remove(userRef);
      console.log(`User ${userId} deleted`);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Delete session
  async deleteSession(userId, sessionId) {
    if (!this.database || !userId || !sessionId) {
      console.error('Database not initialized or invalid userId/sessionId');
      return false;
    }
    
    try {
      const sessionRef = ref(this.database, `users/${userId}/sessions/${sessionId}`);
      await remove(sessionRef);
      console.log(`Session ${sessionId} deleted for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  // Get all sessions data (for analytics)
  async getAllSessionsData() {
    if (!this.database) {
      console.error('Database not initialized');
      return [];
    }
    
    try {
      const usersRef = ref(this.database, 'users');
      const snapshot = await get(usersRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const usersData = snapshot.val();
      const allSessions = [];
      
      // Collect sessions from all users
      Object.keys(usersData).forEach(userId => {
        const user = usersData[userId];
        if (user.sessions) {
          Object.keys(user.sessions).forEach(sessionId => {
            allSessions.push({
              userId,
              sessionId,
              data: user.sessions[sessionId]
            });
          });
        }
      });
      
      return allSessions;
    } catch (error) {
      console.error('Error getting all sessions data:', error);
      return [];
    }
  }
}

export default new AdminManager();