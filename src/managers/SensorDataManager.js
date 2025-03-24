// src/managers/SensorDataManager.js
import { Accelerometer, Gyroscope, Magnetometer } from 'expo-sensors';

/**
 * Manages sensor data acquisition with power management and error handling
 */
class SensorDataManager {
  constructor() {
    // Sensor subscriptions
    this.accelSubscription = null;
    this.gyroSubscription = null;
    this.magSubscription = null;
    
    // Default configuration
    this.config = {
      updateInterval: {
        accelerometer: 100, // 10 Hz
        gyroscope: 100,     // 10 Hz
        magnetometer: 100   // 10 Hz
      },
      batchSize: 1,
      lowPowerMode: false
    };
    
    // Callback references
    this.onAccelerometerUpdate = null;
    this.onGyroscopeUpdate = null;
    this.onMagnetometerUpdate = null;
    
    // Statistics tracking
    this.stats = {
      accelerometer: {
        readings: 0,
        errors: 0,
        lastReading: null
      },
      gyroscope: {
        readings: 0,
        errors: 0,
        lastReading: null
      },
      magnetometer: {
        readings: 0,
        errors: 0,
        lastReading: null
      }
    };
    
    console.log('SensorDataManager initialized');
  }
  
  /**
   * Initialize with configuration
   * @param {Object} config - Configuration options
   */
  initialize(config = {}) {
    // Apply configuration
    if (config.updateInterval) {
      this.config.updateInterval = {
        ...this.config.updateInterval,
        ...config.updateInterval
      };
    }
    
    if (typeof config.batchSize === 'number') {
      this.config.batchSize = config.batchSize;
    }
    
    if (typeof config.lowPowerMode === 'boolean') {
      this.config.lowPowerMode = config.lowPowerMode;
    }
    
    console.log('SensorDataManager configured:', this.config);
    return this;
  }
  
  /**
   * Update configuration (e.g., when power mode changes)
   * @param {Object} config - New configuration options
   */
  updateConfiguration(config = {}) {
    // Apply new configuration
    if (config.updateInterval) {
      this.config.updateInterval = {
        ...this.config.updateInterval,
        ...config.updateInterval
      };
    }
    
    if (typeof config.batchSize === 'number') {
      this.config.batchSize = config.batchSize;
    }
    
    if (typeof config.lowPowerMode === 'boolean') {
      this.config.lowPowerMode = config.lowPowerMode;
    }
    
    // Apply new update intervals to active sensors
    this.applyUpdateIntervals();
    
    console.log('SensorDataManager reconfigured:', this.config);
    return this;
  }
  
  /**
   * Apply current update intervals to active sensors
   */
  applyUpdateIntervals() {
    try {
      const multiplier = this.config.lowPowerMode ? 2 : 1;
      
      if (this.accelSubscription) {
        const interval = this.config.updateInterval.accelerometer * multiplier;
        Accelerometer.setUpdateInterval(interval);
        console.log(`Accelerometer interval updated to ${interval}ms`);
      }
      
      if (this.gyroSubscription) {
        const interval = this.config.updateInterval.gyroscope * multiplier;
        Gyroscope.setUpdateInterval(interval);
        console.log(`Gyroscope interval updated to ${interval}ms`);
      }
      
      if (this.magSubscription) {
        const interval = this.config.updateInterval.magnetometer * multiplier;
        Magnetometer.setUpdateInterval(interval);
        console.log(`Magnetometer interval updated to ${interval}ms`);
      }
    } catch (error) {
      console.error('Error applying update intervals:', error);
    }
  }
  
  /**
   * Start listening to all sensors
   * @param {Object} callbacks - Data update callbacks
   * @returns {boolean} Success status
   */
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
      // Calculate intervals based on power mode
      const multiplier = this.config.lowPowerMode ? 2 : 1;
      
      // Set update intervals
      const accelInterval = this.config.updateInterval.accelerometer * multiplier;
      const gyroInterval = this.config.updateInterval.gyroscope * multiplier;
      const magInterval = this.config.updateInterval.magnetometer * multiplier;
      
      Accelerometer.setUpdateInterval(accelInterval);
      Gyroscope.setUpdateInterval(gyroInterval);
      Magnetometer.setUpdateInterval(magInterval);
      
      // Start accelerometer if callback provided
      if (this.onAccelerometerUpdate) {
        console.log(`Starting accelerometer listener at ${accelInterval}ms interval`);
        this.accelSubscription = Accelerometer.addListener(data => {
          try {
            // Verify data structure before passing to callback
            if (this.validateData(data)) {
              // Add timestamp to data
              const timestampedData = {
                ...data,
                timestamp: Date.now()
              };
              
              // Update statistics
              this.stats.accelerometer.readings++;
              this.stats.accelerometer.lastReading = timestampedData.timestamp;
              
              // Pass to callback
              this.onAccelerometerUpdate(timestampedData);
            } else {
              this.stats.accelerometer.errors++;
              console.warn('Invalid accelerometer data format:', data);
            }
          } catch (error) {
            this.stats.accelerometer.errors++;
            console.error('Error in accelerometer data handler:', error);
          }
        });
        console.log('Accelerometer started');
      }
      
      // Start gyroscope if callback provided
      if (this.onGyroscopeUpdate) {
        console.log(`Starting gyroscope listener at ${gyroInterval}ms interval`);
        this.gyroSubscription = Gyroscope.addListener(data => {
          try {            
            if (this.validateData(data)) {
              // Add timestamp to data
              const timestampedData = {
                ...data,
                timestamp: Date.now()
              };
              
              // Update statistics
              this.stats.gyroscope.readings++;
              this.stats.gyroscope.lastReading = timestampedData.timestamp;
              
              // Pass to callback
              this.onGyroscopeUpdate(timestampedData);
            } else {
              this.stats.gyroscope.errors++;
              console.warn('Invalid gyroscope data format:', data);
            }
          } catch (error) {
            this.stats.gyroscope.errors++;
            console.error('Error in gyroscope data handler:', error);
          }
        });
        console.log('Gyroscope started');
      }
      
      // Start magnetometer if callback provided
      if (this.onMagnetometerUpdate) {
        console.log(`Starting magnetometer listener at ${magInterval}ms interval`);
        this.magSubscription = Magnetometer.addListener(data => {
          try {
            if (this.validateData(data)) {
              // Add timestamp to data
              const timestampedData = {
                ...data,
                timestamp: Date.now()
              };
              
              // Update statistics
              this.stats.magnetometer.readings++;
              this.stats.magnetometer.lastReading = timestampedData.timestamp;
              
              // Pass to callback
              this.onMagnetometerUpdate(timestampedData);
            } else {
              this.stats.magnetometer.errors++;
              console.warn('Invalid magnetometer data format:', data);
            }
          } catch (error) {
            this.stats.magnetometer.errors++;
            console.error('Error in magnetometer data handler:', error);
          }
        });
        console.log('Magnetometer started');
      }
      
      return true;
    } catch (error) {
      console.error('Error starting sensors:', error);
      // Clean up any partial subscriptions
      this.stopSensors();
      return false;
    }
  }
  
  /**
   * Stop all sensors
   * @returns {boolean} Success status
   */
  stopSensors() {
    console.log('Stopping all sensors');
    
    try {
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
      
      return true;
    } catch (error) {
      console.error('Error stopping sensors:', error);
      return false;
    }
  }
  
  /**
   * Validate sensor data structure
   * @param {Object} data - Sensor data
   * @returns {boolean} Whether data is valid
   */
  validateData(data) {
    return data && 
           typeof data === 'object' && 
           'x' in data && 
           'y' in data && 
           'z' in data &&
           !isNaN(data.x) && 
           !isNaN(data.y) && 
           !isNaN(data.z);
  }
  
  /**
   * Set low power mode
   * @param {boolean} enabled - Whether low power mode is enabled
   */
  setLowPowerMode(enabled) {
    if (this.config.lowPowerMode !== enabled) {
      console.log(`Setting low power mode: ${enabled}`);
      this.config.lowPowerMode = enabled;
      this.applyUpdateIntervals();
    }
  }
  
  /**
   * Check if sensors are available
   * @returns {Promise<Object>} Availability of each sensor
   */
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
  
  /**
   * Get sensor statistics
   * @returns {Object} Sensor statistics
   */
  getStatistics() {
    return {...this.stats};
  }
}

// Export as singleton instance
export default new SensorDataManager();