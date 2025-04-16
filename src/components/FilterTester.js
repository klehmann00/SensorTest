// src/components/FilterTester.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import EnhancedSensorProcessor from '../processors/EnhancedSensorProcessor';

// Test component for both accelerometer and gyroscope
const FilterTester = ({ accelData, gyroData }) => {
  const [processedAccel, setProcessedAccel] = useState(null);
  const [processedGyro, setProcessedGyro] = useState(null);
  
  useEffect(() => {
    if (accelData) {
      const result = EnhancedSensorProcessor.processAccelerometerData(accelData);
      setProcessedAccel(result);
    }
  }, [accelData]);
  
  useEffect(() => {
    if (gyroData) {
      const result = EnhancedSensorProcessor.processGyroscopeData(gyroData);
      setProcessedGyro(result);
    }
  }, [gyroData]);
  
  if (!processedAccel || !processedGyro) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Waiting for sensor data...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enhanced Filter Test</Text>
      
      {/* Accelerometer Section */}
      <Text style={styles.mainHeader}>Accelerometer</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Road Filter</Text>
        <Text style={styles.value}>X: {processedAccel.road.filtered.x.toFixed(3)}</Text>
        <Text style={styles.value}>Y: {processedAccel.road.filtered.y.toFixed(3)}</Text>
        <Text style={styles.value}>Z: {processedAccel.road.filtered.z.toFixed(3)}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Filter</Text>
        <Text style={styles.value}>X: {processedAccel.vehicle.filtered.x.toFixed(3)}</Text>
        <Text style={styles.value}>Y: {processedAccel.vehicle.filtered.y.toFixed(3)}</Text>
        <Text style={styles.value}>Z: {processedAccel.vehicle.filtered.z.toFixed(3)}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Driver Filter</Text>
        <Text style={styles.value}>X: {processedAccel.driver.filtered.x.toFixed(3)}</Text>
        <Text style={styles.value}>Y: {processedAccel.driver.filtered.y.toFixed(3)}</Text>
        <Text style={styles.value}>Z: {processedAccel.driver.filtered.z.toFixed(3)}</Text>
      </View>
      
      {/* Gyroscope Section */}
      <Text style={styles.mainHeader}>Gyroscope</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Road Filter</Text>
        <Text style={styles.value}>X: {processedGyro.road.filtered.x.toFixed(3)}</Text>
        <Text style={styles.value}>Y: {processedGyro.road.filtered.y.toFixed(3)}</Text>
        <Text style={styles.value}>Z: {processedGyro.road.filtered.z.toFixed(3)}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Filter</Text>
        <Text style={styles.value}>X: {processedGyro.vehicle.filtered.x.toFixed(3)}</Text>
        <Text style={styles.value}>Y: {processedGyro.vehicle.filtered.y.toFixed(3)}</Text>
        <Text style={styles.value}>Z: {processedGyro.vehicle.filtered.z.toFixed(3)}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Driver Filter</Text>
        <Text style={styles.value}>X: {processedGyro.driver.filtered.x.toFixed(3)}</Text>
        <Text style={styles.value}>Y: {processedGyro.driver.filtered.y.toFixed(3)}</Text>
        <Text style={styles.value}>Z: {processedGyro.driver.filtered.z.toFixed(3)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 10,
    margin: 10,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  mainHeader: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  section: {
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 5,
  },
  sectionTitle: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  value: {
    color: 'white',
    fontSize: 14,
    marginBottom: 2,
  }
});

export default FilterTester;