import { io } from 'socket.io-client';

/**
 * LocationService
 * Manages WebSocket connection to GPS/Tracker Service
 * Provides real-time truck location updates
 */
class LocationService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.currentLocation = null;
  }

  /**
   * Connect to WebSocket server
   * @param {string} url - WebSocket server URL
   */
  connect(url = 'wss://api.coco-track.com') {
    if (this.socket && this.isConnected) {
      console.log('[LocationService] Already connected');
      return;
    }

    console.log('[LocationService] Connecting to:', url);

    this.socket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this._setupEventHandlers();
  }

  /**
   * Set up WebSocket event handlers
   * @private
   */
  _setupEventHandlers() {
    // Connection established
    this.socket.on('connect', () => {
      console.log('[LocationService] Connected to GPS tracker');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    // Location update received
    this.socket.on('location', (data) => {
      console.log('[LocationService] Location update received:', data);
      this.currentLocation = {
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.timestamp || new Date().toISOString(),
        accuracy: data.accuracy || null,
      };
      this._notifyListeners(this.currentLocation);
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('[LocationService] Connection error:', error.message);
      this.isConnected = false;
      this.reconnectAttempts++;
    });

    // Disconnected
    this.socket.on('disconnect', (reason) => {
      console.log('[LocationService] Disconnected:', reason);
      this.isConnected = false;

      if (reason === 'io server disconnect') {
        // Server disconnected the client, need to manually reconnect
        this.socket.connect();
      }
    });

    // Reconnection attempt
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`[LocationService] Reconnection attempt ${attemptNumber}`);
    });

    // Reconnected successfully
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`[LocationService] Reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    // Failed to reconnect
    this.socket.on('reconnect_failed', () => {
      console.error('[LocationService] Failed to reconnect after max attempts');
      this.isConnected = false;
    });
  }

  /**
   * Subscribe to location updates
   * @param {function} callback - Callback function to receive location updates
   * @returns {function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback);

    // If we already have a location, send it immediately
    if (this.currentLocation) {
      callback(this.currentLocation);
    }

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Notify all listeners of location update
   * @private
   * @param {object} location - Location data
   */
  _notifyListeners(location) {
    this.listeners.forEach(listener => {
      try {
        listener(location);
      } catch (error) {
        console.error('[LocationService] Error in listener:', error);
      }
    });
  }

  /**
   * Get current location (cached)
   * @returns {object|null} Current location or null
   */
  getCurrentLocation() {
    return this.currentLocation;
  }

  /**
   * Check if connected
   * @returns {boolean} Connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      console.log('[LocationService] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners = [];
      this.currentLocation = null;
    }
  }

  /**
   * Manually trigger reconnection
   */
  reconnect() {
    if (this.socket) {
      console.log('[LocationService] Manual reconnect triggered');
      this.socket.connect();
    }
  }

  /**
   * Send location update to server (for admin/driver use)
   * @param {object} location - Location data {latitude, longitude, timestamp}
   */
  sendLocation(location) {
    if (!this.socket || !this.isConnected) {
      console.error('[LocationService] Cannot send location: not connected');
      return false;
    }

    console.log('[LocationService] Sending location update:', location);
    this.socket.emit('updateLocation', location);
    return true;
  }
}

// Export singleton instance
export default new LocationService();
