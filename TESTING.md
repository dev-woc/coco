# Testing Guide - Coco-Track Mobile

## Overview
This document provides instructions for testing the Coco-Track mobile application across different platforms and scenarios.

## Unit Tests

### Running Tests
```bash
npm test
```

### Test Coverage
```bash
npm test -- --coverage
```

### What's Tested
- **LocationService**: WebSocket connection, reconnection logic, location updates, subscription management
- **TruckMarker**: Marker rendering, coordinate validation, custom titles
- **Location Permissions**: Permission requests, checking permissions, error handling

### Known Issues
- Expo 54 has compatibility issues with Jest's new architecture
- Tests are configured but may require additional setup for full E2E testing
- See README.md for more information

## Manual Testing

### iOS Simulator Testing

#### Prerequisites
- macOS with Xcode installed
- iOS Simulator configured
- Google Maps API key added to `app.json`

#### Steps
1. Start the Expo development server:
   ```bash
   npm start
   ```

2. Press `i` to open iOS simulator, or run:
   ```bash
   npm run ios
   ```

3. **Test Scenarios:**

   **AC-1.1: Custom Truck Icon**
   - Verify truck marker appears with custom icon (orange/green truck design)
   - Tap marker to see title "Coconut Truck"

   **AC-1.2: Auto Location Updates**
   - Observe truck marker position (should update every 30-60 seconds when WebSocket connected)
   - Check console logs for location updates
   - Verify debug overlay shows updated timestamp

   **AC-1.3: Map Visibility**
   - Verify map renders correctly on different iPhone screen sizes
   - Test on iPhone SE (small), iPhone 14 (medium), iPhone 14 Pro Max (large)

   **AC-1.4: User Location**
   - Grant location permission when prompted
   - Verify blue dot appears showing your location
   - Deny permission - verify app still works (no user location shown)

   **AC-1.5: Default Home Screen**
   - Fresh app launch should show map screen immediately
   - No splash or welcome screens

   **AC-1.6: Map Controls**
   - Pinch to zoom in/out
   - Drag map to pan around
   - Tap compass to reset orientation
   - Tap "My Location" button (if permission granted)

### Android Emulator Testing

#### Prerequisites
- Android Studio installed
- Android emulator configured
- Google Maps API key added to `app.json`

#### Steps
1. Start the Expo development server:
   ```bash
   npm start
   ```

2. Press `a` to open Android emulator, or run:
   ```bash
   npm run android
   ```

3. **Test Scenarios:** (Same as iOS above)

4. **Android-Specific Checks:**
   - Verify Google Maps renders correctly (not Apple Maps)
   - Test on different Android API levels (minimum API 21)
   - Check zoom controls appear on Android

### Cross-Platform Verification

Test the same scenarios on both platforms and verify:
- Consistent UI appearance
- Same functionality behavior
- Similar performance (map load < 2 seconds)
- Location permissions work correctly on both

## WebSocket Testing

### Testing with Mock Server

Since the production WebSocket server (`wss://api.coco-track.com`) may not be available during development, you can test with a mock server:

1. **Install mock server** (separate terminal):
   ```bash
   npm install -g socket.io-mock-server
   # Or use a custom Node.js script
   ```

2. **Create mock GPS data emitter:**
   ```javascript
   // mock-gps-server.js
   const io = require('socket.io')(3000);

   io.on('connection', (socket) => {
     console.log('Client connected');

     // Simulate GPS updates every 30 seconds
     setInterval(() => {
       const location = {
         latitude: 25.7617 + (Math.random() - 0.5) * 0.01,
         longitude: -80.1918 + (Math.random() - 0.5) * 0.01,
         timestamp: new Date().toISOString(),
         accuracy: 10,
       };

       socket.emit('location', location);
       console.log('Sent location:', location);
     }, 30000);
   });
   ```

3. **Update MapScreen.js** temporarily to use mock server:
   ```javascript
   LocationService.connect('ws://localhost:3000');
   ```

4. **Test WebSocket Scenarios:**
   - Initial connection (truck appears on map)
   - Location updates (marker moves smoothly)
   - Connection loss (banner shows "Connection lost")
   - Reconnection (banner disappears, updates resume)

## Performance Testing

### Metrics to Verify

**App Launch Time:**
- Target: < 3 seconds on mid-range devices
- Measure from app icon tap to map visible

**Map Render Time:**
- Target: < 2 seconds on initial load
- Measure from map component mount to tiles loaded

**GPS Update Latency:**
- Target: < 5 seconds from server broadcast to UI update
- Use console logs to track timing

### Tools
- React Native Performance Monitor (shake device → "Perf Monitor")
- Chrome DevTools (for debugging)
- Xcode Instruments (iOS profiling)
- Android Profiler (Android profiling)

## Regression Testing Checklist

Before marking story as "Ready for Review", verify:

- [ ] Unit tests pass (or test infrastructure documented if blocked)
- [ ] App launches successfully on iOS
- [ ] App launches successfully on Android
- [ ] Map renders correctly on both platforms
- [ ] Truck marker appears and updates
- [ ] User location permission flow works
- [ ] User location displays when granted
- [ ] App works gracefully when permission denied
- [ ] Map controls (zoom, pan) work on both platforms
- [ ] WebSocket connects and receives updates
- [ ] WebSocket reconnection logic works
- [ ] No crashes or critical errors in console
- [ ] Performance meets targets (< 3s launch, < 2s map load)

## Known Limitations

1. **Expo 54 Test Environment**: Jest configuration needs additional setup for full E2E tests
2. **WebSocket Server**: Production server must be available or mock server used
3. **Map API Keys**: Required for both iOS (Apple Maps) and Android (Google Maps)
4. **Real Device Testing**: GPS simulation in emulators may not perfectly match real devices

## Next Steps

For comprehensive testing in a production environment:
1. Set up Detox for E2E testing
2. Configure CI/CD pipeline for automated testing
3. Add visual regression testing
4. Set up crash reporting (Sentry/Crashlytics)
5. Implement analytics to track real-world performance
