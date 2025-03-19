// src/processors/CalibrationProcessor.js
import CoordinateTransformer from './CoordinateTransformer';

class CalibrationProcessor {
  constructor() {
    // Calibration state
    this.isCalibrating = false;
    this.calibrationSamples = [];
    this.targetSampleCount = 30; // Number of samples to collect
    
    // Callback references
    this.onCalibrationStarted = null;
    this.onCalibrationProgress = null;
    this.onCalibrationCompleted = null;
    this.onCalibrationCancelled = null;
    
    console.log('CalibrationProcessor initialized');
  }
  
  // Register event handlers
  registerCallbacks(callbacks) {
    if (callbacks.onCalibrationStarted) {
      this.onCalibrationStarted = callbacks.onCalibrationStarted;
    }
    
    if (callbacks.onCalibrationProgress) {
      this.onCalibrationProgress = callbacks.onCalibrationProgress;
    }
    
    if (callbacks.onCalibrationCompleted) {
      this.onCalibrationCompleted = callbacks.onCalibrationCompleted;
    }
    
    if (callbacks.onCalibrationCancelled) {
      this.onCalibrationCancelled = callbacks.onCalibrationCancelled;
    }
    
    console.log('Calibration callbacks registered');
    return this;
  }
  
  // Start calibration process
  startCalibration() {
    if (this.isCalibrating) {
      console.log('Calibration already in progress');
      return false;
    }
    
    console.log('Starting calibration sample collection');
    this.isCalibrating = true;
    this.calibrationSamples = [];
    
    if (this.onCalibrationStarted) {
      this.onCalibrationStarted();
    }
    
    return true;
  }
  
  // Add a sample during calibration
  addCalibrationSample(sampleData) {
    if (!this.isCalibrating) {
      console.log("Not calibrating, sample ignored");
      return false;
    }
    
    // Store the sample
    this.calibrationSamples.push({
      timestamp: Date.now(),
      x: sampleData.x,
      y: sampleData.y,
      z: sampleData.z
    });
    
    // Calculate and report progress
    const progress = this.calibrationSamples.length / this.targetSampleCount;
    console.log(`Calibration sample ${this.calibrationSamples.length}/${this.targetSampleCount} added. Progress: ${(progress * 100).toFixed(0)}%`);
    
    if (this.onCalibrationProgress) {
      this.onCalibrationProgress(progress);
    }
    
    // Check if we have enough samples
    if (this.calibrationSamples.length >= this.targetSampleCount) {
      console.log("Target sample count reached, completing calibration");
      this.completeCalibration();
    }
    
    return true;
  }
  
  // Complete the calibration process
  completeCalibration() {
    if (!this.isCalibrating) {
      return false;
    }
    
    console.log(`Completed calibration with ${this.calibrationSamples.length} samples`);
    
    // Calculate statistics from calibration samples
    const averageX = this.calibrationSamples.reduce((sum, sample) => sum + sample.x, 0) 
                   / this.calibrationSamples.length;
    const averageY = this.calibrationSamples.reduce((sum, sample) => sum + sample.y, 0)
                   / this.calibrationSamples.length;
    const averageZ = this.calibrationSamples.reduce((sum, sample) => sum + sample.z, 0)
                   / this.calibrationSamples.length;
    
    // Calculate the vector magnitude (should be close to 1G)
    const magnitude = Math.sqrt(averageX * averageX + averageY * averageY + averageZ * averageZ);
    
    console.log(`Average values - X: ${averageX}, Y: ${averageY}, Z: ${averageZ}, Magnitude: ${magnitude}`);
    
    this.isCalibrating = false;
    
    const calibrationResults = {
      sampleCount: this.calibrationSamples.length,
      averageX,
      averageY,
      averageZ,
      magnitude,
      success: true
    };
    
    if (this.onCalibrationCompleted) {
      this.onCalibrationCompleted(calibrationResults);
    }
    
    return true;
  }
  
  // Cancel ongoing calibration
  cancelCalibration() {
    if (!this.isCalibrating) {
      console.log("No calibration in progress to cancel");
      return false;
    }
    
    console.log("Cancelling calibration");
    
    this.isCalibrating = false;
    this.calibrationSamples = [];
    
    if (this.onCalibrationCancelled) {
      this.onCalibrationCancelled();
    }
    
    return true;
  }
  
  // Apply calibration to raw sensor data
  applyCalibration(data) {
    // For now, just use the CoordinateTransformer's basic function
    return CoordinateTransformer.applyTransformation(data);
  }
  
  // Check if calibration is active
  isCalibrationActive() {
    return this.isCalibrating;
  }
  
  // Reset both the calibration processor and the coordinate transformer
  reset() {
    this.cancelCalibration();
    CoordinateTransformer.reset();
    console.log('Calibration system fully reset');
    return true;
  }
}

// Export as singleton
export default new CalibrationProcessor();