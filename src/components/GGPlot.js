// src/components/GGPlot.js (Enhanced Version)
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, Rect, Ellipse, Path } from 'react-native-svg';
import * as Location from 'expo-location';
import VehicleDynamics from '../utils/VehicleDynamics';
import ConfigurationManager from '../managers/ConfigurationManager';

export default function GGPlot({ 
  processedData, 
  isCalibrating = false,
  showProcessed = true
 
}) {
  const [speed, setSpeed] = useState(0);
  const [heading, setHeading] = useState(0);
  
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
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (location) => {
            setSpeed(location.coords.speed || 0);
            setHeading(location.coords.heading || 0);
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


    useEffect(() => {
      console.log(`GGPlot display mode: ${showProcessed ? 'Processed' : 'Raw'}`);
    }, [showProcessed]);
    
  
  const gToPixel = (g, isX) => {
    const scale = isX ? plotWidth : plotHeight;
    return padding + (scale / 2) + (g * scale / (2 * maxG));
  };

  // In GGPlot.js, change this part in the renderAxes function:
const renderAxes = () => {
  const centerX = padding + plotWidth / 2;
  const centerY = padding + plotHeight / 2;

  // Get processed values - use defaults if not available
  const lateralValue = processedData?.processed_lateral || 0;
  const longitudinalValue = processedData?.processed_longitudinal || 0;
  const verticalValue = processedData?.verticalDisplay || 
                       (showProcessed 
                        ? (processedData?.filtered_z || 0)
                        : (processedData?.vertical || 0));
  
  

    // Convert to bar height
    const maxVerticalG = 1; // Maximum vertical G to display
    const barHeight = (verticalValue / maxVerticalG) * (height - 2 * padding);
    const barY = centerY - (barHeight / 2);

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

        {/* Speed Display */}
        <SvgText
          x={padding + 10}
          y={padding + 20}
          fill="white"
          fontSize="12"
          textAnchor="start"
        >
          Speed:
        </SvgText>
        <SvgText
          x={padding + 10}
          y={padding + 35}
          fill="#FF6B6B"
          fontSize="12"
          textAnchor="start"
        >
          {(speed * 3.6).toFixed(1)} km/h
        </SvgText>
        
        {/* Vertical G numerical display */}
        <SvgText
          x={padding + 10}
          y={padding + 65}
          fill="white"
          fontSize="12"
          textAnchor="start"
        >
          Vertical G:
        </SvgText>
        <SvgText
          x={padding + 10}
          y={padding + 80}
          fill="#FF6B6B"
          fontSize="12"
          textAnchor="start"
        >
          {verticalValue.toFixed(2)} G
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
          cy={centerY - (verticalValue * (height - 2 * padding) / (2 * maxVerticalG))}
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
  };
  
  const renderTractionCircle = () => {
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
    
    // Create the paths for the top and bottom halves of the traction ellipse
    const createHalfEllipsePath = (rx, ry, top) => {
      // For top half, we go from -180° to 0°
      // For bottom half, we go from 0° to 180°
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
    };
    
    // Create paths for the top and bottom halves of the ellipse
    const topPath = createHalfEllipsePath(radiusX, radiusYTop, true);
    const bottomPath = createHalfEllipsePath(radiusX, radiusYBottom, false);
    
    // Calculate metrics using VehicleDynamics
    const tractionCircle = VehicleDynamics.calculateTractionCircle(processedData, showProcessed);
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
  };

// Get processed values
// Get values based on showProcessed prop
// Replace the current value selection with:
const lateralValue = showProcessed 
  ? (processedData?.filteredLateralMovement || 0)
  : (processedData?.lateralMovement || 0);

const longitudinalValue = showProcessed 
  ? (processedData?.filteredLongitudinalMovement || 0)
  : (processedData?.longitudinalMovement || 0);

const verticalValue = showProcessed
  ? (processedData?.filteredVerticalMovement || 0)
  : (processedData?.verticalMovement || 0);

  console.log("GGPlot coordinates:", {
    lateralValue, 
    longitudinalValue,
    rawCoords: {
      lateral: processedData?.lateral,
      longitudinal: processedData?.longitudinal,
      filtered_x: processedData?.filtered_x,
      filtered_y: processedData?.filtered_y
    }
  });

  // Calculate point coordinates
const currentPoint = {
  x: gToPixel(lateralValue, true),
  y: gToPixel(-longitudinalValue, false)
};

// Get dynamics information and colors
const dynamics = VehicleDynamics.calculateDynamics(processedData, speed, showProcessed);
const pointColor = dynamics ? dynamics.lateralColor : "#FF6B6B";

return (
  <View style={styles.container}>
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
}
});