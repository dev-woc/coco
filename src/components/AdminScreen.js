import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import LocationService from '../services/LocationService';

export default function AdminScreen() {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [locationWatcher, setLocationWatcher] = useState(null);

  useEffect(() => {
    // Connect to WebSocket service
    LocationService.connect('wss://api.coco-track.com');

    // Check connection status
    const checkConnection = setInterval(() => {
      setIsConnected(LocationService.getConnectionStatus());
    }, 1000);

    // Subscribe to location updates to show current truck location
    const unsubscribe = LocationService.subscribe((location) => {
      setCurrentLocation(location);
    });

    return () => {
      unsubscribe();
      clearInterval(checkConnection);
      if (locationWatcher) {
        locationWatcher.remove();
      }
      LocationService.disconnect();
    };
  }, []);

  // Handle auto-update toggle
  useEffect(() => {
    if (autoUpdate) {
      startAutoUpdate();
    } else {
      stopAutoUpdate();
    }
  }, [autoUpdate]);

  const startAutoUpdate = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for auto-update.');
        setAutoUpdate(false);
        return;
      }

      // Watch position changes
      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Or when moved 10 meters
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          sendLocationUpdate(latitude, longitude);
        }
      );

      setLocationWatcher(watcher);
    } catch (error) {
      console.error('[AdminScreen] Error starting auto-update:', error);
      Alert.alert('Error', 'Failed to start auto-update: ' + error.message);
      setAutoUpdate(false);
    }
  };

  const stopAutoUpdate = () => {
    if (locationWatcher) {
      locationWatcher.remove();
      setLocationWatcher(null);
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      setIsSending(true);

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        setIsSending(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(location.coords.latitude.toString());
      setLongitude(location.coords.longitude.toString());
      setIsSending(false);
    } catch (error) {
      console.error('[AdminScreen] Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location: ' + error.message);
      setIsSending(false);
    }
  };

  const sendLocationUpdate = (lat, lng) => {
    const locationData = {
      latitude: typeof lat === 'string' ? parseFloat(lat) : lat,
      longitude: typeof lng === 'string' ? parseFloat(lng) : lng,
      timestamp: Date.now(),
    };

    // Send location via WebSocket
    LocationService.sendLocation(locationData);
  };

  const handleSendLocation = () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Invalid Input', 'Please enter valid latitude and longitude values.');
      return;
    }

    if (lat < -90 || lat > 90) {
      Alert.alert('Invalid Latitude', 'Latitude must be between -90 and 90.');
      return;
    }

    if (lng < -180 || lng > 180) {
      Alert.alert('Invalid Longitude', 'Longitude must be between -180 and 180.');
      return;
    }

    setIsSending(true);
    sendLocationUpdate(lat, lng);

    setTimeout(() => {
      setIsSending(false);
      Alert.alert('Success', 'Location updated successfully!');
    }, 500);
  };

  const handleSetPresetLocation = (name, lat, lng) => {
    setLatitude(lat.toString());
    setLongitude(lng.toString());
  };

  // Preset locations (can be customized)
  const presetLocations = [
    { name: 'Miami Beach', lat: 25.7907, lng: -80.1300 },
    { name: 'Downtown Miami', lat: 25.7753, lng: -80.1892 },
    { name: 'Wynwood', lat: 25.8010, lng: -80.1994 },
    { name: 'Coconut Grove', lat: 25.7286, lng: -80.2520 },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Connection Status */}
        <View style={[styles.statusCard, isConnected ? styles.connected : styles.disconnected]}>
          <Text style={styles.statusText}>
            {isConnected ? '● Connected to Server' : '○ Disconnected'}
          </Text>
        </View>

        {/* Current Truck Location */}
        {currentLocation && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Current Truck Location</Text>
            <Text style={styles.coordText}>
              Lat: {currentLocation.latitude.toFixed(6)}
            </Text>
            <Text style={styles.coordText}>
              Lng: {currentLocation.longitude.toFixed(6)}
            </Text>
            <Text style={styles.timestampText}>
              Last Updated: {new Date(currentLocation.timestamp).toLocaleString()}
            </Text>
          </View>
        )}

        {/* Auto-Update Toggle */}
        <View style={styles.card}>
          <View style={styles.autoUpdateRow}>
            <View style={styles.autoUpdateText}>
              <Text style={styles.cardTitle}>Auto-Update Location</Text>
              <Text style={styles.descriptionText}>
                Automatically send your current location every 10 seconds
              </Text>
            </View>
            <Switch
              value={autoUpdate}
              onValueChange={setAutoUpdate}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={autoUpdate ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Manual Location Input */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Set Location Manually</Text>

          <Text style={styles.label}>Latitude</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 25.7617"
            value={latitude}
            onChangeText={setLatitude}
            keyboardType="numeric"
            editable={!autoUpdate}
          />

          <Text style={styles.label}>Longitude</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., -80.1918"
            value={longitude}
            onChangeText={setLongitude}
            keyboardType="numeric"
            editable={!autoUpdate}
          />

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleGetCurrentLocation}
            disabled={isSending || autoUpdate}
          >
            {isSending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Use My Current Location</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, (!isConnected || autoUpdate) && styles.buttonDisabled]}
            onPress={handleSendLocation}
            disabled={!isConnected || isSending || autoUpdate}
          >
            <Text style={styles.buttonText}>
              {isSending ? 'Sending...' : 'Update Truck Location'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preset Locations */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Locations</Text>
          <View style={styles.presetGrid}>
            {presetLocations.map((location, index) => (
              <TouchableOpacity
                key={index}
                style={styles.presetButton}
                onPress={() => handleSetPresetLocation(location.name, location.lat, location.lng)}
                disabled={autoUpdate}
              >
                <Text style={styles.presetButtonText}>{location.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Instructions</Text>
          <Text style={styles.instructionText}>
            1. Enable "Auto-Update" to send your current location automatically{'\n'}
            2. Or manually enter coordinates and click "Update Truck Location"{'\n'}
            3. Use "Quick Locations" for preset addresses{'\n'}
            4. Customers will see the location update in real-time
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  statusCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  disconnected: {
    backgroundColor: '#FF5722',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  coordText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  timestampText: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  autoUpdateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoUpdateText: {
    flex: 1,
    marginRight: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPrimary: {
    backgroundColor: '#FF5722',
  },
  buttonSecondary: {
    backgroundColor: '#2196F3',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  presetButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    minWidth: '45%',
  },
  presetButtonText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});
