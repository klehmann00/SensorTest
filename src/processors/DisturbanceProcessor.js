// Modified src/processors/DisturbanceProcessor.js with separate gyro decay factors

class DisturbanceProcessor {
  constructor() {
    // Last timestamp for dt calculation
    this.lastTimestamp = 0;
    
    // Disturbance accumulators - initialize with normalized values
    this.disturbanceEnergy = {
      road: {
        lateral: 0,
        longitudinal: 0,
        vertical: 0,
        total: 0,
        normalizedLateral: 0,
        normalizedLongitudinal: 0,
        normalizedVertical: 0,
        normalizedTotal: 0
      },
      vehicle: {
        lateral: 0,
        longitudinal: 0,
        vertical: 0,
        total: 0,
        normalizedLateral: 0,
        normalizedLongitudinal: 0,
        normalizedVertical: 0,
        normalizedTotal: 0
      },
      driver: {
        lateral: 0,
        longitudinal: 0,
        vertical: 0,
        total: 0,
        normalizedLateral: 0,
        normalizedLongitudinal: 0,
        normalizedVertical: 0,
        normalizedTotal: 0
      }
    };
    
    // Recent acceleration history (for frequency analysis)
    this.accelHistory = {
      road: { x: [], y: [], z: [] },
      vehicle: { x: [], y: [], z: [] },
      driver: { x: [], y: [], z: [] }
    };
        
    // Constants
    this.INTEGRATION_WINDOW = 50; // Number of samples for integration window
    
    // Configuration for each disturbance type - ADD SEPARATE GYRO SETTINGS HERE
    this.config = {
      road: {
        // Accelerometer settings (unchanged)
        accelerationThreshold: 0.05,
        decayFactor: 0.95,
        sensitivityFactor: 1.0,
        
        // Gyroscope settings - NEW APPROACH
        gyroThreshold: 0.001,         // Lower threshold for detection
        gyroHalfLifeMs: 3000,          // Time in ms for value to decay by half
        gyroSensitivityFactor: 50.0   // More reasonable sensitivity
      },
      vehicle: {
        // Accelerometer settings (unchanged)
        accelerationThreshold: 0.03,
        decayFactor: 0.97,
        sensitivityFactor: 0.8,
        
        // Gyroscope settings - NEW APPROACH
        gyroThreshold: 0.001,
        gyroHalfLifeMs: 3000,         // Longer decay for vehicle
        gyroSensitivityFactor: 75.0
      },
      driver: {
        // Accelerometer settings (unchanged)
        accelerationThreshold: 0.02,
        decayFactor: 0.98,
        sensitivityFactor: 0.6,
        
        // Gyroscope settings - NEW APPROACH
        gyroThreshold: 0.001,
        gyroHalfLifeMs: 3000,        // Even longer decay for driver
        gyroSensitivityFactor: 25.0
      }
    };
    
    // Energy scaling factors for normalization - separate for gyro
    this.maxEnergy = {
      accel: {
        road: 10.0,
        vehicle: 5.0,
        driver: 3.0
      },
      gyro: {
        road: 1.0,
        vehicle: 1.0,
        driver: 1.0
      }
    };

    this.lastGyroTimestamp = 0;
    console.log('DisturbanceProcessor initialized with separate gyro decay factors');
  }
  
  /**
   * Reset the processor state
   */
  reset() {
    // Reset all state variables
    this.lastTimestamp = 0;
    
    // Reset disturbance accumulators
    this.disturbanceEnergy = {
      road: {
        lateral: 0,
        longitudinal: 0,
        vertical: 0,
        total: 0,
        normalizedLateral: 0,
        normalizedLongitudinal: 0,
        normalizedVertical: 0,
        normalizedTotal: 0
      },
      vehicle: {
        lateral: 0,
        longitudinal: 0,
        vertical: 0,
        total: 0,
        normalizedLateral: 0,
        normalizedLongitudinal: 0,
        normalizedVertical: 0,
        normalizedTotal: 0
      },
      driver: {
        lateral: 0,
        longitudinal: 0,
        vertical: 0,
        total: 0,
        normalizedLateral: 0,
        normalizedLongitudinal: 0,
        normalizedVertical: 0,
        normalizedTotal: 0
      }
    };
    
    // Reset acceleration history
    this.accelHistory = {
      road: { x: [], y: [], z: [] },
      vehicle: { x: [], y: [], z: [] },
      driver: { x: [], y: [], z: [] }
    };
    
    console.log('DisturbanceProcessor reset');
  }
    
  /**
   * Process filtered accelerometer data from each perspective
   * and integrate disturbance energy
   * 
   * @param {Object} filteredData - Object containing filtered acceleration data from each perspective
   * @param {Object} gyroData - Object containing filtered gyroscope data from each perspective
   * @returns {Object} - Disturbance energy metrics
   */
  processDisturbances(filteredData, gyroData = null) {
    if (!filteredData) {
      console.log('No filtered data passed to DisturbanceProcessor');
      return null;
    }
    
    // Debug input data
    console.log('DisturbanceProcessor input data:', {
      roadFiltered: filteredData.road?.filtered ? 'present' : 'missing',
      vehicleFiltered: filteredData.vehicle?.filtered ? 'present' : 'missing',
      driverFiltered: filteredData.driver?.filtered ? 'present' : 'missing'
    });

    // Sample data if available
    if (filteredData.road?.filtered) {
      console.log('Sample road data:', {
        x: filteredData.road.filtered.x,
        y: filteredData.road.filtered.y,
        z: filteredData.road.filtered.z
      });
    }
    
    const timestamp = filteredData.timestamp || Date.now();
    
    // Calculate time delta
    let dt = 0;
    if (this.lastTimestamp > 0) {
      dt = (timestamp - this.lastTimestamp) / 1000; // Convert to seconds
    }
    this.lastTimestamp = timestamp;
    
    // Create a new structure for gyro-specific disturbance energy
/*    const gyroDisturbance = {
      road: {
        roll: 0,        // X-axis rotation
        pitch: 0,       // Y-axis rotation
        yaw: 0,         // Z-axis rotation
        total: 0,
        normalizedRoll: 0,
        normalizedPitch: 0,
        normalizedYaw: 0,
        normalizedTotal: 0
      },
      vehicle: {
        roll: 0,
        pitch: 0,
        yaw: 0,
        total: 0,
        normalizedRoll: 0,
        normalizedPitch: 0,
        normalizedYaw: 0,
        normalizedTotal: 0
      },
      driver: {
        roll: 0,
        pitch: 0,
        yaw: 0,
        total: 0,
        normalizedRoll: 0,
        normalizedPitch: 0,
        normalizedYaw: 0,
        normalizedTotal: 0
      }
    };
*/
// Use existing or create new gyroDisturbance object
if (!this.gyroDisturbance) {
  this.gyroDisturbance = {
    road: {
      roll: 0, pitch: 0, yaw: 0, total: 0,
      normalizedRoll: 0, normalizedPitch: 0, normalizedYaw: 0, normalizedTotal: 0
    },
    vehicle: {
      roll: 0, pitch: 0, yaw: 0, total: 0,
      normalizedRoll: 0, normalizedPitch: 0, normalizedYaw: 0, normalizedTotal: 0
    },
    driver: {
      roll: 0, pitch: 0, yaw: 0, total: 0,
      normalizedRoll: 0, normalizedPitch: 0, normalizedYaw: 0, normalizedTotal: 0
    }
  };
}
const gyroDisturbance = this.gyroDisturbance;

    // Skip processing if time delta is too large or not available
    if (dt <= 0 || dt > 0.5) {
      return { 
        accel: { ...this.disturbanceEnergy },
        gyro: gyroDisturbance,
        timestamp 
      };
    }
  
    // Process each perspective for accelerometer data
    ['road', 'vehicle', 'driver'].forEach(perspective => {
      // Get filtered data for this perspective
      const accelData = filteredData[perspective]?.filtered;
      if (!accelData) return;
      
      // Update acceleration history
      this.updateAccelHistory(perspective, accelData);
      
      // Calculate energy for each axis
      this.calculateDisturbanceEnergy(perspective, accelData, dt);
    });

    // Process gyroscope data if provided
// Process gyroscope data if provided
if (gyroData) {
  console.log('Processing gyro data:', gyroData ? 'present' : 'missing');
  
  // Calculate time delta for gyro processing specifically
  const now = Date.now();
  const gyroTimeDelta = this.lastGyroTimestamp > 0 ? (now - this.lastGyroTimestamp) : 0;
  this.lastGyroTimestamp = now;
  
  console.log(`Gyro time delta: ${gyroTimeDelta}ms`);
  
  ['road', 'vehicle', 'driver'].forEach(perspective => {
    const gyroFiltered = gyroData[perspective]?.filtered;
    if (!gyroFiltered) {
      console.log(`No gyro filtered data for ${perspective}`);
      return;
    }
    
    // Calculate gyro energy using the separate gyro settings
    const config = this.config[perspective];
    
    // Get roll, pitch, yaw rates
    const rollRate = Math.abs(gyroFiltered.x);
    const pitchRate = Math.abs(gyroFiltered.y);
    const yawRate = Math.abs(gyroFiltered.z);
    
    // Apply gyro-specific thresholds
    const gyroThreshold = config.gyroThreshold;
    
    // Calculate energy for each axis with gyro-specific sensitivity factors
    const rollEnergy = rollRate > gyroThreshold ? 
      Math.pow(rollRate - gyroThreshold, 2) * config.gyroSensitivityFactor : 0;
    const pitchEnergy = pitchRate > gyroThreshold ? 
      Math.pow(pitchRate - gyroThreshold, 2) * config.gyroSensitivityFactor : 0;
    const yawEnergy = yawRate > gyroThreshold ? 
      Math.pow(yawRate - gyroThreshold, 2) * config.gyroSensitivityFactor : 0;

    // Calculate time-based decay factor - EXPONENTIAL DECAY
    // If halfLifeMs is 500, then after 500ms the value will be multiplied by 0.5
    let timeDecay = 1.0;
    if (gyroTimeDelta > 0) {
      const decayRate = Math.log(2) / config.gyroHalfLifeMs; // Natural log of 2 divided by half-life
      timeDecay = Math.exp(-decayRate * gyroTimeDelta);
      
      // Keep decay between 0 and 1 to avoid numerical issues
      timeDecay = Math.max(0, Math.min(1, timeDecay));

      console.log(`${perspective} half-life: ${config.gyroHalfLifeMs}ms, time decay: ${timeDecay.toFixed(4)}`);
      }
    
    // Apply decay and accumulation for gyro disturbance - USING TIME-BASED DECAY
    gyroDisturbance[perspective].roll = 
      gyroDisturbance[perspective].roll * timeDecay + 
      rollEnergy;
      
    gyroDisturbance[perspective].pitch = 
      gyroDisturbance[perspective].pitch * timeDecay + 
      pitchEnergy;
      
    gyroDisturbance[perspective].yaw = 
      gyroDisturbance[perspective].yaw * timeDecay + 
      yawEnergy;
    
    // Calculate total
    gyroDisturbance[perspective].total = 
      gyroDisturbance[perspective].roll +
      gyroDisturbance[perspective].pitch +
      gyroDisturbance[perspective].yaw;
      
    // Add to disturbance energy (with less weight than accel)
    const gyroWeight = 0.5; // Gyro contributes half as much as accel
    
    this.disturbanceEnergy[perspective].lateral += rollEnergy * gyroWeight;
    this.disturbanceEnergy[perspective].longitudinal += pitchEnergy * gyroWeight;
    this.disturbanceEnergy[perspective].vertical += yawEnergy * gyroWeight;
    
    // Recalculate total
    this.disturbanceEnergy[perspective].total = 
      this.disturbanceEnergy[perspective].lateral +
      this.disturbanceEnergy[perspective].longitudinal +
      this.disturbanceEnergy[perspective].vertical;
      
    // Normalize the values again
    this.normalizeEnergyValues(perspective);
    this.normalizeGyroValues(perspective, gyroDisturbance);
    
    // Debug log the timeDecay factor
    console.log(`${perspective} gyro timeDecay: ${timeDecay.toFixed(4)}, halfLife: ${config.gyroHalfLifeMs}ms`);
  });
}

    console.log('Gyro disturbance structure after processing:', {
      road: gyroDisturbance.road ? 'initialized' : 'missing',
      vehicle: gyroDisturbance.vehicle ? 'initialized' : 'missing',
      driver: gyroDisturbance.driver ? 'initialized' : 'missing'
    });

    // Debug output before returning
    console.log('Normalized disturbance values:', {
      road: this.disturbanceEnergy.road.normalizedTotal,
      vehicle: this.disturbanceEnergy.vehicle.normalizedTotal,
      driver: this.disturbanceEnergy.driver.normalizedTotal
    });

    // Return current disturbance energy state
    return { 
      accel: { ...this.disturbanceEnergy },
      gyro: this.gyroDisturbance,
      timestamp
    };
  }
  
  /**
   * Update acceleration history for a specific perspective
   * 
   * @param {string} perspective - 'road', 'vehicle', or 'driver'
   * @param {Object} accelData - Filtered acceleration data
   */
  updateAccelHistory(perspective, accelData) {
    // Add new data point
    this.accelHistory[perspective].x.push(accelData.x);
    this.accelHistory[perspective].y.push(accelData.y);
    this.accelHistory[perspective].z.push(accelData.z);
    
    // Trim history to window size
    if (this.accelHistory[perspective].x.length > this.INTEGRATION_WINDOW) {
      this.accelHistory[perspective].x.shift();
      this.accelHistory[perspective].y.shift();
      this.accelHistory[perspective].z.shift();
    }
  }
  
  /**
   * Calculate disturbance energy for a specific perspective
   * 
   * @param {string} perspective - 'road', 'vehicle', or 'driver'
   * @param {Object} accelData - Filtered acceleration data
   * @param {number} dt - Time delta in seconds
   */
  calculateDisturbanceEnergy(perspective, accelData, dt) {
    const config = this.config[perspective];
    const history = this.accelHistory[perspective];
    
    // Calculate acceleration magnitudes
    const lateralAccel = Math.abs(accelData.y);
    const longitudinalAccel = Math.abs(accelData.x);
    const verticalAccel = Math.abs(accelData.z - 1.0); // Remove gravity component
    
    // Apply thresholding - only accumulate energy above threshold
    const lateralEnergy = lateralAccel > config.accelerationThreshold
      ? Math.pow(lateralAccel - config.accelerationThreshold, 2)
      : 0;
      
    const longitudinalEnergy = longitudinalAccel > config.accelerationThreshold
      ? Math.pow(longitudinalAccel - config.accelerationThreshold, 2) 
      : 0;
      
    const verticalEnergy = verticalAccel > config.accelerationThreshold
      ? Math.pow(verticalAccel - config.accelerationThreshold, 2)
      : 0;
    
    // Apply frequency characteristics based on perspective
    // - For road disturbances, emphasize higher frequencies
    // - For vehicle disturbances, emphasize medium frequencies
    // - For driver disturbances, emphasize lower frequencies
    let frequencyFactor = 1.0;
    
    if (perspective === 'road') {
      // Calculate high-frequency component (variance over short time)
      frequencyFactor = this.calculateShortTermVariance(history);
    } else if (perspective === 'vehicle') {
      // Calculate medium-frequency component
      frequencyFactor = this.calculateMediumTermVariance(history);
    } else if (perspective === 'driver') {
      // Calculate low-frequency component
      frequencyFactor = this.calculateLongTermTrend(history);
    }
    
    // Apply frequency-based scaling
    const scaledLateralEnergy = lateralEnergy * frequencyFactor * config.sensitivityFactor;
    const scaledLongitudinalEnergy = longitudinalEnergy * frequencyFactor * config.sensitivityFactor;
    const scaledVerticalEnergy = verticalEnergy * frequencyFactor * config.sensitivityFactor;
    
    // Apply energy integration with decay
    this.disturbanceEnergy[perspective].lateral = 
      this.disturbanceEnergy[perspective].lateral * config.decayFactor + 
      scaledLateralEnergy * dt;
      
    this.disturbanceEnergy[perspective].longitudinal = 
      this.disturbanceEnergy[perspective].longitudinal * config.decayFactor + 
      scaledLongitudinalEnergy * dt;
      
    this.disturbanceEnergy[perspective].vertical = 
      this.disturbanceEnergy[perspective].vertical * config.decayFactor + 
      scaledVerticalEnergy * dt;
    
    // Calculate total energy
    this.disturbanceEnergy[perspective].total = 
      this.disturbanceEnergy[perspective].lateral +
      this.disturbanceEnergy[perspective].longitudinal +
      this.disturbanceEnergy[perspective].vertical;
      
    // Normalize to a 0-100 scale for easier interpretation
    this.normalizeEnergyValues(perspective);
  }
  
  /**
   * Calculate short-term variance (high frequency components)
   * 
   * @param {Object} history - Acceleration history for a perspective
   * @returns {number} - Variance factor
   */
  calculateShortTermVariance(history) {
    // Get the most recent 10 samples
    const recentX = history.x.slice(-10);
    const recentY = history.y.slice(-10);
    const recentZ = history.z.slice(-10);
    
    if (recentX.length < 5) return 1.0;
    
    // Calculate variance
    const varianceX = this.calculateVariance(recentX);
    const varianceY = this.calculateVariance(recentY);
    const varianceZ = this.calculateVariance(recentZ);
    
    // Combined variance
    return Math.sqrt(varianceX + varianceY + varianceZ) * 10;
  }
  
  /**
   * Calculate medium-term variance (medium frequency components)
   * 
   * @param {Object} history - Acceleration history for a perspective
   * @returns {number} - Variance factor
   */
  calculateMediumTermVariance(history) {
    // Get the middle segment of the history
    const midX = history.x.slice(-30, -10);
    const midY = history.y.slice(-30, -10);
    const midZ = history.z.slice(-30, -10);
    
    if (midX.length < 5) return 1.0;
    
    // Calculate variance
    const varianceX = this.calculateVariance(midX);
    const varianceY = this.calculateVariance(midY);
    const varianceZ = this.calculateVariance(midZ);
    
    // Combined variance
    return Math.sqrt(varianceX + varianceY + varianceZ) * 8;
  }
  
  /**
   * Calculate long-term trend (low frequency components)
   * 
   * @param {Object} history - Acceleration history for a perspective
   * @returns {number} - Trend factor
   */
  calculateLongTermTrend(history) {
    if (history.x.length < 10) return 1.0;
    
    // Calculate the difference between current and older values
    const startIdx = 0;
    const endIdx = history.x.length - 1;
    
    const diffX = Math.abs(history.x[endIdx] - history.x[startIdx]);
    const diffY = Math.abs(history.y[endIdx] - history.y[startIdx]);
    const diffZ = Math.abs(history.z[endIdx] - history.z[startIdx]);
    
    // Combined trend
    return (diffX + diffY + diffZ) * 5;
  }
  
  /**
   * Calculate variance of an array
   * 
   * @param {Array} array - Array of values
   * @returns {number} - Variance
   */
  calculateVariance(array) {
    if (array.length < 2) return 0;
    
    // Calculate mean
    const mean = array.reduce((sum, val) => sum + val, 0) / array.length;
    
    // Calculate variance
    const variance = array.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / array.length;
    
    return variance;
  }
  
  /**
   * Normalize energy values to 0-100 scale
   * 
   * @param {string} perspective - 'road', 'vehicle', or 'driver'
   */
  normalizeEnergyValues(perspective) {
    // Use maxEnergy values from the class property
    const maxEnergy = this.maxEnergy.accel[perspective];
    
    // Normalize lateral
    let normalizedLateral = (this.disturbanceEnergy[perspective].lateral / maxEnergy) * 100;
    normalizedLateral = Math.min(Math.max(normalizedLateral, 0), 100);
    
    // Normalize longitudinal
    let normalizedLongitudinal = (this.disturbanceEnergy[perspective].longitudinal / maxEnergy) * 100;
    normalizedLongitudinal = Math.min(Math.max(normalizedLongitudinal, 0), 100);
    
    // Normalize vertical
    let normalizedVertical = (this.disturbanceEnergy[perspective].vertical / maxEnergy) * 100;
    normalizedVertical = Math.min(Math.max(normalizedVertical, 0), 100);
    
    // Normalize total
    let normalizedTotal = (this.disturbanceEnergy[perspective].total / (maxEnergy * 3)) * 100;
    normalizedTotal = Math.min(Math.max(normalizedTotal, 0), 100);
    
    // Store normalized values
    this.disturbanceEnergy[perspective].normalizedLateral = normalizedLateral;
    this.disturbanceEnergy[perspective].normalizedLongitudinal = normalizedLongitudinal;
    this.disturbanceEnergy[perspective].normalizedVertical = normalizedVertical;
    this.disturbanceEnergy[perspective].normalizedTotal = normalizedTotal;
  }
  
  /**
   * Normalize gyro values to 0-100 scale
   * 
   * @param {string} perspective - 'road', 'vehicle', or 'driver'
   * @param {Object} gyroData - Gyro disturbance data
   */
  normalizeGyroValues(perspective, gyroData) {
    // Use maxEnergy values from the class property for gyro
    const maxEnergy = this.maxEnergy.gyro[perspective];
    
    // Normalize roll
    let normalizedRoll = (gyroData[perspective].roll / maxEnergy) * 100;
    normalizedRoll = isNaN(normalizedRoll) ? 0 : Math.min(Math.max(normalizedRoll, 0), 100);
    
    // Normalize pitch
    let normalizedPitch = (gyroData[perspective].pitch / maxEnergy) * 100;
    normalizedPitch = isNaN(normalizedPitch) ? 0 : Math.min(Math.max(normalizedPitch, 0), 100);
    
    // Normalize yaw
    let normalizedYaw = (gyroData[perspective].yaw / maxEnergy) * 100;
    normalizedYaw = isNaN(normalizedYaw) ? 0 : Math.min(Math.max(normalizedYaw, 0), 100);
    
    // Normalize total
    let normalizedTotal = (gyroData[perspective].total / (maxEnergy * 3)) * 100;
    normalizedTotal = isNaN(normalizedTotal) ? 0 : Math.min(Math.max(normalizedTotal, 0), 100);
    
    // Store normalized values
    gyroData[perspective].normalizedRoll = normalizedRoll;
    gyroData[perspective].normalizedPitch = normalizedPitch;
    gyroData[perspective].normalizedYaw = normalizedYaw;
    gyroData[perspective].normalizedTotal = normalizedTotal;
  }

  /**
   * Update configuration parameters
   * 
   * @param {Object} config - New configuration parameters
   */
  updateConfig(config) {
    if (config) {
      // Merge new config with existing
      if (config.road) {
        this.config.road = { ...this.config.road, ...config.road };
      }
      if (config.vehicle) {
        this.config.vehicle = { ...this.config.vehicle, ...config.vehicle };
      }
      if (config.driver) {
        this.config.driver = { ...this.config.driver, ...config.driver };
      }
      
      // Update maxEnergy values if provided
      if (config.maxEnergy) {
        if (config.maxEnergy.accel) {
          this.maxEnergy.accel = { ...this.maxEnergy.accel, ...config.maxEnergy.accel };
        }
        if (config.maxEnergy.gyro) {
          this.maxEnergy.gyro = { ...this.maxEnergy.gyro, ...config.maxEnergy.gyro };
        }
      }
      
      console.log('DisturbanceProcessor config updated');
    }
    
    // Return current configuration
    return {
      config: this.config,
      maxEnergy: this.maxEnergy
    };
  }
}
  
export default new DisturbanceProcessor();