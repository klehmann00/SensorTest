// src/components/SensorDisplay.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
  
  // Determine which values to display based on data structure and showProcessed flag
  
  // Update the displayValues determination in SensorDisplay.js
let displayValues = {
  x: 0, y: 0, z: 0
};

// Handle various data structures
if (data.filtered && showProcessed) {
  // Show filtered data when in Processed mode
  displayValues = {
    x: data.filtered.x || 0,
    y: data.filtered.y || 0,
    z: data.filtered.z || 0
  };
} else if (data.transformed) {
  // Show transformed (calibrated) data when in Raw mode
  displayValues = {
    x: data.transformed.x || 0,
    y: data.transformed.y || 0,
    z: data.transformed.z || 0
  };
} else if (data.raw) {
  // Fallback to raw data if no processed data available
  displayValues = {
    x: data.raw.x || 0,
    y: data.raw.y || 0,
    z: data.raw.z || 0
  };
} else {
  // Simple x,y,z format as final fallback
  displayValues = {
    x: data.x || 0,
    y: data.y || 0,
    z: data.z || 0
  };
}
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
          X: {displayValues.x.toFixed(3)} {showProcessed ? '(Lateral)' : ''}
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
          Y: {displayValues.y.toFixed(3)} {showProcessed ? '(Longitudinal)' : ''}
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
          Z: {displayValues.z.toFixed(3)} {showProcessed ? '(Vertical)' : ''}
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

export default SensorDisplay;