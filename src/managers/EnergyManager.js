// src/managers/EnergyManager.js
import { AppState } from 'react-native';

/**
 * Manages energy usage and sensor update rates based on app state
 */
class EnergyManager {
  constructor() {
    // Power mode state
    this.mode = 'normal'; // 'normal', 'low', 'background'
    this.listeners = [];
    this.appState = 'active';
    this.appStateSubscription = null;
    
    // Custom configuration by mode
    this.modeConfigs = {
      normal: {
        updateInterval: {
          accelerometer: 100, // 10Hz
          gyroscope: 100,     // 10Hz
          magnetometer: 200   // 5Hz
        },
        processingLevel: 'full',
        batchSize: 1,
        cloudSyncInterval: 5000, // 5s
        motionDetection: true
      },
      low: {
        updateInterval: {
          accelerometer: 200, // 5Hz
          gyroscope: 200,     // 5Hz
          magnetometer: 500   // 2Hz
        },
        processingLevel: 'minimal',
        batchSize: 2,
        cloudSyncInterval: 10000, // 10s
        motionDetection: true
      },
      background: {
        updateInterval: {
          accelerometer: 1000, // 1Hz
          gyroscope: 1000,     // 1Hz
          magnetometer: 0      // OFF
        },
        processingLevel: 'none',
        batchSize: 5,
        cloudSyncInterval: 30000, // 30s
        motionDetection: false
      }
    };
    
    console.log('EnergyManager initialized');
  }
  
  /**
   * Start monitoring app state changes
   */
  initialize() {
    // Subscribe to AppState changes
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    
    // Set initial state
    this.appState = AppState.currentState;
    this.updatePowerMode();
    
    console.log(`EnergyManager initialized with app state: ${this.appState}`);
    return this;
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }
  
  /**
   * Handle app state changes
   * @param {string} nextAppState - New app state
   */
  handleAppStateChange = (nextAppState) => {
    console.log(`App state changed: ${this.appState} -> ${nextAppState}`);
    
    // Update stored state
    this.appState = nextAppState;
    
    // Update power mode based on app state
    this.updatePowerMode();
  }
  
  /**
   * Update power mode based on app state
   */
  updatePowerMode() {
    let newMode;
    
    // Determine power mode based on app state
    if (this.appState === 'active') {
      newMode = 'normal';
    } else if (this.appState === 'inactive') {
      newMode = 'low';
    } else {
      newMode = 'background';
    }
    
    // Set the power mode
    this.setPowerMode(newMode);
  }
  
  /**
   * Set power mode manually
   * @param {string} mode - Power mode ('normal', 'low', 'background')
   * @returns {Object} Configuration for the mode
   */
  setPowerMode(mode) {
    // Validate mode
    if (!['normal', 'low', 'background'].includes(mode)) {
      console.error(`Invalid power mode: ${mode}`);
      return this.getConfigForMode(this.mode);
    }
    
    // Skip if already in this mode
    if (mode === this.mode) {
      return this.getConfigForMode(mode);
    }
    
    const previousMode = this.mode;
    this.mode = mode;
    
    // Get configuration for the new mode
    const config = this.getConfigForMode(mode);
    
    // Notify listeners of mode change
    this.notifyListeners(mode, config);
    
    console.log(`Energy mode changed: ${previousMode} -> ${mode}`);
    return config;
  }
  
  /**
   * Get sensor configuration for power mode
   * @param {string} mode - Power mode
   * @returns {Object} Configuration for the mode
   */
  getConfigForMode(mode) {
    // Return deep copy of config to prevent modification
    return JSON.parse(JSON.stringify(this.modeConfigs[mode] || this.modeConfigs.normal));
  }
  
  /**
   * Notify listeners of mode change
   * @param {string} mode - New mode
   * @param {Object} config - Mode configuration
   */
  notifyListeners(mode, config) {
    this.listeners.forEach(listener => {
      try {
        listener(mode, config);
      } catch (error) {
        console.error('Error in power mode listener:', error);
      }
    });
  }
  
  /**
   * Subscribe to power mode changes
   * @param {Function} listener - Callback function
   * @returns {boolean} Success status
   */
  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
      
      // Notify immediately with current state
      try {
        listener(this.mode, this.getConfigForMode(this.mode));
      } catch (error) {
        console.error('Error in power mode listener (initial notification):', error);
      }
      
      return true;
    }
    return false;
  }
  
  /**
   * Unsubscribe from power mode changes
   * @param {Function} listener - Callback function
   * @returns {boolean} Success status
   */
  unsubscribe(listener) {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * Get current power mode
   * @returns {string} Current power mode
   */
  getCurrentMode() {
    return this.mode;
  }
  
  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getCurrentConfig() {
    return this.getConfigForMode(this.mode);
  }
  
  /**
   * Update mode configuration
   * @param {string} mode - Power mode to update
   * @param {Object} config - Configuration updates
   * @returns {Object} Updated configuration
   */
  updateModeConfig(mode, config) {
    if (!this.modeConfigs[mode]) {
      console.error(`Invalid power mode: ${mode}`);
      return null;
    }
    
    // Update configuration (shallow merge)
    this.modeConfigs[mode] = {
      ...this.modeConfigs[mode],
      ...config
    };
    
    // If updating current mode, notify listeners
    if (mode === this.mode) {
      const updatedConfig = this.getConfigForMode(mode);
      this.notifyListeners(mode, updatedConfig);
    }
    
    console.log(`Updated configuration for ${mode} mode:`, this.modeConfigs[mode]);
    return this.getConfigForMode(mode);
  }
}

// Export as singleton
export default new EnergyManager();