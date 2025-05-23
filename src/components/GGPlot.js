// src/components/GGPlot.js

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, Rect, Path } from 'react-native-svg';
import * as Location from 'expo-location';
import VehicleDynamics from '../utils/VehicleDynamics';
import ConfigurationManager from '../managers/ConfigurationManager';

export default function GGPlot({ 
  processedData, 
  isCalibrating = false,
  showProcessed = true
}) {

  const [speed, setSpeed] = useState(0);
  // Remove unused heading state
  
  // Get configuration
  const [maxG, setMaxG] = useState(
    ConfigurationManager.getValue('visualization', 'maxGDisplay') || 1.0
  );
  const [showTractionCircle, setShowTractionCircle] = useState(
    ConfigurationManager.getValue('visualization', 'showTractionCircle') || true
  );
  
  // Get vehicle performance values
  const [vehicleConfig, setVehicleConfig] = useState(
    ConfigurationManager.getCategory('vehicle')
  );

  const width = Dimensions.get('window').width - 40;
  const height = width;
  const padding = 40;
  const plotWidth = width - (padding * 2);
  const plotHeight = height - (padding * 2);

  // Create half ellipse path function (moved outside render to avoid recreation)
  const createHalfEllipsePath = useCallback((rx, ry, top, centerX, centerY) => {
    const startAngle = top ? Math.PI : 0;
    const endAngle = top ? 0 : Math.PI;
    const sweepFlag = 1; // Always draw in a clockwise direction
    
    // Start point
    const startX = centerX + rx * Math.cos(startAngle);
    const startY = centerY + ry * Math.sin(startAngle);
    
    // End point
    const endX = centerX + rx * Math.cos(endAngle);
    const endY = centerY + ry * Math.sin(endAngle);
    
    return `M ${startX} ${startY} A ${rx} ${ry} 0 0 ${sweepFlag} ${endX} ${endY}`;
  }, []);

  // Set up GPS location tracking
  useEffect(() => {
    let locationSubscription;

    const startLocationUpdates = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 500,
            distanceInterval: 1,
          },
          (location) => {
            setSpeed(Math.max(0, location.coords.speed || 0));
            // Removed setting heading since it's not used
          }
        );
      } catch (error) {
        console.log('Error setting up location:', error);
      }
    };

    startLocationUpdates();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);
  
  // Update config when ConfigurationManager changes
  useEffect(() => {
    const refreshConfig = async () => {
      await ConfigurationManager.loadConfiguration();
      setMaxG(ConfigurationManager.getValue('visualization', 'maxGDisplay') || 1.0);
      setShowTractionCircle(ConfigurationManager.getValue('visualization', 'showTractionCircle') || true);
      setVehicleConfig(ConfigurationManager.getCategory('vehicle'));
    };
    
    refreshConfig();
  }, []);
  
  const gToPixel = useCallback((g, isX) => {
    const scale = isX ? plotWidth : plotHeight;
    return padding + (scale / 2) + (g * scale / (2 * maxG));
  }, [padding, plotWidth, plotHeight, maxG]);

  // This function extracts values ensuring consistent axis mapping
  const extractValues = useCallback(() => {
    if (!processedData) {
      return { lateralValue: 0, longitudinalValue: 0, verticalValue: 0 };
    }

    let lateralValue, longitudinalValue, verticalValue;

    if (showProcessed && processedData?.lateral !== undefined) {
      // PROCESSED MODE - Use the labeled domain values
      lateralValue = processedData.lateral || 0;
      longitudinalValue = -1 * (processedData.longitudinal || 0); // Negate for display orientation
      verticalValue = processedData.vertical || 0;
    } else if (!showProcessed && processedData?.transformed) {
      // RAW MODE with transformation data (calibrated)
      // FIXED MAPPING: X is lateral, Y is longitudinal
      lateralValue = processedData.transformed.x || 0; // X is lateral
      longitudinalValue = -1 * (processedData.transformed.y || 0); // Y is longitudinal (negated)
      verticalValue = processedData.transformed.z || 0;
    } else {
      // FALLBACK - Direct access to coordinates
      // FIXED MAPPING: X is lateral, Y is longitudinal
      lateralValue = processedData?.x || 0; // X is lateral in raw mode
      longitudinalValue = -1 * (processedData?.y || 0); // Y is longitudinal in raw mode (negated)
      verticalValue = processedData?.z || 0;
    }

    return { lateralValue, longitudinalValue, verticalValue };
  }, [processedData, showProcessed]);

  // Then use these extracted values
  const { lateralValue, longitudinalValue, verticalValue } = extractValues();

  // Calculate point coordinates
  const currentPoint = {
    x: gToPixel(lateralValue, true),
    y: gToPixel(-longitudinalValue, false)
  };

  // Render axes with consistent labeling
  const renderAxes = useCallback(() => {
    const centerX = padding + plotWidth / 2;
    const centerY = padding + plotHeight / 2;

    return (
      <>
        <Line
          x1={padding}
          y1={centerY}
          x2={width - padding}
          y2={centerY}
          stroke="white"
          strokeWidth="1"
        />
        <Line
          x1={centerX}
          y1={padding}
          x2={centerX}
          y2={height - padding}
          stroke="white"
          strokeWidth="1"
        />
        <SvgText
          x={width - padding + 5}
          y={centerY + 15}
          fill="white"
          fontSize="12"
          textAnchor="start"
        >
          Right
        </SvgText>
        <SvgText
          x={padding - 5}
          y={centerY + 15}
          fill="white"
          fontSize="12"
          textAnchor="end"
        >
          Left
        </SvgText>
        <SvgText
          x={centerX - 20}
          y={padding - 5}
          fill="white"
          fontSize="12"
          textAnchor="end"
        >
          Accel
        </SvgText>
        <SvgText
          x={centerX - 20}
          y={height - padding + 15}
          fill="white"
          fontSize="12"
          textAnchor="end"
        >
          Brake
        </SvgText>

        {/* Vertical G axis with point */}
        <Line 
          x1={width - padding - 20}
          y1={padding}
          x2={width - padding - 20}
          y2={height - padding}
          stroke="white"
          strokeWidth="1"
        />

        <Circle
          cx={width - padding - 20}
          cy={padding + ((1 - verticalValue) / 2) * (height - 2 * padding)}
          r="4"
          fill="#FF6B6B"
        />

        <SvgText
          x={width - padding - 20}
          y={padding - 5}
          fill="white"
          fontSize="10"
          textAnchor="middle"
        >
          +1G
        </SvgText>
        <SvgText
          x={width - padding - 20}
          y={height - padding + 15}
          fill="white"
          fontSize="10"
          textAnchor="middle"
        >
          -1G
        </SvgText>
      </>
    );
  }, [padding, plotWidth, plotHeight, width, height, verticalValue]);
  
  const renderTractionCircle = useCallback(() => {
    if (!showTractionCircle) return null;
    
    const centerX = padding + plotWidth / 2;
    const centerY = padding + plotHeight / 2;
    
    // Calculate size of the traction ellipse based on vehicle performance
    const maxLateral = vehicleConfig.maxLateral;
    const maxAccel = vehicleConfig.maxAcceleration;
    const maxBraking = vehicleConfig.maxBraking;
    
    // Scale factors for the plot
    const lateralScale = (plotWidth / 2) / maxG;
    const accelScale = (plotHeight / 2) / maxG;
    const brakeScale = (plotHeight / 2) / maxG;
    
    // Calculate ellipse radii in screen coordinates
    const radiusX = maxLateral * lateralScale;
    const radiusYTop = maxAccel * accelScale;
    const radiusYBottom = maxBraking * brakeScale;
    
    // Create paths for the top and bottom halves of the ellipse
    const topPath = createHalfEllipsePath(radiusX, radiusYTop, true, centerX, centerY);
    const bottomPath = createHalfEllipsePath(radiusX, radiusYBottom, false, centerX, centerY);
    
    // Calculate metrics using VehicleDynamics - pass the data in the correct format
    let tractionData;
    if (showProcessed && processedData?.lateral !== undefined) {
      tractionData = processedData;
    } else {
      // In raw mode, convert the data to the format expected by VehicleDynamics
      tractionData = {
        lateral: lateralValue,
        longitudinal: -longitudinalValue, // Undo the negation we did for display
        vertical: verticalValue
      };
    }
    
    const tractionCircle = VehicleDynamics.calculateTractionCircle(tractionData, showProcessed);
    const intensity = tractionCircle / 100; // 0 to 1
    
    // Get color based on traction utilization
    const getCircleColor = (value) => {
      if (value <= 0.5) {
        // Green to yellow
        const g = 255;
        const r = Math.round(255 * (value * 2));
        return `rgba(${r}, ${g}, 0, 0.3)`;
      } else {
        // Yellow to red
        const r = 255;
        const g = Math.round(255 * (1 - (value - 0.5) * 2));
        return `rgba(${r}, ${g}, 0, 0.3)`;
      }
    };
    
    return (
      <>
        {/* Traction Ellipse */}
        <Path
          d={topPath}
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="1"
          fill="none"
        />
        <Path
          d={bottomPath}
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="1"
          fill="none"
        />
        
        {/* Percentage circles - 25%, 50%, 75% */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={Math.min(radiusX, radiusYTop) * 0.25}
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="1"
          strokeDasharray="2,2"
          fill="none"
        />
        <Circle
          cx={centerX}
          cy={centerY}
          r={Math.min(radiusX, radiusYTop) * 0.5}
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="1"
          strokeDasharray="2,2"
          fill="none"
        />
        <Circle
          cx={centerX}
          cy={centerY}
          r={Math.min(radiusX, radiusYTop) * 0.75}
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="1"
          strokeDasharray="2,2"
          fill="none"
        />
        
        {/* Current traction circle utilized */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={Math.min(radiusX, radiusYTop) * intensity}
          fill={getCircleColor(intensity)}
          stroke={getCircleColor(1)}
          strokeWidth="1"
        />
        
        {/* Traction utilization text */}
        <SvgText
          x={padding + 10}
          y={height - padding - 30}
          fill="white"
          fontSize="12"
          textAnchor="start"
        >
          Grip Used:
        </SvgText>
        <SvgText
          x={padding + 80}
          y={height - padding - 30}
          fill={getCircleColor(1).replace('0.3', '1')}
          fontSize="12"
          fontWeight="bold"
          textAnchor="start"
        >
          {tractionCircle.toFixed(0)}%
        </SvgText>
      </>
    );
  }, [
    padding, plotWidth, plotHeight, width, height, 
    showTractionCircle, vehicleConfig, maxG, 
    createHalfEllipsePath, lateralValue, longitudinalValue, 
    verticalValue, processedData, showProcessed
  ]);

  // Get dynamics information and colors - pass data in correct format
  const getDynamicsData = useCallback(() => {
    if (showProcessed && processedData?.lateral !== undefined) {
      return processedData;
    } else {
      // In raw mode, convert the data to the format expected by VehicleDynamics
      return {
        lateral: lateralValue,
        longitudinal: -longitudinalValue, // Undo the negation we did for display
        vertical: verticalValue
      };
    }
  }, [showProcessed, processedData, lateralValue, longitudinalValue, verticalValue]);
  
  const dynamicsData = getDynamicsData();
  const dynamics = VehicleDynamics.calculateDynamics(dynamicsData, speed, showProcessed);
  const pointColor = dynamics ? dynamics.lateralColor : "#FF6B6B";

  return (
    <View style={styles.container}>
      {/* Add Speed display outside SVG */}
      <View style={styles.speedContainer}>
        <View style={styles.speedInlineContainer}>
          <Text style={styles.speedLabel}>Speed: </Text>
          <Text style={styles.speedValue}>{(speed * 3.6).toFixed(1)} km/h</Text>
        </View>
      </View>
      
      {/* Add Vertical G display outside SVG */}
      <View style={styles.verticalGContainer}>
        <Text style={styles.verticalGValue}>{verticalValue.toFixed(2)} G</Text>
      </View>
      
      <Svg width={width} height={height}>
        {/* Draw traction circle first so it's behind everything else */}
        {renderTractionCircle()}
        
        {/* Draw coordinate axes */}
        {renderAxes()}
        
        {/* Draw vector from center to current point */}
        <Line
          x1={padding + plotWidth / 2}
          y1={padding + plotHeight / 2}
          x2={currentPoint.x}
          y2={currentPoint.y}
          stroke={pointColor}
          strokeWidth="2"
        />
        
        {/* Draw current point */}
        <Circle
          cx={currentPoint.x}
          cy={currentPoint.y}
          r="5"
          fill={pointColor}
        />
        
        {/* Visual indicator during calibration */}
        {isCalibrating && (
          <Rect
            x={padding}
            y={padding}
            width={plotWidth}
            height={plotHeight}
            fill="rgba(76, 209, 196, 0.3)"
            stroke="#4ECDC4"
            strokeWidth="2"
          />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'white',
    width: '100%',
    alignItems: 'center',
  },
  speedContainer: {
    position: 'absolute',
    top: 345, // Adjust position as needed
    left: 100,
    zIndex: 10,
  },
  speedInlineContainer: {
    flexDirection: 'row', // Makes elements display in a row
    alignItems: 'center', // Vertically centers the text
  },
  speedLabel: {
    color: 'white',
    fontSize: 14,
  },
  speedValue: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: 'bold',
  },
  verticalGContainer: {
    position: 'absolute',
    top: 0,
    right: 10,
    // backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    padding: 8,
    zIndex: 10,
  },
  verticalGLabel: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  verticalGValue: {
    color: '#4ECDC4',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});