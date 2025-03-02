// DataMonitor.js
import { getDatabase, ref, get, set } from 'firebase/database';

export class DataMonitor {
  constructor(config = {}) {
    this.config = {
      maxSessionSize: 50 * 1024 * 1024, // 50MB per session
      maxUserStorage: 500 * 1024 * 1024, // 500MB per user
      cleanupThreshold: 0.9, // 90% of max storage
      retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
      ...config
    };
  }

  calculateSessionSize(sessionData) {
    const sensorTypes = ['accelerometer', 'gyroscope', 'magnetometer'];
    let totalSize = 0;
    totalSize += JSON.stringify(sessionData.metadata || {}).length;
    
    for (const sensorType of sensorTypes) {
      if (sessionData[sensorType]) {
        totalSize += JSON.stringify(sessionData[sensorType]).length;
      }
    }
    return totalSize;
  }

  async monitorUserStorage(userId) {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}/sessions`);
    
    try {
      const snapshot = await get(userRef);
      const sessions = snapshot.val() || {};
      
      let totalSize = 0;
      const sessionSizes = {};
      const sessionsToClean = [];

      for (const [sessionId, sessionData] of Object.entries(sessions)) {
        const sessionSize = this.calculateSessionSize(sessionData);
        sessionSizes[sessionId] = sessionSize;
        totalSize += sessionSize;

        const sessionAge = Date.now() - sessionData.metadata.startTime;
        if (sessionAge > this.config.retentionPeriod) {
          sessionsToClean.push({
            sessionId,
            size: sessionSize,
            startTime: sessionData.metadata.startTime
          });
        }
      }

      await set(ref(db, `monitoring/${userId}`), {
        lastChecked: Date.now(),
        totalStorage: totalSize,
        sessionCount: Object.keys(sessions).length,
        sessionSizes
      });

      return {
        totalSize,
        sessionSizes,
        exceededStorage: totalSize > this.config.maxUserStorage,
        storageUsagePercent: (totalSize / this.config.maxUserStorage) * 100,
        sessionsToClean: sessionsToClean.sort((a, b) => a.startTime - b.startTime)
      };
    } catch (error) {
      console.log('Storage monitoring error:', error.message);
      throw error;
    }
  }

  async checkSessionSize(userId, sessionId) {
    const db = getDatabase();
    const sessionRef = ref(db, `users/${userId}/sessions/${sessionId}`);
    
    try {
      const snapshot = await get(sessionRef);
      const sessionData = snapshot.val();
      
      if (!sessionData) {
        throw new Error('Session not found');
      }

      const sessionSize = this.calculateSessionSize(sessionData);
      const sizePercent = (sessionSize / this.config.maxSessionSize) * 100;

      // Only log if approaching storage limits
      if (sizePercent > 50) {
        console.log(`Storage usage: ${sizePercent.toFixed(1)}% (${formatFileSize(sessionSize)})`);
      }

      await set(ref(db, `monitoring/${userId}/sessions/${sessionId}`), {
        lastChecked: Date.now(),
        currentSize: sessionSize,
        sizePercent
      });

      return {
        sessionSize,
        sizePercent,
        approaching: sizePercent > 80,
        exceeded: sessionSize > this.config.maxSessionSize
      };
    } catch (error) {
      if (!error.message.includes('Session not found')) {
        console.log('Session size check error:', error.message);
      }
      throw error;
    }
  }

  async cleanupOldSessions(userId) {
    try {
      const monitoringResult = await this.monitorUserStorage(userId);
      
      if (monitoringResult.storageUsagePercent > (this.config.cleanupThreshold * 100)) {
        const db = getDatabase();
        
        for (const session of monitoringResult.sessionsToClean) {
          await set(ref(db, `users/${userId}/sessions/${session.sessionId}`), null);
          await set(ref(db, `monitoring/${userId}/cleanup/${Date.now()}`), {
            sessionId: session.sessionId,
            size: session.size,
            reason: 'retention_period_exceeded'
          });
        }

        return {
          cleaned: monitoringResult.sessionsToClean.length,
          spaceFreed: monitoringResult.sessionsToClean.reduce((total, session) => total + session.size, 0)
        };
      }

      return { cleaned: 0, spaceFreed: 0 };
    } catch (error) {
      console.log('Session cleanup error:', error.message);
      throw error;
    }
  }
}

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};