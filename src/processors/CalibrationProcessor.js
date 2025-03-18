// CalibrationProcessor.js
class CalibrationProcessor {
  constructor() {
    // Calibration state
    this.isCalibrating = false;
    this.calibrationSamples = [];
    this.targetSampleCount = 30; // Reduced for easier calibration
    
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
    
  // Set up a sampling interval to collect samples automatically
  // We'll monitor progress every 500ms
  this.samplingInterval = setInterval(() => {
  }, 500);


  // Auto-complete after 20 seconds for testing
  console.log('Setting up auto-completion timer');
  setTimeout(() => {
    console.log('Auto-completion timer fired');
    if (this.isCalibrating) {
      console.log('Auto-completing calibration for testing');
      
      // Add dummy samples if none were collected
      if (this.calibrationSamples.length === 0) {
        for (let i = 0; i < 5; i++) {
          this.calibrationSamples.push({
            timestamp: Date.now(),
            x: 0, y: 0, z: 1 // Dummy data
          });
        }
      }
      
      this.completeCalibration();
    } else {
      console.log('Calibration already completed before auto-completion timer');
    }
  }, 20000);
  

    return true;
  }
  
  // Add a sample during calibration
  addCalibrationSample(sampleData) {
    if (!this.isCalibrating) {
      console.log("Not calibrating, sample ignored");
      return false;
    }
      // More detailed logging and data validation
  console.log("Adding calibration sample with data:", JSON.stringify(sampleData));
  
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
    
    // Clean up timers
    if (this.samplingInterval) {
      clearInterval(this.samplingInterval);
      this.samplingInterval = null;
    }

    if (this.safetyTimeout) {
      clearTimeout(this.safetyTimeout);
      this.safetyTimeout = null;
    }

    console.log(`Completed calibration with ${this.calibrationSamples.length} samples`);
    
    // For now, just log the samples, don't calculate anything
    const averageX = this.calibrationSamples.reduce((sum, sample) => sum + sample.x, 0) / this.calibrationSamples.length;
    const averageY = this.calibrationSamples.reduce((sum, sample) => sum + sample.y, 0) / this.calibrationSamples.length;
    const averageZ = this.calibrationSamples.reduce((sum, sample) => sum + sample.z, 0) / this.calibrationSamples.length;
    
    console.log(`Average values - X: ${averageX}, Y: ${averageY}, Z: ${averageZ}`);
    
    this.isCalibrating = false;
    
    if (this.onCalibrationCompleted) {
      this.onCalibrationCompleted({
        sampleCount: this.calibrationSamples.length,
        averageX,
        averageY,
        averageZ
      });
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
      
        // Clean up timers
    if (this.samplingInterval) {
      clearInterval(this.samplingInterval);
      this.samplingInterval = null;
    }
    
    if (this.safetyTimeout) {
      clearTimeout(this.safetyTimeout);
      this.safetyTimeout = null;
    }
    
    this.isCalibrating = false;
    this.calibrationSamples = [];
    
    if (this.onCalibrationCancelled) {
      this.onCalibrationCancelled();
    }
    
    return true;
  }
  
  // Apply calibration to raw sensor data
  applyCalibration(data) {
    // Just pass through the data for now
    return {
      raw_x: data.x,
      raw_y: data.y, 
      raw_z: data.z,
      x: data.x,
      y: data.y,
      z: data.z
    };
  }
}

// Export as singleton
export default new CalibrationProcessor();