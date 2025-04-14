// src/processors/SensorProcessor.js
import CoordinateTransformer from './CoordinateTransformer';
import FilterConfig from '../config/FilterConfig';

// Simple implementation that avoids class instantiation issues
const SensorProcessor = {
  // Configuration
  config: {
    useFiltering: true,
    useCalibration: true,
    debugMode: false,
    processing: {
      maxDelta: { 
        x: FilterConfig.accelerometer.processed.maxDelta.x,
        y: FilterConfig.accelerometer.processed.maxDelta.y,
        z: FilterConfig.accelerometer.processed.maxDelta.z,
        gyroX: FilterConfig.gyroscope.processed.maxDelta.x,
        gyroY: FilterConfig.gyroscope.processed.maxDelta.y,
        gyroZ: FilterConfig.gyroscope.processed.maxDelta.z
      },
      filter: { 
        x: FilterConfig.accelerometer.processed.filter.x,
        y: FilterConfig.accelerometer.processed.filter.y,
        z: FilterConfig.accelerometer.processed.filter.z,
        gyroX: FilterConfig.gyroscope.processed.filter.x,
        gyroY: FilterConfig.gyroscope.processed.filter.y,
        gyroZ: FilterConfig.gyroscope.processed.filter.z
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
      // Step 1: Add timestamp if missing
      let data = { ...rawData, timestamp: rawData.timestamp || Date.now() };
      let transformResult = { raw: data, transformed: data };
      
      console.log(`[FLOW] SensorProcessor applying calibration: ${this.config.useCalibration && CoordinateTransformer.calibrated}`);

      // Step 2: Apply calibration if enabled and available
      if (this.config.useCalibration && CoordinateTransformer.calibrated) {
        transformResult = CoordinateTransformer.applyTransformation(data);
      }
      
      // Step 3: Get the transformed data
      const transformedData = transformResult.transformed;
      
      // Step 4: Apply rate limiting
      const limited = {
        x: this.limitRateOfChange(transformedData.x, this.accelPrevValues.x, this.config.processing.maxDelta.x),
        y: this.limitRateOfChange(transformedData.y, this.accelPrevValues.y, this.config.processing.maxDelta.y),
        z: this.limitRateOfChange(transformedData.z, this.accelPrevValues.z, this.config.processing.maxDelta.z),
        timestamp: transformedData.timestamp
      };
      
      // Update previous values
      this.accelPrevValues = { ...limited };
      
      // Step 5: Apply filtering if enabled
      let filtered = null;
      if (this.config.useFiltering) {
        filtered = {
          x: this.lowPassFilter(limited.x, this.accelPrevFiltered.x, this.config.processing.filter.x),
          y: this.lowPassFilter(limited.y, this.accelPrevFiltered.y, this.config.processing.filter.y),
          z: this.lowPassFilter(limited.z, this.accelPrevFiltered.z, this.config.processing.filter.z),
          timestamp: limited.timestamp
        };
        
        // Update filtered values
        this.accelPrevFiltered = { ...filtered };
      }
      
      // Step 6: Define processed data (with final values)
      const processed = filtered || limited || transformedData;
      
      // Step 7: Return result with domain-specific mapping
      // CRITICAL - Consistent mapping for vehicle coordinates:
      // - X sensor axis -> Lateral vehicle axis (side-to-side)
      // - Y sensor axis -> Longitudinal vehicle axis (forward/backward)
      // - Z sensor axis -> Vertical vehicle axis (up/down)
      return {
        raw: transformResult.raw,
        transformed: transformedData,
        limited: limited,
        filtered: filtered,
        processed: processed,
        // Domain-specific names for acceleration - FIXED MAPPING
        lateral: processed.x,          // X-axis is lateral (side-to-side)
        longitudinal: processed.y,     // Y-axis is longitudinal (forward/backward)
        vertical: processed.z,         // Z-axis is vertical (up/down)
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
  // In SensorProcessor.js, modify the processGyroscopeData function:
// In SensorProcessor.js, full fix for processGyroscopeData function
processGyroscopeData: function(rawData) {
  if (!rawData) return rawData;
  
  try {
    // Step 1: Add timestamp if missing
    let data = { ...rawData, timestamp: rawData.timestamp || Date.now() };
    let transformResult = { raw: data, transformed: data };
    
    // Step 2: Apply calibration if enabled and available
    console.log(`[FLOW] SensorProcessor applying calibration: ${this.config.useCalibration && CoordinateTransformer.calibrated}`);
    if (this.config.useCalibration && CoordinateTransformer.calibrated) {
      transformResult = CoordinateTransformer.applyTransformation(data);
    }
    
    // Step 3: Get the transformed data
    const transformedData = transformResult.transformed;
    
    // Step 4: Apply rate limiting to TRANSFORMED data (not raw data)
    const limited = {
      x: this.limitRateOfChange(transformedData.x, this.gyroPrevValues.x, this.config.processing.maxDelta.gyroX),
      y: this.limitRateOfChange(transformedData.y, this.gyroPrevValues.y, this.config.processing.maxDelta.gyroY),
      z: this.limitRateOfChange(transformedData.z, this.gyroPrevValues.z, this.config.processing.maxDelta.gyroZ),
      timestamp: transformedData.timestamp
    };
    
    // Update previous values
    this.gyroPrevValues = { ...limited };
    
    // Step 5: Apply filtering if enabled
    let filtered = null;
    if (this.config.useFiltering) {
      console.log(`Gyro filter values: X=${this.config.processing.filter.gyroX}, Y=${this.config.processing.filter.gyroY}, Z=${this.config.processing.filter.gyroZ}`);

      filtered = {
        x: this.lowPassFilter(limited.x, this.gyroPrevFiltered.x, this.config.processing.filter.gyroX),
        y: this.lowPassFilter(limited.y, this.gyroPrevFiltered.y, this.config.processing.filter.gyroY),
        z: this.lowPassFilter(limited.z, this.gyroPrevFiltered.z, this.config.processing.filter.gyroZ),
        timestamp: limited.timestamp
      };
      console.log(`Gyro filtering: Input=${JSON.stringify(limited)}, Output=${JSON.stringify(filtered)}`);

      // Update filtered values
      this.gyroPrevFiltered = { ...filtered };
    }
    
    // Step 6: Define processed data (with final values)
    const processed = filtered || limited || transformedData;
    
    // Step 7: Return result with domain-specific mapping
    // Make sure filtered values are included in the returned object
    return {
      raw: transformResult.raw,
      transformed: transformedData,
      limited: limited,
      filtered: filtered,  // This is key - make sure filtered values are returned
      processed: processed,
      // Domain-specific names for gyroscope - FIXED MAPPING
      roll: processed.x,    // X-axis rotation (roll) - around lateral axis
      pitch: processed.y,   // Y-axis rotation (pitch) - around longitudinal axis
      yaw: processed.z,     // Z-axis rotation (yaw) - around vertical axis
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
  
  // Apply rate limiting to prevent large jumps in values
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
    const previous = this.config.useCalibration;
    this.config.useCalibration = !!enabled;
    console.log(`[FLOW] SensorProcessor calibration: ${previous} → ${this.config.useCalibration}`);
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