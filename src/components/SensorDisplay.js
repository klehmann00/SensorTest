// src/components/SensorDisplay.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

/**
 * Component to display sensor data with visualization bars
 * @param {Object} props - Component props
 * @param {string} props.title - Display title
 * @param {Object} props.data - Sensor data
 * @param {string} props.color - Theme color
 * @param {number} props.scale - Value scaling factor
 * @param {boolean} props.showProcessed - Whether to show processed values
 */
const SensorDisplay = ({ title, data, color, scale = 1, showProcessed = true }) => {
  // Handle null or incomplete data
  if (!data) {
    return (
      <View style={styles.visualContainer}>
        <Text style={[styles.sensorTitle, {color}]}>{title}</Text>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }
  
  // Determine what values to display based on sensor type and data
  let displayValues = { x: 0, y: 0, z: 0 };

  // Special handling for gyroscope data
  if (title.toLowerCase().includes('gyro')) {
    // Use roll/pitch/yaw properties if available
    if (data.roll !== undefined) {
      displayValues = {
        x: data.roll || 0,    // X-axis rotation rate (roll)
        y: data.pitch || 0,   // Y-axis rotation rate (pitch)
        z: data.yaw || 0      // Z-axis rotation rate (yaw)
      };
    } 
    // Otherwise fall back to standard properties based on processing mode
    else if (data.filtered && showProcessed) {
      displayValues = {
        x: data.filtered.x || 0,
        y: data.filtered.y || 0,
        z: data.filtered.z || 0
      };
    } else {
      displayValues = {
        x: data.transformed?.x || data.x || 0,
        y: data.transformed?.y || data.y || 0,
        z: data.transformed?.z || data.z || 0
      };
    }
  } 
  // Special handling for accelerometer data
  else if (title.toLowerCase().includes('accel')) {
    // Use domain-specific properties if available
    if (data.lateral !== undefined) {
      displayValues = {
        x: data.lateral || 0,        // Side-to-side
        y: data.longitudinal || 0,   // Forward-backward
        z: data.vertical || 0        // Up-down
      };
    }
    // Otherwise fall back to processing stages
    else if (data.filtered && showProcessed) {
      displayValues = {
        x: data.filtered.x || 0,
        y: data.filtered.y || 0,
        z: data.filtered.z || 0
      };
    } else {
      displayValues = {
        x: data.transformed?.x || data.x || 0,
        y: data.transformed?.y || data.y || 0,
        z: data.transformed?.z || data.z || 0
      };
    }
  }
  // Standard handling for other sensor types
  else if (data.filtered && showProcessed) {
    displayValues = {
      x: data.filtered.x || 0,
      y: data.filtered.y || 0,
      z: data.filtered.z || 0
    };
  } else if (data.transformed) {
    displayValues = {
      x: data.transformed.x || 0,
      y: data.transformed.y || 0,
      z: data.transformed.z || 0
    };
  } else if (data.raw) {
    displayValues = {
      x: data.raw.x || 0,
      y: data.raw.y || 0,
      z: data.raw.z || 0
    };
  } else {
    displayValues = {
      x: data.x || 0,
      y: data.y || 0,
      z: data.z || 0
    };
  }
  
  // Helper to get axis labels based on sensor type
  const getAxisLabels = () => {
    if (title.toLowerCase().includes('gyro')) {
      return {
        x: 'Roll: ',
        y: 'Pitch: ', 
        z: 'Yaw: '
      };
    } else if (title.toLowerCase().includes('accel')) {
      return {
        x: showProcessed ? 'Lateral: ' : 'X: ',
        y: showProcessed ? 'Longitudinal: ' : 'Y: ', 
        z: showProcessed ? 'Vertical: ' : 'Z: '
      };
    } else {
      return {
        x: 'X: ',
        y: 'Y: ',
        z: 'Z: '
      };
    }
  };

  const axisLabels = getAxisLabels();
  
  // Helper function to get bar width for visualization
  const getBarWidth = (value, scale = 1) => {
    const maxWidth = 300;
    const scaledWidth = Math.abs(value * scale) * maxWidth;
    return Math.min(scaledWidth, maxWidth);
  };
  
  // Helper to get color based on value intensity
  const getIntensityColor = (value, baseColor) => {
    // For now, just return the base color
    // Could be enhanced to show different shades based on value
    return baseColor;
  };
  
  return (
    <View style={styles.visualContainer}>
      <Text style={[styles.sensorTitle, {color}]}>{title}</Text>
      
      <View style={styles.axisContainer}>
        <Text style={styles.axisLabel}>
          {axisLabels.x} {displayValues.x.toFixed(3)}
        </Text>
        <View style={styles.barBackground}>
          <View 
            style={[
              styles.bar, 
              {
                width: getBarWidth(displayValues.x, scale), 
                backgroundColor: getIntensityColor(displayValues.x, '#E74C3C')
              }
            ]} 
          />
        </View>
      </View>
      
      <View style={styles.axisContainer}>
        <Text style={styles.axisLabel}>
          {axisLabels.y} {displayValues.y.toFixed(3)}
        </Text>
        <View style={styles.barBackground}>
          <View 
            style={[
              styles.bar, 
              {
                width: getBarWidth(displayValues.y, scale), 
                backgroundColor: getIntensityColor(displayValues.y, '#27AE60')
              }
            ]} 
          />
        </View>
      </View>
      
      <View style={styles.axisContainer}>
        <Text style={styles.axisLabel}>
          {axisLabels.z} {displayValues.z.toFixed(3)}
        </Text>
        <View style={styles.barBackground}>
          <View 
            style={[
              styles.bar, 
              {
                width: getBarWidth(displayValues.z, scale), 
                backgroundColor: getIntensityColor(displayValues.z, '#3498DB')
              }
            ]} 
          />
        </View>
      </View>
      
      {data.error && (
        <Text style={styles.errorText}>
          Error: {data.errorMessage || 'Processing error'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  visualContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  sensorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  axisContainer: {
    marginBottom: 15,
  },
  axisLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  barBackground: {
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  bar: {
    height: 20,
    borderRadius: 10,
  },
  noDataText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
    color: '#95A5A6',
  },
  errorText: {
    color: '#E74C3C',
    marginTop: 10,
    fontStyle: 'italic',
  }
});

// PropTypes definition
SensorDisplay.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.shape({
    // Raw data
    raw: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
      z: PropTypes.number
    }),
    // Transformed data
    transformed: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
      z: PropTypes.number
    }),
    // Limited data
    limited: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
      z: PropTypes.number
    }),
    // Filtered data
    filtered: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
      z: PropTypes.number
    }),
    // Processed data
    processed: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
      z: PropTypes.number
    }),
    // Domain-specific accelerometer properties
    lateral: PropTypes.number,
    longitudinal: PropTypes.number,
    vertical: PropTypes.number,
    // Domain-specific gyroscope properties
    roll: PropTypes.number,
    pitch: PropTypes.number,
    yaw: PropTypes.number,
    // Error information
    error: PropTypes.bool,
    errorMessage: PropTypes.string,
    // Legacy/direct properties
    x: PropTypes.number,
    y: PropTypes.number,
    z: PropTypes.number
  }),
  color: PropTypes.string,
  scale: PropTypes.number,
  showProcessed: PropTypes.bool
};

SensorDisplay.defaultProps = {
  data: {},
  color: '#4ECDC4',
  scale: 1,
  showProcessed: true
};

export default SensorDisplay;