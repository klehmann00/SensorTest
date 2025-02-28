// SensorProcessor.js - Simplified for debugging
class SensorProcessor {
    constructor() {
      console.log('SensorProcessor initialized');
    }
    
    processAccelerometerData(data, calibrationMatrix) {
      console.log('Processing accel data:', data);
      
      // Just pass through data with added properties
      return {
        ...data,
        raw_x: data.x,
        raw_y: data.y,
        raw_z: data.z,
        processed_lateral: data.y,
        processed_longitudinal: data.x,
        processed_vertical: data.z
      };
    }
    
    processGyroscopeData(data) {
      return data;
    }
    
    processMagnetometerData(data) {
      return data;
    }
    
    reset() {
      console.log('SensorProcessor reset');
    }
  }
  
  // Export a singleton instance
  export default new SensorProcessor();