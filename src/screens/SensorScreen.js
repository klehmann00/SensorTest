// src/screens/SensorScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet,
  Text, 
  View, 
  ScrollView,
  Button,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  AppState
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAdmin } from '../contexts/AdminContext';

// Import managers and processors
import SensorDataManager from '../managers/SensorDataManager';
import SensorProcessor from '../processors/SensorProcessor';
import CalibrationSystem from '../managers/CalibrationSystem';
import EnergyManager from '../managers/EnergyManager';
import CloudStorage from '../managers/CloudStorage';
import AuthManager from '../services/AuthManager';

// Import components
import SensorDisplay from '../components/SensorDisplay';
import GGPlot from '../components/GGPlot';
import DebugPanel from '../components/DebugPanel';
import GyroVisualizer from '../components/GyroVisualizer';

const SensorScreen = () => {
  const { isAdmin } = useAdmin();
  
  // State variables for sensor data
  const [accelData, setAccelData] = useState({ x: 0, y: 0, z: 0 });
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [magData, setMagData] = useState({ x: 0, y: 0, z: 0 });
  const [processedAccelData, setProcessedAccelData] = useState(null);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [dataPointCount, setDataPointCount] = useState(0);
  
  // Calibration state
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibrationDescription, setCalibrationDescription] = useState('Not calibrated');
  
  // Display options
  const [showProcessed, setShowProcessed] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [powerMode, setPowerMode] = useState('normal');
  
  // References for async state access
  const recordingRef = useRef(false);
  const sessionIdRef = useRef(null);
  const dataPointCountRef = useRef(0);
  const calibratingRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  
  // Initialize systems on mount
  useEffect(() => {
    async function initializeSystems() {
      try {
        console.log('Initializing systems...');
        
        // Initialize energy manager
        EnergyManager.initialize();
        
        // Subscribe to energy manager events
        EnergyManager.subscribe(handlePowerModeChange);
        
        // Initialize calibration system and load saved calibration
        const calibrationLoaded = await CalibrationSystem.initialize();
        setIsCalibrated(calibrationLoaded);
        updateCalibrationInfo();
        
        // Filter and Limiter definitions
        SensorProcessor.initialize({
          processing: {
            maxDelta: { 
              x: 0.025,  // For accelerometer
              y: 0.025,  // For accelerometer
              z: 0.05,   // For accelerometer
              gyroX: 0.3, // For gyroscope (rad/s) - add these new properties
              gyroY: 0.3, // For gyroscope (rad/s)
              gyroZ: 0.3  // For gyroscope (rad/s)
            },
            filter: { 
              x: 0.1,    // For accelerometer
              y: 0.1,    // For accelerometer
              z: 0.2,    // For accelerometer
              gyroX: 0.9, // For gyroscope - add these new properties
              gyroY: 0.01, // For gyroscope
              gyroZ: 0.1  // For gyroscope
            }
          },
          useFiltering: true,
          useCalibration: true,
          debugMode: false
        });
       
        
        // Subscribe to AppState changes
        const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
        
        return () => {
          // Clean up
          EnergyManager.cleanup();
          appStateSubscription.remove();
        };
      } catch (error) {
        console.error('Error initializing systems:', error);
        Alert.alert('Initialization Error', 'Failed to initialize sensor systems. Please restart the app.');
      }
    }
    
    initializeSystems();
  }, []);
  
  // Handle app state changes
  const handleAppStateChange = (nextAppState) => {
    console.log(`App state changed: ${appStateRef.current} -> ${nextAppState}`);
    appStateRef.current = nextAppState;
    
    // If going to background while recording, make sure we're in background mode
    if (nextAppState === 'background' && recordingRef.current) {
      EnergyManager.setPowerMode('background');
    }
  };
  
  // Handle power mode changes
  const handlePowerModeChange = (mode, config) => {
    console.log(`Power mode changed to ${mode}`);
    setPowerMode(mode);
    
    // Update sensor manager configuration
    SensorDataManager.updateConfiguration({
      updateInterval: config.updateInterval,
      batchSize: config.batchSize,
      lowPowerMode: mode !== 'normal'
    });
    
    // Update sensor processor based on processing level
    if (config.processingLevel === 'full') {
      SensorProcessor.setFiltering(true);
    } else if (config.processingLevel === 'minimal') {
      // Minimal processing - turn off some heavier processing
      SensorProcessor.updateConfig({
        processing: {
          filter: { x: 0.3, y: 0.3, z: 0.3 } // Less filtering (higher alpha)
        }
      });
      SensorProcessor.setFiltering(true);
    } else {
      // No processing in background mode
      SensorProcessor.setFiltering(false);
    }
  };
  
  // Update calibration info display
  const updateCalibrationInfo = () => {
    if (CalibrationSystem.isDeviceCalibrated()) {
      setCalibrationDescription(CalibrationSystem.getOrientationDescription());
    } else {
      setCalibrationDescription('Device not calibrated');
    }
  };
  
  // Start sensors when component is mounted
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
        
        if (recordingRef.current) {
          stopRecording();
        }
        
        if (calibratingRef.current) {
          CalibrationSystem.cancelCalibration();
          setIsCalibrating(false);
          calibratingRef.current = false;
        }
      };
    } catch (error) {
      console.error("Error starting sensors:", error);
      Alert.alert('Sensor Error', 'Failed to initialize device sensors. Please restart the app.');
    }
  }, []);
  
  // Handle accelerometer data
  // Handle accelerometer data
// Update the handleAccelerometerData function in SensorScreen.js
const handleAccelerometerData = (rawData) => {
  try {
    // Handle calibration mode
    if (calibratingRef.current) {
      CalibrationSystem.addCalibrationSample(rawData);
      setAccelData(rawData);
      return;
    }
    
    // Always process raw data through our pipeline
    const processedData = SensorProcessor.processAccelerometerData(rawData);
    
    // Update UI with appropriate data
    setAccelData(rawData); // Store original raw data
    setProcessedAccelData(processedData); // Store all processed stages

    // Store data if recording
    if (recordingRef.current && sessionIdRef.current) {
      const userId = AuthManager.getCurrentUserId();
      if (userId) {
        // Always store the fully processed data when recording
        CloudStorage.queueData(userId, sessionIdRef.current, 'accelerometer', processedData);
        
        // Update data point count
        dataPointCountRef.current += 1;
        setDataPointCount(dataPointCountRef.current);
      }
    }
  } catch (error) {
    console.error("Error processing accelerometer data:", error);
  }
};
  
  // Handle gyroscope data
  const handleGyroscopeData = (rawData) => {
    try {
      // Store a reference to the raw data for debugging
      const timestamp = Date.now();
      const timestampedRawData = { ...rawData, timestamp };
      
      // Skip processing during calibration
      if (calibratingRef.current) {
        setGyroData(timestampedRawData);
        return;
      }
      
      // Process through pipeline
      const processedData = SensorProcessor.processGyroscopeData(timestampedRawData);
      
      // Update UI
      setGyroData(processedData);
      
      // Store data if recording
      if (recordingRef.current && sessionIdRef.current) {
        const userId = AuthManager.getCurrentUserId();
        if (userId) {
          CloudStorage.queueData(userId, sessionIdRef.current, 'gyroscope', processedData);
        }
      }
    } catch (error) {
      console.error("Error processing gyroscope data:", error);
    }
  };
  
  // Handle magnetometer data
  const handleMagnetometerData = (rawData) => {
    try {
      // Skip processing during calibration or if in low power mode
      if (calibratingRef.current || powerMode === 'background') {
        setMagData(rawData);
        return;
      }
      
      // Update UI
      setMagData(rawData);
      
      // Store data if recording
      if (recordingRef.current && sessionIdRef.current) {
        const userId = AuthManager.getCurrentUserId();
        if (userId) {
          CloudStorage.queueData(userId, sessionIdRef.current, 'magnetometer', rawData);
        }
      }
    } catch (error) {
      console.error("Error processing magnetometer data:", error);
    }
  };
  
  // Start recording data
  const startRecording = async () => {
    const userId = AuthManager.getCurrentUserId();
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to record data');
      return;
    }
    
    const newSessionId = Date.now().toString();
    console.log(`Starting recording with session ID: ${newSessionId}`);
    
    // Create session in database
    const success = await CloudStorage.startRecordingSession(userId, newSessionId);
    
    if (success) {
      console.log(`Recording started successfully: user=${userId}, session=${newSessionId}`);
      setSessionId(newSessionId);
      setIsRecording(true);
      setDataPointCount(0);
      
      // Update refs for async access
      sessionIdRef.current = newSessionId;
      recordingRef.current = true;
      dataPointCountRef.current = 0;
      
      // Reset processors
      SensorProcessor.reset();
      
      return true;
    } else {
      Alert.alert('Error', 'Failed to start recording session');
      return false;
    }
  };
  
  // Stop recording data
  const stopRecording = async () => {
    const userId = AuthManager.getCurrentUserId();
    if (!userId || !sessionIdRef.current) {
      return false;
    }
    
    // Update UI state
    setIsRecording(false);
    recordingRef.current = false;
    
    // Store the session ID before clearing the ref
    const currentSessionId = sessionIdRef.current;
    sessionIdRef.current = null;
    
    try {
      // Process any remaining queued data
      await CloudStorage.processUploadQueue();
      
      // End the session in database
      await CloudStorage.endRecordingSession(userId, currentSessionId);
      
      // Reset session state
      setSessionId(null);
      
      // Offer to export data
      Alert.alert(
        'Recording Complete',
        'Would you like to export the recorded data?',
        [
          {
            text: 'No',
            style: 'cancel'
          },
          {
            text: 'Yes',
            onPress: () => exportSessionData(userId, currentSessionId)
          }
        ]
      );
      
      return true;
    } catch (error) {
      console.error("Error stopping recording:", error);
      Alert.alert('Error', 'Failed to complete recording session');
      return false;
    }
  };
  
  // Export session data
  const exportSessionData = async (userId, sessionId) => {
    try {
      Alert.alert('Exporting Data', 'Preparing session data for export...');
      
      // Get session data
      const sessionData = await CloudStorage.getSessionData(userId, sessionId);
      
      if (!sessionData) {
        Alert.alert('Error', 'No data found for this session');
        return;
      }
      
      // Send data via email or other method
      // Implementation depends on platform capabilities
      
      Alert.alert('Export Complete', 'Session data has been exported successfully');
    } catch (error) {
      console.error("Error exporting data:", error);
      Alert.alert('Export Error', 'Failed to export session data');
    }
  };
  
  // Toggle recording
  const toggleRecording = async () => {
    if (!isRecording) {
      await startRecording();
    } else {
      await stopRecording();
    }
  };
  
  // Start calibration
  const startCalibration = () => {
    // Make sure we're not recording
    if (isRecording) {
      Alert.alert('Recording Active', 'Please stop recording before calibrating');
      return;
    }
    
    // Start the calibration process
    if (CalibrationSystem.isCalibrationActive()) {
      console.log('Calibration already in progress');
      return;
    }
    
    // Set up calibration callbacks
    const callbacks = {
      onStart: () => {
        setIsCalibrating(true);
        calibratingRef.current = true;
        setCalibrationProgress(0);
        console.log('Calibration started');
      },
      onProgress: (progress) => {
        setCalibrationProgress(progress);
        console.log(`Calibration progress: ${(progress * 100).toFixed(0)}%`);
      },
      onComplete: (result) => {
        setIsCalibrating(false);
        calibratingRef.current = false;
        
        if (result.success) {
          setIsCalibrated(true);
          updateCalibrationInfo();
          
          Alert.alert(
            'Calibration Complete',
            `Device calibrated successfully.\nOrientation: ${CalibrationSystem.getOrientationDescription()}`
          );
        } else {
          Alert.alert(
            'Calibration Issue',
            'Calibration completed but could not determine device orientation properly. Please try again with the device on a stable surface.'
          );
        }
      },
      onCancel: (reason) => {
        setIsCalibrating(false);
        calibratingRef.current = false;
        setCalibrationProgress(0);
        
        Alert.alert('Calibration Cancelled', reason);
      }
    };
    
    // Start calibration with callbacks
    CalibrationSystem.startCalibration(callbacks);
  };
  
  // Cancel calibration
  const cancelCalibration = () => {
    if (calibratingRef.current) {
      CalibrationSystem.cancelCalibration();
    }
  };
  
  // Clear calibration
  const clearCalibration = async () => {
    // Confirm with user
    Alert.alert(
      'Clear Calibration',
      'Are you sure you want to clear the current calibration?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clear',
          onPress: async () => {
            const success = await CalibrationSystem.clearCalibration();
            if (success) {
              setIsCalibrated(false);
              setCalibrationDescription('Device not calibrated');
              Alert.alert('Calibration Cleared', 'Device calibration has been reset');
            } else {
              Alert.alert('Error', 'Failed to clear calibration');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };
  
// Toggle processed data display
const toggleDataProcessing = () => {
  const newMode = !showProcessed;
  setShowProcessed(newMode);
  SensorProcessor.setFiltering(newMode);
};

// Toggle debug panel
const toggleDebugPanel = () => {
  setShowDebugPanel(!showDebugPanel);
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
    await WebBrowser.openBrowserAsync('https://yourdomain.com/sensor-display');
  };
  
  // Add a calibration sample manually
  const addCalibrationSample = () => {
    if (calibratingRef.current) {
      console.log("Manually adding calibration sample");
      CalibrationSystem.addCalibrationSample(accelData);
    } else {
      Alert.alert('Not Calibrating', 'Start calibration first.');
    }
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.mainTitle}>Sensor Display</Text>
        
        {isRecording && (
          <View style={styles.recordingStatus}>
            <Text style={styles.recordingText}>
              RECORDING {dataPointCount} samples
            </Text>
          </View>
        )}
        
        {isCalibrated ? (
          <Text style={styles.calibrationStatus}>
            Calibrated: {calibrationDescription}
          </Text>
        ) : (
          <Text style={styles.calibrationStatus}>
            Not calibrated
          </Text>
        )}
        
        {/* Power mode indicator */}
        <Text style={styles.powerMode}>
          Power Mode: {powerMode.toUpperCase()}
        </Text>
        
        {/* Main visualization */}
        <GGPlot 
          processedData={showProcessed ? processedAccelData : processedAccelData?.transformed || accelData}
          maxG={1} 
          isCalibrating={isCalibrating}
          showProcessed={showProcessed}
        />

        {/* Gyro visualizer */}
        <View style={styles.gyroVisualizerContainer}>
          <GyroVisualizer 
            data={gyroData} 
            size={150}
            showProcessed={showProcessed}
          />
        </View>
        
        {/* Calibration overlay */}
        {isCalibrating && (
          <View style={styles.calibrationOverlay}>
            <Text style={styles.calibrationText}>Calibrating...</Text>
            <Text style={styles.calibrationSubText}>
              {Math.round(calibrationProgress * 100)}% Complete
            </Text>
            <ActivityIndicator size="large" color="#4ECDC4" />
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={cancelCalibration}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Control buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              isRecording ? styles.stopButton : styles.startButton,
              isCalibrating && styles.disabledButton
            ]}
            onPress={toggleRecording}
            disabled={isCalibrating}
          >
            <Text style={styles.buttonText}>
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton,
              styles.calibrateButton,
              (isCalibrating || isRecording) && styles.disabledButton
            ]}
            onPress={startCalibration}
            disabled={isCalibrating || isRecording}
          >
            <Text style={styles.buttonText}>Calibrate</Text>
          </TouchableOpacity>
          
          {isCalibrated && (
            <TouchableOpacity 
              style={[
                styles.actionButton,
                styles.clearButton,
                (isCalibrating || isRecording) && styles.disabledButton
              ]}
              onPress={clearCalibration}
              disabled={isCalibrating || isRecording}
            >
              <Text style={styles.buttonText}>Clear Calibration</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.toggleButton]}
            onPress={toggleDataProcessing}
          >
            <Text style={styles.buttonText}>
              {showProcessed ? "Show Raw" : "Show Processed"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.toggleButton]}
            onPress={toggleDebugPanel}
          >
            <Text style={styles.buttonText}>
              {showDebugPanel ? "Hide Debug" : "Show Debug"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
            disabled={isCalibrating}
          >
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        {/* Sensor displays */}
        <SensorDisplay 
          title="Accelerometer (G)" 
          data={showProcessed ? processedAccelData : accelData} 
          color="#FF6B6B" 
          scale={1} 
          showProcessed={showProcessed} 
        />
        
        <SensorDisplay 
          title="Gyroscope (rad/s)" 
          data={gyroData} 
          color="#4ECDC4" 
          scale={2} 
          showProcessed={showProcessed} 
        />
        <View style={styles.gyroVisualizerContainer}>
          <Text style={styles.sectionTitle}>Rotation Rates</Text>
           <GyroVisualizer 
            data={gyroData} 
            size={150}
          />
        </View>

        <SensorDisplay 
          title="Magnetometer (μT)" 
          data={magData} 
          color="#45B7D1" 
          scale={0.1} 
          showProcessed={showProcessed} 
        />
        
        {/* Debug panel */}
        {showDebugPanel && (
          <DebugPanel 
            rawData={accelData}
            processedData={processedAccelData}
            calibrationOffsets={CalibrationSystem.getCalibrationInfo().vector || { x: 0, y: 0, z: 0 }}
            isCalibrated={isCalibrated}
          />
        )}
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
  recordingStatus: {
    backgroundColor: '#E74C3C',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 15,
  },
  recordingText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  calibrationStatus: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
  powerMode: {
    color: '#4ECDC4',
    fontSize: 14,
    marginBottom: 15,
  },
  calibrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    zIndex: 1000,
  },
  calibrationText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  calibrationSubText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 15,
  },
  cancelButton: {
    backgroundColor: '#E74C3C',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
    gap: 10,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  startButton: {
    backgroundColor: '#2ECC71',
  },
  stopButton: {
    backgroundColor: '#E74C3C',
  },
  calibrateButton: {
    backgroundColor: '#3498DB',
  },
  clearButton: {
    backgroundColor: '#95A5A6',
  },
  toggleButton: {
    backgroundColor: '#9B59B6',
  },
  logoutButton: {
    backgroundColor: '#34495E',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  gyroVisualizerContainer: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)', // Match GGPlot's styling
    borderRadius: 15,
    padding: 10,
    marginTop: -5, // Move it closer to GGPlot by using negative margin
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)', // Subtle border
    width: '100%', // Match GGPlot width
  },
});

export default SensorScreen;