// src/utils/GravityCompensation.js

/**
 * Handles gravity vector compensation for accelerometer readings
 */
class GravityCompensation {
    constructor() {
      // Default gravity vector (device lying flat)
      this.gravityVector = { x: 0, y: 0, z: 1 };
      this.magnitude = 1.0; // Expected to be close to 1G
    }
    
    /**
     * Set the gravity vector based on calibration readings
     * 
     * @param {Array} samples - Array of accelerometer readings during calibration
     */
    calibrateGravityVector(samples) {
      if (!samples || samples.length === 0) return false;
      
      // Calculate average values
      const avgX = samples.reduce((sum, s) => sum + s.x, 0) / samples.length;
      const avgY = samples.reduce((sum, s) => sum + s.y, 0) / samples.length;
      const avgZ = samples.reduce((sum, s) => sum + s.z, 0) / samples.length;
      
      // Calculate magnitude of the gravity vector
      const magnitude = Math.sqrt(avgX * avgX + avgY * avgY + avgZ * avgZ);
      
      // Save the calibration values
      this.gravityVector = {
        x: avgX / magnitude, // Normalize to unit vector
        y: avgY / magnitude,
        z: avgZ / magnitude
      };
      
      this.magnitude = magnitude;
      
      console.log("Calibrated gravity vector:", this.gravityVector);
      console.log("Calibrated magnitude:", this.magnitude);
      
      return {
        vector: this.gravityVector,
        magnitude: this.magnitude,
        offsets: { x: avgX, y: avgY, z: avgZ }
      };
    }
    
    /**
     * Compensate for gravity in accelerometer readings
     * 
     * @param {Object} data - Raw accelerometer data {x, y, z}
     * @returns {Object} - Gravity-compensated accelerometer data
     */
    compensateForGravity(data) {
      if (!data) return null;
      
      // Calculate dot product of the data with the gravity vector
      const dotProduct = 
        data.x * this.gravityVector.x +
        data.y * this.gravityVector.y +
        data.z * this.gravityVector.z;
      
      // Subtract the gravity component in the direction of the gravity vector
      return {
        x: data.x - (dotProduct * this.gravityVector.x),
        y: data.y - (dotProduct * this.gravityVector.y),
        z: data.z - (dotProduct * this.gravityVector.z)
      };
    }
    
    /**
     * Simple calibration that subtracts the offset values
     * 
     * @param {Object} data - Raw accelerometer data {x, y, z}
     * @param {Object} offsets - Calibration offsets {x, y, z}
     * @returns {Object} - Calibrated accelerometer data
     */
    applyCalibrationOffsets(data, offsets) {
      if (!data || !offsets) return data;
      
      return {
        x: data.x - offsets.x,
        y: data.y - offsets.y,
        z: data.z - (offsets.z - this.magnitude) // Adjust Z to account for gravity
      };
    }
  }
  
  export default new GravityCompensation();