// src/managers/CalibrationSystem.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import CoordinateTransformer from '../processors/CoordinateTransformer';

// Storage key for calibration data
const CALIBRATION_STORAGE_KEY = 'sensor_calibration_data';

/**
 * Manages device calibration and stores calibration data
 */
class CalibrationSystem {
  constructor() {
    // Calibration state
    this.isCalibrating = false;
    this.samples = [];
    this.targetSampleCount = 30;
    this.callbacks = {};
    this.calibrationTimeout = null;
    this.lastCalibrationAttempt = null;
    this.lastCalibration = null;
    this.calibrationLoaded = false;
    
    console.log('CalibrationSystem initialized');
  }
  
  /**
   * Initialize the calibration system
   * @returns {Promise<boolean>} Whether calibration was loaded
   */
  async initialize() {
    try {
      const calibrationLoaded = await this.loadCalibration();
      this.calibrationLoaded = calibrationLoaded;
      
      console.log(`Calibration system initialized, loaded: ${calibrationLoaded}`);
      return calibrationLoaded;
    } catch (error) {
      console.error('Error initializing calibration system:', error);
      return false;
    }
  }
  
  /**
   * Start the calibration process
   * @param {Object} callbacks - Callback functions
   * @returns {boolean} Whether calibration was started
   */
  startCalibration(callbacks = {}) {
    if (this.isCalibrating) {
      console.log('Calibration already in progress');
      return false;
    }
    
    console.log('Starting calibration process');
    
    // Store callbacks
    this.callbacks = {
      onStart: callbacks.onStart || null,
      onProgress: callbacks.onProgress || null,
      onComplete: callbacks.onComplete || null,
      onCancel: callbacks.onCancel || null
    };
    
    // Reset samples array
    this.samples = [];
    this.isCalibrating = true;
    this.lastCalibrationAttempt = Date.now();
    
    // Notify start
    if (this.callbacks.onStart) {
      this.callbacks.onStart();
    }
    
    // Set safety timeout
    this.calibrationTimeout = setTimeout(() => {
      if (this.isCalibrating) {
        this.cancelCalibration('Calibration timed out after 10 seconds');
      }
    }, 10000);
    
    return true;
  }
  
  /**
   * Add a sample to calibration
   * @param {Object} data - Sensor data
   * @returns {boolean} Success status
   */
  addCalibrationSample(data) {
    if (!this.isCalibrating) {
      console.log('Not in calibration mode');
      return false;
    }
    
    try {
      // Validate data
      if (!data || typeof data !== 'object' || 
          typeof data.x !== 'number' || 
          typeof data.y !== 'number' || 
          typeof data.z !== 'number') {
        console.error('Invalid sample data:', data);
        return false;
      }
      
      // Add sample with timestamp
      this.samples.push({
        x: data.x,
        y: data.y,
        z: data.z,
        timestamp: data.timestamp || Date.now()
      });
      
      // Calculate progress
      const progress = this.samples.length / this.targetSampleCount;
      
      // Notify progress
      if (this.callbacks.onProgress) {
        this.callbacks.onProgress(progress);
      }
      
      console.log(`Added calibration sample ${this.samples.length} of ${this.targetSampleCount}`);
      
      // Check if we have enough samples
      if (this.samples.length >= this.targetSampleCount) {
        this.completeCalibration();
      }
      
      return true;
    } catch (error) {
      console.error('Error adding calibration sample:', error);
      return false;
    }
  }
  
  /**
   * Complete the calibration process
   * @returns {boolean} Success status
   */
  completeCalibration() {
    if (!this.isCalibrating) {
      console.log('Not in calibration mode');
      return false;
    }
    
    console.log(`Completing calibration with ${this.samples.length} samples`);
    
    try {
      // Clear safety timeout
      if (this.calibrationTimeout) {
        clearTimeout(this.calibrationTimeout);
        this.calibrationTimeout = null;
      }
      
      // Calculate transformation matrix
      const transformMatrix = CoordinateTransformer.calculateTransformMatrix(this.samples);
      
      // Store calibration info
      this.lastCalibration = CoordinateTransformer.getCalibrationInfo();
      
      // Reset state
      this.isCalibrating = false;
      
      // Save calibration to persistent storage
      this.saveCalibration();
      
      // Create result summary
      const result = {
        success: !!transformMatrix,
        samples: this.samples.length,
        matrix: transformMatrix,
        calibrationInfo: this.lastCalibration,
        timestamp: Date.now(),
        orientation: CoordinateTransformer.getOrientationDescription()
      };
      
      // Notify completion
      if (this.callbacks.onComplete) {
        this.callbacks.onComplete(result);
      }
      
      return true;
    } catch (error) {
      console.error('Error completing calibration:', error);
      this.cancelCalibration(`Error: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Cancel ongoing calibration
   * @param {string} reason - Cancellation reason
   * @returns {boolean} Success status
   */
  cancelCalibration(reason = 'Cancelled by user') {
    if (!this.isCalibrating) {
      console.log('Not in calibration mode');
      return false;
    }
    
    console.log(`Cancelling calibration: ${reason}`);
    
    // Clear safety timeout
    if (this.calibrationTimeout) {
      clearTimeout(this.calibrationTimeout);
      this.calibrationTimeout = null;
    }
    
    // Reset state
    this.isCalibrating = false;
    this.samples = [];
    
    // Notify cancellation
    if (this.callbacks.onCancel) {
      this.callbacks.onCancel(reason);
    }
    
    return true;
  }
  
  /**
   * Save calibration data to persistent storage
   * @returns {Promise<boolean>} Success status
   */
  async saveCalibration() {
    try {
      // Get calibration info
      const calibrationInfo = CoordinateTransformer.getCalibrationInfo();
      
      if (!calibrationInfo.calibrated) {
        console.log('No calibration data to save');
        return false;
      }
      
      // Create storage data
      const storageData = {
        matrix: calibrationInfo.matrix,
        vector: calibrationInfo.vector,
        timestamp: Date.now(),
        orientation: CoordinateTransformer.getOrientationDescription()
      };
      
      // Save to storage
      const jsonData = JSON.stringify(storageData);
      await AsyncStorage.setItem(CALIBRATION_STORAGE_KEY, jsonData);
      
      console.log('Calibration saved to storage');
      return true;
    } catch (error) {
      console.error('Error saving calibration:', error);
      return false;
    }
  }
  
  /**
   * Load calibration from persistent storage
   * @returns {Promise<boolean>} Success status
   */
  async loadCalibration() {
    try {
      // Get data from storage
      const jsonData = await AsyncStorage.getItem(CALIBRATION_STORAGE_KEY);
      
      if (!jsonData) {
        console.log('No stored calibration found');
        return false;
      }
      
      // Parse stored data
      const storageData = JSON.parse(jsonData);
      
      if (!storageData.matrix) {
        console.log('Invalid calibration data format');
        return false;
      }
      
      // Apply to transformer
      const success = CoordinateTransformer.setTransformMatrix(storageData.matrix);
      
      if (success) {
        console.log('Loaded calibration from storage');
        this.lastCalibration = CoordinateTransformer.getCalibrationInfo();
        return true;
      } else {
        console.error('Failed to set transformation matrix');
        return false;
      }
    } catch (error) {
      console.error('Error loading calibration:', error);
      return false;
    }
  }
  
  /**
   * Clear saved calibration
   * @returns {Promise<boolean>} Success status
   */
  async clearCalibration() {
    try {
      await AsyncStorage.removeItem(CALIBRATION_STORAGE_KEY);
      CoordinateTransformer.reset();
      this.lastCalibration = null;
      
      console.log('Calibration cleared');
      return true;
    } catch (error) {
      console.error('Error clearing calibration:', error);
      return false;
    }
  }
  
  /**
   * Check if calibration is in progress
   * @returns {boolean} Whether calibration is active
   */
  isCalibrationActive() {
    return this.isCalibrating;
  }
  
  /**
   * Check if device is calibrated
   * @returns {boolean} Whether device is calibrated
   */
  isDeviceCalibrated() {
    return CoordinateTransformer.calibrated;
  }
  
  /**
   * Get calibration information
   * @returns {Object} Calibration information
   */
  getCalibrationInfo() {
    return CoordinateTransformer.getCalibrationInfo();
  }
  
  /**
   * Get orientation description
   * @returns {string} Orientation description
   */
  getOrientationDescription() {
    return CoordinateTransformer.getOrientationDescription();
  }
  
  /**
   * Apply calibration to sensor data
   * @param {Object} data - Raw sensor data
   * @returns {Object} Calibrated data
   */
  applyCalibration(data) {
    return CoordinateTransformer.applyTransformation(data);
  }
}

// Export as singleton
export default new CalibrationSystem();