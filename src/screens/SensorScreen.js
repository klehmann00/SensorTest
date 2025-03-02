import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet,
  Text, 
  View, 
  ScrollView,
  Button,
  Alert,
  ActivityIndicator
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAdmin } from '../contexts/AdminContext';
import SensorDataManager from '../managers/SensorData';
import DataProcessor from '../managers/DataProcessing';
import StorageManager from '../managers/StorageManager';
import AuthManager from '../services/AuthManager';
import CalibrationManager from '../managers/CalibrationManager';
import SensorDisplay from '../components/SensorDisplay';
import { Accelerometer } from 'expo-sensors';
import GGPlot from '../components/GGPlot';

const SensorScreen = () => {
  const { isAdmin } = useAdmin();
  
  // State variables
  const [accelData, setAccelData] = useState({ x: 0, y: 0, z: 0 });
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [magData, setMagData] = useState({ x: 0, y: 0, z: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [dataPointCount, setDataPointCount] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [showProcessed, setShowProcessed] = useState(true);
  const recordingRef = useRef(false);
  const sessionIdRef = useRef(null);
  const dataPointCountRef = useRef(0);

  // Check sensor availability when component loads
  useEffect(() => {
    SensorDataManager.checkSensorsAvailability().then(availability => {
      console.log("Sensor availability:", availability);
    });
  }, []);

  // Handle accelerometer data
  const handleAccelerometerData = (rawData) => {
    try {
      console.log("Raw accel data:", JSON.stringify(rawData));

      if (isCalibrating) {
        console.log("CALIBRATION: Adding sample");
        CalibrationManager.addCalibrationSample(rawData);
        setAccelData(rawData);
        return;
      }
      
      const isCurrentlyRecording = recordingRef.current;
      const currentSessionId = sessionIdRef.current;
      
      const calibratedData = CalibrationManager.applyCalibration(rawData);
      const processedData = DataProcessor.processAccelerometerData(calibratedData);
      
      setAccelData(processedData);

      if (isCurrentlyRecording && currentSessionId) {
        const userId = AuthManager.getCurrentUserId();
        if (userId) {
          StorageManager.storeAccelerometerData(userId, currentSessionId, processedData);
        }
      }
    } catch (error) {
      console.error("Error processing accelerometer data:", error);
    }
  };

  // Handle gyroscope data
  const handleGyroscopeData = (rawData) => {
    try {
      const isCurrentlyRecording = recordingRef.current;
      const currentSessionId = sessionIdRef.current;
      
      if (isCalibrating) {
        setGyroData(rawData);
        return;
      }
      
      const processedData = DataProcessor.processGyroscopeData(rawData);
      setGyroData(processedData);
      
      if (isCurrentlyRecording && currentSessionId) {
        const userId = AuthManager.getCurrentUserId();
        if (userId) {
          StorageManager.storeGyroscopeData(userId, currentSessionId, processedData);
        }
      }
    } catch (error) {
      console.error("Error processing gyroscope data:", error);
    }
  };

  // Handle magnetometer data
  const handleMagnetometerData = (rawData) => {
    try {
      const isCurrentlyRecording = recordingRef.current;
      const currentSessionId = sessionIdRef.current;
      
      if (isCalibrating) {
        setMagData(rawData);
        return;
      }
      
      const processedData = DataProcessor.processMagnetometerData(rawData);
      setMagData(processedData);
      
      if (isCurrentlyRecording && currentSessionId) {
        const userId = AuthManager.getCurrentUserId();
        if (userId) {
          StorageManager.storeMagnetometerData(userId, currentSessionId, processedData);
        }
      }
    } catch (error) {
      console.error("Error processing magnetometer data:", error);
    }
  };

  // Start recording
  const startRecording = async () => {
    const userId = AuthManager.getCurrentUserId();
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to record data');
      return;
    }
    
    const newSessionId = Date.now().toString();
    console.log(`Starting recording with session ID: ${newSessionId}`);

    const success = await StorageManager.startRecordingSession(userId, newSessionId);
    
    if (success) {
      console.log(`Recording started successfully: user=${userId}, session=${newSessionId}`);
      setSessionId(newSessionId);
      setIsRecording(true);
      setDataPointCount(0);
      
      sessionIdRef.current = newSessionId;
      recordingRef.current = true;
      
      DataProcessor.reset();
      
      const countInterval = setInterval(async () => {
        console.log(`Count interval fired, recording: ${recordingRef.current}, sessionId: ${sessionIdRef.current}`);
      
        if (!recordingRef.current) {
          console.log("Recording stopped, clearing interval");
          clearInterval(countInterval);
          return;
        }
      
        try {
          console.log(`Counting data points for session ${newSessionId}`);
          const count = await StorageManager.countSessionDataPoints(userId, newSessionId);
          console.log(`Data point count result: ${count}`);
          setDataPointCount(count);
          dataPointCountRef.current = count;
        } catch (error) {
          console.error("Error counting data points:", error);
        }
      }, 1000);
          
      return countInterval;
    } else {
      Alert.alert('Error', 'Failed to start recording session');
      return null;
    }
  };
  
  // Stop recording
  const stopRecording = async (countInterval) => {
    const userId = AuthManager.getCurrentUserId();
    if (!userId || !sessionId) {
      return;
    }
    
    setIsRecording(false);
    recordingRef.current = false;
    sessionIdRef.current = null;
    
    if (countInterval) {
      clearInterval(countInterval);
    }
    
    await StorageManager.endRecordingSession(userId, sessionId);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const exportData = await StorageManager.exportSessionData(userId, sessionId);
    
    if (!exportData.files || exportData.files.length === 0) {
      Alert.alert('Warning', 'No data was recorded during this session');
      return;
    }
    
    await StorageManager.emailExportedData(exportData.files, sessionId);
    setSessionId(null);
  };
  
  // Start calibration
  const startCalibration = () => {
    Alert.alert('Calibration', 'Calibration is temporarily disabled');
  };
  
  // Toggle recording
  const toggleRecording = async () => {
    let countInterval = null;
    
    if (!isRecording) {
      countInterval = await startRecording();
    } else {
      await stopRecording(countInterval);
    }
  };
  
  // Logout handler
  const handleLogout = async () => {
    if (isRecording) {
      await stopRecording();
    }
    
    await AuthManager.logout();
  };
  
  // Open web display
  const openWebView = async () => {
    await WebBrowser.openBrowserAsync('https://klehmann00.github.io/sensor-display/');
  };
  
  // Toggle data processing
  const toggleDataProcessing = () => {
    setShowProcessed(!showProcessed);
  };

  // Initialize sensors
  useEffect(() => {
    try {
      const callbacks = {
        onAccelerometerUpdate: handleAccelerometerData,
        onGyroscopeUpdate: handleGyroscopeData,
        onMagnetometerUpdate: handleMagnetometerData
      };
      
      console.log("Starting sensors...");
      SensorDataManager.startSensors(callbacks);
      console.log("Sensors started successfully");
      
      return () => {
        console.log("Cleaning up sensors...");
        SensorDataManager.stopSensors();
        
        if (isRecording) {
          stopRecording();
        }
        
        if (isCalibrating) {
          CalibrationManager.cancelCalibration();
          setIsCalibrating(false);
        }
      };
    } catch (error) {
      console.error("Error starting sensors:", error);
      Alert.alert('Sensor Error', 'Failed to initialize device sensors. Please restart the app.');
    }
  }, []);

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.mainTitle}>iPhone Sensors</Text>
        {isRecording && (
          <Text style={styles.dataCount}>Data points collected: {dataPointCount}</Text>
        )}
        
        <GGPlot 
          processedData={{
            processed_lateral: accelData.filtered_y || accelData.limited_y || accelData.y || 0,
            processed_longitudinal: accelData.filtered_x || accelData.limited_x || accelData.x || 0,
            processed_vertical: accelData.filtered_z || accelData.limited_z || accelData.z || 0,
            raw_x: accelData.raw_x || accelData.x || 0,
            raw_y: accelData.raw_y || accelData.y || 0,
            raw_z: accelData.raw_z || accelData.z || 0
          }}
          maxG={1} 
          isCalibrating={isCalibrating}
        />
        
        {isCalibrating && (
          <View style={styles.calibrationOverlay}>
            <Text style={styles.calibrationText}>Calibrating...</Text>
            <ActivityIndicator size="large" color="#4ECDC4" />
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <Button 
            title={isRecording ? "Stop Recording" : "Start Recording"}
            onPress={toggleRecording}
            color={isRecording ? "#E74C3C" : "#2ECC71"}
            disabled={isCalibrating}
          />
          <Button 
            title="Calibrate"
            onPress={startCalibration}
            color="#3498DB"
            disabled={isCalibrating || isRecording}
          />
          <Button 
            title={showProcessed ? "Show Raw" : "Show Processed"} 
            onPress={toggleDataProcessing} 
            color="#9B59B6"
            disabled={isCalibrating}
          />
          <Button 
            title="Open Web Display" 
            onPress={openWebView}
            color="#4ECDC4"
            disabled={isCalibrating}
          />
          <Button
            title="Logout"
            onPress={handleLogout}
            color="#E74C3C"
            disabled={isCalibrating}
          />
        </View>
        
        <SensorDisplay title="Accelerometer (G)" data={accelData} color="#FF6B6B" scale={1} showProcessed={showProcessed} />
        <SensorDisplay title="Gyroscope (rad/s)" data={gyroData} color="#4ECDC4" scale={2} showProcessed={showProcessed} />
        <SensorDisplay title="Magnetometer (μT)" data={magData} color="#45B7D1" scale={0.1} showProcessed={showProcessed} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#2C3E50',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  dataCount: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
  calibrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
  calibrationText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 10,
  },
});

export default SensorScreen;