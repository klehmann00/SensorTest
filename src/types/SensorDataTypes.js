import PropTypes from 'prop-types';

// Common structure for all sensor types
export const SensorDataShape = PropTypes.shape({
  // Original readings from sensor hardware
  raw: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
    z: PropTypes.number,
    timestamp: PropTypes.number
  }),
  
  // After calibration/orientation adjustment
  transformed: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
    z: PropTypes.number,
    timestamp: PropTypes.number
  }),
  
  // After rate limiting
  limited: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
    z: PropTypes.number,
    timestamp: PropTypes.number
  }),
  
  // After filtering
  filtered: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
    z: PropTypes.number,
    timestamp: PropTypes.number
  }),
  
  // Final processed values
  processed: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
    z: PropTypes.number,
    timestamp: PropTypes.number
  }),
  
  // Error information
  error: PropTypes.bool,
  errorMessage: PropTypes.string
});

// Specialized structures for specific sensor types
export const AccelerometerDataShape = PropTypes.shape({
  ...SensorDataShape,
  // Domain-specific properties
  lateral: PropTypes.number,      // Side-to-side
  longitudinal: PropTypes.number, // Forward-backward
  vertical: PropTypes.number      // Up-down
});

export const GyroscopeDataShape = PropTypes.shape({
  ...SensorDataShape,
  // Domain-specific properties
  roll: PropTypes.number,  // Rotation around X-axis
  pitch: PropTypes.number, // Rotation around Y-axis
  yaw: PropTypes.number    // Rotation around Z-axis
});