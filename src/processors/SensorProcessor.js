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
  processAccelerometerData(data, applyTransformation = true) { // Added function opening brace
    try {
      console.log("SensorProcessor using calibration:", this.useCalibration, "with data:", data);
      
      // Make sure we have valid data
      if (!data || typeof data !== 'object' || 
          typeof data.x !== 'number' || 
          typeof data.y !== 'number' || 
          typeof data.z !== 'number') {
        console.error('Invalid accelerometer data for processing');
        return data;
      }
      
      let processedData = { ...data };
      
      // Step 1: Apply calibration/transformation if enabled
      if (this.useCalibration && applyTransformation) {
        processedData = CalibrationProcessor.applyCalibration(data);
        console.log("After calibration:", processedData);
      } else {
        // Just add raw properties for consistency
        processedData = {
          ...data,
          raw_x: data.x,
          raw_y: data.y,
          raw_z: data.z
        };
      }
      
      // Step 2: Apply filtering if enabled, but preserve calibrated values
      if (this.useFiltering) {
        const filteredData = DataProcessor.processAccelerometerData(processedData);
        
        // Preserve the calibrated values and marker
        if (processedData.marker === 'transformed-by-coordinate-transformer') {
          filteredData.marker = processedData.marker;
          
          // Use filtered values for display but maintain the calibrated coordinate system
          filteredData.processed_lateral = filteredData.filtered_y || filteredData.y;
          filteredData.processed_longitudinal = filteredData.filtered_x || filteredData.x;
          filteredData.processed_vertical = filteredData.filtered_z || filteredData.z;
          
          // Set back the original transformed values
          filteredData.x = processedData.x;
          filteredData.y = processedData.y;
          filteredData.z = processedData.z;
          filteredData.lateral = processedData.lateral;
          filteredData.longitudinal = processedData.longitudinal;
          filteredData.vertical = processedData.vertical;
        } else {
          // If not calibrated, use filtered values directly
          filteredData.processed_lateral = filteredData.filtered_y || filteredData.y;
          filteredData.processed_longitudinal = filteredData.filtered_x || filteredData.x;
          filteredData.processed_vertical = filteredData.filtered_z || filteredData.z;
        }
        
        processedData = filteredData;
      } else {
        // No filtering, just add processed values
        processedData.processed_lateral = processedData.y;
        processedData.processed_longitudinal = processedData.x;
        processedData.processed_vertical = processedData.z;
      }
      
      // Add a log to see final data
      console.log("Final processed data:", processedData);
      
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