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
    this.demoMode = false;
    this.demoInterval = null;
  }

  /**
   * Connect to WebSocket server
   * @param {string} url - WebSocket server URL
   * @param {boolean} enableDemo - Enable demo mode for testing
   */
  connect(url = 'wss://api.coco-track.com', enableDemo = true) {
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

    // Enable demo mode if server is unreachable
    if (enableDemo) {
      setTimeout(() => {
        if (!this.isConnected) {
          console.log('[LocationService] Server unreachable, enabling DEMO MODE');
          this.enableDemoMode();
        }
      }, 3000);
    }
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
   * @param {object} location - Location data {latitude, longitude, timestamp, isBroadcasting}
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

  /**
   * Send broadcast status to server (for admin/driver use)
   * @param {boolean} isActive - Whether broadcasting is active
   */
  sendBroadcastStatus(isActive) {
    if (!this.socket || !this.isConnected) {
      console.error('[LocationService] Cannot send broadcast status: not connected');
      return false;
    }

    console.log('[LocationService] Sending broadcast status:', isActive);
    this.socket.emit('broadcastStatus', { isActive });
    return true;
  }

  /**
   * Enable demo mode - simulates a truck in Miami, FL
   */
  enableDemoMode() {
    if (this.demoMode) return;

    console.log('[LocationService] 🎭 DEMO MODE ENABLED - Simulating truck in Miami, FL');
    this.demoMode = true;
    this.isConnected = true; // Simulate connection

    // Starting location: Wynwood, Miami
    let latitude = 25.8010;
    let longitude = -80.1994;
    let direction = 1;

    // Send initial location
    this.currentLocation = {
      latitude,
      longitude,
      timestamp: Date.now(),
      demo: true,
    };
    this._notifyListeners(this.currentLocation);

    // Simulate truck movement every 5 seconds
    this.demoInterval = setInterval(() => {
      // Move truck slightly (simulates driving around)
      latitude += (Math.random() - 0.5) * 0.002 * direction;
      longitude += (Math.random() - 0.5) * 0.002 * direction;

      // Keep within Miami bounds
      if (latitude > 25.85 || latitude < 25.75) direction *= -1;
      if (longitude > -80.15 || longitude < -80.25) direction *= -1;

      this.currentLocation = {
        latitude,
        longitude,
        timestamp: Date.now(),
        demo: true,
      };

      this._notifyListeners(this.currentLocation);
      console.log('[LocationService] 🎭 Demo update:', latitude.toFixed(4), longitude.toFixed(4));
    }, 5000);
  }

  /**
   * Disable demo mode
   */
  disableDemoMode() {
    if (!this.demoMode) return;

    console.log('[LocationService] 🎭 DEMO MODE DISABLED');
    this.demoMode = false;
    this.isConnected = false;

    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = null;
    }

    this.currentLocation = null;
  }

  /**
   * Check if demo mode is active
   */
  isDemoMode() {
    return this.demoMode;
  }
}

// Export singleton instance
export default new LocationService();
