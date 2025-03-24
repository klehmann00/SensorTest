// src/processors/CoordinateTransformer.js

/**
 * Handles coordinate transformations to account for device orientation
 * Standardized coordinate system:
 * - X-axis: Lateral (side-to-side movement)
 * - Y-axis: Longitudinal (forward-backward movement)
 * - Z-axis: Vertical (up-down movement)
 */
class CoordinateTransformer {
  constructor() {
    // Default identity transformation matrix
    this.transformMatrix = [
      [1, 0, 0], // X-axis (maps to lateral)
      [0, 1, 0], // Y-axis (maps to longitudinal)
      [0, 0, 1]  // Z-axis (maps to vertical)
    ];
    
    // Calibration offset vector (used for simple offset calibration)
    this.calibrationVector = null;
    
    // Reference gravity vector (default is device lying flat)
    this.referenceGravity = { x: 0, y: 0, z: 1 };
    
    // Flag to track if calibration has been performed
    this.calibrated = false;
    
    // Store calibration information for diagnostics
    this.calibrationInfo = null;
    
    console.log('CoordinateTransformer initialized with identity matrix');
  }
  
  /**
   * Apply coordinate transformation to sensor data
   * @param {Object} data - Raw sensor data {x, y, z}
   * @returns {Object} Transformed data
   */
  applyTransformation(data) {
    if (!this.validateData(data)) {
      return { raw: data || {}, transformed: data || {} };
    }
    
    try {
      // Store raw values with consistent naming
      const result = {
        raw: {
          x: data.x, // lateral
          y: data.y, // longitudinal
          z: data.z, // vertical
          timestamp: data.timestamp
        }
      };
      
      if (!this.calibrated) {
        // No calibration, just standardize property names
        result.transformed = { ...result.raw };
        return result;
      }
      
      // Extract raw values
      const rawX = data.x;
      const rawY = data.y;
      const rawZ = data.z;
      
      let transformedX, transformedY, transformedZ;
      
      if (this.transformMatrix) {
        // Apply full orthogonal transformation using matrix
        const rawVec = [rawX, rawY, rawZ];
        
        // Matrix-vector multiplication
        transformedX = 
          this.transformMatrix[0][0] * rawVec[0] + 
          this.transformMatrix[0][1] * rawVec[1] + 
          this.transformMatrix[0][2] * rawVec[2];
          
        transformedY = 
          this.transformMatrix[1][0] * rawVec[0] + 
          this.transformMatrix[1][1] * rawVec[1] + 
          this.transformMatrix[1][2] * rawVec[2];
          
        transformedZ = 
          this.transformMatrix[2][0] * rawVec[0] + 
          this.transformMatrix[2][1] * rawVec[1] + 
          this.transformMatrix[2][2] * rawVec[2];
      } else if (this.calibrationVector) {
        // Simple offset subtraction as fallback
        transformedX = rawX - this.calibrationVector.x;
        transformedY = rawY - this.calibrationVector.y;
        transformedZ = rawZ - this.calibrationVector.z;
        
        // After offset, z should be close to 1.0 (gravity)
        transformedZ = transformedZ + 1.0;
      } else {
        // No transformation data available, use raw values
        transformedX = rawX;
        transformedY = rawY;
        transformedZ = rawZ;
      }
      
      // Store transformed values with consistent naming
      result.transformed = {
        x: transformedX, // lateral
        y: transformedY, // longitudinal
        z: transformedZ, // vertical
        timestamp: data.timestamp
      };
      
      return result;
    } catch (error) {
      console.error('Error applying transformation:', error);
      return { 
        raw: { x: data.x, y: data.y, z: data.z, timestamp: data.timestamp },
        transformed: { x: data.x, y: data.y, z: data.z, timestamp: data.timestamp },
        error: true
      };
    }
  }
  
  /**
   * Sets the transformation matrix directly
   * @param {Array} matrix - 3x3 transformation matrix
   * @returns {boolean} Success status
   */
  setTransformMatrix(matrix) {
    if (!matrix || !Array.isArray(matrix) || matrix.length !== 3) {
      console.error('Invalid transformation matrix');
      return false;
    }
    
    // Validate matrix structure
    const isValid = matrix.every(row => 
      Array.isArray(row) && row.length === 3 && 
      row.every(val => typeof val === 'number')
    );
    
    if (!isValid) {
      console.error('Transformation matrix has invalid structure');
      return false;
    }
    
    this.transformMatrix = [...matrix];
    this.calibrated = true;
    console.log('Transformation matrix set:', this.transformMatrix);
    return true;
  }
  
  /**
   * Calculate transformation matrix from calibration samples
   * @param {Array} samples - Array of accelerometer readings during calibration
   * @returns {Array} Transformation matrix
   */
  calculateTransformMatrix(samples) {
    console.log("Starting matrix calculation with", samples.length, "samples");
    
    if (!this.validateSamples(samples)) {
      console.error('Invalid calibration samples');
      return null;
    }
    
    try {
      // Calculate average acceleration vector during calibration
      const avgVector = this.calculateAverageVector(samples);
      console.log("Average calibration vector:", avgVector);
      
      // Calculate magnitude
      const magnitude = this.calculateMagnitude(avgVector);
      console.log("Calibration vector magnitude:", magnitude);
      
      if (magnitude < 0.5) {
        console.error('Calibration vector magnitude too low');
        return null;
      }
      
      // Save the calibration vector for offset subtraction
      this.calibrationVector = { ...avgVector };
      
      // Normalize gravity vector
      const normalizedGravity = {
        x: avgVector.x / magnitude,
        y: avgVector.y / magnitude,
        z: avgVector.z / magnitude
      };
      
      // The new Z axis should point opposite to gravity
      const newZ = [-normalizedGravity.x, -normalizedGravity.y, -normalizedGravity.z];
      
      // Find a vector perpendicular to Z axis (for X axis)
      // We'll use a simple approach: if Z is not parallel to [0,1,0], use that, otherwise use [1,0,0]
      let tempVector = [0, 1, 0];
      if (Math.abs(newZ[1]) > 0.9) {
        tempVector = [1, 0, 0];
      }
      
      // Find new X axis using cross product
      const newX = this.crossProduct(tempVector, newZ);
      // Normalize X axis
      const newXnorm = this.normalizeVector(newX);
      
      // Find Y axis using cross product of Z and X (ensures orthogonality)
      const newY = this.crossProduct(newZ, newXnorm);
      // Normalize Y axis
      const newYnorm = this.normalizeVector(newY);
      
      // Construct transformation matrix
      // Each row is one of our new basis vectors
      this.transformMatrix = [
        newXnorm, // X-axis (maps to lateral)
        newYnorm, // Y-axis (maps to longitudinal)
        newZ      // Z-axis (maps to vertical)
      ];
      
      // Store calibration info for diagnostics
      this.calibrationInfo = {
        averageVector: avgVector,
        magnitude: magnitude,
        normalizedGravity: normalizedGravity,
        basis: {
          x: newXnorm,
          y: newYnorm,
          z: newZ
        },
        timestamp: Date.now(),
        sampleCount: samples.length
      };
      
      this.calibrated = true;
      console.log("Final transformation matrix:", this.transformMatrix);
      return this.transformMatrix;
    } catch (error) {
      console.error('Error calculating transformation matrix:', error);
      return null;
    }
  }
  
  /**
   * Validate calibration samples
   * @param {Array} samples - Calibration samples
   * @returns {boolean} Whether samples are valid
   */
  validateSamples(samples) {
    return samples && 
           Array.isArray(samples) && 
           samples.length > 0 &&
           samples.every(s => this.validateData(s));
  }
  
  /**
   * Validate sensor data structure
   * @param {Object} data - Sensor data
   * @returns {boolean} Whether data is valid
   */
  validateData(data) {
    return data && 
           typeof data === 'object' && 
           'x' in data && 
           'y' in data && 
           'z' in data &&
           !isNaN(data.x) && 
           !isNaN(data.y) && 
           !isNaN(data.z);
  }
  
  /**
   * Calculate average vector from samples
   * @param {Array} samples - Sensor data samples
   * @returns {Object} Average vector
   */
  calculateAverageVector(samples) {
    const sum = samples.reduce((acc, sample) => ({
      x: acc.x + sample.x,
      y: acc.y + sample.y,
      z: acc.z + sample.z
    }), { x: 0, y: 0, z: 0 });
    
    return {
      x: sum.x / samples.length,
      y: sum.y / samples.length,
      z: sum.z / samples.length
    };
  }
  
  /**
   * Calculate magnitude of a vector
   * @param {Object} vector - Vector object with x, y, z components
   * @returns {number} Vector magnitude
   */
  calculateMagnitude(vector) {
    return Math.sqrt(
      vector.x * vector.x + 
      vector.y * vector.y + 
      vector.z * vector.z
    );
  }
  
  /**
   * Normalize a vector
   * @param {Array} vec - Vector as array [x, y, z]
   * @returns {Array} Normalized vector
   */
  normalizeVector(vec) {
    const magnitude = Math.sqrt(
      vec[0] * vec[0] + 
      vec[1] * vec[1] + 
      vec[2] * vec[2]
    );
    
    if (magnitude === 0) {
      return [0, 0, 0];
    }
    
    return [
      vec[0] / magnitude,
      vec[1] / magnitude,
      vec[2] / magnitude
    ];
  }
  
  /**
   * Compute cross product of two vectors
   * @param {Array} a - First vector
   * @param {Array} b - Second vector
   * @returns {Array} Cross product vector
   */
  crossProduct(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }
  
  /**
   * Reset to identity transformation
   */
  reset() {
    this.transformMatrix = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];
    this.calibrationVector = null;
    this.calibrated = false;
    this.calibrationInfo = null;
    console.log('CoordinateTransformer reset to identity matrix');
    return true;
  }
  
  /**
   * Get calibration information
   * @returns {Object} Calibration information
   */
  getCalibrationInfo() {
    if (!this.calibrated) {
      return {
        calibrated: false,
        message: 'Device not calibrated'
      };
    }
    
    return {
      calibrated: true,
      matrix: this.transformMatrix,
      vector: this.calibrationVector,
      info: this.calibrationInfo,
      timestamp: this.calibrationInfo?.timestamp || Date.now()
    };
  }
  
  /**
   * Get a description of the device orientation
   * @returns {string} Orientation description
   */
  getOrientationDescription() {
    if (!this.calibrated) {
      return 'Device not calibrated';
    }
    
    // This is a simple approximation - for a full orientation description,
    // we would need to analyze the rotation matrix more thoroughly
    const zAxis = this.transformMatrix[2];
    
    // Find which way gravity is pointing
    if (Math.abs(zAxis[2]) > 0.8) {
      return 'Device is flat (z-up)';
    } else if (Math.abs(zAxis[0]) > 0.8) {
      return zAxis[0] > 0 ? 'Device on right side' : 'Device on left side';
    } else if (Math.abs(zAxis[1]) > 0.8) {
      return zAxis[1] > 0 ? 'Device pointing forward' : 'Device pointing backward';
    } else {
      return 'Device in intermediate orientation';
    }
  }
}

// Export a singleton instance
export default new CoordinateTransformer();