// src/processors/CoordinateTransformer.js
class CoordinateTransformer {
  constructor() {
    // Default identity transformation matrix
    this.transformMatrix = {
      xx: 1, xy: 0, xz: 0,
      yx: 0, yy: 1, yz: 0,
      zx: 0, zy: 0, zz: 1
    };
    
    // Initialize the calibration vector - will be set during calibration
    this.calibrationVector = null;
    
    // Reference vectors
    this.referenceG = { x: 0, y: 0, z: 1 }; // Default gravity vector (phone lying flat)
    this.calibrated = false;
    
    console.log('CoordinateTransformer initialized with identity matrix');
  }
  
  /**
   * Sets the transformation matrix directly
   * 
   * @param {Object} matrix - The 3x3 transformation matrix
   */
  setTransformMatrix(matrix) {
    if (!matrix || typeof matrix !== 'object') {
      console.error('Invalid transformation matrix');
      return false;
    }
    
    // Validate matrix structure
    const requiredProps = ['xx', 'xy', 'xz', 'yx', 'yy', 'yz', 'zx', 'zy', 'zz'];
    const hasAllProps = requiredProps.every(prop => typeof matrix[prop] === 'number');
    
    if (!hasAllProps) {
      console.error('Transformation matrix missing required properties');
      return false;
    }
    
    this.transformMatrix = { ...matrix };
    this.calibrated = true;
    console.log('Transformation matrix set:', this.transformMatrix);
    return true;
  }

  /**
   * Calculate a transformation matrix from calibration samples
   * 
   * @param {Array} samples - Array of accelerometer readings during calibration
   * @returns {Object} The calculated transformation matrix
   */
  calculateTransformMatrix(samples) {
    console.log("Starting matrix calculation with", samples.length, "samples");
    
    if (!samples || !Array.isArray(samples) || samples.length === 0) {
      console.error('Invalid calibration samples');
      return null;
    }
    
    try {
      // Calculate average acceleration vector during calibration
      const avgVector = {
        x: samples.reduce((sum, s) => sum + s.x, 0) / samples.length,
        y: samples.reduce((sum, s) => sum + s.y, 0) / samples.length,
        z: samples.reduce((sum, s) => sum + s.z, 0) / samples.length
      };
      
      console.log("Average vector:", avgVector);
      
      // Calculate magnitude
      const magnitude = Math.sqrt(
        avgVector.x * avgVector.x + 
        avgVector.y * avgVector.y + 
        avgVector.z * avgVector.z
      );
      
      console.log("Vector magnitude:", magnitude);
      
      if (magnitude < 0.5) {
        console.error('Calibration vector magnitude too low');
        return null;
      }
      
      // Save the raw calibration vector (not normalized)
      // This is what we'll use for direct subtraction
      this.calibrationVector = {
        x: avgVector.x,
        y: avgVector.y,
        z: avgVector.z
      };
      
      console.log("Calibration vector saved:", this.calibrationVector);
      
      // We'll still return a matrix for compatibility with the rest of the code
      return {
        xx: 1, xy: 0, xz: 0,
        yx: 0, yy: 1, yz: 0,
        zx: 0, zy: 0, zz: 1
      };
    } catch (error) {
      console.error('Error calculating transformation matrix:', error);
      return null;
    }
  }
  
  /**
   * Apply the transformation to a sensor reading
   * 
   * @param {Object} data - The raw sensor data {x, y, z}
   * @returns {Object} Transformed sensor data
   */
  applyTransformation(data) {
    console.log("Applying transformation to:", data);
    
    if (!data || typeof data !== 'object' || 
        typeof data.x !== 'number' || 
        typeof data.y !== 'number' || 
        typeof data.z !== 'number') {
      console.error('Invalid sensor data for transformation');
      return data; // Return original data on error
    }
    
    try {
      // Store the original values
      const rawX = data.x;
      const rawY = data.y;
      const rawZ = data.z;
      
      // Only do subtraction if we're calibrated and have a calibration vector
      let transformedX, transformedY, transformedZ;
      
      if (this.calibrated && this.calibrationVector) {
        // Simply subtract the calibration vector
        transformedX = rawX - this.calibrationVector.x;
        transformedY = rawY - this.calibrationVector.y;
        transformedZ = rawZ;  // We usually don't adjust Z
        
        console.log("Using calibration vector:", this.calibrationVector);
      } else {
        // No calibration, just pass through
        transformedX = rawX;
        transformedY = rawY;
        transformedZ = rawZ;
      }
      
      // Return both raw and transformed values with a marker
      const result = {
        raw_x: rawX,
        raw_y: rawY,
        raw_z: rawZ,
        
        // Transformed values
        x: transformedX,
        y: transformedY,
        z: transformedZ,
        
        // For compatibility with existing code
        longitudinal: transformedX,
        lateral: transformedY,
        vertical: transformedZ,
        
        // Marker to track transformation
        marker: 'transformed-by-coordinate-transformer'
      };
      
      console.log("Transformation result:", result);
      return result;
    } catch (error) {
      console.error('Error applying transformation:', error);
      
      // Return original data with raw_ properties as a fallback
      return {
        raw_x: data.x,
        raw_y: data.y,
        raw_z: data.z,
        x: data.x,
        y: data.y,
        z: data.z
      };
    }
  }
  
  /**
   * Reset to identity transformation
   */
  reset() {
    this.transformMatrix = {
      xx: 1, xy: 0, xz: 0,
      yx: 0, yy: 1, yz: 0,
      zx: 0, zy: 0, zz: 1
    };
    this.calibrationVector = null;
    this.calibrated = false;
    console.log('CoordinateTransformer reset to identity matrix');
  }
}

// Export a singleton instance
export default new CoordinateTransformer();