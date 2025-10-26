import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import LocationService from '../services/LocationService';
import { useNavigation } from '@react-navigation/native';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom truck icon
const truckIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjRkY1NzIyIiBkPSJNNDgwIDI4OGgtMzJ2LTk2YzAtNy45LTMuMi0xNS41LTguOC0yMS4xbC04MC04MGMtNS42LTUuNi0xMy4yLTguOC0yMS4xLTguOEgyNDB2LTMyYzAtMTcuNy0xNC4zLTMyLTMyLTMySDMyQzE0LjMgNTAgMCA2NC4zIDAgODJ2MjA2YzAgMTcuNyAxNC4zIDMyIDMyIDMyaDE2LjhjOC41IDI4LjEgMzQuMSA0OCA2NC4yIDQ4czU1LjctMTkuOSA2NC4yLTQ4SDI4OGgyNC44YzguNSAyOC4xIDM0LjEgNDggNjQuMiA0OHM1NS43LTE5LjkgNjQuMi00OEg0ODBjMTcuNyAwIDMyLTE0LjMgMzItMzJ2LTMwYzAtMTcuNy0xNC4zLTMyLTMyLTMyem0tMzYwIDQ4Yy0xNy42IDAtMzItMTQuNC0zMi0zMnMxNC40LTMyIDMyLTMyIDMyIDE0LjQgMzIgMzItMTQuNCAzMi0zMiAzMnptMTkyLTExMkg3NnYtNDBoMjA0djQwem0xNi01NkgyNDBWMTE0aDk4LjFsMzguMSAzOC4xSDMyOHYxNS45em00OS0xNmgtNDB2LTMyaDQwdjMyem0tMzIgMTg0Yy0xNy42IDAtMzItMTQuNC0zMi0zMnMxNC40LTMyIDMyLTMyIDMyIDE0LjQgMzIgMzItMTQuNCAzMi0zMiAzMnoiLz48L3N2Zz4=',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Component to handle map updates
function MapUpdater({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView([center.latitude, center.longitude], map.getZoom());
    }
  }, [center, map]);

  return null;
}

export default function MapScreen() {
  const navigation = useNavigation();
  const [truckLocation, setTruckLocation] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Initial map center (default to Miami, FL)
  const [center, setCenter] = useState({
    latitude: 25.7617,
    longitude: -80.1918,
  });

  useEffect(() => {
    // Get user's current location to center map
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log('[MapScreen] Could not get initial location:', error);
          // Keep default Miami location
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    }

    // Connect to WebSocket service
    console.log('[MapScreen] Connecting to location service...');
    LocationService.connect('wss://api.coco-track.com');

    // Subscribe to location updates
    const unsubscribe = LocationService.subscribe((location) => {
      console.log('[MapScreen] Received location update:', location);
      setIsConnecting(false);
      setConnectionError(false);
      setIsDemoMode(LocationService.isDemoMode());

      // Update truck location
      setTruckLocation(location);

      // Center map on truck location on first update
      if (!truckLocation) {
        setCenter({
          latitude: location.latitude,
          longitude: location.longitude,
        });
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
      {/* Demo mode banner */}
      {isDemoMode && (
        <View style={[styles.statusBanner, styles.demoBanner]}>
          <Text style={styles.statusText}>🎭 DEMO MODE - Sample truck in Miami, FL</Text>
        </View>
      )}

      {/* Connection status banner */}
      {isConnecting && !isDemoMode && (
        <View style={styles.statusBanner}>
          <ActivityIndicator color="#FFFFFF" style={styles.loader} />
          <Text style={styles.statusText}>Connecting to truck...</Text>
        </View>
      )}

      {connectionError && !isDemoMode && (
        <View style={[styles.statusBanner, styles.errorBanner]}>
          <Text style={styles.statusText}>Connection lost. Retrying...</Text>
        </View>
      )}

      <MapContainer
        center={[center.latitude, center.longitude]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater center={truckLocation} />

        {truckLocation && (
          <Marker
            position={[truckLocation.latitude, truckLocation.longitude]}
            icon={truckIcon}
          >
            <Popup>
              <div>
                <strong>Coconut Truck</strong>
                <br />
                Last updated: {new Date(truckLocation.timestamp).toLocaleTimeString()}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Location info overlay (for debugging/demo) */}
      {truckLocation && (
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
    position: 'relative',
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
  },
  errorBanner: {
    backgroundColor: '#FF5722',
  },
  demoBanner: {
    backgroundColor: '#9C27B0',
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
    zIndex: 999,
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  adminButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    zIndex: 999,
    cursor: 'pointer',
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
