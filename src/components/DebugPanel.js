// src/components/DebugPanel.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

/**
 * Debug panel for displaying detailed sensor information
 * @param {Object} props - Component props
 * @param {Object} props.rawData - Raw sensor data
 * @param {Object} props.processedData - Processed sensor data
 * @param {Object} props.calibrationOffsets - Calibration offset values
 * @param {boolean} props.isCalibrated - Whether device is calibrated
 */
const DebugPanel = ({ rawData, processedData, calibrationOffsets, isCalibrated }) => {
  const [expanded, setExpanded] = useState({
    raw: true,
    transformed: true,
    processed: true,
    calibration: true
  });
  
  // Toggle section expansion
  const toggleSection = (section) => {
    setExpanded({
      ...expanded,
      [section]: !expanded[section]
    });
  };
  
  // Extract raw values safely
  const rawValues = rawData?.raw || rawData || { x: 0, y: 0, z: 0 };
  
  // Extract transformed values safely
  const transformedValues = processedData?.transformed || { x: 0, y: 0, z: 0 };
  
  // Extract processed values safely
  const processedValues = processedData?.processed || { x: 0, y: 0, z: 0 };
  
  // Extract final values with proper naming
  const finalValues = {
    lateral: processedData?.lateral || processedValues.x || 0,
    longitudinal: processedData?.longitudinal || processedValues.y || 0,
    vertical: processedData?.vertical || processedValues.z || 0
  };
  
  // Create section header
  const SectionHeader = ({ title, section }) => (
    <TouchableOpacity 
      style={styles.sectionHeader}
      onPress={() => toggleSection(section)}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.expandButton}>
        {expanded[section] ? '▼' : '▶'}
      </Text>
    </TouchableOpacity>
  );
  
  // Format value for display
  const formatValue = (value) => {
    if (value === undefined || value === null) {
      return 'N/A';
    }
    if (typeof value === 'number') {
      return value.toFixed(4);
    }
    return String(value);
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Debug Values</Text>
      
      {/* Raw sensor data */}
      <SectionHeader title="Raw Sensor Values" section="raw" />
      {expanded.raw && (
        <View style={styles.section}>
          <Text style={styles.value}>X: {formatValue(rawValues.x)}</Text>
          <Text style={styles.value}>Y: {formatValue(rawValues.y)}</Text>
          <Text style={styles.value}>Z: {formatValue(rawValues.z)}</Text>
          <Text style={styles.value}>Timestamp: {rawValues.timestamp || 'N/A'}</Text>
        </View>
      )}
      
      {/* Transformed values */}
      <SectionHeader title="Transformed Values" section="transformed" />
      {expanded.transformed && (
        <View style={styles.section}>
          <Text style={styles.value}>X: {formatValue(transformedValues.x)}</Text>
          <Text style={styles.value}>Y: {formatValue(transformedValues.y)}</Text>
          <Text style={styles.value}>Z: {formatValue(transformedValues.z)}</Text>
          <Text style={styles.value}>Timestamp: {transformedValues.timestamp || 'N/A'}</Text>
        </View>
      )}
      
      {/* Processed values */}
      <SectionHeader title="Processed Values" section="processed" />
      {expanded.processed && (
        <View style={styles.section}>
          <Text style={styles.value}>X: {formatValue(processedValues.x)}</Text>
          <Text style={styles.value}>Y: {formatValue(processedValues.y)}</Text>
          <Text style={styles.value}>Z: {formatValue(processedValues.z)}</Text>
          
          <Text style={styles.valueHeader}>Vehicle Dynamics Naming:</Text>
          <Text style={styles.value}>Lateral: {formatValue(finalValues.lateral)}</Text>
          <Text style={styles.value}>Longitudinal: {formatValue(finalValues.longitudinal)}</Text>
          <Text style={styles.value}>Vertical: {formatValue(finalValues.vertical)}</Text>
          
          {/* Intermediate values if available */}
          {processedData?.intermediate && (
            <>
              <Text style={styles.valueHeader}>Intermediate Values:</Text>
              {processedData.intermediate.limited && (
                <>
                  <Text style={styles.value}>Limited X: {formatValue(processedData.intermediate.limited.x)}</Text>
                  <Text style={styles.value}>Limited Y: {formatValue(processedData.intermediate.limited.y)}</Text>
                  <Text style={styles.value}>Limited Z: {formatValue(processedData.intermediate.limited.z)}</Text>
                </>
              )}
              
              {processedData.intermediate.filtered && (
                <>
                  <Text style={styles.value}>Filtered X: {formatValue(processedData.intermediate.filtered.x)}</Text>
                  <Text style={styles.value}>Filtered Y: {formatValue(processedData.intermediate.filtered.y)}</Text>
                  <Text style={styles.value}>Filtered Z: {formatValue(processedData.intermediate.filtered.z)}</Text>
                </>
              )}
            </>
          )}
          
          {/* Error information if available */}
          {processedData?.error && (
            <View style={styles.errorSection}>
              <Text style={styles.errorHeader}>Error Information:</Text>
              <Text style={styles.errorText}>{processedData.errorMessage || 'Unknown error'}</Text>
            </View>
          )}
        </View>
      )}
      
      {/* Calibration information */}
      <SectionHeader title="Calibration Information" section="calibration" />
      {expanded.calibration && (
        <View style={styles.section}>
          <Text style={styles.value}>Calibrated: {isCalibrated ? 'Yes' : 'No'}</Text>
          <Text style={styles.value}>Offset X: {formatValue(calibrationOffsets?.x)}</Text>
          <Text style={styles.value}>Offset Y: {formatValue(calibrationOffsets?.y)}</Text>
          <Text style={styles.value}>Offset Z: {formatValue(calibrationOffsets?.z)}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 10,
    maxHeight: 400,
    width: '100%',
    marginVertical: 10,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
    marginBottom: 5,
  },
  sectionTitle: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  expandButton: {
    color: 'white',
    fontSize: 14,
  },
  section: {
    marginBottom: 15,
    paddingLeft: 10,
  },
  valueHeader: {
    color: '#95A5A6',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 2,
  },
  value: {
    color: 'white',
    fontSize: 14,
    marginBottom: 2,
  },
  errorSection: {
    backgroundColor: 'rgba(231, 76, 60, 0.3)',
    padding: 8,
    borderRadius: 5,
    marginTop: 8,
  },
  errorHeader: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  errorText: {
    color: '#F5B7B1',
    fontSize: 14,
  }
});

export default DebugPanel;