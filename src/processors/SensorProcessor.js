// src/processors/SensorProcessor.js
import DataProcessor from '../managers/DataProcessing';
import CalibrationProcessor from './CalibrationProcessor';

class SensorProcessor {
  constructor() {
    this.initialized = false;
    this.useFiltering = true;
    this.useCalibration = true;
    
    console.log('SensorProcessor initialized');
  }
  
  initialize() {
    if (this.initialized) return true;
    
    try {
      this.initialized = true;
      console.log('SensorProcessor fully initialized');
      return true;
    } catch (error) {
      console.error('Error initializing SensorProcessor:', error);
      return false;
    }
  }
  
  /**
   * Process accelerometer data through the calibration and filtering pipeline
   * 
   * @param {Object} data - Raw accelerometer data
   * @param {boolean} applyTransformation - Whether to apply coordinate transformation
   * @returns {Object} - Processed accelerometer data
   */
  processAccelerometerData(data, applyTransformation = true) {
    try {
      // Make sure we have valid data
      if (!data || typeof data !== 'object' || 
          typeof data.x !== 'number' || 
          typeof data.y !== 'number' || 
          typeof data.z !== 'number') {
        console.error('Invalid accelerometer data for processing');
        return data;
      }
      
      // Start with raw data
      let processedData = { 
        ...data,
        // Store raw values
        raw_x: data.x,
        raw_y: data.y,
        raw_z: data.z
      };
      
      // Step 1: Apply calibration/transformation if enabled
      if (this.useCalibration && applyTransformation) {
      }
      
      // Step 2: Apply filtering if enabled
      if (this.useFiltering) {
        const filteredData = DataProcessor.processAccelerometerData(processedData);
        
        // IMPORTANT: Maintain consistent mapping between axes and directions
        // X maps to lateral, Y maps to longitudinal, Z maps to vertical
       // Swap X and Y to fix the coordinate mapping
        filteredData.processed_lateral = filteredData.filtered_y || filteredData.y;
        filteredData.processed_longitudinal = filteredData.filtered_x || filteredData.x;
        filteredData.processed_vertical = filteredData.filtered_z || filteredData.z;
        
        processedData = filteredData;
      } else {
        // No filtering, just add processed values from the calibrated data
        processedData.processed_lateral = processedData.x;
        processedData.processed_longitudinal = processedData.y;
        processedData.processed_vertical = processedData.z;
      }
      
      return processedData;
    } catch (error) {
      console.error('Error processing accelerometer data:', error);
      
      // Return original data with raw_ properties as a fallback
      return {
        ...data,
        raw_x: data.x,
        raw_y: data.y,
        raw_z: data.z
      };
    }
  }
  
  /**
   * Process gyroscope data
   * 
   * @param {Object} data - Raw gyroscope data
   * @returns {Object} - Processed gyroscope data
   */
  processGyroscopeData(data) {
    try {
      if (!data) return data;
      
      let processedData = { ...data };
      
      // Apply filtering if enabled
      if (this.useFiltering) {
        processedData = DataProcessor.processGyroscopeData(data);
      } else {
        // Just add raw properties for consistency
        processedData = {
          ...data,
          raw_x: data.x,
          raw_y: data.y,
          raw_z: data.z
        };
      }
      
      return processedData;
    } catch (error) {
      console.error('Error processing gyroscope data:', error);
      return {
        ...data,
        raw_x: data.x,
        raw_y: data.y,
        raw_z: data.z
      };
    }
  }
  
  /**
   * Process magnetometer data
   * 
   * @param {Object} data - Raw magnetometer data
   * @returns {Object} - Processed magnetometer data
   */
  processMagnetometerData(data) {
    try {
      if (!data) return data;
      
      let processedData = { ...data };
      
      // Apply filtering if enabled
      if (this.useFiltering) {
        processedData = DataProcessor.processMagnetometerData(data);
      } else {
        // Just add raw properties for consistency
        processedData = {
          ...data,
          raw_x: data.x,
          raw_y: data.y,
          raw_z: data.z
        };
      }
      
      return processedData;
    } catch (error) {
      console.error('Error processing magnetometer data:', error);
      return {
        ...data,
        raw_x: data.x,
        raw_y: data.y,
        raw_z: data.z
      };
    }
  }
  
  /**
   * Toggle filtering on or off
   * 
   * @param {boolean} enabled - Whether filtering should be enabled
   */
  setFiltering(enabled) {
    this.useFiltering = !!enabled;
    console.log(`Filtering ${this.useFiltering ? 'enabled' : 'disabled'}`);
    return this.useFiltering;
  }
  
  /**
   * Toggle calibration/transformation on or off
   * 
   * @param {boolean} enabled - Whether calibration should be applied
   */
  setCalibration(enabled) {
    this.useCalibration = !!enabled;
    console.log(`Calibration ${this.useCalibration ? 'enabled' : 'disabled'}`);
    return this.useCalibration;
  }
  
  /**
   * Reset processor state
   */
  reset() {
    DataProcessor.reset();
    console.log('SensorProcessor reset');
  }
}

// Export a singleton instance
export default new SensorProcessor();