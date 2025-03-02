// DataProcessing.js - Handles data filtering and processing

class DataProcessor {
    constructor() {
      // Previous values for rate limiting
      this.prevAccelValues = { x: 0, y: 0, z: 0 };
      this.prevGyroValues = { x: 0, y: 0, z: 0 };
      this.prevMagValues = { x: 0, y: 0, z: 0 };
      
      // Previous filtered values for smoothing
      this.prevFilteredAccel = { x: 0, y: 0, z: 0 };
      this.prevFilteredGyro = { x: 0, y: 0, z: 0 };
      this.prevFilteredMag = { x: 0, y: 0, z: 0 };
      
      // First reading flags
      this.isFirstAccelReading = true;
      this.isFirstGyroReading = true;
      this.isFirstMagReading = true;
      
      // Default processing parameters
      this.params = {
        // Rate limiting settings (max change per reading)
        maxDeltaAccelX: 0.025,  // G
        maxDeltaAccelY: 0.01,   // G
        maxDeltaAccelZ: 0.5,    // G
        maxDeltaGyro: 0.2,      // rad/s
        maxDeltaMag: 2.0,       // μT
        
        // Low-pass filter constants
        filterAccelX: 0.05,     // Longitudinal (lower = more filtering)
        filterAccelY: 0.1,      // Lateral (lower = more filtering)
        filterAccelZ: 0.25,     // Vertical (lower = more filtering)
        filterGyro: 0.1,        // Gyroscope
        filterMag: 0.1          // Magnetometer
      };
      
      console.log('DataProcessor initialized');
    }
    
    // Apply rate limiting to prevent large jumps in values
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
    
    // Apply low-pass filter for smoothing
    applyLowPassFilter(newValue, oldValue, alpha) {
      return alpha * newValue + (1 - alpha) * oldValue;
    }
    
    // Process accelerometer data
   // Process accelerometer data
processAccelerometerData(data) {
  // For first reading, initialize values without processing
  if (this.isFirstAccelReading) {
    this.isFirstAccelReading = false;
    
    // Extract the values using the correct property names
    const x = data.longitudinal !== undefined ? data.longitudinal : data.x;
    const y = data.lateral !== undefined ? data.lateral : data.y;
    const z = data.vertical !== undefined ? data.vertical : data.z;
    
    this.prevAccelValues = { x, y, z };
    this.prevFilteredAccel = { x, y, z };
    
    return {
      ...data,
      raw_x: data.raw_x || data.x,
      raw_y: data.raw_y || data.y,
      raw_z: data.raw_z || data.z,
      limited_x: x,
      limited_y: y,
      limited_z: z,
      filtered_x: x,
      filtered_y: y,
      filtered_z: z
    };
  }
  
  // Extract values using the correct property names
  const rawX = data.longitudinal !== undefined ? data.longitudinal : data.x;
  const rawY = data.lateral !== undefined ? data.lateral : data.y;
  const rawZ = data.vertical !== undefined ? data.vertical : data.z;
  
  // Apply rate limiting
  const limitedX = this.limitRateOfChange(
    rawX, this.prevAccelValues.x, this.params.maxDeltaAccelX);
  const limitedY = this.limitRateOfChange(
    rawY, this.prevAccelValues.y, this.params.maxDeltaAccelY);
  const limitedZ = this.limitRateOfChange(
    rawZ, this.prevAccelValues.z, this.params.maxDeltaAccelZ);
  
  // Store current limited values for next time
  this.prevAccelValues = { x: limitedX, y: limitedY, z: limitedZ };
  
  // Apply low-pass filter to the rate-limited values
  const filteredX = this.applyLowPassFilter(
    limitedX, this.prevFilteredAccel.x, this.params.filterAccelX);
  const filteredY = this.applyLowPassFilter(
    limitedY, this.prevFilteredAccel.y, this.params.filterAccelY);
  const filteredZ = this.applyLowPassFilter(
    limitedZ, this.prevFilteredAccel.z, this.params.filterAccelZ);
  
  // Store filtered values for next time
  this.prevFilteredAccel = { x: filteredX, y: filteredY, z: filteredZ };
  
  // Return data with all processing stages
  return {
    ...data,
    raw_x: data.raw_x || data.x,
    raw_y: data.raw_y || data.y,
    raw_z: data.raw_z || data.z,
    limited_x: limitedX,
    limited_y: limitedY,
    limited_z: limitedZ,
    filtered_x: filteredX,
    filtered_y: filteredY,
    filtered_z: filteredZ
  };
}
    
    // Process gyroscope data
    processGyroscopeData(data) {
      // For first reading, initialize values without processing
      if (this.isFirstGyroReading) {
        this.isFirstGyroReading = false;
        this.prevGyroValues = { ...data };
        this.prevFilteredGyro = { ...data };
        
        return {
          ...data,
          raw_x: data.x,
          raw_y: data.y,
          raw_z: data.z,
          filtered_x: data.x,
          filtered_y: data.y,
          filtered_z: data.z
        };
      }
      
      // Apply rate limiting to all axes
      const limitedX = this.limitRateOfChange(
        data.x, this.prevGyroValues.x, this.params.maxDeltaGyro);
      const limitedY = this.limitRateOfChange(
        data.y, this.prevGyroValues.y, this.params.maxDeltaGyro);
      const limitedZ = this.limitRateOfChange(
        data.z, this.prevGyroValues.z, this.params.maxDeltaGyro);
      
      // Store limited values for next time
      this.prevGyroValues = { x: limitedX, y: limitedY, z: limitedZ };
      
      // Apply filtering
      const filteredX = this.applyLowPassFilter(
        limitedX, this.prevFilteredGyro.x, this.params.filterGyro);
      const filteredY = this.applyLowPassFilter(
        limitedY, this.prevFilteredGyro.y, this.params.filterGyro);
      const filteredZ = this.applyLowPassFilter(
        limitedZ, this.prevFilteredGyro.z, this.params.filterGyro);
      
      // Store filtered values for next time
      this.prevFilteredGyro = { x: filteredX, y: filteredY, z: filteredZ };
      
      return {
        ...data,
        raw_x: data.x,
        raw_y: data.y,
        raw_z: data.z,
        filtered_x: filteredX,
        filtered_y: filteredY,
        filtered_z: filteredZ
      };
    }
    
    // Process magnetometer data
    processMagnetometerData(data) {
      // For first reading, initialize values without processing
      if (this.isFirstMagReading) {
        this.isFirstMagReading = false;
        this.prevMagValues = { ...data };
        this.prevFilteredMag = { ...data };
        
        return {
          ...data,
          raw_x: data.x,
          raw_y: data.y,
          raw_z: data.z,
          filtered_x: data.x,
          filtered_y: data.y,
          filtered_z: data.z
        };
      }
      
      // Apply rate limiting to all axes
      const limitedX = this.limitRateOfChange(
        data.x, this.prevMagValues.x, this.params.maxDeltaMag);
      const limitedY = this.limitRateOfChange(
        data.y, this.prevMagValues.y, this.params.maxDeltaMag);
      const limitedZ = this.limitRateOfChange(
        data.z, this.prevMagValues.z, this.params.maxDeltaMag);
      
      // Store limited values for next time
      this.prevMagValues = { x: limitedX, y: limitedY, z: limitedZ };
      
      // Apply filtering
      const filteredX = this.applyLowPassFilter(
        limitedX, this.prevFilteredMag.x, this.params.filterMag);
      const filteredY = this.applyLowPassFilter(
        limitedY, this.prevFilteredMag.y, this.params.filterMag);
      const filteredZ = this.applyLowPassFilter(
        limitedZ, this.prevFilteredMag.z, this.params.filterMag);
      
      // Store filtered values for next time
      this.prevFilteredMag = { x: filteredX, y: filteredY, z: filteredZ };
      
      return {
        ...data,
        raw_x: data.x,
        raw_y: data.y,
        raw_z: data.z,
        filtered_x: filteredX,
        filtered_y: filteredY,
        filtered_z: filteredZ
      };
    }
    
    // Update processing parameters
    updateParameters(newParams) {
      this.params = {
        ...this.params,
        ...newParams
      };
      console.log('DataProcessor parameters updated:', this.params);
    }
    
    // Reset processor state
    reset() {
      this.isFirstAccelReading = true;
      this.isFirstGyroReading = true;
      this.isFirstMagReading = true;
      
      this.prevAccelValues = { x: 0, y: 0, z: 0 };
      this.prevGyroValues = { x: 0, y: 0, z: 0 };
      this.prevMagValues = { x: 0, y: 0, z: 0 };
      
      this.prevFilteredAccel = { x: 0, y: 0, z: 0 };
      this.prevFilteredGyro = { x: 0, y: 0, z: 0 };
      this.prevFilteredMag = { x: 0, y: 0, z: 0 };
      
      console.log('DataProcessor reset');
    }
  }
  
  // Export as a singleton instance
  export default new DataProcessor();