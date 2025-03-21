// src/managers/CalibrationManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import CalibrationProcessor from '../processors/CalibrationProcessor';
import CoordinateTransformer from '../processors/CoordinateTransformer';

// Constants
const CALIBRATION_STORAGE_KEY = 'sensor_calibration_matrix';

class CalibrationManager {
  constructor() {
    this.calibrationMatrix = null;
    this.hasLoadedSavedCalibration = false;
    
    console.log('CalibrationManager initialized');
  }
  
  /**
   * Initialize the calibration manager and load any saved calibration
   */
async initialize() {
  try {
    // Clear any existing calibration data to ensure fresh start with new system
    await this.clearCalibration();
    
    console.log('Cleared existing calibration for system upgrade');
    this.hasLoadedSavedCalibration = true;
    return false; // Return false to indicate no valid calibration
  } catch (error) {
    console.error('Error initializing CalibrationManager:', error);
    return false;
  }
}
  
  /**
   * Apply calibration to raw sensor data using the coordinate transformer
   * 
   * @param {Object} data - Raw sensor data
   * @returns {Object} - Calibrated sensor data
   */
  applyCalibration(data) {
    return CalibrationProcessor.applyCalibration(data);
  }
  
  /**
   * Save the current calibration matrix to persistent storage
   * 
   * @param {Object} matrix - The calibration matrix to save
   * @returns {boolean} - Success or failure
   */
  async saveCalibrationMatrix(matrix) {
    try {
      if (!matrix) {
        matrix = CoordinateTransformer.transformMatrix;
      }
      
      this.calibrationMatrix = matrix;
      const jsonMatrix = JSON.stringify(matrix);
      await AsyncStorage.setItem(CALIBRATION_STORAGE_KEY, jsonMatrix);
      console.log('Calibration matrix saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving calibration matrix:', error);
      return false;
    }
  }
  
  /**
   * Load a previously saved calibration matrix from storage
   * 
   * @returns {Object|null} - The loaded calibration matrix or null
   */
  async loadCalibrationMatrix() {
    try {
      const jsonMatrix = await AsyncStorage.getItem(CALIBRATION_STORAGE_KEY);
      if (!jsonMatrix) return null;
      
      const matrix = JSON.parse(jsonMatrix);
      console.log('Loaded saved calibration matrix');
      this.calibrationMatrix = matrix;
      return matrix;
    } catch (error) {
      console.error('Error loading calibration matrix:', error);
      return null;
    }
  }
  
  /**
   * Clear any saved calibration data
   * 
   * @returns {boolean} - Success or failure
   */
  async clearCalibration() {
    try {
      await AsyncStorage.removeItem(CALIBRATION_STORAGE_KEY);
      CoordinateTransformer.reset();
      this.calibrationMatrix = null;
      console.log('Calibration cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing calibration:', error);
      return false;
    }
  }
  
  /**
   * Check if we have a valid calibration matrix
   * 
   * @returns {boolean} - True if calibrated
   */
  isCalibrated() {
    return CoordinateTransformer.calibrated;
  }
  
  /**
   * Get the current calibration matrix
   * 
   * @returns {Object|null} - The current calibration matrix
   */
  getCalibrationMatrix() {
    return this.calibrationMatrix || CoordinateTransformer.transformMatrix;
  }
  
  /**
   * Get a summary of the current calibration state 
   * 
   * @returns {Object} - Summary of calibration state
   */
  getCalibrationSummary() {
    const matrix = this.getCalibrationMatrix();
    const isCalibrated = this.isCalibrated();
    
    return {
      isCalibrated,
      matrix,
      rotationDescription: this.getRotationDescription(matrix)
    };
  }
  
  /**
   * Get a human-readable description of the rotation transformation
   * 
   * @param {Object} matrix - The calibration matrix
   * @returns {string} - Description of the rotation
   */
  getRotationDescription(matrix) {
    if (!matrix) return "No calibration applied";
    
    // For now, just provide a basic description
    return "Device calibrated";
  }
}

export default new CalibrationManager();