// src/processors/SensorProcessor.js
import CoordinateTransformer from './CoordinateTransformer';

// Simple implementation that avoids class instantiation issues
const SensorProcessor = {
  // Configuration
  config: {
    useFiltering: true,
    useCalibration: true,
    debugMode: false,
    processing: {
      maxDelta: { x: 0.025, y: 0.025, z: 0.05 },
      filter: { x: 0.05, y: 0.05, z: 0.05 }, // Reduced alpha values for accelerometer
      // Gyroscope-specific settings
      gyro: {
        maxDelta: { x: 0.2, y: 0.2, z: 0.2 },
        filter: { x: 0.1, y: 0.1, z: 0.1 }
      }
    }
  },
  
  // Separate state variables for each sensor type
  accelPrevValues: { x: 0, y: 0, z: 0 },
  accelPrevFiltered: { x: 0, y: 0, z: 0 },
  gyroPrevValues: { x: 0, y: 0, z: 0 },
  gyroPrevFiltered: { x: 0, y: 0, z: 0 },
  
  // Initialize with configuration
  initialize: function(config = {}) {
    console.log('SensorProcessor initializing with config:', config);
    
    // Merge provided configuration with defaults
    if (config.processing) {
      this.config.processing = {
        ...this.config.processing,
        ...config.processing
      };
      
      // Handle nested gyro settings if provided
      if (config.processing.gyro) {
        this.config.processing.gyro = {
          ...this.config.processing.gyro,
          ...config.processing.gyro
        };
      }
    }
    
    if (typeof config.useFiltering === 'boolean') {
      this.config.useFiltering = config.useFiltering;
    }
    
    if (typeof config.useCalibration === 'boolean') {
      this.config.useCalibration = config.useCalibration;
    }
    
    if (typeof config.debugMode === 'boolean') {
      this.config.debugMode = config.debugMode;
    }
    
    // Reset any previous state
    this.reset();
    
    console.log('SensorProcessor initialized successfully');
    return true;
  },
  
  // Process accelerometer data
  processAccelerometerData: function(rawData) {
    if (!rawData) return rawData;
    
    try {
      // Add timestamp if missing
      let data = { ...rawData, timestamp: rawData.timestamp || Date.now() };
      let transformResult = { raw: data, transformed: data };
      
      // Apply calibration if enabled and available
      if (this.config.useCalibration && CoordinateTransformer.calibrated) {
        transformResult = CoordinateTransformer.applyTransformation(data);
      }
      
      // Get the transformed data (either calibrated or uncalibrated)
      const transformedData = transformResult.transformed;
      
      // Apply rate limiting to prevent large jumps
      const limited = {
        x: this.limitRateOfChange(transformedData.x, this.accelPrevValues.x, this.config.processing.maxDelta.x),
        y: this.limitRateOfChange(transformedData.y, this.accelPrevValues.y, this.config.processing.maxDelta.y),
        z: this.limitRateOfChange(transformedData.z, this.accelPrevValues.z, this.config.processing.maxDelta.z),
        timestamp: transformedData.timestamp
      };
      
      // Update accelerometer-specific previous values
      this.accelPrevValues = { ...limited };
      
      // Apply filtering if enabled
      let filteredData = null;
      if (this.config.useFiltering) {
        filteredData = {
          x: this.lowPassFilter(limited.x, this.accelPrevFiltered.x, this.config.processing.filter.x),
          y: this.lowPassFilter(limited.y, this.accelPrevFiltered.y, this.config.processing.filter.y),
          z: this.lowPassFilter(limited.z, this.accelPrevFiltered.z, this.config.processing.filter.z),
          timestamp: limited.timestamp
        };
        
        // Update accelerometer-specific filtered values
        this.accelPrevFiltered = { ...filteredData };
      }
      
      // Return data with consistent structure
      return {
        raw: transformResult.raw,
        transformed: transformedData,
        limited: limited,
        filtered: filteredData,
        processed: filteredData || limited || transformedData,
        // Domain-specific names for acceleration
        lateral: filteredData ? filteredData.y : (limited ? limited.y : transformedData.y),
        longitudinal: filteredData ? filteredData.x : (limited ? limited.x : transformedData.x),
        vertical: filteredData ? filteredData.z : (limited ? limited.z : transformedData.z),
        // For debugging
        timestamp: data.timestamp
      };
    } catch (error) {
      console.error('Error processing accelerometer data:', error);
      return {
        raw: rawData,
        error: true,
        errorMessage: error.message
      };
    }
  },
  
  // Process gyroscope data
  processGyroscopeData: function(rawData) {
    if (!rawData) return rawData;
    
    try {
      // Add timestamp if missing
      let data = { ...rawData, timestamp: rawData.timestamp || Date.now() };
      
      // For consistency, we create a transformed object even if not applying calibration
      // This ensures consistent structure with accelerometer data
      let transformedData = { ...data };
      
      // Get gyro-specific settings or fall back to defaults
      const gyroMaxDelta = this.config.processing.gyro?.maxDelta || {
        x: 0.2, y: 0.2, z: 0.2
      };
      
      const gyroFilter = this.config.processing.gyro?.filter || {
        x: 0.1, y: 0.1, z: 0.1
      };
      
      // Apply rate limiting to prevent large jumps
      const limited = {
        x: this.limitRateOfChange(transformedData.x, this.gyroPrevValues.x, gyroMaxDelta.x),
        y: this.limitRateOfChange(transformedData.y, this.gyroPrevValues.y, gyroMaxDelta.y),
        z: this.limitRateOfChange(transformedData.z, this.gyroPrevValues.z, gyroMaxDelta.z),
        timestamp: transformedData.timestamp
      };
      
      // Update gyroscope-specific previous values
      this.gyroPrevValues = { ...limited };
      
      // Apply filtering if enabled
      let filteredData = null;
      if (this.config.useFiltering) {
        filteredData = {
          x: this.lowPassFilter(limited.x, this.gyroPrevFiltered.x, gyroFilter.x),
          y: this.lowPassFilter(limited.y, this.gyroPrevFiltered.y, gyroFilter.y),
          z: this.lowPassFilter(limited.z, this.gyroPrevFiltered.z, gyroFilter.z),
          timestamp: limited.timestamp
        };
        
        // Update gyroscope-specific filtered values
        this.gyroPrevFiltered = { ...filteredData };
      }
      
      // Return data with consistent structure matching accelerometer
      return {
        raw: data,
        transformed: transformedData,
        limited: limited,
        filtered: filteredData,
        processed: filteredData || limited || transformedData,
        // Domain-specific names for rotation rates
        roll: filteredData ? filteredData.x : (limited ? limited.x : transformedData.x),
        pitch: filteredData ? filteredData.y : (limited ? limited.y : transformedData.y),
        yaw: filteredData ? filteredData.z : (limited ? limited.z : transformedData.z),
        // For debugging
        timestamp: data.timestamp
      };
    } catch (error) {
      console.error('Error processing gyroscope data:', error);
      return {
        raw: rawData,
        error: true,
        errorMessage: error.message
      };
    }
  },
  
  // Apply RATE LIMITING to prevent large jumps in values
  limitRateOfChange: function(newValue, oldValue, maxDelta) {
    const delta = newValue - oldValue;
    
    if (delta > maxDelta) {
      return oldValue + maxDelta;
    } else if (delta < -maxDelta) {
      return oldValue - maxDelta;
    } else {
      return newValue;
    }
  },
  
  // LOW PASS FILTER implementation
  lowPassFilter: function(newValue, oldValue, alpha) {
    if (isNaN(newValue) || isNaN(oldValue)) return newValue;
    return ((newValue - oldValue) * alpha) + oldValue;
  },
  
  // Toggle filtering
  setFiltering: function(enabled) {
    this.config.useFiltering = !!enabled;
    console.log(`Filtering ${this.config.useFiltering ? 'enabled' : 'disabled'}`);
    return this.config.useFiltering;
  },
  
  // Toggle calibration
  setCalibration: function(enabled) {
    this.config.useCalibration = !!enabled;
    console.log(`Calibration ${this.config.useCalibration ? 'enabled' : 'disabled'}`);
    return this.config.useCalibration;
  },
  
  // Update configuration
  updateConfig: function(config = {}) {
    // Update processing configuration
    if (config.processing) {
      this.config.processing = {
        ...this.config.processing,
        ...config.processing
      };
      
      // Update gyro-specific settings if provided
      if (config.processing.gyro) {
        this.config.processing.gyro = {
          ...this.config.processing.gyro,
          ...config.processing.gyro
        };
      }
    }
    
    // Update flags
    if (typeof config.useFiltering === 'boolean') {
      this.config.useFiltering = config.useFiltering;
    }
    
    if (typeof config.useCalibration === 'boolean') {
      this.config.useCalibration = config.useCalibration;
    }
    
    if (typeof config.debugMode === 'boolean') {
      this.config.debugMode = config.debugMode;
    }
    
    console.log('SensorProcessor configuration updated');
    return { ...this.config };
  },
  
  // Reset processor state
  reset: function() {
    // Reset both accelerometer and gyroscope state variables
    this.accelPrevValues = { x: 0, y: 0, z: 0 };
    this.accelPrevFiltered = { x: 0, y: 0, z: 0 };
    this.gyroPrevValues = { x: 0, y: 0, z: 0 };
    this.gyroPrevFiltered = { x: 0, y: 0, z: 0 };
    console.log('SensorProcessor reset');
    return this;
  }
};

export default SensorProcessor;