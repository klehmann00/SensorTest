// SessionManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_EXPIRY_KEY = 'session_expiry_timestamp';
const DEFAULT_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// For debugging, use a much shorter session (5 minutes)
// const DEFAULT_SESSION_DURATION = 5 * 60 * 1000; // 5 minutes

const SessionManager = {
  // Start a new session when user logs in
  startNewSession: async (duration = DEFAULT_SESSION_DURATION) => {
    const expiryTime = Date.now() + duration;
    console.log('Starting new session, expires at:', new Date(expiryTime).toLocaleString());
    
    try {
      await AsyncStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());
      console.log('Session saved successfully');
      
      // Double-check it was saved
      const saved = await AsyncStorage.getItem(SESSION_EXPIRY_KEY);
      console.log('Verification - saved expiry:', saved);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  },
  
  // Check if session is valid
  isSessionValid: async () => {
    try {
      const expiryTimeStr = await AsyncStorage.getItem(SESSION_EXPIRY_KEY);
      console.log('Retrieved session expiry:', expiryTimeStr);
      
      if (!expiryTimeStr) {
        console.log('No active session found');
        return false;
      }
      
      const expiryTime = parseInt(expiryTimeStr, 10);
      const now = Date.now();
      const isValid = now < expiryTime;
      
      console.log(
        'Session check -', 
        'Current time:', new Date(now).toLocaleString(),
        'Expiry time:', new Date(expiryTime).toLocaleString(),
        'Valid?', isValid
      );
      
      return isValid;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  },
  
  // Clear session data
  clearSession: async () => {
    console.log('Clearing session data');
    try {
      await AsyncStorage.removeItem(SESSION_EXPIRY_KEY);
      
      // Verify it was removed
      const check = await AsyncStorage.getItem(SESSION_EXPIRY_KEY);
      console.log('Session cleared, verification:', check === null ? 'Success' : 'Failed');
      
      return true;
    } catch (error) {
      console.error('Error clearing session:', error);
      return false;
    }
  }
};

export default SessionManager;