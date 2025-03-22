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
    
    // Calculate the transformation matrix from samples
    const transformMatrix = CoordinateTransformer.calculateTransformMatrix(this.calibrationSamples);
    
    // Calculate statistics from calibration samples for reporting
    const avgX = this.calibrationSamples.reduce((sum, sample) => sum + sample.x, 0) 
              / this.calibrationSamples.length;
    const avgY = this.calibrationSamples.reduce((sum, sample) => sum + sample.y, 0)
              / this.calibrationSamples.length;
    const avgZ = this.calibrationSamples.reduce((sum, sample) => sum + sample.z, 0)
              / this.calibrationSamples.length;
    
    // Calculate the vector magnitude (should be close to 1G)
    const magnitude = Math.sqrt(avgX * avgX + avgY * avgY + avgZ * avgZ);
    
    console.log(`Average values - X: ${avgX}, Y: ${avgY}, Z: ${avgZ}, Magnitude: ${magnitude}`);
    
    this.isCalibrating = false;
    
    const calibrationResults = {
      sampleCount: this.calibrationSamples.length,
      averageX: avgX,
      averageY: avgY,
      averageZ: avgZ,
      magnitude: magnitude,
      matrix: transformMatrix,
      success: !!transformMatrix
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
    if (!data) return data;
    
    // Simply delegate to the CoordinateTransformer
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