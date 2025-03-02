// AuthManager.js - Handles user authentication
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { getDatabase, ref, set, get } from 'firebase/database';
import SessionManager from '../managers/SessionManager';

class AuthManager {
  constructor() {
    this.auth = null;
    this.database = null;
    this.currentUser = null;
    this.userStateListeners = [];
    this.unsubscribeAuth = null;
    console.log('AuthManager initialized');
  }

  // Initialize with Firebase auth
  initialize(auth, database) {
    this.auth = auth;
    console.log('Current auth state:', auth.currentUser ? 'User is logged in' : 'No user logged in');
    this.database = database;
    
    // Set up auth state listener
    if (this.auth) {
      this.unsubscribeAuth = onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
        // Notify all listeners of auth state change
        this.userStateListeners.forEach(listener => listener(user));
        console.log(`Auth state changed: ${user ? 'User logged in' : 'No user'}`);
      });
      
      console.log('AuthManager connected to Firebase Auth');
    } else {
      console.error('Auth object is invalid');
    }
  }

  // Cleanup resources
  cleanup() {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
      this.unsubscribeAuth = null;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.auth?.currentUser || null;
  }

  // Get current user ID
  getCurrentUserId() {
    return this.auth?.currentUser?.uid || null;
  }

  // Subscribe to auth state changes
  subscribeToAuthChanges(listener) {
    if (typeof listener === 'function') {
      this.userStateListeners.push(listener);
      // Immediately call with current state
      listener(this.currentUser);
      return true;
    }
    return false;
  }

  // Unsubscribe from auth state changes
  unsubscribeFromAuthChanges(listener) {
    const index = this.userStateListeners.indexOf(listener);
    if (index !== -1) {
      this.userStateListeners.splice(index, 1);
      return true;
    }
    return false;
  }

  // Login with email and password
  async loginWithEmail(email, password) {
    if (!this.auth) {
      console.error('Auth not initialized');
      return { success: false, error: 'Auth not initialized' };
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('Login successful');
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Login error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Create a new account
  async createAccount(email, password) {
    if (!this.auth || !this.database) {
      console.error('Auth or database not initialized');
      return { success: false, error: 'Auth or database not initialized' };
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      // Save user data to database
      await set(ref(this.database, `users/${userCredential.user.uid}`), {
        email: email,
        createdAt: Date.now(),
        access: true
      });
      
      // Send verification email
      await sendEmailVerification(userCredential.user);
      
      console.log('Account created successfully');
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Account creation error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Send password reset email
  async sendPasswordReset(email) {
    if (!this.auth) {
      console.error('Auth not initialized');
      return { success: false, error: 'Auth not initialized' };
    }
    
    try {
      await sendPasswordResetEmail(this.auth, email);
      console.log('Password reset email sent');
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Logout
  async logout() {
    if (!this.auth) {
      console.error('Auth not initialized');
      return { success: false, error: 'Auth not initialized' };
    }
    
    try {
      // Clear the session first
      await SessionManager.clearSession();
      
      // Then perform the Firebase logout
      await signOut(this.auth);
      console.log('Logout successful');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Check if user is admin
  async checkIsAdmin(userId) {
    if (!this.database || !userId) {
      return false;
    }
    
    try {
      const userRef = ref(this.database, `users/${userId}`);
      const snapshot = await get(userRef);
      const userData = snapshot.val();
      
      return userData && userData.isAdmin === true;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Get user data
  async getUserData(userId) {
    if (!this.database || !userId) {
      return null;
    }
    
    try {
      const userRef = ref(this.database, `users/${userId}`);
      const snapshot = await get(userRef);
      return snapshot.val();
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }
}

export default new AuthManager();