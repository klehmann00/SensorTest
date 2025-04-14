// src/config/FilterConfig.js
const FilterConfig = {
    // Acceleration filtering
    accelerometer: {
      // Raw data processing (first stage)
      raw: {
        maxDelta: { x: 0.025, y: 0.025, z: 0.05 },
        filter: { x: 0.1, y: 0.1, z: 0.2 }
      },
      // Post-transformation processing (second stage)
      processed: {
        maxDelta: { x: 0.025, y: 0.025, z: 0.05 },
        filter: { x: 0.1, y: 0.1, z: 0.2 }
      }
    },
    
    // Gyroscope filtering
    gyroscope: {
      // Raw data processing (first stage)
      raw: {
        maxDelta: { x: 0.3, y: 0.3, z: 0.3 },
        filter: { x: 0.1, y: 0.1, z: 0.1 }
      },
      // Post-transformation processing (second stage)
      processed: {
        maxDelta: { x: 0.3, y: 0.3, z: 0.3 },
        filter: { x: 0.5, y: 0.5, z: 0.5 } // Your very low values for strong filtering
      }
    }
  };
  
  export default FilterConfig;