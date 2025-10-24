import * as Location from 'expo-location';
import {
  requestLocationPermission,
  checkLocationPermission,
  getCurrentLocation,
} from './locationPermissions';

// Mock expo-location
jest.mock('expo-location');

describe('Location Permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestLocationPermission', () => {
    it('should return granted true when permission is granted', async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
      });

      const result = await requestLocationPermission();

      expect(result.granted).toBe(true);
      expect(result.status).toBe('granted');
    });

    it('should return granted false when permission is denied', async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'denied',
      });

      const result = await requestLocationPermission();

      expect(result.granted).toBe(false);
      expect(result.status).toBe('denied');
    });

    it('should handle errors gracefully', async () => {
      Location.requestForegroundPermissionsAsync.mockRejectedValue(
        new Error('Permission error')
      );

      const result = await requestLocationPermission();

      expect(result.granted).toBe(false);
      expect(result.status).toBe('error');
      expect(result.error).toBe('Permission error');
    });
  });

  describe('checkLocationPermission', () => {
    it('should return true when permission is granted', async () => {
      Location.getForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
      });

      const result = await checkLocationPermission();

      expect(result).toBe(true);
    });

    it('should return false when permission is not granted', async () => {
      Location.getForegroundPermissionsAsync.mockResolvedValue({
        status: 'denied',
      });

      const result = await checkLocationPermission();

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      Location.getForegroundPermissionsAsync.mockRejectedValue(
        new Error('Check error')
      );

      const result = await checkLocationPermission();

      expect(result).toBe(false);
    });
  });

  describe('getCurrentLocation', () => {
    it('should return location when permission is granted', async () => {
      Location.getForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
      });

      Location.getCurrentPositionAsync.mockResolvedValue({
        coords: {
          latitude: 25.7617,
          longitude: -80.1918,
          accuracy: 10,
        },
      });

      const result = await getCurrentLocation();

      expect(result).toEqual({
        latitude: 25.7617,
        longitude: -80.1918,
        accuracy: 10,
      });
    });

    it('should return null when permission is not granted', async () => {
      Location.getForegroundPermissionsAsync.mockResolvedValue({
        status: 'denied',
      });

      const result = await getCurrentLocation();

      expect(result).toBeNull();
      expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
    });

    it('should return null on error', async () => {
      Location.getForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
      });

      Location.getCurrentPositionAsync.mockRejectedValue(
        new Error('Location error')
      );

      const result = await getCurrentLocation();

      expect(result).toBeNull();
    });

    it('should use balanced accuracy', async () => {
      Location.getForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
      });

      Location.getCurrentPositionAsync.mockResolvedValue({
        coords: {
          latitude: 25.7617,
          longitude: -80.1918,
          accuracy: 10,
        },
      });

      await getCurrentLocation();

      expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
        accuracy: Location.Accuracy.Balanced,
      });
    });
  });
});
