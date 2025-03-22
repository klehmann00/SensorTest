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
import CalibrationProcessor from '../processors/CalibrationProcessor';
import SensorProcessor from '../processors/SensorProcessor';
import ConfigurationManager from '../managers/ConfigurationManager';
import GravityCompensation from '../utils/GravityCompensation';
import CoordinateTransformer from '../processors/CoordinateTransformer';
import DebugPanel from '../components/DebugPanel';

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
  const [showProcessed, setShowProcessed] = useState(false);
  const recordingRef = useRef(false);
  const sessionIdRef = useRef(null);
  const dataPointCountRef = useRef(0);
  const isCalibratingRef = useRef(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibrationDescription, setCalibrationDescription] = useState('Not calibrated');
  const [calibrationOffsetX, setCalibrationOffsetX] = useState(0);
  const [calibrationOffsetY, setCalibrationOffsetY] = useState(0);  
  const [calibrationOffsetZ, setCalibrationOffsetZ] = useState(0);
  const [gravityVector, setGravityVector] = useState({ x: 0, y: 0, z: 1 });
  const [gravityMagnitude, setGravityMagnitude] = useState(1.0);
  const [rawAccelData, setRawAccelData] = useState({x: 0, y: 0, z: 0});
  const [transformedAccelData, setTransformedAccelData] = useState(null);


  // Add this new useEffect hook for system initialization
   useEffect(() => {
    const initializeSystem = async () => {
      try {
        // Initialize the configuration
        await ConfigurationManager.loadConfiguration();
        
        // Initialize the calibration system and load saved calibration
        const calibrationLoaded = await CalibrationManager.initialize();
        setIsCalibrated(calibrationLoaded);
        
        if (calibrationLoaded) {
          console.log('Loaded saved calibration');
          const summary = CalibrationManager.getCalibrationSummary();
          setCalibrationDescription(summary.rotationDescription);
        } else {
          console.log('No calibration loaded');
        }
        
        // Initialize the SensorProcessor
        SensorProcessor.initialize();
      } catch (error) {
        console.error('Error initializing systems:', error);
      }
    };
    
    initializeSystem();
  }, []);
  
 // Add this new useEffect hook along with your other hooks
    useEffect(() => {
      isCalibratingRef.current = isCalibrating;
    }, [isCalibrating]);

  // Check sensor availability when component loads
  useEffect(() => {
    SensorDataManager.checkSensorsAvailability().then(availability => {
      console.log("Sensor availability:", availability);

    });


    // Register calibration callbacks
    CalibrationProcessor.registerCallbacks({
      onCalibrationStarted: () => {
        setIsCalibrating(true);
        setCalibrationProgress(0);
        console.log("Calibration started");
      },
      onCalibrationProgress: (progress) => {
        setCalibrationProgress(progress);
        console.log(`Calibration progress: ${(progress * 100).toFixed(0)}%`);
      },
      onCalibrationCompleted: async (result) => {
        setIsCalibrating(false);
        console.log("Calibration completed:", result);
        
        // Save calibration matrix if successful
        if (result.success) {
          // Apply the calibration matrix to CoordinateTransformer
          const saved = await CalibrationManager.saveCalibrationMatrix(result.matrix);
          setIsCalibrated(saved);
          
          const summary = CalibrationManager.getCalibrationSummary();
          setCalibrationDescription(summary.rotationDescription);
          
          // Make sure the SensorProcessor knows to use calibration
          SensorProcessor.setCalibration(true);
          
          Alert.alert(
            'Calibration Complete',
            `Calibration completed with ${result.sampleCount} samples.\n\n` +
            `Device orientation: ${summary.rotationDescription}`
          );
        } else {
          Alert.alert(
            'Calibration Complete',
            `Calibration completed but couldn't determine orientation.\n` +
            `Try again with the device positioned securely.`
          );
        }
      },
      onCalibrationCancelled: () => {
        setIsCalibrating(false);
        setCalibrationProgress(0);
        console.log("Calibration cancelled");
        Alert.alert('Calibration Cancelled', 'Calibration process was cancelled.');
      }
    });
  }, []);

  // Handle accelerometer data
// Replace the existing handleAccelerometerData function in SensorScreen.js

const handleAccelerometerData = (rawData) => {
  try {
    // Store the raw data for debugging
    setRawAccelData(rawData);
    
    // Check if we're calibrating
    if (isCalibratingRef.current) {
      try {
        // Add the sample to the calibration processor
        CalibrationProcessor.addCalibrationSample(rawData);
      } catch (error) {
        console.error("Error processing calibration sample:", error);
      }
      
      // Update UI with raw data during calibration
      setAccelData(rawData);
      return;
    }
    
    // Check if recording is active
    const isCurrentlyRecording = recordingRef.current;
    const currentSessionId = sessionIdRef.current;

    // Process the raw data through the sensor processor
    const processedData = SensorProcessor.processAccelerometerData(rawData);
    
    // Transform the processed data using CoordinateTransformer
    const transformedData = CoordinateTransformer.applyTransformation(processedData);
    
    console.log("Transformed data for display:", {
      lateral: transformedData.lateral,
      longitudinal: transformedData.longitudinal,
      vertical: transformedData.vertical
    });
    
    setAccelData(processedData);
    setTransformedAccelData(transformedData);
    
    // If recording is active, store the data
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
  // START CALIBRATION FUNCTION
  // Replace the existing startCalibration function in SensorScreen.js

  const startCalibration = () => {
    // Start the calibration process
    if (CalibrationProcessor.isCalibrationActive()) {
      console.log('Calibration already in progress');
      return;
    }
    
    // Reset any previous calibration
    CalibrationProcessor.reset();
    CoordinateTransformer.reset();
    
    console.log('Starting calibration process...');
    CalibrationProcessor.startCalibration();
    
    // All sample collection will be handled by the processor
    // via the callback that was set up in useEffect
  };


// Update this function to also handle filtered values
// In the compensateForGravity function, ensure we're handling filtered values correctly
const compensateForGravity = (data, gravityVector, gravityMagnitude) => {
  if (!data || !gravityVector) return data;
  
  // Create a new object to avoid modifying the original
  const compensated = { ...data };
  
  // For raw values
  compensated.x = data.x - gravityVector.x;
  compensated.y = data.y - gravityVector.y;
  compensated.z = data.z - gravityVector.z;
  
  // For filtered values - apply the exact same offset
  if (data.filtered_x !== undefined) {
    compensated.filtered_x = data.filtered_x - gravityVector.x;
    compensated.filtered_y = data.filtered_y - gravityVector.y; 
    compensated.filtered_z = data.filtered_z - gravityVector.z;
  }
  
  return compensated;
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
          CalibrationProcessor.cancelCalibration();
          setIsCalibrating(false);
        }
      };
    } catch (error) {
      console.error("Error starting sensors:", error);
      Alert.alert('Sensor Error', 'Failed to initialize device sensors. Please restart the app.');
    }
  }, []);

  // Add safety timeout for calibration - NEW USEEFFECT HOOK
  // Replace the safety timeout useEffect with this simpler version:
  useEffect(() => {
    if (isCalibrating) {
      console.log("Setting up calibration safety timeout");
      const timer = setTimeout(() => {
        console.log("Calibration safety timeout triggered");
        // Directly set state instead of calling the method
        setIsCalibrating(false);
        Alert.alert('Calibration Timeout', 'Calibration timed out after 10 seconds.');
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isCalibrating]);

   
  const compensatedData = isCalibrated && gravityVector ? 
  compensateForGravity(accelData, gravityVector, gravityMagnitude) 
  : accelData;

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.mainTitle}>iPhone Sensors</Text>
        {isRecording && (
          <Text style={styles.dataCount}>Data points collected: {dataPointCount}</Text>
        )}
        



// Then your existing GGPlot component will use this compensatedData
// In SensorScreen.js
// This represents the GGPlot component section in SensorScreen.js
// Replace the existing GGPlot component with this

console.log("Data being passed to GGPlot:", 
  showProcessed ? transformedAccelData : accelData
);

<GGPlot 
  processedData={!showProcessed ? transformedAccelData : accelData}
  maxG={1} 
  isCalibrating={isCalibrating}
  showProcessed={!showProcessed}
/>
        
        {isCalibrating && (
          <View style={styles.calibrationOverlay}>
            <Text style={styles.calibrationText}>Calibrating...</Text>
            <Text style={styles.calibrationSubText}>
              {Math.round(calibrationProgress * 100)}% Complete
            </Text>
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

          <Button 
            title="Add Cal Sample"
            onPress={() => {
              if (isCalibrating) {
                console.log("Manually adding calibration sample");
                CalibrationProcessor.addCalibrationSample(accelData);
              } else {
                Alert.alert('Not Calibrating', 'Start calibration first.');
              }
            }}
            color="#FF9500"
            disabled={!isCalibrating}
          />

        </View>
        
        <SensorDisplay title="Accelerometer (G)" data={accelData} color="#FF6B6B" scale={1} showProcessed={showProcessed} />
        <SensorDisplay title="Gyroscope (rad/s)" data={gyroData} color="#4ECDC4" scale={2} showProcessed={showProcessed} />
        <SensorDisplay title="Magnetometer (μT)" data={magData} color="#45B7D1" scale={0.1} showProcessed={showProcessed} />

        <DebugPanel 
  rawData={rawAccelData}
  processedData={transformedAccelData || accelData}
  calibrationOffsets={CoordinateTransformer.calibrationVector || { x: 0, y: 0, z: 0 }}
  isCalibrated={CoordinateTransformer.calibrated}
/>
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
  calibrationSubText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 15,
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