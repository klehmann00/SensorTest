// src/processors/DataProcessor.js

/**
 * Handles data filtering and smoothing
 * This class applies filters to already-transformed data
 */
class DataProcessor {
  constructor() {
    this.reset();
    
    // Default processing parameters
    this.params = {
      // Rate limiting settings (max change per reading)
      maxDelta: {
        x: 0.025,  // Lateral axis (G)
        y: 0.025,  // Longitudinal axis (G)
        z: 0.05,   // Vertical axis (G)
      },
      
      // Low-pass filter constants (lower = more filtering)
      filter: {
        x: 0.1,    // Lateral axis
        y: 0.1,    // Longitudinal axis
        z: 0.2,    // Vertical axis
      }
    };
    
    console.log('DataProcessor initialized with default parameters');
  }
  
  /**
   * Reset processor state
   */
  reset() {
    // Previous values for rate limiting
    this.prevValues = { x: 0, y: 0, z: 0 };
    
    // Previous filtered values for smoothing
    this.prevFiltered = { x: 0, y: 0, z: 0 };
    
    // First reading flag
    this.isFirstReading = true;
    
    // Store the last processing timestamp
    this.lastProcessingTime = 0;
    
    console.log('DataProcessor reset');
    return this;
  }
  
  /**
   * Configure processing parameters
   * @param {Object} params - Processing parameters
   * @returns {DataProcessor} this instance for chaining
   */
  configure(params = {}) {
    // Update maxDelta settings
    if (params.maxDelta) {
      this.params.maxDelta = {
        ...this.params.maxDelta,
        ...params.maxDelta
      };
    }
    
    // Update filter settings
    if (params.filter) {
      this.params.filter = {
        ...this.params.filter,
        ...params.filter
      };
    }
    
    console.log('DataProcessor configured with parameters:', this.params);
    return this;
  }
  
  /**
   * Process accelerometer data with filtering and rate limiting
   * @param {Object} data - Transformed accelerometer data
   * @returns {Object} Processed data
   */
  processAccelerometerData(data) {
    // Check for valid data structure
    if (!data || !data.transformed) {
      console.warn('Invalid data structure for processing');
      return data;
    }
    
    try {
      const transformed = data.transformed;
      const now = data.transformed.timestamp || Date.now();
      
      // For first reading, just store values and return without processing
      if (this.isFirstReading) {
        this.isFirstReading = false;
        this.prevValues = { 
          x: transformed.x,
          y: transformed.y,
          z: transformed.z
        };
        this.prevFiltered = { 
          x: transformed.x,
          y: transformed.y,
          z: transformed.z
        };
        this.lastProcessingTime = now;
        
        // Return data with processed values equal to transformed
        return {
          ...data,
          limited: { ...transformed },
          filtered: { ...transformed },
          processed: { ...transformed }
        };
      }
      
      // Apply rate limiting to prevent large jumps in values
      const limited = {
        x: this.limitRateOfChange(transformed.x, this.prevValues.x, this.params.maxDelta.x),
        y: this.limitRateOfChange(transformed.y, this.prevValues.y, this.params.maxDelta.y),
        z: this.limitRateOfChange(transformed.z, this.prevValues.z, this.params.maxDelta.z),
        timestamp: now
      };
      
      // Update previous values for next iteration
      this.prevValues = { 
        x: limited.x,
        y: limited.y,
        z: limited.z
      };
      
      // Apply low-pass filter to smoothed values
      const filtered = {
        x: this.applyLowPassFilter(limited.x, this.prevFiltered.x, this.params.filter.x),
        y: this.applyLowPassFilter(limited.y, this.prevFiltered.y, this.params.filter.y),
        z: this.applyLowPassFilter(limited.z, this.prevFiltered.z, this.params.filter.z),
        timestamp: now
      };
      
      // Update previous filtered values for next iteration
      this.prevFiltered = { 
        x: filtered.x,
        y: filtered.y,
        z: filtered.z
      };
      
      // Update processing timestamp
      this.lastProcessingTime = now;
      
      // Return data with all processing stages
      return {
        ...data,
        limited,
        filtered,
        processed: {
          x: filtered.x,  // lateral
          y: filtered.y,  // longitudinal
          z: filtered.z,  // vertical
          timestamp: now
        }
      };
    } catch (error) {
      console.error('Error processing accelerometer data:', error);
      
      // Return original data if processing fails
      return {
        ...data,
        error: true,
        errorMessage: error.message
      };
    }
  }
  
  /**
   * Process gyroscope data
   * @param {Object} data - Transformed gyroscope data
   * @returns {Object} Processed data
   */
  processGyroscopeData(data) {
    // Similar structure to processAccelerometerData but with appropriate
    // parameters for gyroscope data
    if (!data || !data.transformed) {
      return data;
    }
    
    try {
      const transformed = data.transformed;
      const now = data.transformed.timestamp || Date.now();
      
      // For first reading, initialize and return
      if (this.isFirstReading) {
        this.isFirstReading = false;
        this.prevValues = { ...transformed };
        this.prevFiltered = { ...transformed };
        this.lastProcessingTime = now;
        
        return {
          ...data,
          limited: { ...transformed },
          filtered: { ...transformed },
          processed: { ...transformed }
        };
      }
      
      // Apply rate limiting (using gyro-specific parameters if needed)
      const limited = {
        x: this.limitRateOfChange(transformed.x, this.prevValues.x, this.params.maxDelta.x),
        y: this.limitRateOfChange(transformed.y, this.prevValues.y, this.params.maxDelta.y),
        z: this.limitRateOfChange(transformed.z, this.prevValues.z, this.params.maxDelta.z),
        timestamp: now
      };
      
      this.prevValues = { ...limited };
      
      // Apply filtering
      const filtered = {
        x: this.applyLowPassFilter(limited.x, this.prevFiltered.x, this.params.filter.x),
        y: this.applyLowPassFilter(limited.y, this.prevFiltered.y, this.params.filter.y),
        z: this.applyLowPassFilter(limited.z, this.prevFiltered.z, this.params.filter.z),
        timestamp: now
      };
      
      this.prevFiltered = { ...filtered };
      this.lastProcessingTime = now;
      
      return {
        ...data,
        limited,
        filtered,
        processed: { ...filtered }
      };
    } catch (error) {
      console.error('Error processing gyroscope data:', error);
      return {
        ...data,
        error: true,
        errorMessage: error.message
      };
    }
  }
  
  /**
   * Apply rate limiting to prevent large jumps in values
   * @param {number} newValue - New value
   * @param {number} oldValue - Previous value
   * @param {number} maxDelta - Maximum allowed change
   * @returns {number} Rate-limited value
   */
  limitRateOfChange(newValue, oldValue, maxDelta) {
    const delta = newValue - oldValue;
    
    if (delta > maxDelta) {
      return oldValue + maxDelta;
    } else if (delta < -maxDelta) {
      return oldValue - maxDelta;
    } else {
      return newValue;
    }
  }
  
  /**
   * Apply low-pass filter for smoothing
   * @param {number} newValue - New value
   * @param {number} oldValue - Previous filtered value
   * @param {number} alpha - Filter coefficient (0-1, higher = less filtering)
   * @returns {number} Filtered value
   */
  applyLowPassFilter(newValue, oldValue, alpha) {
    return alpha * newValue + (1 - alpha) * oldValue;
  }
  
  /**
   * Get current processing parameters
   * @returns {Object} Processing parameters
   */
  getParameters() {
    return { ...this.params };
  }
}

// Export as a singleton instance
export default new DataProcessor();