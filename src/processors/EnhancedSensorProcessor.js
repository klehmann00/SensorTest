// src/processors/EnhancedSensorProcessor.js

/**
 * Enhanced sensor processor that applies multiple filter levels
 * and integration to sensor data for different analysis perspectives:
 * 1. Driver actions (high response, minimal filtering)
 * 2. Vehicle dynamics (medium filtering)
 * 3. Road conditions (heavy filtering)
 */
class EnhancedSensorProcessor {
    constructor() {
      // Initialize filter coefficients for each perspective
      this.filterSettings = {
        road: {
          accel: { x: 0.8, y: 0.8, z: 0.7 }, // Higher = less filtering, more responsive
          gyro: { x: 0.8, y: 0.8, z: 0.8 }
        },
        vehicle: {
          accel: { x: 0.3, y: 0.3, z: 0.3 }, // Medium filtering
          gyro: { x: 0.4, y: 0.4, z: 0.4 }
        },
        driver: {
          accel: { x: 0.05, y: 0.05, z: 0.1 }, // Heavy filtering to extract road patterns
          gyro: { x: 0.05, y: 0.05, z: 0.05 }
        }
      };
      
      // Initialize state for each filter level
      this.state = {
        driver: {
          accel: { prevFiltered: { x: 0, y: 0, z: 0 }, 
                   velocity: { x: 0, y: 0, z: 0 },
                   position: { x: 0, y: 0, z: 0 } },
          gyro: { prevFiltered: { x: 0, y: 0, z: 0 },
                  angularPosition: { x: 0, y: 0, z: 0 } }
        },
        vehicle: {
          accel: { prevFiltered: { x: 0, y: 0, z: 0 }, 
                   velocity: { x: 0, y: 0, z: 0 },
                   position: { x: 0, y: 0, z: 0 } },
          gyro: { prevFiltered: { x: 0, y: 0, z: 0 },
                  angularPosition: { x: 0, y: 0, z: 0 } }
        },
        road: {
          accel: { prevFiltered: { x: 0, y: 0, z: 0 }, 
                   velocity: { x: 0, y: 0, z: 0 },
                   position: { x: 0, y: 0, z: 0 } },
          gyro: { prevFiltered: { x: 0, y: 0, z: 0 },
                  angularPosition: { x: 0, y: 0, z: 0 } }
        }
      };
      
      // Integration time tracking
      this.lastTimestamp = 0;
      
      // Constants
      this.GRAVITY = 9.81; // m/s²
      
      console.log('EnhancedSensorProcessor initialized');
    }
    
    /**
     * Reset all filters and integrators
     */
    reset() {
      Object.keys(this.state).forEach(perspective => {
        this.state[perspective].accel.prevFiltered = { x: 0, y: 0, z: 0 };
        this.state[perspective].accel.velocity = { x: 0, y: 0, z: 0 };
        this.state[perspective].accel.position = { x: 0, y: 0, z: 0 };
        
        this.state[perspective].gyro.prevFiltered = { x: 0, y: 0, z: 0 };
        this.state[perspective].gyro.angularPosition = { x: 0, y: 0, z: 0 };
      });
      
      this.lastTimestamp = 0;
      console.log('EnhancedSensorProcessor reset');
    }
    
    /**
     * Update filter settings
     * @param {Object} settings - New filter settings
     */
    updateFilterSettings(settings) {
      if (settings?.driver?.accel) {
        this.filterSettings.driver.accel = {...this.filterSettings.driver.accel, ...settings.driver.accel};
      }
      if (settings?.driver?.gyro) {
        this.filterSettings.driver.gyro = {...this.filterSettings.driver.gyro, ...settings.driver.gyro};
      }
      if (settings?.vehicle?.accel) {
        this.filterSettings.vehicle.accel = {...this.filterSettings.vehicle.accel, ...settings.vehicle.accel};
      }
      if (settings?.vehicle?.gyro) {
        this.filterSettings.vehicle.gyro = {...this.filterSettings.vehicle.gyro, ...settings.vehicle.gyro};
      }
      if (settings?.road?.accel) {
        this.filterSettings.road.accel = {...this.filterSettings.road.accel, ...settings.road.accel};
      }
      if (settings?.road?.gyro) {
        this.filterSettings.road.gyro = {...this.filterSettings.road.gyro, ...settings.road.gyro};
      }
      
      console.log('Filter settings updated');
    }
    
    /**
     * Process accelerometer data through all filter levels
     * @param {Object} rawData - Raw accelerometer data
     * @returns {Object} - Processed data with multiple filter levels
     */
    processAccelerometerData(rawData) {
      if (!rawData) return null;
      
      try {
        // Extract timestamp and ensure it's numeric
        const timestamp = rawData.timestamp || Date.now();
        
        // Calculate time delta for integration
        const dt = this.calculateTimeDelta(timestamp);
        
        // Extract raw values with consistent mapping (matching mobile app)
        const rawX = rawData.x || 0; // Longitudinal in vehicle coordinates
        const rawY = rawData.y || 0; // Lateral in vehicle coordinates
        const rawZ = rawData.z || 0; // Vertical in vehicle coordinates
        
        // Get data with consistent property structure
        const data = {
          raw: { x: rawX, y: rawY, z: rawZ, timestamp },
          timestamp,
          driver: { filtered: {}, velocity: {}, position: {} },
          vehicle: { filtered: {}, velocity: {}, position: {} },
          road: { filtered: {}, velocity: {}, position: {} }
        };
        
        // Process each perspective
        ['driver', 'vehicle', 'road'].forEach(perspective => {
          // Apply perspective-specific filtering
          const filtered = this.applyLowPassFilter(
            { x: rawX, y: rawY, z: rawZ },
            this.state[perspective].accel.prevFiltered,
            this.filterSettings[perspective].accel
          );
          
          // Store filtered values
          data[perspective].filtered = { ...filtered, timestamp };
          this.state[perspective].accel.prevFiltered = { ...filtered };
          
          // Apply integration to calculate velocity - but only if we have a valid time delta
          if (dt > 0 && dt < 0.5) { // Sanity check on dt (prevent huge jumps)
            // Convert G to m/s² and integrate to velocity
            const newVelocity = {
              x: this.state[perspective].accel.velocity.x + filtered.x * this.GRAVITY * dt,
              y: this.state[perspective].accel.velocity.y + filtered.y * this.GRAVITY * dt,
              z: this.state[perspective].accel.velocity.z + filtered.z * this.GRAVITY * dt
            };
            
            // Apply a decay factor to velocity (prevents drift)
            const decayFactor = perspective === 'road' ? 0.9 : 0.95;
            this.state[perspective].accel.velocity = {
              x: newVelocity.x * decayFactor,
              y: newVelocity.y * decayFactor,
              z: newVelocity.z * decayFactor
            };
            
            // Integrate velocity to position
            this.state[perspective].accel.position = {
              x: this.state[perspective].accel.position.x + this.state[perspective].accel.velocity.x * dt,
              y: this.state[perspective].accel.position.y + this.state[perspective].accel.velocity.y * dt,
              z: this.state[perspective].accel.position.z + this.state[perspective].accel.velocity.z * dt
            };
            
            // For road perspective, apply high-pass filter to position (removes long-term drift)
            if (perspective === 'road') {
              this.state[perspective].accel.position = {
                x: this.state[perspective].accel.position.x * 0.9,
                y: this.state[perspective].accel.position.y * 0.9,
                z: this.state[perspective].accel.position.z * 0.9
              };
            }
          }
          
          // Store integrated values
          data[perspective].velocity = { ...this.state[perspective].accel.velocity, timestamp };
          data[perspective].position = { ...this.state[perspective].accel.position, timestamp };
        });
        
        // Add computed metrics for driver behavior analysis
        data.metrics = this.computeAccelMetrics(data);
        
        // Update last timestamp
        this.lastTimestamp = timestamp;
        
        return data;
      } catch (error) {
        console.error('Error in enhanced accelerometer processing:', error);
        return {
          raw: rawData,
          error: true,
          errorMessage: error.message
        };
      }
    }
    
    /**
     * Process gyroscope data through all filter levels
     * @param {Object} rawData - Raw gyroscope data
     * @returns {Object} - Processed data with multiple filter levels
     */
    processGyroscopeData(rawData) {
      if (!rawData) return null;
      console.log('Processing gyro data:', rawData);

      try {
        // Extract timestamp and ensure it's numeric
        const timestamp = rawData.timestamp || Date.now();
        
        // Calculate time delta for integration
        const dt = this.calculateTimeDelta(timestamp);
        
        // Extract raw values with consistent mapping
        const rawX = rawData.roll || 0; // Roll rate
        const rawY = rawData.pitch || 0; // Pitch rate
        const rawZ = rawData.yaw || 0; // Yaw rate
        
        console.log('Extracted gyro raw values:', { rawX, rawY, rawZ });

        // Get data with consistent property structure
        const data = {
          raw: { x: rawX, y: rawY, z: rawZ, timestamp },
          timestamp,
          driver: { filtered: {}, angularPosition: {} },
          vehicle: { filtered: {}, angularPosition: {} },
          road: { filtered: {}, angularPosition: {} }
        };
        
        // Process each perspective
        ['driver', 'vehicle', 'road'].forEach(perspective => {
          // Apply perspective-specific filtering
          const filtered = this.applyLowPassFilter(
            { x: rawX, y: rawY, z: rawZ },
            this.state[perspective].gyro.prevFiltered,
            this.filterSettings[perspective].gyro
          );
          
          // Store filtered values
          data[perspective].filtered = { ...filtered, timestamp };
          this.state[perspective].gyro.prevFiltered = { ...filtered };
          
          // Integrate to get angular position
          if (dt > 0 && dt < 0.5) {
            this.state[perspective].gyro.angularPosition = {
              x: this.state[perspective].gyro.angularPosition.x + filtered.x * dt,
              y: this.state[perspective].gyro.angularPosition.y + filtered.y * dt,
              z: this.state[perspective].gyro.angularPosition.z + filtered.z * dt
            };
            
            // Apply a decay factor for road (prevents drift)
            if (perspective === 'road') {
              this.state[perspective].gyro.angularPosition = {
                x: this.state[perspective].gyro.angularPosition.x * 0.9,
                y: this.state[perspective].gyro.angularPosition.y * 0.9,
                z: this.state[perspective].gyro.angularPosition.z * 0.9
              };
            }
          }
          
          // Store integrated values
          data[perspective].angularPosition = {
            ...this.state[perspective].gyro.angularPosition,
            timestamp
          };
        });
        
        // Add computed metrics for vehicle dynamics analysis
        data.metrics = this.computeGyroMetrics(data);
        
        // Update last timestamp
        this.lastTimestamp = timestamp;
        
        return data;
      } catch (error) {
        console.error('Error in enhanced gyroscope processing:', error);
        return {
          raw: rawData,
          error: true,
          errorMessage: error.message
        };
      }
    }
    
    /**
     * Calculate time delta in seconds
     * @param {number} timestamp - Current timestamp in ms
     * @returns {number} - Time delta in seconds
     */
    calculateTimeDelta(timestamp) {
      if (!this.lastTimestamp) {
        return 0;
      }
      
      return (timestamp - this.lastTimestamp) / 1000; // Convert to seconds
    }
    
    /**
     * Apply low-pass filter for smoothing
     * @param {Object} newValues - New values {x, y, z}
     * @param {Object} prevFiltered - Previous filtered values {x, y, z}
     * @param {Object} filter - Filter coefficients {x, y, z}
     * @returns {Object} - Filtered values {x, y, z}
     */
    applyLowPassFilter(newValues, prevFiltered, filter) {
      return {
        x: filter.x * newValues.x + (1 - filter.x) * prevFiltered.x,
        y: filter.y * newValues.y + (1 - filter.y) * prevFiltered.y,
        z: filter.z * newValues.z + (1 - filter.z) * prevFiltered.z
      };
    }
    
    /**
     * Compute additional metrics from accelerometer data
     * @param {Object} data - Processed accelerometer data
     * @returns {Object} - Computed metrics
     */
    computeAccelMetrics(data) {
      // Driver smoothness (measure of how abruptly driver changes inputs)
      // Lower values indicate smoother driving
      const driverInputRate = Math.sqrt(
        Math.pow(data.driver.filtered.x - this.state.driver.accel.prevFiltered.x, 2) +
        Math.pow(data.driver.filtered.y - this.state.driver.accel.prevFiltered.y, 2)
      ) * 100; // Scale for readability
      
      // Vehicle stability (measure of vehicle body control)
      // Lower values indicate more stable vehicle
      const vehicleStability = Math.sqrt(
        Math.pow(data.vehicle.filtered.x, 2) +
        Math.pow(data.vehicle.filtered.y, 2) +
        Math.pow(data.vehicle.filtered.z, 2)
      );
      
      // Road roughness indicator
      // Higher values indicate rougher road
      const roadRoughness = Math.abs(data.road.filtered.z) * 10; // Scale for readability
      
      return {
        driverInputRate,
        vehicleStability,
        roadRoughness
      };
    }
    
    /**
     * Compute additional metrics from gyroscope data
     * @param {Object} data - Processed gyroscope data
     * @returns {Object} - Computed metrics
     */
    computeGyroMetrics(data) {
      // Driver steering behavior (measure of steering input)
      // Higher values indicate more active steering
      const steeringActivity = Math.abs(data.driver.filtered.z) * 10; // Scale for readability
      
      // Vehicle roll/pitch stability
      // Lower values indicate more stable vehicle
      const vehicleAttitudeStability = Math.sqrt(
        Math.pow(data.vehicle.filtered.x, 2) + // Roll rate
        Math.pow(data.vehicle.filtered.y, 2)   // Pitch rate
      );
      
      // Understeer/Oversteer indicator
      // Positive: understeer tendency, Negative: oversteer tendency
      // This is a simplified model - would need speed data for accurate calculation
      const turnInBalance = data.vehicle.filtered.z === 0 ? 
        0 : data.driver.filtered.z / data.vehicle.filtered.z;
      
      return {
        steeringActivity,
        vehicleAttitudeStability,
        turnInBalance: isFinite(turnInBalance) ? turnInBalance : 0
      };
    }
    
    /**
     * Set filter coefficients
     * @param {string} perspective - 'driver', 'vehicle', or 'road'
     * @param {string} sensor - 'accel' or 'gyro'
     * @param {Object} coefficients - Filter coefficients {x, y, z}
     */
    setFilterCoefficients(perspective, sensor, coefficients) {
      if (this.filterSettings[perspective] && this.filterSettings[perspective][sensor]) {
        this.filterSettings[perspective][sensor] = {
          ...this.filterSettings[perspective][sensor],
          ...coefficients
        };
        
        console.log(`Updated ${perspective} ${sensor} filter coefficients`);
        return true;
      }
      
      console.error(`Invalid perspective (${perspective}) or sensor (${sensor})`);
      return false;
    }
    
    /**
     * Get current filter settings
     * @returns {Object} - Current filter settings
     */
    getFilterSettings() {
      return JSON.parse(JSON.stringify(this.filterSettings));
    }
  }
  
  export default new EnhancedSensorProcessor();