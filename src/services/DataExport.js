// Complete update for DataExport.js

import { getDatabase, ref, get } from 'firebase/database';

export const exportSessionData = async (userId, sessionId) => {
  try {
    console.log(`Exporting data for userId: ${userId}, sessionId: ${sessionId}`);
    const database = getDatabase();
    const sessionPath = `users/${userId}/sessions/${sessionId}`;
    
    // Get the session data
    const snapshot = await get(ref(database, sessionPath));
    const sessionData = snapshot.val();
    
    if (!sessionData) {
      console.error('No session data found');
      return { files: [] };
    }
    
    console.log('Session data retrieved, keys:', Object.keys(sessionData));
    
    // Log data availability
    if (sessionData.accelerometer) {
      console.log('Found accelerometer data');
    } else {
      console.log('No accelerometer data found');
    }
    
    if (sessionData.gyroscope) {
      console.log('Found gyroscope data');
    } else {
      console.log('No gyroscope data found');
    }
    
    if (sessionData.magnetometer) {
      console.log('Found magnetomoeter data');
    } else {
      console.log('No magnetometer data found');
    }
    
    // Format the data into CSV files
    const files = [];
    
    // Process accelerometer data if it exists
    if (sessionData.accelerometer) {
      console.log('Processing accelerometer data...');
      const accelData = sessionData.accelerometer;
      const timestamps = Object.keys(accelData).sort();
  
    // Create different CSV files for different processing stages
  
    // 1. Raw data CSV
    let rawCsvContent = 'timestamp,x,y,z\n';
    timestamps.forEach(timestamp => {
      const reading = accelData[timestamp];
    
    // Get raw values regardless of format
    const rawX = reading.raw_x || reading.x;
    const rawY = reading.raw_y || reading.y;
    const rawZ = reading.raw_z || reading.z;
    
    rawCsvContent += `${timestamp},${rawX},${rawY},${rawZ}\n`;
  });
  
  files.push({
    fileName: `accelerometer_raw_${sessionId}.csv`,
    content: rawCsvContent
  });
  
  // 2. Processed data CSV (final values after all processing)
  let processedCsvContent = 'timestamp,lateral,longitudinal,vertical\n';
  timestamps.forEach(timestamp => {
    const reading = accelData[timestamp];
    
    // Try to get processed values or fall back to whatever format is available
    const lateral = reading.processed_lateral || reading.lateral || reading.y || 0;
    const longitudinal = reading.processed_longitudinal || reading.longitudinal || reading.x || 0;
    const vertical = reading.processed_vertical || reading.vertical || reading.z || 0;
    
    processedCsvContent += `${timestamp},${lateral},${longitudinal},${vertical}\n`;
  });
  
  files.push({
    fileName: `accelerometer_processed_${sessionId}.csv`,
    content: processedCsvContent
  });
  
  console.log(`Accelerometer CSVs created with ${timestamps.length} readings`);
}

    // Process gyroscope data if it exists
    if (sessionData.gyroscope) {
      console.log('Processing gyroscope data...');
      const gyroData = sessionData.gyroscope;
      const timestamps = Object.keys(gyroData).sort();
      
      let csvContent = 'timestamp,x,y,z\n';
      
      timestamps.forEach(timestamp => {
        const reading = gyroData[timestamp];
        
        // Gyroscope data is typically in raw x,y,z format
        const x = reading.x;
        const y = reading.y;
        const z = reading.z;
        
        csvContent += `${timestamp},${x},${y},${z}\n`;
      });
      
      files.push({
        fileName: `gyroscope_${sessionId}.csv`,
        content: csvContent
      });
      
      console.log(`Gyroscope CSV created with ${timestamps.length} readings`);
    }
    
    // Process magnetometer data if it exists
    if (sessionData.magnetometer) {
      console.log('Processing magnetometer data...');
      const magData = sessionData.magnetometer;
      const timestamps = Object.keys(magData).sort();
      
      let csvContent = 'timestamp,x,y,z\n';
      
      timestamps.forEach(timestamp => {
        const reading = magData[timestamp];
        
        // Magnetometer data is typically in raw x,y,z format
        const x = reading.x;
        const y = reading.y;
        const z = reading.z;
        
        csvContent += `${timestamp},${x},${y},${z}\n`;
      });
      
      files.push({
        fileName: `magnetometer_${sessionId}.csv`,
        content: csvContent
      });
      
      console.log(`Magnetometer CSV created with ${timestamps.length} readings`);
    }
    
    // Include metadata in a more informative format
    if (sessionData.metadata) {
      console.log('Processing metadata...');
      
      // Format metadata as a more readable CSV
      let metadataContent = 'Property,Value\n';
      
      // Add session start time in human-readable format
      if (sessionData.metadata.startTime) {
        const startDate = new Date(sessionData.metadata.startTime);
        metadataContent += `Session Start,${startDate.toLocaleString()}\n`;
      }
      
      // Add session end time in human-readable format
      if (sessionData.metadata.endTime) {
        const endDate = new Date(sessionData.metadata.endTime);
        metadataContent += `Session End,${endDate.toLocaleString()}\n`;
        
        // Calculate duration if both start and end times exist
        if (sessionData.metadata.startTime) {
          const durationMs = sessionData.metadata.endTime - sessionData.metadata.startTime;
          const durationSec = (durationMs / 1000).toFixed(1);
          metadataContent += `Duration (seconds),${durationSec}\n`;
        }
      }
      
      // Add device info if it exists
      if (sessionData.metadata.deviceInfo) {
        if (sessionData.metadata.deviceInfo.sampleRates) {
          const rates = sessionData.metadata.deviceInfo.sampleRates;
          metadataContent += `Accelerometer Sample Rate (ms),${rates.accelerometer}\n`;
          metadataContent += `Gyroscope Sample Rate (ms),${rates.gyroscope}\n`;
          metadataContent += `Magnetometer Sample Rate (ms),${rates.magnetometer}\n`;
        }
        
        if (sessionData.metadata.deviceInfo.units) {
          const units = sessionData.metadata.deviceInfo.units;
          metadataContent += `Accelerometer Units,${units.accelerometer}\n`;
          metadataContent += `Gyroscope Units,${units.gyroscope}\n`;
          metadataContent += `Magnetometer Units,${units.magnetometer}\n`;
        }
      }
      
      // Add data point counts
      let accelCount = 0;
      let gyroCount = 0;
      let magCount = 0;
      
      if (sessionData.accelerometer) {
        accelCount = Object.keys(sessionData.accelerometer).length;
        metadataContent += `Accelerometer Data Points,${accelCount}\n`;
      }
      
      if (sessionData.gyroscope) {
        gyroCount = Object.keys(sessionData.gyroscope).length;
        metadataContent += `Gyroscope Data Points,${gyroCount}\n`;
      }
      
      if (sessionData.magnetometer) {
        magCount = Object.keys(sessionData.magnetometer).length;
        metadataContent += `Magnetometer Data Points,${magCount}\n`;
      }
      
      const totalPoints = accelCount + gyroCount + magCount;
      metadataContent += `Total Data Points,${totalPoints}\n`;
      
      files.push({
        fileName: `session_info_${sessionId}.csv`,
        content: metadataContent
      });
      
      console.log('Metadata CSV created');
    }
    
    return { files };
  } catch (error) {
    console.error('Error exporting session data:', error);
    console.log(`Returning ${files.length} files for export:`, files.map(f => f.fileName));
    return { files: [] };
  }
};