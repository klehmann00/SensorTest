// Add this component to a new file src/components/DebugPanel.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const DebugPanel = ({ rawData, processedData, calibrationOffsets, isCalibrated }) => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Debug Values</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Raw Sensor Values:</Text>
        <Text style={styles.value}>X: {rawData?.x?.toFixed(4) || 'N/A'}</Text>
        <Text style={styles.value}>Y: {rawData?.y?.toFixed(4) || 'N/A'}</Text>
        <Text style={styles.value}>Z: {rawData?.z?.toFixed(4) || 'N/A'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Processed Values:</Text>
        <Text style={styles.value}>Processed X: {processedData?.x?.toFixed(4) || 'N/A'}</Text>
        <Text style={styles.value}>Processed Y: {processedData?.y?.toFixed(4) || 'N/A'}</Text>
        <Text style={styles.value}>Processed Z: {processedData?.z?.toFixed(4) || 'N/A'}</Text>
        <Text style={styles.value}>Lateral: {processedData?.lateral?.toFixed(4) || 'N/A'}</Text>
        <Text style={styles.value}>Longitudinal: {processedData?.longitudinal?.toFixed(4) || 'N/A'}</Text>
        <Text style={styles.value}>Vertical: {processedData?.vertical?.toFixed(4) || 'N/A'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Filtered Values:</Text>
        <Text style={styles.value}>Filtered X: {processedData?.filtered_x?.toFixed(4) || 'N/A'}</Text>
        <Text style={styles.value}>Filtered Y: {processedData?.filtered_y?.toFixed(4) || 'N/A'}</Text>
        <Text style={styles.value}>Filtered Z: {processedData?.filtered_z?.toFixed(4) || 'N/A'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>GGPlot Input Values:</Text>
        <Text style={styles.value}>Lateral Movement: {(processedData?.lateral - (isCalibrated ? calibrationOffsets.x : 0))?.toFixed(4) || 'N/A'}</Text>
        <Text style={styles.value}>Longitudinal Movement: {(processedData?.longitudinal - (isCalibrated ? calibrationOffsets.y : 0))?.toFixed(4) || 'N/A'}</Text>
        <Text style={styles.value}>Vertical Movement: {(processedData?.vertical - (isCalibrated ? calibrationOffsets.z : 0))?.toFixed(4) || 'N/A'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Calibration:</Text>
        <Text style={styles.value}>Calibrated: {isCalibrated ? 'Yes' : 'No'}</Text>
        <Text style={styles.value}>Offset X: {calibrationOffsets?.x?.toFixed(4) || 'N/A'}</Text>
        <Text style={styles.value}>Offset Y: {calibrationOffsets?.y?.toFixed(4) || 'N/A'}</Text>
        <Text style={styles.value}>Offset Z: {calibrationOffsets?.z?.toFixed(4) || 'N/A'}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    maxHeight: 300,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  section: {
    marginBottom: 15,
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
  },
});

export default DebugPanel;