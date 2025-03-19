// src/managers/ConfigurationManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for configuration
const CONFIG_STORAGE_KEY = 'sensor_app_configuration';

class ConfigurationManager {
  constructor() {
    // Default configuration values
    this.config = {
      // Data processing parameters
      processing: {
        // Rate limiting settings (max change per reading)
        maxDeltaAccelX: 0.025,  // G
        maxDeltaAccelY: 0.01,   // G
        maxDeltaAccelZ: 0.5,    // G
        maxDeltaGyro: 0.2,      // rad/s
        maxDeltaMag: 2.0,       // μT
        
        // Low-pass filter constants
        filterAccelX: 0.05,     // Longitudinal (lower = more filtering)
        filterAccelY: 0.1,      // Lateral (lower = more filtering)
        filterAccelZ: 0.25,     // Vertical (lower = more filtering)
        filterGyro: 0.1,        // Gyroscope
        filterMag: 0.1,         // Magnetometer
        
        // Sensor update rates
        accelUpdateRate: 100,   // ms
        gyroUpdateRate: 100,    // ms
        magUpdateRate: 100      // ms
      },
      
      // Vehicle dynamics parameters
      vehicle: {
        // Maximum performance levels
        maxBraking: 1.0,       // G
        maxAcceleration: 0.6,  // G
        maxLateral: 0.9,       // G
        
        // Vehicle characteristics
        mass: 1500,            // kg
        wheelbase: 2.7,        // meters
        trackWidth: 1.8,       // meters
        
        // GPS integration
        useGPSSpeed: true      // Use GPS speed for calculations when available
      },
      
      // Visualization settings
      visualization: {
        // GGPlot settings
        maxGDisplay: 1.0,      // Maximum G to display on plot
        showTractionCircle: true,  // Whether to show the traction circle
        colorMapping: true,    // Use colors to represent G-force intensity
        
        // Display options
        showRawData: false,    // Whether to show raw sensor data
        showProcessedData: true, // Whether to show processed data
        showDynamicsView: true // Whether to show the dynamics visualization
      },
      
      // Session recording settings
      recording: {
        sampleRate: 10,        // How many samples per second to record
        autoExport: true,      // Automatically offer to export when recording stops
        maxSessionTime: 3600   // Maximum session time in seconds
      }
    };
    
    this.isLoaded = false;
    console.log('ConfigurationManager initialized with defaults');
  }
  
  /**
   * Load configuration from storage
   */
  async loadConfiguration() {
    try {
      const storedConfig = await AsyncStorage.getItem(CONFIG_STORAGE_KEY);
      
      if (storedConfig) {
        // Merge stored config with defaults to ensure we have all properties
        const parsed = JSON.parse(storedConfig);
        this.config = this.mergeConfig(this.config, parsed);
        console.log('Configuration loaded from storage');
      } else {
        console.log('No stored configuration found, using defaults');
      }
      
      this.isLoaded = true;
      return true;
    } catch (error) {
      console.error('Error loading configuration:', error);
      return false;
    }
  }
  
  /**
   * Save current configuration to storage
   */
  async saveConfiguration() {
    try {
      const json = JSON.stringify(this.config);
      await AsyncStorage.setItem(CONFIG_STORAGE_KEY, json);
      console.log('Configuration saved to storage');
      return true;
    } catch (error) {
      console.error('Error saving configuration:', error);
      return false;
    }
  }
  
  /**
   * Get a configuration value
   * 
   * @param {string} category - The configuration category
   * @param {string} key - The configuration key
   * @returns {any} - The configuration value
   */
  getValue(category, key) {
    if (!this.config[category]) {
      console.warn(`Configuration category ${category} not found`);
      return null;
    }
    
    if (key in this.config[category]) {
      return this.config[category][key];
    } else {
      console.warn(`Configuration key ${key} not found in ${category}`);
      return null;
    }
  }
  
  /**
   * Set a configuration value
   * 
   * @param {string} category - The configuration category
   * @param {string} key - The configuration key
   * @param {any} value - The new value
   * @returns {boolean} - Success status
   */
  setValue(category, key, value) {
    if (!this.config[category]) {
      console.warn(`Configuration category ${category} not found`);
      return false;
    }
    
    if (key in this.config[category]) {
      this.config[category][key] = value;
      console.log(`Configuration ${category}.${key} set to ${value}`);
      return true;
    } else {
      console.warn(`Configuration key ${key} not found in ${category}`);
      return false;
    }
  }
  
  /**
   * Get an entire configuration category
   * 
   * @param {string} category - The configuration category
   * @returns {Object} - The configuration category object
   */
  getCategory(category) {
    return this.config[category] || {};
  }
  
  /**
   * Update an entire configuration category
   * 
   * @param {string} category - The configuration category
   * @param {Object} values - The new values
   * @returns {boolean} - Success status
   */
  updateCategory(category, values) {
    if (!this.config[category]) {
      console.warn(`Configuration category ${category} not found`);
      return false;
    }
    
    this.config[category] = { ...this.config[category], ...values };
    console.log(`Configuration category ${category} updated`);
    return true;
  }
  
  /**
   * Reset configuration to defaults
   * 
   * @param {string} category - Optional category to reset, or all if omitted
   * @returns {boolean} - Success status
   */
  resetToDefaults(category = null) {
    const defaultConfig = new ConfigurationManager().config;
    
    if (category) {
      if (!this.config[category]) {
        console.warn(`Configuration category ${category} not found`);
        return false;
      }
      
      this.config[category] = { ...defaultConfig[category] };
      console.log(`Configuration category ${category} reset to defaults`);
    } else {
      this.config = { ...defaultConfig };
      console.log('All configuration reset to defaults');
    }
    
    return true;
  }
  
  /**
   * Helper to merge configs, ensuring all default properties exist
   */
  mergeConfig(defaultConfig, userConfig) {
    const result = { ...defaultConfig };
    
    // For each category in the default config
    Object.keys(defaultConfig).forEach(category => {
      if (userConfig[category]) {
        // Merge this category, keeping default values for missing properties
        result[category] = { ...defaultConfig[category], ...userConfig[category] };
      }
    });
    
    return result;
  }
}

export default new ConfigurationManager();