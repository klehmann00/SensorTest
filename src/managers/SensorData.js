// SensorData.js - Handles sensor data acquisition with improved error handling
import { Accelerometer, Gyroscope, Magnetometer } from 'expo-sensors';

class SensorDataManager {
  constructor() {
    // Sensor subscriptions
    this.accelSubscription = null;
    this.gyroSubscription = null;
    this.magSubscription = null;
    
    // Update intervals in milliseconds
    this.ACCELEROMETER_UPDATE_INTERVAL = 100; // 10 Hz
    this.GYROSCOPE_UPDATE_INTERVAL = 100;     // 10 Hz
    this.MAGNETOMETER_UPDATE_INTERVAL = 100;  // 10 Hz
    
    // Callback references
    this.onAccelerometerUpdate = null;
    this.onGyroscopeUpdate = null;
    this.onMagnetometerUpdate = null;
    
    // Debug mode
    this.debugMode = true;
    
    console.log('SensorDataManager initialized');
  }
  
  debug(message) {
    if (this.debugMode) {
      console.log(`[SensorData] ${message}`);
    }
  }
  
  // Start listening to all sensors with improved error handling
  startSensors(callbacks) {
    console.log('Starting sensors with callbacks:', callbacks ? 'Provided' : 'Missing');
    
    if (!callbacks) {
      console.error('Cannot start sensors: No callbacks provided');
      return false;
    }
    
    // Store callbacks
    this.onAccelerometerUpdate = callbacks.onAccelerometerUpdate;
    this.onGyroscopeUpdate = callbacks.onGyroscopeUpdate;
    this.onMagnetometerUpdate = callbacks.onMagnetometerUpdate;
    
    try {
      // Set update intervals
      Accelerometer.setUpdateInterval(this.ACCELEROMETER_UPDATE_INTERVAL);
      Gyroscope.setUpdateInterval(this.GYROSCOPE_UPDATE_INTERVAL);
      Magnetometer.setUpdateInterval(this.MAGNETOMETER_UPDATE_INTERVAL);
      
      // Start accelerometer if callback provided
      if (this.onAccelerometerUpdate) {
        console.log('Starting accelerometer listener');
        this.accelSubscription = Accelerometer.addListener(data => {
          try {
            // Verify data structure before passing to callback
            if (data && typeof data === 'object' && 'x' in data && 'y' in data && 'z' in data) {
              this.onAccelerometerUpdate(data);
            } else {
              console.warn('Invalid accelerometer data format:', data);
            }
          } catch (error) {
            console.error('Error in accelerometer data handler:', error);
          }
        });
        console.log('Accelerometer started');
      }
      
      // Start gyroscope if callback provided
      if (this.onGyroscopeUpdate) {
        console.log('Starting gyroscope listener');
        this.gyroSubscription = Gyroscope.addListener(data => {
          try {            
            if (data && typeof data === 'object' && 'x' in data && 'y' in data && 'z' in data) {
              this.onGyroscopeUpdate(data);
            } else {
              console.warn('Invalid gyroscope data format:', data);
            }
          } catch (error) {
            console.error('Error in gyroscope data handler:', error);
          }
        });
        console.log('Gyroscope started');
      }
      
      // Start magnetometer if callback provided
      if (this.onMagnetometerUpdate) {
        console.log('Starting magnetometer listener');
        this.magSubscription = Magnetometer.addListener(data => {
          try {
            if (data && typeof data === 'object' && 'x' in data && 'y' in data && 'z' in data) {
              this.onMagnetometerUpdate(data);
            } else {
              console.warn('Invalid magnetometer data format:', data);
            }
          } catch (error) {
            console.error('Error in magnetometer data handler:', error);
          }
        });
        console.log('Magnetometer started');
      }
      
      return true;
    } catch (error) {
      console.error('Error starting sensors:', error);
      this.stopSensors(); // Clean up any partial subscriptions
      return false;
    }
  }
  
  // Stop all sensors with improved error handling
  stopSensors() {
    console.log('Stopping all sensors');
    
    try {
      if (this.accelSubscription) {
        this.accelSubscription.remove();
        this.accelSubscription = null;
        console.log('Accelerometer stopped');
      }
    } catch (error) {
      console.error('Error stopping accelerometer:', error);
    }
    
    try {
      if (this.gyroSubscription) {
        this.gyroSubscription.remove();
        this.gyroSubscription = null;
        console.log('Gyroscope stopped');
      }
    } catch (error) {
      console.error('Error stopping gyroscope:', error);
    }
    
    try {
      if (this.magSubscription) {
        this.magSubscription.remove();
        this.magSubscription = null;
        console.log('Magnetometer stopped');
      }
    } catch (error) {
      console.error('Error stopping magnetometer:', error);
    }
  }
  
  // Change update rates
  setUpdateRates(accelRate, gyroRate, magRate) {
    try {
      if (accelRate) {
        this.ACCELEROMETER_UPDATE_INTERVAL = accelRate;
        Accelerometer.setUpdateInterval(accelRate);
        console.log(`Accelerometer rate set to ${accelRate}ms`);
      }
      
      if (gyroRate) {
        this.GYROSCOPE_UPDATE_INTERVAL = gyroRate;
        Gyroscope.setUpdateInterval(gyroRate);
        console.log(`Gyroscope rate set to ${gyroRate}ms`);
      }
      
      if (magRate) {
        this.MAGNETOMETER_UPDATE_INTERVAL = magRate;
        Magnetometer.setUpdateInterval(magRate);
        console.log(`Magnetometer rate set to ${magRate}ms`);
      }
      
      return true;
    } catch (error) {
      console.error('Error setting update rates:', error);
      return false;
    }
  }
  
  // Check if sensors are available
  async checkSensorsAvailability() {
    const results = {
      accelerometer: false,
      gyroscope: false,
      magnetometer: false
    };
    
    try {
      results.accelerometer = await Accelerometer.isAvailableAsync();
      console.log(`Accelerometer available: ${results.accelerometer}`);
    } catch (error) {
      console.error('Error checking accelerometer availability:', error);
    }
    
    try {
      results.gyroscope = await Gyroscope.isAvailableAsync();
      console.log(`Gyroscope available: ${results.gyroscope}`);
    } catch (error) {
      console.error('Error checking gyroscope availability:', error);
    }
    
    try {
      results.magnetometer = await Magnetometer.isAvailableAsync();
      console.log(`Magnetometer available: ${results.magnetometer}`);
    } catch (error) {
      console.error('Error checking magnetometer availability:', error);
    }
    
    return results;
  }
}

// Export as singleton instance
export default new SensorDataManager();