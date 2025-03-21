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
      
      // Simple calibration - just store the offset vector
      // (We'll use it for simple subtraction in applyTransformation)
      this.calibrated = true;
      
      // We also need to calculate a proper rotation matrix for orthogonal transformation
      
      // Step 1: Normalize the gravity vector from calibration
      const gravityVec = [
        avgVector.x / magnitude,
        avgVector.y / magnitude,
        avgVector.z / magnitude
      ];
      
      // Step 2: Find a vector perpendicular to gravity
      // Choose any vector not parallel to gravity, e.g., [1,0,0]
      let perpVec = [1, 0, 0];
      // If gravity is close to [1,0,0], use [0,1,0] instead
      if (Math.abs(gravityVec[0]) > 0.9) {
        perpVec = [0, 1, 0];
      }
      
      // Step 3: Calculate first orthogonal vector using cross product
      const v1 = [
        gravityVec[1] * perpVec[2] - gravityVec[2] * perpVec[1],
        gravityVec[2] * perpVec[0] - gravityVec[0] * perpVec[2],
        gravityVec[0] * perpVec[1] - gravityVec[1] * perpVec[0]
      ];
      
      // Normalize v1
      const v1Mag = Math.sqrt(v1[0]*v1[0] + v1[1]*v1[1] + v1[2]*v1[2]);
      const v1Norm = [v1[0]/v1Mag, v1[1]/v1Mag, v1[2]/v1Mag];
      
      // Step 4: Calculate second orthogonal vector using cross product
      const v2 = [
        gravityVec[1] * v1Norm[2] - gravityVec[2] * v1Norm[1],
        gravityVec[2] * v1Norm[0] - gravityVec[0] * v1Norm[2],
        gravityVec[0] * v1Norm[1] - gravityVec[1] * v1Norm[0]
      ];
      
      // Normalize v2
      const v2Mag = Math.sqrt(v2[0]*v2[0] + v2[1]*v2[1] + v2[2]*v2[2]);
      const v2Norm = [v2[0]/v2Mag, v2[1]/v2Mag, v2[2]/v2Mag];
      
      // Step 5: Create rotation matrix
      // z axis is aligned with gravity (negated since we want +Z to be up)
      // x axis is aligned with v1Norm (lateral)
      // y axis is aligned with v2Norm (longitudinal)
      this.transformMatrix = [
        [v1Norm[0], v1Norm[1], v1Norm[2]],
        [v2Norm[0], v2Norm[1], v2Norm[2]],
        [-gravityVec[0], -gravityVec[1], -gravityVec[2]] // negate to align +Z up
      ];
      
      console.log("TRANSFORM_MATRIX_CALCULATED", {
        samples: samples.length,
        avgVector: avgVector,
        magnitude: magnitude,
        transformMatrix: this.transformMatrix
      });

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
      console.log("Calibration state:", {
        calibrated: this.calibrated,
        hasMatrix: !!this.transformMatrix,
        hasVector: !!this.calibrationVector
      });

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
          console.log("Using transformation matrix");

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
          
            console.log("TRANSFORM_APPLIED", {
              rawInput: { x: rawX, y: rawY, z: rawZ },
              transformMatrix: this.transformMatrix,
              transformed: { x: transformedX, y: transformedY, z: transformedZ }
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
          console.log("Using transformation matrix");

          // Fall back to simple offset subtraction
          transformedX = rawX - this.calibrationVector.x;
          transformedY = rawY - this.calibrationVector.y;
          transformedZ = rawZ - this.calibrationVector.z;
          
          console.log("OFFSET_APPLIED", {
            rawInput: { x: rawX, y: rawY, z: rawZ },
            calibrationVector: this.calibrationVector,
            transformed: { x: transformedX, y: transformedY, z: transformedZ }
          });
          
          if (hasFiltered) {
            filteredX = data.filtered_x - this.calibrationVector.x;
            filteredY = data.filtered_y - this.calibrationVector.y;
            filteredZ = data.filtered_z - this.calibrationVector.z;
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
      
      // Return both raw and transformed values
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
      console.log("Before transformation:", { x: rawX, y: rawY, z: rawZ });
      console.log("After transformation:", { x: transformedX, y: transformedY, z: transformedZ });

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
}

// Export a singleton instance
export default new CoordinateTransformer();