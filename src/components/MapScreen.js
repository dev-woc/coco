import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Platform, Alert, TouchableOpacity } from 'react-native';
import MapView, { PROVIDER_GOOGLE, AnimatedRegion } from 'react-native-maps';
import TruckMarker from './TruckMarker';
import LocationService from '../services/LocationService';
import { requestLocationPermission } from '../utils/locationPermissions';
import { useNavigation } from '@react-navigation/native';

export default function MapScreen() {
  const navigation = useNavigation();
  const [truckLocation, setTruckLocation] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const mapRef = useRef(null);

  // Animated region for smooth marker movement
  const markerCoordinate = useRef(null);

  // Initial map region (default to Miami, FL)
  const [region, setRegion] = useState({
    latitude: 25.7617,
    longitude: -80.1918,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    // Request location permissions
    const setupLocationPermissions = async () => {
      const result = await requestLocationPermission();
      setLocationPermissionGranted(result.granted);

      if (!result.granted) {
        Alert.alert(
          'Location Permission',
          'Location permission is needed to show your position on the map. You can still view the truck location.',
          [{ text: 'OK' }]
        );
      }
    };

    setupLocationPermissions();
    // Connect to WebSocket service
    console.log('[MapScreen] Connecting to location service...');
    LocationService.connect('wss://api.coco-track.com');

    // Subscribe to location updates
    const unsubscribe = LocationService.subscribe((location) => {
      console.log('[MapScreen] Received location update:', location);
      setIsConnecting(false);
      setConnectionError(false);

      // Update truck location
      setTruckLocation(location);

      // Animate marker to new position if we have a previous position
      if (markerCoordinate.current) {
        markerCoordinate.current.timing({
          latitude: location.latitude,
          longitude: location.longitude,
          duration: 1000, // 1 second animation
        }).start();
      } else {
        // First location - initialize animated region
        markerCoordinate.current = new AnimatedRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0,
          longitudeDelta: 0,
        });

        // Center map on truck location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }, 1000);
        }
      }
    });

    // Check connection status periodically
    const connectionCheckInterval = setInterval(() => {
      if (!LocationService.getConnectionStatus() && !isConnecting) {
        setConnectionError(true);
      }
    }, 5000);

    // Cleanup on unmount
    return () => {
      unsubscribe();
      clearInterval(connectionCheckInterval);
      LocationService.disconnect();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Connection status banner */}
      {isConnecting && (
        <View style={styles.statusBanner}>
          <ActivityIndicator color="#FFFFFF" style={styles.loader} />
          <Text style={styles.statusText}>Connecting to truck...</Text>
        </View>
      )}

      {connectionError && (
        <View style={[styles.statusBanner, styles.errorBanner]}>
          <Text style={styles.statusText}>Connection lost. Retrying...</Text>
        </View>
      )}

      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : null}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={locationPermissionGranted}
        showsMyLocationButton={locationPermissionGranted}
        showsCompass={true}
        zoomEnabled={true}
        zoomControlEnabled={true}
        scrollEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
        loadingEnabled={true}
      >
        {/* Truck marker */}
        {truckLocation && (
          <TruckMarker
            coordinate={truckLocation}
            title="Coconut Truck"
          />
        )}
      </MapView>

      {/* Location info overlay (for debugging/demo) */}
      {truckLocation && __DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Truck Location: {truckLocation.latitude.toFixed(4)}, {truckLocation.longitude.toFixed(4)}
          </Text>
          <Text style={styles.debugText}>
            Updated: {new Date(truckLocation.timestamp).toLocaleTimeString()}
          </Text>
        </View>
      )}

      {/* Admin button */}
      <TouchableOpacity
        style={styles.adminButton}
        onPress={() => navigation.navigate('Admin')}
      >
        <Text style={styles.adminButtonText}>⚙️ Admin</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  statusBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  errorBanner: {
    backgroundColor: '#FF5722',
  },
  loader: {
    marginRight: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  debugInfo: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  adminButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
