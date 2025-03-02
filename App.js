import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet,
  Text, 
  View, 
  ScrollView,
  SafeAreaView,
  Button,
  Alert,
  TextInput,
  TouchableOpacity,
  ActivityIndicator  // Add this import
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';

// Import Firebase
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { initializeAuth, getReactNativePersistence, browserSessionPersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import our modules
import SensorDataManager from './SensorData';
import DataProcessor from './DataProcessing';
import StorageManager from './StorageManager';
import AuthManager from './AuthManager';
import AdminManager from './AdminManager';
import AdminScreen from './AdminScreen';
import CalibrationManager from './CalibrationManager';
import SessionManager from './SessionManager';
import { AdminProvider, useAdmin } from './AdminContext';
import { Accelerometer } from 'expo-sensors';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC_wBOaHBmwBhrk0-OZSrQejlNE76tr33Q",
  authDomain: "sensor-display.firebaseapp.com",
  projectId: "sensor-display",
  storageBucket: "sensor-display.firebasestorage.app",
  messagingSenderId: "999834441988",
  appId: "1:999834441988:web:6c3ede4d4a379bbb1dd851",
  databaseURL: "https://sensor-display-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Initialize Auth with sessionOnly persistence (will be cleared when app closes)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize our managers
StorageManager.initialize(database);
AuthManager.initialize(auth, database);
AdminManager.initialize(database);

// Create stack navigator
const Stack = createNativeStackNavigator();

// Login Screen Component
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    const result = await AuthManager.loginWithEmail(email, password);
    
    if (!result.success) {
      setError(result.error);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    
    const result = await AuthManager.sendPasswordReset(email);
    
    if (result.success) {
      Alert.alert('Password Reset', 'Password reset email sent! Check your inbox.');
    } else {
      setError(result.error);
    }
  };

  return (
    <View style={styles.authContainer}>
      <Text style={styles.mainTitle}>Sensor Display</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#95a5a6"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#95a5a6"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.authButton} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handlePasswordReset}>
        <Text style={[styles.linkText, { marginBottom: 10 }]}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
};

// SignUp Screen Component
const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    setError('');
    const result = await AuthManager.createAccount(email, password);
    
    if (result.success) {
      Alert.alert(
        'Account Created',
        'Please check your email for verification link.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } else {
      setError(result.error);
    }
  };

  return (
    <View style={styles.authContainer}>
      <Text style={styles.mainTitle}>Create Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#95a5a6"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#95a5a6"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.authButton} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
};

// SensorScreen Component
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
  const dataPointCountRef = useRef(0); // Add this line

  // Check sensor availability when component loads
  useEffect(() => {
    // Check sensor availability at startup
    SensorDataManager.checkSensorsAvailability().then(availability => {
      console.log("Sensor availability:", availability);
    });
  }, []);

  // Handle accelerometer data - UPDATED function with error handling
  // Handle accelerometer data - Update this function in App.js
// Handle accelerometer data
// Handle accelerometer data
// Handle accelerometer data
// Handle accelerometer data
const handleAccelerometerData = (rawData) => {
  try {
    // If calibrating, ONLY focus on adding samples
    if (isCalibrating) {
      console.log("CALIBRATION: Adding sample");
      CalibrationManager.addCalibrationSample(rawData);
      setAccelData(rawData);
      return;
    }
    
    // Get recording state from refs
    const isCurrentlyRecording = recordingRef.current;
    const currentSessionId = sessionIdRef.current;
    
    // Normal processing (not during calibration)
    const calibratedData = CalibrationManager.applyCalibration(rawData);
    const processedData = DataProcessor.processAccelerometerData(calibratedData);
    setAccelData(processedData);

    // If recording, store the data
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

  // Handle gyroscope data - UPDATED with error handling
  const handleGyroscopeData = (rawData) => {
    try {
      // Use ref values 
      const isCurrentlyRecording = recordingRef.current;
      const currentSessionId = sessionIdRef.current;
      
      // Skip processing during calibration
      if (isCalibrating) {
        setGyroData(rawData);
        return;
      }
      
      // Process the data
      const processedData = DataProcessor.processGyroscopeData(rawData);
      
      // Update state
      setGyroData(processedData);
      
      // If recording, store the data - using ref values
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

  // Handle magnetometer data - UPDATED with error handling
  const handleMagnetometerData = (rawData) => {
    try {
      // Use ref values
      const isCurrentlyRecording = recordingRef.current;
      const currentSessionId = sessionIdRef.current;
      
      // Skip processing during calibration
      if (isCalibrating) {
        setMagData(rawData);
        return;
      }
      
      // Process the data
      const processedData = DataProcessor.processMagnetometerData(rawData);
      
      // Update state
      setMagData(processedData);
      
      // If recording, store the data - using ref values
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
    // Check if user is logged in
    const userId = AuthManager.getCurrentUserId();
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to record data');
      return;
    }
    
    // Generate session ID
    const newSessionId = Date.now().toString();
    console.log(`Starting recording with session ID: ${newSessionId}`);

    // Start recording session
    const success = await StorageManager.startRecordingSession(userId, newSessionId);
    
    if (success) {
      console.log(`Recording started successfully: user=${userId}, session=${newSessionId}`);
      setSessionId(newSessionId);
      setIsRecording(true);
      setDataPointCount(0);
      
      sessionIdRef.current = newSessionId;
      recordingRef.current = true;
      
      // Reset data processor
      DataProcessor.reset();
      
      // Start data point counter
     // Start data point counter with enhanced debugging
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
    // Check if user is logged in
    const userId = AuthManager.getCurrentUserId();
    if (!userId || !sessionId) {
      return;
    }
    
    // Stop recording
    setIsRecording(false);
    recordingRef.current = false;
    sessionIdRef.current = null;
    
    // Clear counter interval
    if (countInterval) {
      clearInterval(countInterval);
    }
    
    // End recording session
    await StorageManager.endRecordingSession(userId, sessionId);
    
    // Add a delay to ensure all data is written
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Export session data
    const exportData = await StorageManager.exportSessionData(userId, sessionId);
    
    if (!exportData.files || exportData.files.length === 0) {
      Alert.alert('Warning', 'No data was recorded during this session');
      return;
    }
    
    // Email the exported data
    await StorageManager.emailExportedData(exportData.files, sessionId);
    
    // Reset session
    setSessionId(null);
  };
  
// startCalibration function:
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
    // If recording, stop first
    if (isRecording) {
      await stopRecording();
    }
    
    // Logout
    await AuthManager.logout();
  };
  
  // Open web display
  const openWebView = async () => {
    await WebBrowser.openBrowserAsync('https://klehmann00.github.io/sensor-display/');
  };
  
  // Add this after your other handler functions (like openWebView)
  const toggleDataProcessing = () => {
    setShowProcessed(!showProcessed);
  };

  // Initialize sensors when component mounts - UPDATED useEffect
  useEffect(() => {
    try {
      // Define callbacks
      const callbacks = {
        onAccelerometerUpdate: handleAccelerometerData,
        onGyroscopeUpdate: handleGyroscopeData,
        onMagnetometerUpdate: handleMagnetometerData
      };
      
      // Start sensors with error handling
      console.log("Starting sensors...");
      SensorDataManager.startSensors(callbacks);
      console.log("Sensors started successfully");
      
      // Clean up on unmount
      return () => {
        console.log("Cleaning up sensors...");
        // Stop sensors
        SensorDataManager.stopSensors();
        
        // If recording, stop recording
        if (isRecording) {
          stopRecording();
        }
        
        // If calibrating, cancel calibration
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
  
  // Helper function to get bar width for visualization
  const getBarWidth = (value, scale = 1) => {
    const maxWidth = 300;
    const scaledWidth = Math.abs(value * scale) * maxWidth;
    return Math.min(scaledWidth, maxWidth);
  };
  
  // Component to display sensor data
  const SensorDisplay = ({ title, data, color, scale = 1 }) => {
    // Safely get values with fallbacks to avoid "toFixed of undefined" errors
    const getDisplayValue = (obj, prop, fallback = 0) => {
      if (!obj) return fallback;
      const value = obj[prop];
      return value !== undefined && value !== null ? value : fallback;
    };
    
    // Choose values based on showProcessed setting
    const xValue = showProcessed 
      ? getDisplayValue(data, 'filtered_x', getDisplayValue(data, 'x', 0))
      : getDisplayValue(data, 'raw_x', getDisplayValue(data, 'x', 0));
      
    const yValue = showProcessed 
      ? getDisplayValue(data, 'filtered_y', getDisplayValue(data, 'y', 0))
      : getDisplayValue(data, 'raw_y', getDisplayValue(data, 'y', 0));
      
    const zValue = showProcessed 
      ? getDisplayValue(data, 'filtered_z', getDisplayValue(data, 'z', 0))
      : getDisplayValue(data, 'raw_z', getDisplayValue(data, 'z', 0));
    
    return (
      <View style={styles.visualContainer}>
        <Text style={[styles.sensorTitle, {color}]}>{title}</Text>
        <View style={styles.axisContainer}>
          <Text style={styles.axisLabel}>X: {xValue.toFixed(3)}</Text>
          <View style={[styles.bar, {width: getBarWidth(xValue, scale), backgroundColor: '#E74C3C'}]} />
        </View>
        <View style={styles.axisContainer}>
          <Text style={styles.axisLabel}>Y: {yValue.toFixed(3)}</Text>
          <View style={[styles.bar, {width: getBarWidth(yValue, scale), backgroundColor: '#27AE60'}]} />
        </View>
        <View style={styles.axisContainer}>
          <Text style={styles.axisLabel}>Z: {zValue.toFixed(3)}</Text>
          <View style={[styles.bar, {width: getBarWidth(zValue, scale), backgroundColor: '#3498DB'}]} />
        </View>
      </View>
    );
  };
  
  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.mainTitle}>iPhone Sensors</Text>
        {isRecording && (
          <Text style={styles.dataCount}>Data points collected: {dataPointCount}</Text>
        )}
        
        {/*-- TODO: Replace this with GGPlot component --*/}
        <View style={styles.ggPlotPlaceholder}>
          <Text style={styles.placeholderText}>G-G Plot goes here</Text>
          {isCalibrating && (
            <View style={styles.calibrationOverlay}>
              <Text style={styles.calibrationText}>Calibrating...</Text>
              <ActivityIndicator size="large" color="#4ECDC4" />
            </View>
            )}
        </View>
        
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
        
        <SensorDisplay title="Accelerometer (G)" data={accelData} color="#FF6B6B" scale={1} />
        <SensorDisplay title="Gyroscope (rad/s)" data={gyroData} color="#4ECDC4" scale={2} />
        <SensorDisplay title="Magnetometer (μT)" data={magData} color="#45B7D1" scale={0.1} />
      </View>
    </ScrollView>
  );
};

// AuthenticatedStack Component
const AuthenticatedStack = () => {
  const { isAdmin } = useAdmin();
  
  return (
    <Stack.Navigator 
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2C3E50',
        },
        headerTintColor: '#fff',
      }}
    >
<Stack.Screen 
  name="Sensors" 
  component={SensorScreen} 
  options={({ navigation }) => ({
    headerShown: true,
    headerRight: () => isAdmin ? (
      <TouchableOpacity 
        onPress={() => navigation.navigate('Admin')}
        style={{ marginRight: 15 }}
      >
        <Text style={{ color: '#fff' }}>Admin</Text>
      </TouchableOpacity>
    ) : null
  })}
/>
      
      {isAdmin && (
        <Stack.Screen 
          name="Admin" 
          component={AdminScreen}
          options={{ headerShown: true }}
        />
      )}
    </Stack.Navigator>
  );
};

// Main App Component - Simplified Approach
export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if session is valid first
    const checkSessionAndSetupAuth = async () => {
      try {
        // First check if session is valid
        const isSessionValid = await SessionManager.isSessionValid();
        console.log("Session valid:", isSessionValid);
        
        // If session is invalid, ensure we're logged out
        if (!isSessionValid) {
          console.log("No valid session, logging out");
          await AuthManager.logout();
        }
        
        // Set up auth listener with a small delay to ensure everything is settled
        setTimeout(() => {
          const handleAuthChange = (newUser) => {
            console.log("Auth state:", newUser ? "Logged in" : "Logged out");
            setUser(newUser);
            
            // If new login, create session
            if (newUser) {
              SessionManager.startNewSession();
            }
          };
          
          // Subscribe to auth changes
          AuthManager.subscribeToAuthChanges(handleAuthChange);
          
          // Stop loading
          setIsLoading(false);
        }, 500); // Small delay to ensure auth state is settled
      } catch (error) {
        console.error("Setup error:", error);
        setIsLoading(false);
      }
    };
    
    checkSessionAndSetupAuth();
    
    // Cleanup
    return () => {
      AuthManager.unsubscribeFromAuthChanges(setUser);
    };
  }, []);

  // Show loading screen
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2C3E50' }}>
        <Text style={{ color: 'white', fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AdminProvider>
        {!user ? (
          <Stack.Navigator 
            screenOptions={{
              headerStyle: {
                backgroundColor: '#2C3E50',
              },
              headerTintColor: '#fff',
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        ) : (
          <AuthenticatedStack />
        )}
      </AdminProvider>
    </NavigationContainer>
  );
}

// Styles
const styles = StyleSheet.create({
  error: {
    color: '#e74c3c',
    marginBottom: 15,
  },
  success: {
    color: '#2ecc71',
    marginBottom: 15,
  },
  linkText: {
    color: '#4ECDC4',
    textAlign: 'center',
  },
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
  sensorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  visualContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    marginTop: 20,
  },
  axisContainer: {
    marginBottom: 15,
  },
  axisLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bar: {
    height: 20,
    borderRadius: 10,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: 20,
    backgroundColor: '#2C3E50',
    paddingTop: 100,
  },
  input: {
    height: 50,
    borderColor: '#34495e',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#34495e',
    color: 'white',
  },
  authButton: {
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 10,
  },
  dataCount: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
  ggPlotPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'white',
    width: '100%',
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: 'white',
    fontSize: 18,
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
    color: '#95a5a6',
    fontSize: 16,
    marginTop: 20,
  },
  spinner: {
    marginVertical: 20,
  },
  progressContainer: {
    width: '80%',
    height: 20,
    backgroundColor: '#34495e',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4ECDC4',
  },
  // Admin screen styles
  loadingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
  },
  noDataText: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
  },
  usersContainer: {
    width: '100%',
    marginTop: 20,
  },
  userItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    width: '100%',
  },
  userEmail: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  userControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonSpacer: {
    width: 10,
  },
});