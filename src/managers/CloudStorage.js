// src/managers/CloudStorage.js
import { getDatabase, ref, set, get, push } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

/**
 * Manages cloud storage and synchronization with efficient batching
 */
class CloudStorage {
  constructor() {
    this.database = null;
    this.batchSize = 10;
    this.pendingUploads = [];
    this.isUploading = false;
    this.uploadInterval = null;
    this.syncInterval = 5000; // 5 seconds
    this.autoSync = true;
    this.networkConnected = true;
    this.netInfoUnsubscribe = null;
    this.lastSyncTime = 0;
    
    console.log('CloudStorage initialized');
  }
  
  /**
   * Initialize with Firebase database
   * @param {Object} database - Firebase database instance
   * @param {Object} config - Configuration options
   * @returns {CloudStorage} This instance for chaining
   */
  initialize(database, config = {}) {
    this.database = database;
    
    // Apply configuration
    if (typeof config.batchSize === 'number') {
      this.batchSize = config.batchSize;
    }
    
    if (typeof config.syncInterval === 'number') {
      this.syncInterval = config.syncInterval;
    }
    
    if (typeof config.autoSync === 'boolean') {
      this.autoSync = config.autoSync;
    }
    
    // Start network monitoring
    this.startNetworkMonitoring();
    
    // Start background sync if enabled
    if (this.autoSync) {
      this.startBackgroundSync();
    }
    
    console.log('CloudStorage initialized with config:', {
      batchSize: this.batchSize,
      syncInterval: this.syncInterval,
      autoSync: this.autoSync
    });
    
    return this;
  }
  
  /**
   * Start monitoring network connectivity
   */
  startNetworkMonitoring() {
    this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable;
      
      // Connection state changed
      if (this.networkConnected !== connected) {
        console.log(`Network connectivity changed: ${connected ? 'Connected' : 'Disconnected'}`);
        this.networkConnected = connected;
        
        // If reconnected, process pending uploads
        if (connected && this.pendingUploads.length > 0) {
          console.log(`Network reconnected, processing ${this.pendingUploads.length} pending uploads`);
          this.processUploadQueue();
        }
      }
    });
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    this.stopBackgroundSync();
    
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }
  }
  
  /**
   * Start background synchronization
   */
  startBackgroundSync() {
    // Clear existing interval if any
    this.stopBackgroundSync();
    
    // Set up new interval
    this.uploadInterval = setInterval(() => {
      if (this.networkConnected && this.pendingUploads.length > 0) {
        this.processUploadQueue();
      }
    }, this.syncInterval);
    
    console.log(`Background sync started with interval: ${this.syncInterval}ms`);
  }
  
  /**
   * Stop background synchronization
   */
  stopBackgroundSync() {
    if (this.uploadInterval) {
      clearInterval(this.uploadInterval);
      this.uploadInterval = null;
      console.log('Background sync stopped');
    }
  }
  
  /**
   * Enqueue data for upload
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @param {string} dataType - Data type (e.g., 'accelerometer')
   * @param {Object} data - Data to upload
   * @returns {boolean} Success status
   */
  queueData(userId, sessionId, dataType, data) {
    if (!userId || !sessionId || !dataType || !data) {
      console.error('Invalid data for upload queue');
      return false;
    }
    
    // Add to pending uploads
    this.pendingUploads.push({
      userId,
      sessionId,
      dataType,
      data,
      timestamp: Date.now(),
      retryCount: 0
    });
    
    // Log queue size periodically
    if (this.pendingUploads.length % 50 === 0) {
      console.log(`Upload queue size: ${this.pendingUploads.length}`);
    }
    
    // Process immediately if queue exceeds threshold
    if (this.pendingUploads.length >= this.batchSize && this.networkConnected) {
      this.processUploadQueue();
    }
    
    return true;
  }
  
  /**
   * Process pending uploads
   * @returns {Promise<boolean>} Success status
   */
  async processUploadQueue() {
    // Skip if already uploading or no pending uploads
    if (this.isUploading || this.pendingUploads.length === 0) {
      return false;
    }
    
    // Skip if no network connection
    if (!this.networkConnected) {
      console.log('Skipping upload due to no network connection');
      return false;
    }
    
    this.isUploading = true;
    console.log(`Processing upload queue (${this.pendingUploads.length} items)`);
    
    try {
      // Take batch from queue
      const batch = this.pendingUploads.splice(0, this.batchSize);
      
      // Group by user and session for efficient uploads
      const groupedUploads = this.groupUploadsForEfficiency(batch);
      
      // Upload each group
      for (const [key, items] of Object.entries(groupedUploads)) {
        const [userId, sessionId] = key.split('|');
        
        // Group data by type
        const dataByType = {};
        items.forEach(item => {
          if (!dataByType[item.dataType]) {
            dataByType[item.dataType] = {};
          }
          
          // Use timestamp as key
          const timestamp = item.data.timestamp || item.timestamp;
          dataByType[item.dataType][timestamp] = item.data;
        });
        
        // Upload each data type
        for (const [dataType, typeData] of Object.entries(dataByType)) {
          try {
            await this.uploadToFirebase(userId, sessionId, dataType, typeData);
          } catch (error) {
            console.error(`Error uploading ${dataType} data:`, error);
            
            // Add failed items back to queue with increased retry count
            items
              .filter(item => item.dataType === dataType)
              .forEach(item => {
                if (item.retryCount < 3) {
                  item.retryCount++;
                  this.pendingUploads.push(item);
                } else {
                  console.error(`Dropping ${dataType} data after 3 retry attempts`);
                }
              });
          }
        }
      }
      
      // Update last sync time
      this.lastSyncTime = Date.now();
      
      console.log(`Upload complete, ${this.pendingUploads.length} items remaining`);
      return true;
    } catch (error) {
      console.error('Error processing upload queue:', error);
      return false;
    } finally {
      this.isUploading = false;
    }
  }
  
  /**
   * Group uploads by user and session
   * @param {Array} uploads - Upload items
   * @returns {Object} Grouped uploads
   */
  groupUploadsForEfficiency(uploads) {
    const grouped = {};
    
    uploads.forEach(upload => {
      const key = `${upload.userId}|${upload.sessionId}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(upload);
    });
    
    return grouped;
  }
  
  /**
   * Upload data to Firebase
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @param {string} dataType - Data type
   * @param {Object} data - Data to upload
   * @returns {Promise<void>}
   */
  async uploadToFirebase(userId, sessionId, dataType, data) {
    if (!this.database) {
      throw new Error('Database not initialized');
    }
    
    const path = `users/${userId}/sessions/${sessionId}/${dataType}`;
    const dbRef = ref(this.database, path);
    
    return await set(dbRef, data);
  }
  
  /**
   * Start a new recording session
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @param {Object} metadata - Session metadata
   * @returns {Promise<boolean>} Success status
   */
  async startRecordingSession(userId, sessionId, metadata = {}) {
    if (!this.database || !userId || !sessionId) {
      console.error('Cannot start recording: missing database, userId or sessionId');
      return false;
    }

    try {
      // Create default metadata if not provided
      const sessionMetadata = {
        startTime: sessionId,
        deviceInfo: {
          sampleRates: {
            accelerometer: 100, // 10 Hz
            gyroscope: 100,     // 10 Hz
            magnetometer: 100   // 10 Hz
          },
          units: {
            accelerometer: 'G',
            gyroscope: 'rad/s',
            magnetometer: 'μT'
          }
        },
        ...metadata
      };
      
      // Save metadata
      const metadataRef = ref(this.database, `users/${userId}/sessions/${sessionId}/metadata`);
      await set(metadataRef, sessionMetadata);
      
      console.log(`Recording session ${sessionId} started for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error starting recording session:', error);
      return false;
    }
  }

  /**
   * End a recording session
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>} Success status
   */
  async endRecordingSession(userId, sessionId) {
    if (!this.database || !userId || !sessionId) {
      console.error('Cannot end recording: missing database, userId or sessionId');
      return false;
    }

    try {
      // Process any remaining uploads
      if (this.pendingUploads.length > 0) {
        await this.processUploadQueue();
      }
      
      // Update session metadata with end time
      const metadataRef = ref(this.database, `users/${userId}/sessions/${sessionId}/metadata/endTime`);
      await set(metadataRef, Date.now());
      
      console.log(`Recording session ${sessionId} ended for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error ending recording session:', error);
      return false;
    }
  }
  
  /**
   * Get session data
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Session data
   */
  async getSessionData(userId, sessionId) {
    if (!this.database || !userId || !sessionId) {
      console.error('Cannot get session data: missing database, userId or sessionId');
      return null;
    }

    try {
      const sessionRef = ref(this.database, `users/${userId}/sessions/${sessionId}`);
      const snapshot = await get(sessionRef);
      
      if (!snapshot.exists()) {
        console.log(`No data found for session ${sessionId}`);
        return null;
      }
      
      return snapshot.val();
    } catch (error) {
      console.error('Error getting session data:', error);
      return null;
    }
  }
  
  /**
   * Get queue status
   * @returns {Object} Queue status
   */
  getQueueStatus() {
    return {
      pendingUploads: this.pendingUploads.length,
      isUploading: this.isUploading,
      networkConnected: this.networkConnected,
      lastSyncTime: this.lastSyncTime
    };
  }
  
  /**
   * Update configuration
   * @param {Object} config - New configuration
   * @returns {Object} Current configuration
   */
  updateConfig(config = {}) {
    let restartSync = false;
    
    if (typeof config.batchSize === 'number') {
      this.batchSize = config.batchSize;
    }
    
    if (typeof config.syncInterval === 'number' && config.syncInterval !== this.syncInterval) {
      this.syncInterval = config.syncInterval;
      restartSync = this.autoSync;
    }
    
    if (typeof config.autoSync === 'boolean' && config.autoSync !== this.autoSync) {
      this.autoSync = config.autoSync;
      
      if (this.autoSync) {
        restartSync = true;
      } else {
        this.stopBackgroundSync();
      }
    }
    
    if (restartSync) {
      this.startBackgroundSync();
    }
    
    return {
      batchSize: this.batchSize,
      syncInterval: this.syncInterval,
      autoSync: this.autoSync
    };
  }
}

// Export as singleton
export default new CloudStorage();