import * as Location from 'expo-location';

/**
 * Location Permissions Utility
 * Handles requesting and checking location permissions
 */

/**
 * Request location permissions from user
 * @returns {Promise<{granted: boolean, status: string}>}
 */
export async function requestLocationPermission() {
  try {
    console.log('[LocationPermissions] Requesting location permission...');

    const { status } = await Location.requestForegroundPermissionsAsync();

    console.log('[LocationPermissions] Permission status:', status);

    return {
      granted: status === 'granted',
      status,
    };
  } catch (error) {
    console.error('[LocationPermissions] Error requesting permission:', error);
    return {
      granted: false,
      status: 'error',
      error: error.message,
    };
  }
}

/**
 * Check if location permissions are granted
 * @returns {Promise<boolean>}
 */
export async function checkLocationPermission() {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('[LocationPermissions] Error checking permission:', error);
    return false;
  }
}

/**
 * Get current device location
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number}|null>}
 */
export async function getCurrentLocation() {
  try {
    const hasPermission = await checkLocationPermission();

    if (!hasPermission) {
      console.warn('[LocationPermissions] Location permission not granted');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    };
  } catch (error) {
    console.error('[LocationPermissions] Error getting location:', error);
    return null;
  }
}
