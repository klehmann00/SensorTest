import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SensorDisplay = ({ title, data, color, scale = 1, showProcessed }) => {
  // Safely get values with fallbacks to avoid "toFixed of undefined" errors
  const getDisplayValue = (obj, prop, fallback = 0) => {
    if (!obj) return fallback;
    const value = obj[prop];
    return value !== undefined && value !== null ? value : fallback;
  };
  
  // Choose values based on showProcessed setting
  const xValue = showProcessed 
    ? getDisplayValue(data, 'filtered_x', getDisplayValue(data, 'x', 0))
    : getDisplayValue(data, 'raw_x', getDisplayValue(data, 'x', 0));
    
  const yValue = showProcessed 
    ? getDisplayValue(data, 'filtered_y', getDisplayValue(data, 'y', 0))
    : getDisplayValue(data, 'raw_y', getDisplayValue(data, 'y', 0));
    
  const zValue = showProcessed 
    ? getDisplayValue(data, 'filtered_z', getDisplayValue(data, 'z', 0))
    : getDisplayValue(data, 'raw_z', getDisplayValue(data, 'z', 0));
  
  // Helper function to get bar width for visualization
  const getBarWidth = (value, scale = 1) => {
    const maxWidth = 300;
    const scaledWidth = Math.abs(value * scale) * maxWidth;
    return Math.min(scaledWidth, maxWidth);
  };
  
  return (
    <View style={styles.visualContainer}>
      <Text style={[styles.sensorTitle, {color}]}>{title}</Text>
      <View style={styles.axisContainer}>
        <Text style={styles.axisLabel}>X: {xValue.toFixed(3)}</Text>
        <View style={[styles.bar, {width: getBarWidth(xValue, scale), backgroundColor: '#E74C3C'}]} />
      </View>
      <View style={styles.axisContainer}>
        <Text style={styles.axisLabel}>Y: {yValue.toFixed(3)}</Text>
        <View style={[styles.bar, {width: getBarWidth(yValue, scale), backgroundColor: '#27AE60'}]} />
      </View>
      <View style={styles.axisContainer}>
        <Text style={styles.axisLabel}>Z: {zValue.toFixed(3)}</Text>
        <View style={[styles.bar, {width: getBarWidth(zValue, scale), backgroundColor: '#3498DB'}]} />
      </View>
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
    marginTop: 20,
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bar: {
    height: 20,
    borderRadius: 10,
  },
});

export default SensorDisplay;