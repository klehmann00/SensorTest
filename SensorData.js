// SensorData.js - Handles sensor data acquisition
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
    
    console.log('SensorDataManager initialized');
  }
  
  // Start listening to all sensors
  startSensors(callbacks) {
    console.log('Starting sensors');
    
    // Store callbacks
    this.onAccelerometerUpdate = callbacks.onAccelerometerUpdate;
    this.onGyroscopeUpdate = callbacks.onGyroscopeUpdate;
    this.onMagnetometerUpdate = callbacks.onMagnetometerUpdate;
    
    // Set update intervals
    Accelerometer.setUpdateInterval(this.ACCELEROMETER_UPDATE_INTERVAL);
    Gyroscope.setUpdateInterval(this.GYROSCOPE_UPDATE_INTERVAL);
    Magnetometer.setUpdateInterval(this.MAGNETOMETER_UPDATE_INTERVAL);
    
    // Start accelerometer if callback provided
    if (this.onAccelerometerUpdate) {
      this.accelSubscription = Accelerometer.addListener(data => {
        this.onAccelerometerUpdate(data);
      });
      console.log('Accelerometer started');
    }
    
    // Start gyroscope if callback provided
    if (this.onGyroscopeUpdate) {
      this.gyroSubscription = Gyroscope.addListener(data => {
        this.onGyroscopeUpdate(data);
      });
      console.log('Gyroscope started');
    }
    
    // Start magnetometer if callback provided
    if (this.onMagnetometerUpdate) {
      this.magSubscription = Magnetometer.addListener(data => {
        this.onMagnetometerUpdate(data);
      });
      console.log('Magnetometer started');
    }
  }
  
  // Stop all sensors
  stopSensors() {
    console.log('Stopping all sensors');
    
    if (this.accelSubscription) {
      this.accelSubscription.remove();
      this.accelSubscription = null;
      console.log('Accelerometer stopped');
    }
    
    if (this.gyroSubscription) {
      this.gyroSubscription.remove();
      this.gyroSubscription = null;
      console.log('Gyroscope stopped');
    }
    
    if (this.magSubscription) {
      this.magSubscription.remove();
      this.magSubscription = null;
      console.log('Magnetometer stopped');
    }
  }
  
  // Change update rates
  setUpdateRates(accelRate, gyroRate, magRate) {
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
  }
}

// Export as singleton instance
export default new SensorDataManager();