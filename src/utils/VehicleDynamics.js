// src/utils/VehicleDynamics.js
import ConfigurationManager from '../managers/ConfigurationManager';

/**
 * Utility class for calculating vehicle dynamics from sensor data
 */
class VehicleDynamics {
  constructor() {
    // Constants
    this.GRAVITY = 9.81; // m/s²
    
    // State variables
    this.lastUpdateTime = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.velocityZ = 0;
    
    // Load configuration
    this.updateConfigFromManager();
    
    console.log('VehicleDynamics initialized');
  }
  
  /**
   * Update configuration from ConfigurationManager
   */
  updateConfigFromManager() {
    // Get vehicle configuration
    const vehicleConfig = ConfigurationManager.getCategory('vehicle');
    
    // Update local configuration
    this.useGPSSpeed = vehicleConfig.useGPSSpeed;
    this.performanceLevel = {
      braking: vehicleConfig.maxBraking,
      acceleration: vehicleConfig.maxAcceleration,
      cornering: vehicleConfig.maxLateral
    };
    
    console.log('VehicleDynamics configuration updated', this.performanceLevel);
  }
  
  /**
   * Reset the dynamics calculations
   */
  reset() {
    this.lastUpdateTime = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.velocityZ = 0;
    this.updateConfigFromManager();
    console.log('VehicleDynamics reset');
  }
  
  /**
   * Get a color representing the acceleration intensity relative to vehicle limits
   * 
   * @param {number} value - The acceleration value in G's
   * @param {string} type - The type of acceleration ('lateral', 'longitudinal', or 'vertical')
   * @returns {string} - A color in hex format
   */
  getAccelerationColor(value, type) {
    let maxValue;
    
    // Set the maximum value based on the type
    switch (type) {
      case 'lateral':
        maxValue = this.performanceLevel.cornering;
        break;
      case 'longitudinal':
        maxValue = value < 0 
          ? this.performanceLevel.braking 
          : this.performanceLevel.acceleration;
        break;
      case 'vertical':
        maxValue = 1.0; // Standard value for vertical acceleration
        break;
      default:
        maxValue = 1.0;
    }
    
    // Calculate the percentage of the maximum
    const percentage = Math.min(Math.abs(value) / maxValue, 1);
    
    // Generate color from green to yellow to red
    if (percentage <= 0.5) {
      // Green to yellow (0% to 50%)
      const g = 255;
      const r = Math.round(255 * (percentage * 2));
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}00`;
    } else {
      // Yellow to red (50% to 100%)
      const r = 255;
      const g = Math.round(255 * (1 - (percentage - 0.5) * 2));
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}00`;
    }
  }
  
  /**
   * Calculate the traction circle utilization
   * 
   * @param {Object} accelData - The accelerometer data
   * @param {boolean} showProcessed - Whether data is in processed mode
   * @returns {number} - The percentage of traction circle used (0-100)
   */
  calculateTractionCircle(accelData, showProcessed = true) {
    if (!accelData) return 0;
    
    let lateral, longitudinal;
    
    // Consistently extract the lateral and longitudinal values
    if (showProcessed && accelData.lateral !== undefined) {
      // Use domain-specific properties if in processed mode and they exist
      lateral = accelData.lateral;
      longitudinal = accelData.longitudinal;
    } else if (accelData.filtered) {
      // Use filtered x/y if available
      lateral = accelData.filtered.y; // Y-axis is lateral
      longitudinal = accelData.filtered.x; // X-axis is longitudinal
    } else if (accelData.transformed) {
      // Use transformed x/y if filtered not available
      lateral = accelData.transformed.y; // Y-axis is lateral
      longitudinal = accelData.transformed.x; // X-axis is longitudinal
    } else {
      // Direct raw data
      lateral = accelData.y; // Y-axis is lateral
      longitudinal = accelData.x; // X-axis is longitudinal
    }
    
    // Handle undefined values
    lateral = lateral || 0;
    longitudinal = longitudinal || 0;
    
    // Calculate combined G-force
    const combinedG = Math.sqrt(
      Math.pow(lateral, 2) + 
      Math.pow(longitudinal, 2)
    );
    
    // Determine the direction (acceleration vs braking)
    const direction = longitudinal >= 0 ? 'acceleration' : 'braking';
    
    // Calculate the angle of the acceleration vector in the lateral-longitudinal plane
    const angle = Math.atan2(lateral, Math.abs(longitudinal));
    
    // Calculate the maximum traction available at this angle
    let maxLateral = this.performanceLevel.cornering;
    let maxLongitudinal = direction === 'acceleration' 
      ? this.performanceLevel.acceleration 
      : this.performanceLevel.braking;
    
    // The radius of the ellipse at this angle
    const maxG = (maxLateral * maxLongitudinal) / 
      Math.sqrt(
        Math.pow(maxLongitudinal * Math.sin(angle), 2) + 
        Math.pow(maxLateral * Math.cos(angle), 2)
      );
    
    // Calculate percentage of maximum traction used
    const tractionUsed = (combinedG / maxG) * 100;
    
    return Math.min(tractionUsed, 100);
  }
  
  /**
   * Calculate vehicle dynamics based on acceleration data
   * 
   * @param {Object} accelData - The accelerometer data
   * @param {number} speed - Current speed in m/s from GPS
   * @param {boolean} showProcessed - Whether data is in processed mode
   * @returns {Object} - Vehicle dynamics information
   */
  calculateDynamics(accelData, speed = null, showProcessed = true) {
    if (!accelData) return null;
    
    const now = Date.now();
    
    let lateral, longitudinal, vertical;
    
    // Consistently extract the lateral, longitudinal, and vertical values
    if (showProcessed && accelData.lateral !== undefined) {
      // Use domain-specific properties if in processed mode and they exist
      lateral = accelData.lateral;
      longitudinal = accelData.longitudinal;
      vertical = accelData.vertical;
    } else if (accelData.filtered) {
      // Use filtered values if available
      lateral = accelData.filtered.y; // Y-axis is lateral
      longitudinal = accelData.filtered.x; // X-axis is longitudinal
      vertical = accelData.filtered.z; // Z-axis is vertical
    } else if (accelData.transformed) {
      // Use transformed values if filtered not available
      lateral = accelData.transformed.y; // Y-axis is lateral
      longitudinal = accelData.transformed.x; // X-axis is longitudinal
      vertical = accelData.transformed.z; // Z-axis is vertical
    } else {
      // Direct raw data
      lateral = accelData.y; // Y-axis is lateral
      longitudinal = accelData.x; // X-axis is longitudinal
      vertical = accelData.z; // Z-axis is vertical
    }
    
    // Handle undefined values
    lateral = lateral || 0;
    longitudinal = longitudinal || 0;
    vertical = vertical || 0;
    
    // Calculate time delta in seconds
    let dt = 0;
    if (this.lastUpdateTime > 0) {
      dt = (now - this.lastUpdateTime) / 1000; // Convert to seconds
    }
    this.lastUpdateTime = now;
    
    // Skip processing if time delta is too large or too small
    if (dt > 0.5 || dt <= 0) {
      return {
        lateral,
        longitudinal,
        vertical,
        lateralColor: this.getAccelerationColor(lateral, 'lateral'),
        longitudinalColor: this.getAccelerationColor(longitudinal, 'longitudinal'),
        verticalColor: this.getAccelerationColor(vertical, 'vertical'),
        tractionCircle: this.calculateTractionCircle(accelData, showProcessed)
      };
    }
    
    // Convert G forces to m/s²
    const accelX = longitudinal * this.GRAVITY;
    const accelY = lateral * this.GRAVITY;
    const accelZ = vertical * this.GRAVITY;
    
    // Simple velocity integration (used if GPS speed not available)
    if (!this.useGPSSpeed || speed === null) {
      this.velocityX += accelX * dt;
      this.velocityY += accelY * dt;
      this.velocityZ += accelZ * dt;
    } else {
      // If GPS speed is available, use it for the forward velocity
      // and just calculate lateral velocity
      this.velocityX = speed;
      this.velocityY += accelY * dt;
    }
    
    // Calculate turning radius (if speed > 1 m/s and lateral acceleration > 0.1m/s²)
    let turningRadius = null;
    if (Math.abs(this.velocityX) > 1 && Math.abs(accelY) > 0.1) {
      // R = v² / a
      turningRadius = Math.pow(this.velocityX, 2) / Math.abs(accelY);
    }
    
    // Calculate stopping distance based on current speed and typical braking deceleration
    let stoppingDistance = null;
    if (this.velocityX > 1) {
      // Typical maximum braking deceleration is about 0.8-1.0g
      const maxBrakingDecel = this.performanceLevel.braking * this.GRAVITY;
      stoppingDistance = Math.pow(this.velocityX, 2) / (2 * maxBrakingDecel);
    }
    
    return {
      lateral,
      longitudinal,
      vertical,
      lateralColor: this.getAccelerationColor(lateral, 'lateral'),
      longitudinalColor: this.getAccelerationColor(longitudinal, 'longitudinal'),
      verticalColor: this.getAccelerationColor(vertical, 'vertical'),
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      velocityZ: this.velocityZ,
      speed: Math.sqrt(Math.pow(this.velocityX, 2) + Math.pow(this.velocityY, 2)),
      turningRadius,
      stoppingDistance,
      tractionCircle: this.calculateTractionCircle(accelData, showProcessed)
    };
  }
  
  /**
   * Update the vehicle performance levels
   * 
   * @param {Object} levels - The performance levels object
   */
  setPerformanceLevels(levels) {
    if (levels && typeof levels === 'object') {
      if (typeof levels.braking === 'number') {
        this.performanceLevel.braking = levels.braking;
      }
      if (typeof levels.acceleration === 'number') {
        this.performanceLevel.acceleration = levels.acceleration;
      }
      if (typeof levels.cornering === 'number') {
        this.performanceLevel.cornering = levels.cornering;
      }
      
      // Update the configuration manager
      ConfigurationManager.updateCategory('vehicle', {
        maxBraking: this.performanceLevel.braking,
        maxAcceleration: this.performanceLevel.acceleration,
        maxLateral: this.performanceLevel.cornering
      });
    }
  }
}

// Export as singleton
export default new VehicleDynamics();