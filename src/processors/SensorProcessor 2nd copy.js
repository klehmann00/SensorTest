// src/processors/SensorProcessor.js
import CoordinateTransformer from './CoordinateTransformer';

// Simple implementation that follows a clear pipeline
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
  
  // Process accelerometer data - follows the exact algorithm we discussed
  processAccelerometerData: function(rawData) {
    if (!rawData) return rawData;
    console.log('Filtering enabled:', this.config.useFiltering);

    try {
      // Copy the rawData to avoid modifying the original
      let data = { ...rawData, timestamp: rawData.timestamp || Date.now() };
      
      // STEP 1: If calibrated, apply transformation
      if (this.config.useCalibration && CoordinateTransformer.calibrated) {
        const transformResult = CoordinateTransformer.applyTransformation(data);
        data = transformResult.transformed; // Use the transformed data for next step
      }
      
      // STEP 2: If in processed mode, apply filtering
      let filteredData = null;
      if (this.config.useFiltering) {
        // Apply filtering directly to the data (which may be transformed or not)
        filteredData = this.applyFiltering(data);
      }
      
      // Return data with all processing steps
      return {
        // Original raw data
        raw: rawData,
        
        // After transformation (if applied, otherwise same as raw)
        transformed: data,
        
        // After filtering (if applied, otherwise null)
        filtered: filteredData,

          // Add these properties directly at the root level
        lateral: filteredData ? filteredData.x : data.x,
        longitudinal: filteredData ? filteredData.y : data.y,
        vertical: filteredData ? filteredData.z : data.z
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
  
  // Apply filtering directly to data (transformed or not)
  applyFiltering: function(data) {
    if (!data) return null;
    
    try {
      // Apply low-pass filtering
      const filtered = {
        x: this.lowPassFilter(data.x, this.prevFiltered.x, this.config.processing.filter.x),
        y: this.lowPassFilter(data.y, this.prevFiltered.y, this.config.processing.filter.y),
        z: this.lowPassFilter(data.z, this.prevFiltered.z, this.config.processing.filter.z),
        timestamp: data.timestamp
      };
      
      // Update previous values
      this.prevFiltered = { ...filtered };
      
      console.log('Filtering result:', filtered);

      return filtered;
    } catch (error) {
      console.error('Error in filtering:', error);
      return null;
    }
  },
  
  // Low-pass filter implementation
  lowPassFilter: function(newValue, oldValue, alpha) {
    if (isNaN(newValue) || isNaN(oldValue)) return newValue;
    return alpha * newValue + (1 - alpha) * oldValue;
  },
  
  // Process gyroscope data
  processGyroscopeData: function(rawData) {
    // Simplified implementation
    return {
      raw: rawData,
      processed: rawData,
      rotationX: rawData.x,
      rotationY: rawData.y,
      rotationZ: rawData.z
    };
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