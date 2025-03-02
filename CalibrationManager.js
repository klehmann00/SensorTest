// Minimal CalibrationManager.js
class CalibrationManager {
  constructor() {
    this.calibrationMatrix = null;
  }
  
  applyCalibration(data) {
    // Just pass through data without calibration
    return {
      lateral: data.y,
      longitudinal: data.x,
      vertical: data.z,
      raw_x: data.x,
      raw_y: data.y,
      raw_z: data.z
    };
  }
}

export default new CalibrationManager();