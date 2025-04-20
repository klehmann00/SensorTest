// src/components/GyroDisturbanceVisualizer.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

const GyroDisturbanceVisualizer = ({ disturbanceData, width = 320 }) => {
  console.log('GyroDisturbanceVisualizer received data structure:', {
    hasDisturbanceData: !!disturbanceData,
    hasRoad: !!disturbanceData?.road,
    hasVehicle: !!disturbanceData?.vehicle,
    hasDriver: !!disturbanceData?.driver,
    roadTotal: disturbanceData?.road?.normalizedTotal,
    vehicleTotal: disturbanceData?.vehicle?.normalizedTotal,
    driverTotal: disturbanceData?.driver?.normalizedTotal
  });
  if (!disturbanceData) {
    return null;
  }
  
  const gyroData = disturbanceData;
  const height = 650;
  const barHeight = 25;
  const barWidth = width - 120;
  const barSpacing = 10;
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
  
  console.log('GyroVisualizer rendering with dimensions:', { 
    height,
    roadY,
    vehicleY, 
    driverY,
    totalNeededHeight: driverY + (4 * (barHeight + barSpacing))
  });
  
  return (
    <View style={[styles.container, { width }]}>
      <Text style={styles.title}>Gyroscope Disturbance Analysis</Text>
      
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
          Road Rotation Rates
        </SvgText>
        
        {renderBar("Roll", gyroData.road.normalizedRoll, roadY)}
        {renderBar("Pitch", gyroData.road.normalizedPitch, roadY + barHeight + barSpacing)}
        {renderBar("Yaw", gyroData.road.normalizedYaw, roadY + 2 * (barHeight + barSpacing))}
        {renderBar("Total", gyroData.road.normalizedTotal, roadY + 3 * (barHeight + barSpacing))}
        
        {/* Vehicle Disturbances */}
        <SvgText
          x={width/2}
          y={vehicleY - 20}
          fill="#FFD166"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
        >
          Vehicle Rotation Rates
        </SvgText>
        
        {renderBar("Roll", gyroData.vehicle.normalizedRoll, vehicleY)}
        {renderBar("Pitch", gyroData.vehicle.normalizedPitch, vehicleY + barHeight + barSpacing)}
        {renderBar("Yaw", gyroData.vehicle.normalizedYaw, vehicleY + 2 * (barHeight + barSpacing))}
        {renderBar("Total", gyroData.vehicle.normalizedTotal, vehicleY + 3 * (barHeight + barSpacing))}
        
        {/* Driver Disturbances */}
        <SvgText
          x={width/2}
          y={driverY - 20}
          fill="#4ECDC4"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
        >
          Driver Rotation Rates
        </SvgText>
        
        {renderBar("Roll", gyroData.driver.normalizedRoll, driverY)}
        {renderBar("Pitch", gyroData.driver.normalizedPitch, driverY + barHeight + barSpacing)}
        {renderBar("Yaw", gyroData.driver.normalizedYaw, driverY + 2 * (barHeight + barSpacing))}
        {renderBar("Total", gyroData.driver.normalizedTotal, driverY + 3 * (barHeight + barSpacing))}
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

export default GyroDisturbanceVisualizer;