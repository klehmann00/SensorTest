// GGPlot.js - Visualization component
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, Rect } from 'react-native-svg';
import * as Location from 'expo-location';

export default function GGPlot({ 
  processedData, 
  maxG = 1, 
  isCalibrating = false 
}) {
  const [speed, setSpeed] = useState(0);
  const [heading, setHeading] = useState(0);

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

  const gToPixel = (g, isX) => {
    const scale = isX ? plotWidth : plotHeight;
    return padding + (scale / 2) + (g * scale / (2 * maxG));
  };

  const renderAxes = () => {
    const centerX = padding + plotWidth / 2;
    const centerY = padding + plotHeight / 2;

    // Get processed values - use defaults if not available
    const lateralValue = processedData?.processed_lateral || 0;
    const longitudinalValue = processedData?.processed_longitudinal || 0;
    const verticalValue = processedData?.processed_vertical || 0;

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

  // Get processed values
  const lateralValue = processedData?.processed_lateral || 0;
  const longitudinalValue = processedData?.processed_longitudinal || 0;

  const currentPoint = {
    x: gToPixel(lateralValue, true),
    y: gToPixel(-longitudinalValue, false)
  };

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {renderAxes()}
        <Circle
          cx={currentPoint.x}
          cy={currentPoint.y}
          r="4"
          fill="#FF6B6B"
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
      
      {/* Debug values at the bottom */}
      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>
          Raw: ({processedData?.raw_x?.toFixed(3) || 0}, {processedData?.raw_y?.toFixed(3) || 0}) | 
          Processed: ({longitudinalValue.toFixed(3)}, {lateralValue.toFixed(3)})
        </Text>
      </View>
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
  debugInfo: {
    marginTop: 5,
    padding: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 5,
    width: '100%',
  },
  debugText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'monospace',
  }
});