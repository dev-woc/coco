import LocationService from './LocationService';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

describe('LocationService', () => {
  let mockSocket;

  beforeEach(() => {
    // Reset the service state
    LocationService.disconnect();

    // Create mock socket with EventEmitter-like behavior
    mockSocket = {
      on: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      emit: jest.fn(),
    };

    io.mockReturnValue(mockSocket);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection Management', () => {
    it('should initialize connection with correct configuration', () => {
      const url = 'wss://test-server.com';
      LocationService.connect(url);

      expect(io).toHaveBeenCalledWith(url, expect.objectContaining({
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
      }));
    });

    it('should set up event handlers on connection', () => {
      LocationService.connect();

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('location', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('reconnect_attempt', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('reconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('reconnect_failed', expect.any(Function));
    });

    it('should not connect if already connected', () => {
      LocationService.connect();
      io.mockClear();

      LocationService.isConnected = true;
      LocationService.connect();

      expect(io).not.toHaveBeenCalled();
    });

    it('should disconnect properly', () => {
      LocationService.connect();
      LocationService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(LocationService.getConnectionStatus()).toBe(false);
    });
  });

  describe('Location Updates', () => {
    it('should handle location updates', () => {
      LocationService.connect();

      // Find the location event handler
      const locationHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'location'
      )[1];

      const testLocation = {
        latitude: 25.7617,
        longitude: -80.1918,
        timestamp: '2025-10-11T12:00:00Z',
        accuracy: 10,
      };

      locationHandler(testLocation);

      const currentLocation = LocationService.getCurrentLocation();
      expect(currentLocation.latitude).toBe(testLocation.latitude);
      expect(currentLocation.longitude).toBe(testLocation.longitude);
    });

    it('should add timestamp if not provided', () => {
      LocationService.connect();

      const locationHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'location'
      )[1];

      const testLocation = {
        latitude: 25.7617,
        longitude: -80.1918,
      };

      locationHandler(testLocation);

      const currentLocation = LocationService.getCurrentLocation();
      expect(currentLocation.timestamp).toBeDefined();
    });
  });

  describe('Subscription Management', () => {
    it('should allow subscribing to location updates', () => {
      const callback = jest.fn();
      const unsubscribe = LocationService.subscribe(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should notify subscribers of location updates', () => {
      LocationService.connect();

      const callback = jest.fn();
      LocationService.subscribe(callback);

      const locationHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'location'
      )[1];

      const testLocation = {
        latitude: 25.7617,
        longitude: -80.1918,
        timestamp: '2025-10-11T12:00:00Z',
      };

      locationHandler(testLocation);

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        latitude: testLocation.latitude,
        longitude: testLocation.longitude,
      }));
    });

    it('should send current location to new subscribers', () => {
      LocationService.currentLocation = {
        latitude: 25.7617,
        longitude: -80.1918,
        timestamp: '2025-10-11T12:00:00Z',
      };

      const callback = jest.fn();
      LocationService.subscribe(callback);

      expect(callback).toHaveBeenCalledWith(LocationService.currentLocation);
    });

    it('should allow unsubscribing from updates', () => {
      const callback = jest.fn();
      const unsubscribe = LocationService.subscribe(callback);

      unsubscribe();

      LocationService._notifyListeners({ latitude: 0, longitude: 0 });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Reconnection Logic', () => {
    it('should handle connection errors', () => {
      LocationService.connect();

      const errorHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect_error'
      )[1];

      errorHandler(new Error('Network error'));

      expect(LocationService.getConnectionStatus()).toBe(false);
    });

    it('should manually reconnect when requested', () => {
      LocationService.connect();
      LocationService.reconnect();

      expect(mockSocket.connect).toHaveBeenCalled();
    });

    it('should handle server-initiated disconnect', () => {
      LocationService.connect();

      const disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )[1];

      disconnectHandler('io server disconnect');

      expect(mockSocket.connect).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in listener callbacks gracefully', () => {
      LocationService.connect();

      const badCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const goodCallback = jest.fn();

      LocationService.subscribe(badCallback);
      LocationService.subscribe(goodCallback);

      const locationHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'location'
      )[1];

      const testLocation = {
        latitude: 25.7617,
        longitude: -80.1918,
      };

      // Should not throw
      expect(() => locationHandler(testLocation)).not.toThrow();

      // Good callback should still be called
      expect(goodCallback).toHaveBeenCalled();
    });
  });
});
