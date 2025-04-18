// src/components/DisturbanceVisualizer.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Circle, Line, Text as SvgText } from 'react-native-svg';

const DisturbanceVisualizer = ({ disturbanceData, width = 320 }) => {
  if (!disturbanceData) {
    return null;
  }
  
  const height = 400;
  const barHeight = 30;
  const barWidth = width - 80;
  const barSpacing = 15;
  const leftMargin = 70;
  
  // Color functions
  const getBarColor = (value) => {
    if (value < 30) return '#4ECDC4'; // Low - teal
    if (value < 70) return '#FFD166'; // Medium - yellow
    return '#FF6B6B'; // High - red
  };
  
  // Render bar for a specific metric
  const renderBar = (label, value, yPosition) => {
    const barValue = value || 0;
    return (
      <>
        <SvgText
          x={leftMargin - 5}
          y={yPosition + barHeight/2 + 5}
          fill="white"
          fontSize="12"
          textAnchor="end"
        >
          {label}
        </SvgText>
        
        {/* Background bar */}
        <Rect
          x={leftMargin}
          y={yPosition}
          width={barWidth}
          height={barHeight}
          fill="rgba(255,255,255,0.1)"
          rx={5}
        />
        
        {/* Value bar */}
        <Rect
          x={leftMargin}
          y={yPosition}
          width={(barValue / 100) * barWidth}
          height={barHeight}
          fill={getBarColor(barValue)}
          rx={5}
        />
        
        {/* Value text */}
        <SvgText
          x={leftMargin + barWidth + 5}
          y={yPosition + barHeight/2 + 5}
          fill="white"
          fontSize="12"
          textAnchor="start"
        >
          {barValue.toFixed(0)}
        </SvgText>
      </>
    );
  };
  
  // Calculate y positions for each section
  const roadY = 40;
  const vehicleY = roadY + 4 * (barHeight + barSpacing) + 20;
  const driverY = vehicleY + 4 * (barHeight + barSpacing) + 20;
  
  return (
    <View style={[styles.container, { width }]}>
      <Text style={styles.title}>Disturbance Analysis</Text>
      
      <Svg width={width} height={height}>
        {/* Road Disturbances */}
        <SvgText
          x={width/2}
          y={20}
          fill="#FF6B6B"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
        >
          Road Disturbances
        </SvgText>
        
        {renderBar("Lateral", disturbanceData.road.normalizedLateral, roadY)}
        {renderBar("Long.", disturbanceData.road.normalizedLongitudinal, roadY + barHeight + barSpacing)}
        {renderBar("Vertical", disturbanceData.road.normalizedVertical, roadY + 2 * (barHeight + barSpacing))}
        {renderBar("Total", disturbanceData.road.normalizedTotal, roadY + 3 * (barHeight + barSpacing))}
        
        {/* Vehicle Disturbances */}
        <SvgText
          x={width/2}
          y={vehicleY - 20}
          fill="#FFD166"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
        >
          Vehicle Disturbances
        </SvgText>
        
        {renderBar("Lateral", disturbanceData.vehicle.normalizedLateral, vehicleY)}
        {renderBar("Long.", disturbanceData.vehicle.normalizedLongitudinal, vehicleY + barHeight + barSpacing)}
        {renderBar("Vertical", disturbanceData.vehicle.normalizedVertical, vehicleY + 2 * (barHeight + barSpacing))}
        {renderBar("Total", disturbanceData.vehicle.normalizedTotal, vehicleY + 3 * (barHeight + barSpacing))}
        
        {/* Driver Disturbances */}
        <SvgText
          x={width/2}
          y={driverY - 20}
          fill="#4ECDC4"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
        >
          Driver Disturbances
        </SvgText>
        
        {renderBar("Lateral", disturbanceData.driver.normalizedLateral, driverY)}
        {renderBar("Long.", disturbanceData.driver.normalizedLongitudinal, driverY + barHeight + barSpacing)}
        {renderBar("Vertical", disturbanceData.driver.normalizedVertical, driverY + 2 * (barHeight + barSpacing))}
        {renderBar("Total", disturbanceData.driver.normalizedTotal, driverY + 3 * (barHeight + barSpacing))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  }
});

export default DisturbanceVisualizer;