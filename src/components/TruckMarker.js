import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';

/**
 * TruckMarker Component
 * Displays a custom truck icon marker on the map
 */
export default function TruckMarker({ coordinate, title = 'Coconut Truck' }) {
  if (!coordinate || !coordinate.latitude || !coordinate.longitude) {
    return null;
  }

  return (
    <Marker
      coordinate={{
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      }}
      title={title}
      description="Fresh coconuts available here!"
      identifier="truck-marker"
    >
      {/* Custom truck icon */}
      <View style={styles.markerContainer}>
        <View style={styles.truckIcon}>
          <View style={styles.truckCab} />
          <View style={styles.truckBody} />
        </View>
        <View style={styles.markerShadow} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  truckIcon: {
    width: 40,
    height: 30,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  truckCab: {
    width: 15,
    height: 20,
    backgroundColor: '#FF6B35',
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  truckBody: {
    width: 25,
    height: 18,
    backgroundColor: '#4CAF50',
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginLeft: -2,
  },
  markerShadow: {
    width: 30,
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 3,
    marginTop: 2,
  },
});
