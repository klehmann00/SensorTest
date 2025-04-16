// src/components/FilterGraphs.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Svg, { 
  Line, 
  Path, 
  Circle, 
  Rect,
  Text as SvgText 
} from 'react-native-svg';

const FilterGraphs = ({ 
  accelData, 
  gyroData, 
  maxPoints = 50, // Maximum number of points to display
  width = Dimensions.get('window').width - 40
}) => {
  // Height for the component
  const height = 600; // Height for all graphs
  
  // State to store historical data
  const [accelHistory, setAccelHistory] = useState({
    road: { x: [], y: [], z: [] },
    vehicle: { x: [], y: [], z: [] },
    driver: { x: [], y: [], z: [] },
    timestamps: []
  });
  
  const [gyroHistory, setGyroHistory] = useState({
    road: { x: [], y: [], z: [] },
    vehicle: { x: [], y: [], z: [] },
    driver: { x: [], y: [], z: [] },
    timestamps: []
  });
  
  // Graph rendering parameters
  const graphConfig = {
    padding: 30,
    graphHeight: 80, // Height per individual graph
    gap: 15, // Gap between graphs
    axisColor: 'rgba(255, 255, 255, 0.3)',
    colors: {
      road: '#FF6B6B',    // Red
      vehicle: '#4ECDC4', // Teal
      driver: '#FFD166',  // Yellow
      x: '#FF6B6B',       // Red - X axis
      y: '#4ECDC4',       // Teal - Y axis
      z: '#9B59B6'        // Purple - Z axis
    },
    // Value ranges for scaling the graph
    valueRanges: {
      accel: 1.0,  // ±1.0G for acceleration
      gyro: 1.0    // ±1.0 rad/s for gyroscope
    }
  };
  
  // Update history when new data arrives
  useEffect(() => {
    if (accelData) {
      const timestamp = Date.now();
      
      // Update accelerometer history
      setAccelHistory(prev => {
        // Add new data points
        const newHistory = {
          road: {
            x: [...prev.road.x, accelData.road.filtered.x],
            y: [...prev.road.y, accelData.road.filtered.y],
            z: [...prev.road.z, accelData.road.filtered.z]
          },
          vehicle: {
            x: [...prev.vehicle.x, accelData.vehicle.filtered.x],
            y: [...prev.vehicle.y, accelData.vehicle.filtered.y],
            z: [...prev.vehicle.z, accelData.vehicle.filtered.z]
          },
          driver: {
            x: [...prev.driver.x, accelData.driver.filtered.x],
            y: [...prev.driver.y, accelData.driver.filtered.y],
            z: [...prev.driver.z, accelData.driver.filtered.z]
          },
          timestamps: [...prev.timestamps, timestamp]
        };
        
        // Trim to maxPoints
        if (newHistory.timestamps.length > maxPoints) {
          newHistory.road.x = newHistory.road.x.slice(-maxPoints);
          newHistory.road.y = newHistory.road.y.slice(-maxPoints);
          newHistory.road.z = newHistory.road.z.slice(-maxPoints);
          newHistory.vehicle.x = newHistory.vehicle.x.slice(-maxPoints);
          newHistory.vehicle.y = newHistory.vehicle.y.slice(-maxPoints);
          newHistory.vehicle.z = newHistory.vehicle.z.slice(-maxPoints);
          newHistory.driver.x = newHistory.driver.x.slice(-maxPoints);
          newHistory.driver.y = newHistory.driver.y.slice(-maxPoints);
          newHistory.driver.z = newHistory.driver.z.slice(-maxPoints);
          newHistory.timestamps = newHistory.timestamps.slice(-maxPoints);
        }
        
        return newHistory;
      });
    }
    
    if (gyroData) {
      const timestamp = Date.now();
      
      // Update gyroscope history
      setGyroHistory(prev => {
        // Add new data points
        const newHistory = {
          road: {
            x: [...prev.road.x, gyroData.road.filtered.x],
            y: [...prev.road.y, gyroData.road.filtered.y],
            z: [...prev.road.z, gyroData.road.filtered.z]
          },
          vehicle: {
            x: [...prev.vehicle.x, gyroData.vehicle.filtered.x],
            y: [...prev.vehicle.y, gyroData.vehicle.filtered.y],
            z: [...prev.vehicle.z, gyroData.vehicle.filtered.z]
          },
          driver: {
            x: [...prev.driver.x, gyroData.driver.filtered.x],
            y: [...prev.driver.y, gyroData.driver.filtered.y],
            z: [...prev.driver.z, gyroData.driver.filtered.z]
          },
          timestamps: [...prev.timestamps, timestamp]
        };
        
        // Trim to maxPoints
        if (newHistory.timestamps.length > maxPoints) {
          newHistory.road.x = newHistory.road.x.slice(-maxPoints);
          newHistory.road.y = newHistory.road.y.slice(-maxPoints);
          newHistory.road.z = newHistory.road.z.slice(-maxPoints);
          newHistory.vehicle.x = newHistory.vehicle.x.slice(-maxPoints);
          newHistory.vehicle.y = newHistory.vehicle.y.slice(-maxPoints);
          newHistory.vehicle.z = newHistory.vehicle.z.slice(-maxPoints);
          newHistory.driver.x = newHistory.driver.x.slice(-maxPoints);
          newHistory.driver.y = newHistory.driver.y.slice(-maxPoints);
          newHistory.driver.z = newHistory.driver.z.slice(-maxPoints);
          newHistory.timestamps = newHistory.timestamps.slice(-maxPoints);
        }
        
        return newHistory;
      });
    }
  }, [accelData, gyroData, maxPoints]);
  
  // Create a path for a data series
  const createPath = (data, valueRange, graphY) => {
    if (!data || data.length < 2) return '';
    
    const graphWidth = width - (graphConfig.padding * 2);
    const graphHeight = graphConfig.graphHeight;
    
    return data.map((value, index) => {
      // Calculate x position based on index
      const x = graphConfig.padding + (index / (maxPoints - 1)) * graphWidth;
      
      // Calculate y position based on value (centered in the graph)
      // Map the value range (-valueRange to +valueRange) to the graph height
      const y = graphY + (graphHeight / 2) - ((value / valueRange) * (graphHeight / 2));
      
      return index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }).join('');
  };
  
  // Render a single filter graph
  const renderFilterGraph = (title, perspective, data, valueRange, yOffset, dataType) => {
    const graphWidth = width - (graphConfig.padding * 2);
    const graphHeight = graphConfig.graphHeight;
    
    // Center of the graph
    const centerY = yOffset + (graphHeight / 2);
    
    return (
      <React.Fragment key={`${dataType}-${perspective}`}>
        {/* Graph title */}
        <SvgText
          x={graphConfig.padding}
          y={yOffset - 10}
          fill={graphConfig.colors[perspective]}
          fontSize="14"
          fontWeight="bold"
        >
          {title}
        </SvgText>
        
        {/* Graph background */}
        <Rect
          x={graphConfig.padding}
          y={yOffset}
          width={graphWidth}
          height={graphHeight}
          fill="rgba(0, 0, 0, 0.2)"
          rx={5}
          ry={5}
        />
        
        {/* Center line */}
        <Line
          x1={graphConfig.padding}
          y1={centerY}
          x2={graphConfig.padding + graphWidth}
          y2={centerY}
          stroke={graphConfig.axisColor}
          strokeWidth="1"
          strokeDasharray="4,4"
        />
        
        {/* Y-axis labels */}
        <SvgText
          x={graphConfig.padding - 5}
          y={yOffset + 10}
          fill="white"
          fontSize="10"
          textAnchor="end"
        >
          +{valueRange}
        </SvgText>
        <SvgText
          x={graphConfig.padding - 5}
          y={yOffset + graphHeight - 5}
          fill="white"
          fontSize="10"
          textAnchor="end"
        >
          -{valueRange}
        </SvgText>
        
        {/* Draw data lines */}
        <Path
          d={createPath(data.x, valueRange, yOffset)}
          stroke={graphConfig.colors.x}
          strokeWidth="2"
          fill="none"
        />
        <Path
          d={createPath(data.y, valueRange, yOffset)}
          stroke={graphConfig.colors.y}
          strokeWidth="2"
          fill="none"
        />
        <Path
          d={createPath(data.z, valueRange, yOffset)}
          stroke={graphConfig.colors.z}
          strokeWidth="2"
          fill="none"
        />
        
        {/* Legend */}
        <Circle cx={width - 70} cy={yOffset + 10} r="4" fill={graphConfig.colors.x} />
        <SvgText x={width - 60} y={yOffset + 14} fill="white" fontSize="10">X</SvgText>
        
        <Circle cx={width - 45} cy={yOffset + 10} r="4" fill={graphConfig.colors.y} />
        <SvgText x={width - 35} y={yOffset + 14} fill="white" fontSize="10">Y</SvgText>
        
        <Circle cx={width - 20} cy={yOffset + 10} r="4" fill={graphConfig.colors.z} />
        <SvgText x={width - 10} y={yOffset + 14} fill="white" fontSize="10">Z</SvgText>
      </React.Fragment>
    );
  };
  
  // Calculate spacing for graphs
  const accelStartY = graphConfig.padding;
  const gyroStartY = accelStartY + (3 * (graphConfig.graphHeight + graphConfig.gap)) + 20;
  
  return (
    <View style={[styles.container, { width, height }]}>
      <Text style={styles.title}>Filter Comparison Graphs</Text>
      
      <ScrollView>
        <Svg width={width} height={height}>
          {/* Accelerometer section title */}
          <SvgText
            x={width / 2}
            y={15}
            fill="white"
            fontSize="16"
            fontWeight="bold"
            textAnchor="middle"
          >
            Accelerometer
          </SvgText>
          
          {/* Accelerometer Graphs */}
          {renderFilterGraph(
            "Road Filter", 
            "road", 
            accelHistory.road, 
            graphConfig.valueRanges.accel,
            accelStartY,
            "accel"
          )}
          
          {renderFilterGraph(
            "Vehicle Filter", 
            "vehicle", 
            accelHistory.vehicle, 
            graphConfig.valueRanges.accel,
            accelStartY + graphConfig.graphHeight + graphConfig.gap,
            "accel"
          )}
          
          {renderFilterGraph(
            "Driver Filter", 
            "driver", 
            accelHistory.driver, 
            graphConfig.valueRanges.accel,
            accelStartY + (2 * (graphConfig.graphHeight + graphConfig.gap)),
            "accel"
          )}
          
          {/* Gyroscope section title */}
          <SvgText
            x={width / 2}
            y={gyroStartY - 5}
            fill="white"
            fontSize="16"
            fontWeight="bold"
            textAnchor="middle"
          >
            Gyroscope
          </SvgText>
          
          {/* Gyroscope Graphs */}
          {renderFilterGraph(
            "Road Filter", 
            "road", 
            gyroHistory.road, 
            graphConfig.valueRanges.gyro,
            gyroStartY,
            "gyro"
          )}
          
          {renderFilterGraph(
            "Vehicle Filter", 
            "vehicle", 
            gyroHistory.vehicle, 
            graphConfig.valueRanges.gyro,
            gyroStartY + graphConfig.graphHeight + graphConfig.gap,
            "gyro"
          )}
          
          {renderFilterGraph(
            "Driver Filter", 
            "driver", 
            gyroHistory.driver, 
            graphConfig.valueRanges.gyro,
            gyroStartY + (2 * (graphConfig.graphHeight + graphConfig.gap)),
            "gyro"
          )}
        </Svg>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2C3E50',
    borderRadius: 15,
    padding: 10,
    marginVertical: 10
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10
  }
});

export default FilterGraphs;