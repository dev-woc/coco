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
} from 'react-native';
import LocationService from '../services/LocationService';

const STORAGE_KEYS = {
  LATITUDE: 'coco_track_latitude',
  LONGITUDE: 'coco_track_longitude',
  BROADCAST: 'coco_track_broadcast',
};

export default function AdminScreen() {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [watchId, setWatchId] = useState(null);

  // Load saved data on mount
  useEffect(() => {
    loadSavedData();
  }, []);

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
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      LocationService.disconnect();
    };
  }, []);

  const loadSavedData = () => {
    try {
      const savedLat = localStorage.getItem(STORAGE_KEYS.LATITUDE);
      const savedLng = localStorage.getItem(STORAGE_KEYS.LONGITUDE);
      const savedBroadcast = localStorage.getItem(STORAGE_KEYS.BROADCAST);

      if (savedLat) setLatitude(savedLat);
      if (savedLng) setLongitude(savedLng);
      if (savedBroadcast !== null) setIsBroadcasting(savedBroadcast === 'true');
    } catch (error) {
      console.error('[AdminScreen] Error loading saved data:', error);
    }
  };

  const saveLocation = (lat, lng) => {
    try {
      localStorage.setItem(STORAGE_KEYS.LATITUDE, lat.toString());
      localStorage.setItem(STORAGE_KEYS.LONGITUDE, lng.toString());
    } catch (error) {
      console.error('[AdminScreen] Error saving location:', error);
    }
  };

  const saveBroadcastStatus = (status) => {
    try {
      localStorage.setItem(STORAGE_KEYS.BROADCAST, status.toString());
    } catch (error) {
      console.error('[AdminScreen] Error saving broadcast status:', error);
    }
  };

  const handleClearLocation = () => {
    if (window.confirm('Are you sure you want to clear the saved location?')) {
      try {
        localStorage.removeItem(STORAGE_KEYS.LATITUDE);
        localStorage.removeItem(STORAGE_KEYS.LONGITUDE);
        setLatitude('');
        setLongitude('');
        alert('Location cleared!');
      } catch (error) {
        console.error('[AdminScreen] Error clearing location:', error);
        alert('Failed to clear location');
      }
    }
  };

  const handleBroadcastToggle = (value) => {
    setIsBroadcasting(value);
    saveBroadcastStatus(value);

    // If turning off broadcast, send a stop signal
    if (!value && isConnected) {
      LocationService.sendBroadcastStatus(false);
    }
  };

  // Handle auto-update toggle
  useEffect(() => {
    if (autoUpdate) {
      startAutoUpdate();
    } else {
      stopAutoUpdate();
    }
  }, [autoUpdate]);

  const startAutoUpdate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setAutoUpdate(false);
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        sendLocationUpdate(latitude, longitude);
      },
      (error) => {
        console.error('[AdminScreen] Geolocation error:', error);
        alert('Failed to get location: ' + error.message);
        setAutoUpdate(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    setWatchId(id);
  };

  const stopAutoUpdate = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsSending(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toString();
        const lng = position.coords.longitude.toString();
        setLatitude(lat);
        setLongitude(lng);
        saveLocation(lat, lng);
        setIsSending(false);
      },
      (error) => {
        console.error('[AdminScreen] Error getting location:', error);
        alert('Failed to get current location: ' + error.message);
        setIsSending(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const sendLocationUpdate = (lat, lng) => {
    const locationData = {
      latitude: typeof lat === 'string' ? parseFloat(lat) : lat,
      longitude: typeof lng === 'string' ? parseFloat(lng) : lng,
      timestamp: Date.now(),
      isBroadcasting: isBroadcasting,
    };

    // Send location via WebSocket
    LocationService.sendLocation(locationData);
  };

  const handleSendLocation = () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid latitude and longitude values.');
      return;
    }

    if (lat < -90 || lat > 90) {
      alert('Latitude must be between -90 and 90.');
      return;
    }

    if (lng < -180 || lng > 180) {
      alert('Longitude must be between -180 and 180.');
      return;
    }

    setIsSending(true);
    saveLocation(lat, lng);
    sendLocationUpdate(lat, lng);

    setTimeout(() => {
      setIsSending(false);
      alert('Location updated successfully!');
    }, 500);
  };

  const handleSetPresetLocation = (name, lat, lng) => {
    setLatitude(lat.toString());
    setLongitude(lng.toString());
    saveLocation(lat, lng);
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

        {/* Broadcast Toggle */}
        <View style={styles.card}>
          <View style={styles.autoUpdateRow}>
            <View style={styles.autoUpdateText}>
              <Text style={styles.cardTitle}>
                {isBroadcasting ? '🟢 Broadcasting' : '🔴 Not Broadcasting'}
              </Text>
              <Text style={styles.descriptionText}>
                {isBroadcasting
                  ? 'Truck is OPEN and sharing location with customers'
                  : 'Truck is CLOSED - customers cannot see location'}
              </Text>
            </View>
            <Switch
              value={isBroadcasting}
              onValueChange={handleBroadcastToggle}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={isBroadcasting ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Auto-Update Toggle */}
        <View style={styles.card}>
          <View style={styles.autoUpdateRow}>
            <View style={styles.autoUpdateText}>
              <Text style={styles.cardTitle}>Auto-Update Location</Text>
              <Text style={styles.descriptionText}>
                Automatically send your current location continuously
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
            editable={!autoUpdate}
          />

          <Text style={styles.label}>Longitude</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., -80.1918"
            value={longitude}
            onChangeText={setLongitude}
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

          <TouchableOpacity
            style={[styles.button, styles.buttonDanger]}
            onPress={handleClearLocation}
            disabled={autoUpdate || (!latitude && !longitude)}
          >
            <Text style={styles.buttonText}>Clear Saved Location</Text>
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
            1. Toggle "Broadcasting" ON when truck is open for business{'\n'}
            2. Enable "Auto-Update" to send your current location automatically{'\n'}
            3. Or manually enter coordinates and click "Update Truck Location"{'\n'}
            4. Use "Quick Locations" for preset addresses{'\n'}
            5. Saved locations persist between sessions{'\n'}
            6. Click "Clear Saved Location" to reset coordinates{'\n'}
            7. Customers can only see location when broadcasting is ON
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
    maxWidth: 800,
    marginHorizontal: 'auto',
    width: '100%',
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
    fontFamily: 'monospace',
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
    cursor: 'pointer',
  },
  buttonPrimary: {
    backgroundColor: '#FF5722',
  },
  buttonSecondary: {
    backgroundColor: '#2196F3',
  },
  buttonDanger: {
    backgroundColor: '#9E9E9E',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
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
    cursor: 'pointer',
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
