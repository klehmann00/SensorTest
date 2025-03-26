// src/components/GyroVisualizer.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Text } from 'react-native-svg';

/**
 * Simple visualizer for gyroscope data showing rotation rates
 */
const GyroVisualizer = ({ data = {}, size = 120, showProcessed = true }) => {
  let displayValues = { x: 0, y: 0, z: 0 };
  
  // Handle various data structures based on showProcessed flag
  if (data.filtered && showProcessed) {
    // Use filtered data when in processed mode
    displayValues = {
      x: data.filtered.x || 0,
      y: data.filtered.y || 0,
      z: data.filtered.z || 0
    };
  } else if (data.transformed) {
    // Use transformed data when in raw mode
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
  
  // Constants for visualization
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 10;
  
  // Scale the rotation values for visualization
  const scaleValue = (value) => {
    // Clamp to a reasonable range and scale to fit radius
    const maxRotation = 5; // rad/s
    return (Math.max(-maxRotation, Math.min(maxRotation, value)) / maxRotation) * radius;
  };
  
  // Colors for each axis (matching your existing color scheme)
  const colors = {
    x: '#E74C3C', // Red
    y: '#27AE60', // Green
    z: '#3498DB'  // Blue
  };
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Reference circle */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={radius}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1"
          fill="none"
        />
        
        {/* Center dot */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={3}
          fill="white"
        />
        
        {/* X-axis rotation (Roll) */}
        <Line
          x1={centerX}
          y1={centerY}
          x2={centerX + scaleValue(displayValues.x)}
          y2={centerY}
          stroke={colors.x}
          strokeWidth="2"
        />
        <Circle
          cx={centerX + scaleValue(displayValues.x)}
          cy={centerY}
          r={4}
          fill={colors.x}
        />
        
        {/* Y-axis rotation (Pitch) */}
        <Line
          x1={centerX}
          y1={centerY}
          x2={centerX}
          y2={centerY - scaleValue(displayValues.y)}
          stroke={colors.y}
          strokeWidth="2"
        />
        <Circle
          cx={centerX}
          cy={centerY - scaleValue(displayValues.y)}
          r={4}
          fill={colors.y}
        />
        
        {/* Z-axis rotation (Yaw) */}
        <Line
          x1={centerX}
          y1={centerY}
          x2={centerX + Math.cos(Math.PI/4) * scaleValue(displayValues.z)}
          y2={centerY - Math.sin(Math.PI/4) * scaleValue(displayValues.z)}
          stroke={colors.z}
          strokeWidth="2"
        />
        <Circle
          cx={centerX + Math.cos(Math.PI/4) * scaleValue(displayValues.z)}
          cy={centerY - Math.sin(Math.PI/4) * scaleValue(displayValues.z)}
          r={4}
          fill={colors.z}
        />
        
        {/* Labels */}
        <Text x={size - 20} y={centerY + 5} fill={colors.x} fontSize="12">X</Text>
        <Text x={centerX - 5} y={10} fill={colors.y} fontSize="12">Y</Text>
        <Text x={centerX + radius/2} y={centerY - radius/2} fill={colors.z} fontSize="12">Z</Text>
        
        {/* Values */}
        <Text x={5} y={15} fill="white" fontSize="10">X: {displayValues.x.toFixed(2)}</Text>
        <Text x={5} y={30} fill="white" fontSize="10">Y: {displayValues.y.toFixed(2)}</Text>
        <Text x={5} y={45} fill="white" fontSize="10">Z: {displayValues.z.toFixed(2)}</Text>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 5,
    margin: 5,
  }
});

export default GyroVisualizer;