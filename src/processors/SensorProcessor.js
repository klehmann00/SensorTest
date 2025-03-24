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
  
  // Process accelerometer data
  processAccelerometerData: function(rawData) {
    if (!rawData) return rawData;
    
    try {
      // Ensure timestamp
      const timestampedData = {
        ...rawData,
        timestamp: rawData.timestamp || Date.now()
      };
      
      // Step 1: Always apply transformation if calibrated
      let transformedData;
      if (this.config.useCalibration && CoordinateTransformer.calibrated) {
        transformedData = CoordinateTransformer.applyTransformation(timestampedData);
      } else {
        transformedData = {
          raw: timestampedData,
          transformed: timestampedData
        };
      }
      
      // Step 2: Apply filtering if enabled (for processed mode)
      let filteredData = null;
      if (this.config.useFiltering) {
        filteredData = this.applyFiltering(transformedData);
      }
      
      // Return both transformed and filtered data
      return {
        // Raw data (original)
        raw: rawData,
        
        // Transformed data (with calibration applied)
        transformed: transformedData.transformed,
        
        // Filtered data (with calibration and filtering)
        filtered: filteredData ? filteredData.filtered : null
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
  
  // Apply filtering to transformed data
  applyFiltering: function(transformedData) {
    const transformed = transformedData.transformed;
    if (!transformed) return transformedData;
    
    try {
      // Apply low-pass filtering to transformed values
      const filtered = {
        x: this.lowPassFilter(transformed.x, this.prevFiltered.x, this.config.processing.filter.x),
        y: this.lowPassFilter(transformed.y, this.prevFiltered.y, this.config.processing.filter.y),
        z: this.lowPassFilter(transformed.z, this.prevFiltered.z, this.config.processing.filter.z),
        timestamp: transformed.timestamp
      };
      
      // Update previous values
      this.prevFiltered = { ...filtered };
      
      return {
        ...transformedData,
        filtered: filtered
      };
    } catch (error) {
      console.error('Error in filtering:', error);
      return transformedData;
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