// CalibrationManager.js - Handles sensor calibration
import { useState } from 'react';

class CalibrationManager {
  constructor() {
    this.isCalibrating = false;
    this.calibrationSamples = [];
    this.calibrationProgress = 0;
    this.calibrationMatrix = null;
    this.onCalibrationStart = null;
    this.onCalibrationProgress = null;
    this.onCalibrationComplete = null;
    this.onCalibrationFailed = null;
    
    this.totalSamples = 5; // REDUCED FROM 30 FOR TESTING
    this.debugMode = true;
    
    console.log('CalibrationManager initialized');
  }
  debug(message) {
    if (this.debugMode) {
      console.log(`[CalibrationManager] ${message}`);
    }
  }

  // Set callback functions
  setCallbacks(callbacks) {
    this.onCalibrationStart = callbacks.onCalibrationStart || null;
    this.onCalibrationProgress = callbacks.onCalibrationProgress || null;
    this.onCalibrationComplete = callbacks.onCalibrationComplete || null;
    this.onCalibrationFailed = callbacks.onCalibrationFailed || null;
  }

  // Get calibration matrix
  getCalibrationMatrix() {
    return this.calibrationMatrix;
  }

  // Check if calibration is in progress
  isCalibrationInProgress() {
    return this.isCalibrating;
  }

  // Get calibration progress (0-1)
  getCalibrationProgress() {
    return this.calibrationProgress;
  }

  // Start calibration process
  // CalibrationManager.js - Handles sensor calibration
import { useState } from 'react';

class CalibrationManager {
  constructor() {
    this.isCalibrating = false;
    this.calibrationSamples = [];
    this.calibrationProgress = 0;
    this.calibrationMatrix = null;
    this.onCalibrationStart = null;
    this.onCalibrationProgress = null;
    this.onCalibrationComplete = null;
    this.onCalibrationFailed = null;
    
    this.totalSamples = 5; // REDUCED FROM 30 FOR TESTING
    this.debugMode = true;
    
    console.log('CalibrationManager initialized');
  }
  debug(message) {
    if (this.debugMode) {
      console.log(`[CalibrationManager] ${message}`);
    }
  }

  // Set callback functions
  setCallbacks(callbacks) {
    this.onCalibrationStart = callbacks.onCalibrationStart || null;
    this.onCalibrationProgress = callbacks.onCalibrationProgress || null;
    this.onCalibrationComplete = callbacks.onCalibrationComplete || null;
    this.onCalibrationFailed = callbacks.onCalibrationFailed || null;
  }

  // Get calibration matrix
  getCalibrationMatrix() {
    return this.calibrationMatrix;
  }

  // Check if calibration is in progress
  isCalibrationInProgress() {
    return this.isCalibrating;
  }

  // Get calibration progress (0-1)
  getCalibrationProgress() {
    return this.calibrationProgress;
  }

  // Start calibration process
  startCalibration() {
    console.log("startCalibration called");
    
    if (this.isCalibrating) {
      console.log('Calibration already in progress');
      return false;
    }
    
    this.isCalibrating = true;
    this.calibrationSamples = [];
    this.calibrationProgress = 0;
    
    console.log("Calibration initialized with callbacks:", {
      onStart: !!this.onCalibrationStart,
      onProgress: !!this.onCalibrationProgress,
      onComplete: !!this.onCalibrationComplete,
      onFailed: !!this.onCalibrationFailed
    });
    
    if (this.onCalibrationStart) {
      this.onCalibrationStart();
    } else {
      console.log("WARNING: onCalibrationStart callback is not set");
    }
    
    console.log('Calibration started, waiting for samples');
    return true;
  }

  // Add calibration sample
  // Add calibration sample
addCalibrationSample(data) {
  if (!this.isCalibrating) return false;
  
  // Add current sample
  this.calibrationSamples.push({
    x: data.x,
    y: data.y,
    z: data.z
  });
  
  // Debug logging
  this.debug(`Sample added: ${this.calibrationSamples.length}/${this.totalSamples}`);
  
  // Update progress
  this.calibrationProgress = this.calibrationSamples.length / this.totalSamples;
  
  if (this.onCalibrationProgress) {
    this.onCalibrationProgress(this.calibrationProgress);
  }
  
  // Check if we have enough samples
  if (this.calibrationSamples.length >= this.totalSamples) {
    this.finalizeCalibration();
  }
  
  return true;
}

  // Cancel calibration
  cancelCalibration() {
    if (!this.isCalibrating) return false;
    
    this.isCalibrating = false;
    this.calibrationSamples = [];
    this.calibrationProgress = 0;
    
    console.log('Calibration cancelled');
    return true;
  }

  // Finalize calibration by calculating calibration matrix
  finalizeCalibration() {
    if (!this.isCalibrating || this.calibrationSamples.length === 0) {
      if (this.onCalibrationFailed) {
        this.onCalibrationFailed('No calibration samples collected');
      }
      this.isCalibrating = false;
      return false;
    }
    
    try {
      // Average the samples
      const avgX = this.calibrationSamples.reduce((sum, sample) => sum + sample.x, 0) / this.calibrationSamples.length;
      const avgY = this.calibrationSamples.reduce((sum, sample) => sum + sample.y, 0) / this.calibrationSamples.length;
      const avgZ = this.calibrationSamples.reduce((sum, sample) => sum + sample.z, 0) / this.calibrationSamples.length;
      
      console.log('Calibration samples averaged:', { x: avgX, y: avgY, z: avgZ });
      
      // Calculate magnitude of the averaged vector
      const magnitude = Math.sqrt(avgX * avgX + avgY * avgY + avgZ * avgZ);
      
      const gx = avgX / magnitude;
      const gy = avgY / magnitude;
      const gz = avgZ / magnitude;
      
      // Create calibration matrix
      this.calibrationMatrix = {
        xx: Math.sqrt(1 - gx * gx),
        xy: -gx * gy / Math.sqrt(1 - gx * gx),
        xz: -gx * gz / Math.sqrt(1 - gx * gx),
        yx: 0,
        yy: gz / Math.sqrt(gz * gz + gy * gy),
        yz: -gy / Math.sqrt(gz * gz + gy * gy),
        zx: gx,
        zy: gy,
        zz: gz,
        initialX: avgX,
        initialY: avgY,
        initialZ: avgZ
      };
      
      console.log('Calibration matrix calculated:', this.calibrationMatrix);
      
      // Reset calibration state
      this.isCalibrating = false;
      this.calibrationSamples = [];
      this.calibrationProgress = 0;
      
      // Notify completion
      if (this.onCalibrationComplete) {
        this.onCalibrationComplete(this.calibrationMatrix);
      }
      
      return true;
    } catch (error) {
      console.error('Error calculating calibration matrix:', error);
      
      if (this.onCalibrationFailed) {
        this.onCalibrationFailed(error.message);
      }
      
      this.isCalibrating = false;
      return false;
    }
  }

  // Apply calibration to sensor reading
  applyCalibration(data) {
    if (!this.calibrationMatrix) {
      return {
        lateral: data.y,
        longitudinal: data.x,
        vertical: data.z,
        raw_x: data.x,
        raw_y: data.y,
        raw_z: data.z
      };
    }
    
    const { xx, xy, xz, yx, yy, yz, zx, zy, zz, initialX, initialY, initialZ } = this.calibrationMatrix;
    
    return {
      lateral: xx * data.x + xy * data.y + xz * data.z,
      longitudinal: yx * data.x + yy * data.y + yz * data.z,
      vertical: (zx * data.x + zy * data.y + zz * data.z) - 
                (zx * initialX + zy * initialY + zz * initialZ),
      raw_x: data.x,
      raw_y: data.y,
      raw_z: data.z
    };
  }
}

export default new CalibrationManager();

  // Add calibration sample
  // Add calibration sample
addCalibrationSample(data) {
  if (!this.isCalibrating) return false;
  
  // Add current sample
  this.calibrationSamples.push({
    x: data.x,
    y: data.y,
    z: data.z
  });
  
  // Debug logging
  this.debug(`Sample added: ${this.calibrationSamples.length}/${this.totalSamples}`);
  
  // Update progress
  this.calibrationProgress = this.calibrationSamples.length / this.totalSamples;
  
  if (this.onCalibrationProgress) {
    this.onCalibrationProgress(this.calibrationProgress);
  }
  
  // Check if we have enough samples
  if (this.calibrationSamples.length >= this.totalSamples) {
    this.finalizeCalibration();
  }
  
  return true;
}

  // Cancel calibration
  cancelCalibration() {
    if (!this.isCalibrating) return false;
    
    this.isCalibrating = false;
    this.calibrationSamples = [];
    this.calibrationProgress = 0;
    
    console.log('Calibration cancelled');
    return true;
  }

  // Finalize calibration by calculating calibration matrix
  finalizeCalibration() {
    if (!this.isCalibrating || this.calibrationSamples.length === 0) {
      if (this.onCalibrationFailed) {
        this.onCalibrationFailed('No calibration samples collected');
      }
      this.isCalibrating = false;
      return false;
    }
    
    try {
      // Average the samples
      const avgX = this.calibrationSamples.reduce((sum, sample) => sum + sample.x, 0) / this.calibrationSamples.length;
      const avgY = this.calibrationSamples.reduce((sum, sample) => sum + sample.y, 0) / this.calibrationSamples.length;
      const avgZ = this.calibrationSamples.reduce((sum, sample) => sum + sample.z, 0) / this.calibrationSamples.length;
      
      console.log('Calibration samples averaged:', { x: avgX, y: avgY, z: avgZ });
      
      // Calculate magnitude of the averaged vector
      const magnitude = Math.sqrt(avgX * avgX + avgY * avgY + avgZ * avgZ);
      
      const gx = avgX / magnitude;
      const gy = avgY / magnitude;
      const gz = avgZ / magnitude;
      
      // Create calibration matrix
      this.calibrationMatrix = {
        xx: Math.sqrt(1 - gx * gx),
        xy: -gx * gy / Math.sqrt(1 - gx * gx),
        xz: -gx * gz / Math.sqrt(1 - gx * gx),
        yx: 0,
        yy: gz / Math.sqrt(gz * gz + gy * gy),
        yz: -gy / Math.sqrt(gz * gz + gy * gy),
        zx: gx,
        zy: gy,
        zz: gz,
        initialX: avgX,
        initialY: avgY,
        initialZ: avgZ
      };
      
      console.log('Calibration matrix calculated:', this.calibrationMatrix);
      
      // Reset calibration state
      this.isCalibrating = false;
      this.calibrationSamples = [];
      this.calibrationProgress = 0;
      
      // Notify completion
      if (this.onCalibrationComplete) {
        this.onCalibrationComplete(this.calibrationMatrix);
      }
      
      return true;
    } catch (error) {
      console.error('Error calculating calibration matrix:', error);
      
      if (this.onCalibrationFailed) {
        this.onCalibrationFailed(error.message);
      }
      
      this.isCalibrating = false;
      return false;
    }
  }

  // Apply calibration to sensor reading
  applyCalibration(data) {
    if (!this.calibrationMatrix) {
      return {
        lateral: data.y,
        longitudinal: data.x,
        vertical: data.z,
        raw_x: data.x,
        raw_y: data.y,
        raw_z: data.z
      };
    }
    
    const { xx, xy, xz, yx, yy, yz, zx, zy, zz, initialX, initialY, initialZ } = this.calibrationMatrix;
    
    return {
      lateral: xx * data.x + xy * data.y + xz * data.z,
      longitudinal: yx * data.x + yy * data.y + yz * data.z,
      vertical: (zx * data.x + zy * data.y + zz * data.z) - 
                (zx * initialX + zy * initialY + zz * initialZ),
      raw_x: data.x,
      raw_y: data.y,
      raw_z: data.z
    };
  }
}

export default new CalibrationManager();