// src/processors/CoordinateTransformer.js
class CoordinateTransformer {
  constructor() {
    // Default identity transformation matrix
    this.transformMatrix = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];
    
    // Calibration offsets (used for simple offset calibration)
    this.calibrationVector = null;
    
    // Reference gravity vector (device lying flat)
    this.referenceGravity = { x: 0, y: 0, z: 1 };
    
    // Flag to track if calibration has been performed
    this.calibrated = false;
    
    console.log('CoordinateTransformer initialized with identity matrix');
  }
  
  /**
   * Sets the transformation matrix directly
   * 
   * @param {Array} matrix - 3x3 transformation matrix
   */
 // In CoordinateTransformer.js, simplify setTransformMatrix

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
   * Calculate a transformation matrix from calibration samples
   * 
   * @param {Array} samples - Array of accelerometer readings during calibration
   * @returns {Array} The calculated transformation matrix
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
      
      console.log("Average calibration vector:", avgVector);
      
      // Calculate magnitude
      const magnitude = Math.sqrt(
        avgVector.x * avgVector.x + 
        avgVector.y * avgVector.y + 
        avgVector.z * avgVector.z
      );
      
      console.log("Calibration vector magnitude:", magnitude);
      
      if (magnitude < 0.5) {
        console.error('Calibration vector magnitude too low');
        return null;
      }
      
      // Save the calibration vector for offset subtraction
      this.calibrationVector = { ...avgVector };
      
      // Normalization step - critical for creating a proper transformation matrix
      const normalizedGravity = {
        x: avgVector.x / magnitude,
        y: avgVector.y / magnitude,
        z: avgVector.z / magnitude
      };
      
      // The new Z axis should be opposite to gravity
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
      
      // Find Y axis using cross product of Z and X
      const newY = this.crossProduct(newZ, newXnorm);
      // Normalize Y axis
      const newYnorm = this.normalizeVector(newY);
      
      // Construct transformation matrix
      // Each row is one of our new basis vectors
      this.transformMatrix = [
        newXnorm,
        newYnorm,
        newZ
      ];
      
      this.calibrated = true;
      console.log("Final transformation matrix:", this.transformMatrix);
      return this.transformMatrix;
    } catch (error) {
      console.error('Error calculating transformation matrix:', error);
      return null;
    }
  }
  
  /**
   * Apply proper orthogonal transformation to sensor data
   * 
   * @param {Object} data - The raw sensor data {x, y, z}
   * @returns {Object} Transformed sensor data
   */
  applyTransformation(data) {
    if (!data || typeof data !== 'object') return data;
    
    try {
      console.log("Applying transformation, calibrated:", this.calibrated);
  
      // Store the original values
      const rawX = data.x;
      const rawY = data.y;
      const rawZ = data.z;
      
      // Get filtered values if they exist
      const hasFiltered = 
        data.filtered_x !== undefined && 
        data.filtered_y !== undefined && 
        data.filtered_z !== undefined;
      
      let transformedX, transformedY, transformedZ;
      let filteredX, filteredY, filteredZ;
      
      if (this.calibrated) {
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
          
          console.log("Matrix transform results:", {
            raw: [rawX, rawY, rawZ],
            transformed: [transformedX, transformedY, transformedZ]
          });
          
          // Also apply matrix to filtered values if available
          if (hasFiltered) {
            const filteredVec = [data.filtered_x, data.filtered_y, data.filtered_z];
            
            filteredX = 
              this.transformMatrix[0][0] * filteredVec[0] + 
              this.transformMatrix[0][1] * filteredVec[1] + 
              this.transformMatrix[0][2] * filteredVec[2];
              
            filteredY = 
              this.transformMatrix[1][0] * filteredVec[0] + 
              this.transformMatrix[1][1] * filteredVec[1] + 
              this.transformMatrix[1][2] * filteredVec[2];
              
            filteredZ = 
              this.transformMatrix[2][0] * filteredVec[0] + 
              this.transformMatrix[2][1] * filteredVec[1] + 
              this.transformMatrix[2][2] * filteredVec[2];
          }
        } else if (this.calibrationVector) {
          // Simple offset subtraction as fallback
          transformedX = rawX - this.calibrationVector.x;
          transformedY = rawY - this.calibrationVector.y;
          transformedZ = rawZ - this.calibrationVector.z;
          
          // After offset, z should be close to 1.0 (gravity)
          transformedZ = transformedZ + 1.0;
          
          console.log("Offset transform results:", {
            raw: [rawX, rawY, rawZ],
            offsets: [this.calibrationVector.x, this.calibrationVector.y, this.calibrationVector.z],
            transformed: [transformedX, transformedY, transformedZ]
          });
          
          if (hasFiltered) {
            filteredX = data.filtered_x - this.calibrationVector.x;
            filteredY = data.filtered_y - this.calibrationVector.y;
            filteredZ = data.filtered_z - this.calibrationVector.z + 1.0;
          }
        }
      } else {
        // No calibration, just pass through
        transformedX = rawX;
        transformedY = rawY;
        transformedZ = rawZ;
        
        if (hasFiltered) {
          filteredX = data.filtered_x;
          filteredY = data.filtered_y;
          filteredZ = data.filtered_z;
        }
      }
      
      // Return data with all processing stages
      const result = {
        raw_x: rawX,
        raw_y: rawY,
        raw_z: rawZ,
        
        // Transformed values
        x: transformedX,
        y: transformedY,
        z: transformedZ,
        
        // Consistent mapping - X is lateral, Y is longitudinal, Z is vertical
        lateral: transformedX,
        longitudinal: transformedY,
        vertical: transformedZ,
      };
      
      // Add filtered values if they existed in input
      if (hasFiltered) {
        result.filtered_x = filteredX;
        result.filtered_y = filteredY;
        result.filtered_z = filteredZ;
      }
      
      return result;
    } catch (error) {
      console.error('Error applying transformation:', error);
      return data;
    }
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
    console.log('CoordinateTransformer reset to identity matrix');
  }
  
  // ADD THE NEW METHODS HERE
  normalizeVector(vec) {
    const magnitude = Math.sqrt(vec[0]*vec[0] + vec[1]*vec[1] + vec[2]*vec[2]);
    return [vec[0]/magnitude, vec[1]/magnitude, vec[2]/magnitude];
  }

  crossProduct(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }
}

// Export a singleton instance
export default new CoordinateTransformer();