// StorageManager.js - Handles data storage, retrieval and export
import { getDatabase, ref, set, get } from 'firebase/database';
import * as FileSystem from 'expo-file-system';
import * as MailComposer from 'expo-mail-composer';

class StorageManager {
  constructor() {
    this.database = null;
    console.log('StorageManager initialized');
  }

  // Initialize with Firebase database
  initialize(database) {
    this.database = database;
    console.log('StorageManager connected to database');
  }

  // Start a new recording session
  async startRecordingSession(userId, sessionId) {
    if (!this.database || !userId || !sessionId) {
      console.error('Cannot start recording: missing database, userId or sessionId');
      return false;
    }

    try {
      // Create session metadata
      const metadataRef = ref(this.database, `users/${userId}/sessions/${sessionId}/metadata`);
      
      await set(metadataRef, {
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
        }
      });
      
      console.log(`Recording session ${sessionId} started for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error starting recording session:', error);
      return false;
    }
  }

  // End a recording session
  async endRecordingSession(userId, sessionId) {
    if (!this.database || !userId || !sessionId) {
      console.error('Cannot end recording: missing database, userId or sessionId');
      return false;
    }

    try {
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

  // Store accelerometer data
  async storeAccelerometerData(userId, sessionId, data) {
    if (!this.database || !userId || !sessionId) return false;
    
    try {
      const timestamp = Date.now();
      const path = `users/${userId}/sessions/${sessionId}/accelerometer/${timestamp}`;
      await set(ref(this.database, path), {
        timestamp,
        ...data
      });
      return true;
    } catch (error) {
      console.error('Error storing accelerometer data:', error);
      return false;
    }
  }

  // Store gyroscope data
  async storeGyroscopeData(userId, sessionId, data) {
    if (!this.database || !userId || !sessionId) return false;
    
    try {
      const timestamp = Date.now();
      const path = `users/${userId}/sessions/${sessionId}/gyroscope/${timestamp}`;
      await set(ref(this.database, path), {
        timestamp,
        ...data
      });
      return true;
    } catch (error) {
      console.error('Error storing gyroscope data:', error);
      return false;
    }
  }

  // Store magnetometer data
  async storeMagnetometerData(userId, sessionId, data) {
    if (!this.database || !userId || !sessionId) return false;
    
    try {
      const timestamp = Date.now();
      const path = `users/${userId}/sessions/${sessionId}/magnetometer/${timestamp}`;
      await set(ref(this.database, path), {
        timestamp,
        ...data
      });
      return true;
    } catch (error) {
      console.error('Error storing magnetometer data:', error);
      return false;
    }
  }

  // Get session data
  async getSessionData(userId, sessionId) {
    if (!this.database || !userId || !sessionId) return null;
    
    try {
      const sessionRef = ref(this.database, `users/${userId}/sessions/${sessionId}`);
      const snapshot = await get(sessionRef);
      return snapshot.val();
    } catch (error) {
      console.error('Error getting session data:', error);
      return null;
    }
  }

  // Count data points in a session
  async countSessionDataPoints(userId, sessionId) {
    console.log(`Starting count for session ${sessionId}`);
    const sessionData = await this.getSessionData(userId, sessionId);
    
    if (!sessionData) {
      console.log('No session data found for counting');
      return 0;
    }
    
    let totalPoints = 0;
    console.log("Session data keys:", Object.keys(sessionData));
    
    if (sessionData.accelerometer) {
      const accelPoints = Object.keys(sessionData.accelerometer).length;
      console.log(`Found ${accelPoints} accelerometer points`);
      totalPoints += accelPoints;
    }
    
    if (sessionData.gyroscope) {
      const gyroPoints = Object.keys(sessionData.gyroscope).length;
      console.log(`Found ${gyroPoints} gyroscope points`);
      totalPoints += gyroPoints;
    }
    
    if (sessionData.magnetometer) {
      const magPoints = Object.keys(sessionData.magnetometer).length;
      console.log(`Found ${magPoints} magnetometer points`);
      totalPoints += magPoints;
    }
    
    console.log(`Total data points: ${totalPoints}`);
    return totalPoints;
  }

  // Export session data to CSV files
  async exportSessionData(userId, sessionId) {
    try {
      console.log(`Exporting data for user ${userId}, session ${sessionId}`);
      
      // Get session data
      const sessionData = await this.getSessionData(userId, sessionId);
      if (!sessionData) {
        console.error('No session data found');
        return { files: [] };
      }
      
      // Files array for export
      const files = [];
      
      // Process accelerometer data
      if (sessionData.accelerometer) {
        // Raw accelerometer data
        const rawAccelCsv = this.createRawAccelerometerCsv(sessionData.accelerometer);
        files.push({
          fileName: `accelerometer_raw_${sessionId}.csv`,
          content: rawAccelCsv
        });
        
        // Processed accelerometer data
        const processedAccelCsv = this.createProcessedAccelerometerCsv(sessionData.accelerometer);
        files.push({
          fileName: `accelerometer_processed_${sessionId}.csv`,
          content: processedAccelCsv
        });
      }
      
      // Process gyroscope data
      if (sessionData.gyroscope) {
        const gyroCsv = this.createGyroscopeCsv(sessionData.gyroscope);
        files.push({
          fileName: `gyroscope_${sessionId}.csv`,
          content: gyroCsv
        });
      }
      
      // Process magnetometer data
      if (sessionData.magnetometer) {
        const magCsv = this.createMagnetometerCsv(sessionData.magnetometer);
        files.push({
          fileName: `magnetometer_${sessionId}.csv`,
          content: magCsv
        });
      }
      
      // Create session info file
      if (sessionData.metadata) {
        const metadataCsv = this.createMetadataCsv(sessionData);
        files.push({
          fileName: `session_info_${sessionId}.csv`,
          content: metadataCsv
        });
      }
      
      return { files };
    } catch (error) {
      console.error('Error exporting session data:', error);
      return { files: [] };
    }
  }

  // Create CSV files for different sensor types
  createRawAccelerometerCsv(accelData) {
    const timestamps = Object.keys(accelData).sort();
    
    let csv = 'timestamp,x,y,z\n';
    timestamps.forEach(timestamp => {
      const reading = accelData[timestamp];
      const x = reading.raw_x !== undefined ? reading.raw_x : reading.x;
      const y = reading.raw_y !== undefined ? reading.raw_y : reading.y;
      const z = reading.raw_z !== undefined ? reading.raw_z : reading.z;
      
      csv += `${timestamp},${x},${y},${z}\n`;
    });
    
    return csv;
  }

  createProcessedAccelerometerCsv(accelData) {
    const timestamps = Object.keys(accelData).sort();
    
    let csv = 'timestamp,lateral,longitudinal,vertical\n';
    timestamps.forEach(timestamp => {
      const reading = accelData[timestamp];
      
      // Look for processed values, fall back to various formats
      const lateral = reading.filtered_y || reading.limited_y || reading.lateral || reading.y;
      const longitudinal = reading.filtered_x || reading.limited_x || reading.longitudinal || reading.x;
      const vertical = reading.filtered_z || reading.limited_z || reading.vertical || reading.z;
      
      csv += `${timestamp},${lateral},${longitudinal},${vertical}\n`;
    });
    
    return csv;
  }

  createGyroscopeCsv(gyroData) {
    const timestamps = Object.keys(gyroData).sort();
    
    let csv = 'timestamp,x,y,z\n';
    timestamps.forEach(timestamp => {
      const reading = gyroData[timestamp];
      
      // Use filtered values if available, otherwise raw
      const x = reading.filtered_x || reading.x;
      const y = reading.filtered_y || reading.y;
      const z = reading.filtered_z || reading.z;
      
      csv += `${timestamp},${x},${y},${z}\n`;
    });
    
    return csv;
  }

  createMagnetometerCsv(magData) {
    const timestamps = Object.keys(magData).sort();
    
    let csv = 'timestamp,x,y,z\n';
    timestamps.forEach(timestamp => {
      const reading = magData[timestamp];
      
      // Use filtered values if available, otherwise raw
      const x = reading.filtered_x || reading.x;
      const y = reading.filtered_y || reading.y;
      const z = reading.filtered_z || reading.z;
      
      csv += `${timestamp},${x},${y},${z}\n`;
    });
    
    return csv;
  }

  createMetadataCsv(sessionData) {
    let csv = 'Property,Value\n';
    
    // Session times
    if (sessionData.metadata.startTime) {
      const startDate = new Date(sessionData.metadata.startTime);
      csv += `Session Start,${startDate.toLocaleString()}\n`;
    }
    
    if (sessionData.metadata.endTime) {
      const endDate = new Date(sessionData.metadata.endTime);
      csv += `Session End,${endDate.toLocaleString()}\n`;
      
      if (sessionData.metadata.startTime) {
        const durationMs = sessionData.metadata.endTime - sessionData.metadata.startTime;
        const durationSec = (durationMs / 1000).toFixed(1);
        csv += `Duration (seconds),${durationSec}\n`;
      }
    }
    
    // Device info
    if (sessionData.metadata.deviceInfo) {
      if (sessionData.metadata.deviceInfo.sampleRates) {
        const rates = sessionData.metadata.deviceInfo.sampleRates;
        csv += `Accelerometer Sample Rate (ms),${rates.accelerometer}\n`;
        csv += `Gyroscope Sample Rate (ms),${rates.gyroscope}\n`;
        csv += `Magnetometer Sample Rate (ms),${rates.magnetometer}\n`;
      }
      
      if (sessionData.metadata.deviceInfo.units) {
        const units = sessionData.metadata.deviceInfo.units;
        csv += `Accelerometer Units,${units.accelerometer}\n`;
        csv += `Gyroscope Units,${units.gyroscope}\n`;
        csv += `Magnetometer Units,${units.magnetometer}\n`;
      }
    }
    
    // Data point counts
    let accelCount = sessionData.accelerometer ? Object.keys(sessionData.accelerometer).length : 0;
    let gyroCount = sessionData.gyroscope ? Object.keys(sessionData.gyroscope).length : 0;
    let magCount = sessionData.magnetometer ? Object.keys(sessionData.magnetometer).length : 0;
    
    csv += `Accelerometer Data Points,${accelCount}\n`;
    csv += `Gyroscope Data Points,${gyroCount}\n`;
    csv += `Magnetometer Data Points,${magCount}\n`;
    csv += `Total Data Points,${accelCount + gyroCount + magCount}\n`;
    
    return csv;
  }

  // Email the exported data
  async emailExportedData(files, sessionId) {
    try {
      if (!files || files.length === 0) {
        console.error('No files to email');
        return false;
      }
      
      // Create exports directory
      const dirPath = `${FileSystem.documentDirectory}exports/`;
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
      }
      
      // Write files to local storage
      const filePaths = await Promise.all(files.map(async (file) => {
        const timestamp = new Date().getTime();
        const filePath = `${dirPath}${timestamp}_${file.fileName}`;
        await FileSystem.writeAsStringAsync(filePath, file.content);
        console.log(`File written to: ${filePath}`);
        return filePath;
      }));
      
      // Check if mail is available
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        console.error('Email is not available on this device');
        return false;
      }
      
      // Compose and send email
      await MailComposer.composeAsync({
        subject: `Sensor Data Export - ${new Date(parseInt(sessionId)).toLocaleString()}`,
        body: 'Attached are the sensor data files from your session.',
        attachments: filePaths
      });
      
      return true;
    } catch (error) {
      console.error('Error emailing data:', error);
      return false;
    }
  }
}

export default new StorageManager();