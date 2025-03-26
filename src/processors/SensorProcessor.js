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
      filter: { x: 0.1, y: 0.1, z: 0.2 }
    }
  },
  
  // Previous values for filtering
  prevValues: { x: 0, y: 0, z: 0 },
  prevFiltered: { x: 0, y: 0, z: 0 },
  
  // Initialize with configuration
  initialize: function(config = {}) {
    console.log('SensorProcessor initializing with config:', config);
    // Merge provided configuration with defaults
    if (config.processing) {
      this.config.processing = {
        ...this.config.processing,
        ...config.processing
      };
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
  
  // ************** PROCESS ACCEL (filtering) *************************************
  // Update the processAccelerometerData function in SensorProcessor.js
processAccelerometerData: function(rawData) {
  if (!rawData) return rawData;
  
  try {
    let data = { ...rawData, timestamp: rawData.timestamp || Date.now() };
    let transformResult = { raw: data, transformed: data };
    if (this.config.useCalibration && CoordinateTransformer.calibrated) {
      transformResult = CoordinateTransformer.applyTransformation(data);
    }
    
    // Get the transformed data (either calibrated or uncalibrated)
    const transformedData = transformResult.transformed;
    
    // STEP 2: Apply filtering if enabled
    let filteredData = null;
    if (this.config.useFiltering) {
      // Apply filtering to the transformed data
      filteredData = this.applyFiltering(transformedData);
    }
    
    // Return data with all processing steps
    return {
      // Original raw data (pre-calibration)
      raw: rawData,
      transformed: transformedData,
      filtered: filteredData,
      processed: filteredData || transformedData,
      lateral: filteredData ? filteredData.x : transformedData.x,
      longitudinal: filteredData ? filteredData.y : transformedData.y,
      vertical: filteredData ? filteredData.z : transformedData.z
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
 
  // ACCEL

  // Apply filtering to transformed data
  applyFiltering: function(transformedData) {
    // Remove this line - transformedData is already the transformed data
    // const transformed = transformedData.transformed;
    
    // Replace with this simple check
    if (!transformedData) return null;
    
    try {
      // Apply low-pass filtering directly to transformedData
      const filtered = {
        x: this.lowPassFilter(transformedData.x, this.prevFiltered.x, this.config.processing.filter.x),
        y: this.lowPassFilter(transformedData.y, this.prevFiltered.y, this.config.processing.filter.y),
        z: this.lowPassFilter(transformedData.z, this.prevFiltered.z, this.config.processing.filter.z),
        timestamp: transformedData.timestamp
      };
      
      // Update previous values
      this.prevFiltered = { ...filtered };
      
      // Return just the filtered data, not wrapped in an object
      return filtered;
    } catch (error) {
      console.error('Error in filtering:', error);
      return null;
    }
  },
  
    // Apply RATE LIMITING ACCEL to prevent large jumps in values
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
  
    
  // LOW PASS FILTER ACCEL implementation
  lowPassFilter: function(newValue, oldValue, alpha) {
    if (isNaN(newValue) || isNaN(oldValue)) return newValue;
    return alpha * newValue + (1 - alpha) * oldValue;
  },
  
  
  // PROCESS GYRO (filtering, limiting)

  processGyroscopeData: function(rawData) {
  if (!rawData) return rawData;
  
  try {
    let data = { ...rawData, timestamp: rawData.timestamp || Date.now() };
    
    let transformResult = { raw: data, transformed: data };
    if (this.config.useCalibration && CoordinateTransformer.calibrated) {
      transformResult.transformed = data;
    }
    
    const transformedData = transformResult.transformed;
    
    // STEP 2: Apply RATE LIMITING GYRO  to prevent large jumps

    const limited = {
      x: this.limitRateOfChange(transformedData.x, this.prevValues.x, this.config.processing.maxDelta.x),
      y: this.limitRateOfChange(transformedData.y, this.prevValues.y, this.config.processing.maxDelta.y),
      z: this.limitRateOfChange(transformedData.z, this.prevValues.z, this.config.processing.maxDelta.z),
      timestamp: transformedData.timestamp
    };
    
    // Update previous values for next iteration
    this.prevValues = { 
      x: limited.x,
      y: limited.y,
      z: limited.z
    };
    
    // STEP 3: Apply FILTERING GYRO  if enabled
    let filteredData = null;
    if (this.config.useFiltering) {
      // Apply filtering to the rate-limited data
      filteredData = {
        x: this.lowPassFilter(limited.x, this.prevFiltered.x, this.config.processing.filter.x),
        y: this.lowPassFilter(limited.y, this.prevFiltered.y, this.config.processing.filter.y),
        z: this.lowPassFilter(limited.z, this.prevFiltered.z, this.config.processing.filter.z),
        timestamp: limited.timestamp
      };
      
      // Update previous filtered values for next iteration
      this.prevFiltered = { ...filteredData };
    }
    
    // Return data with all processing steps
    return {
      raw: data,
      transformed: transformedData,
      limited: limited,
      filtered: filteredData,
      processed: filteredData || limited || transformedData,
      rotationX: filteredData ? filteredData.x : limited.x, // Roll rate
      rotationY: filteredData ? filteredData.y : limited.y, // Pitch rate
      rotationZ: filteredData ? filteredData.z : limited.z  // Yaw rate
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
    this.prevValues = { x: 0, y: 0, z: 0 };
    this.prevFiltered = { x: 0, y: 0, z: 0 };
    console.log('SensorProcessor reset');
    return this;
  }
};

export default SensorProcessor;