# Coco-Track Mobile App

React Native mobile application for tracking coconut truck location in real-time.

## Project Setup

### Tech Stack
- **Framework:** Expo (React Native)
- **Navigation:** React Navigation v7
- **Maps:** React Native Maps
- **Real-time Communication:** Socket.io Client
- **Testing:** Jest + React Native Testing Library

### Installation

```bash
npm install
```

### Running the App

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

### Testing

```bash
npm test
```

**Note:** Testing infrastructure is configured but requires additional Expo 54 setup for compatibility with the new Winter architecture. Tests will be fully operational after Expo test environment configuration.

### Project Structure

```
coco-track-mobile/
├── src/
│   ├── components/      # React components
│   │   └── MapScreen.js # Main map screen
│   ├── services/        # Business logic services
│   ├── navigation/      # Navigation configuration
│   │   └── AppNavigator.js
│   └── utils/          # Utility functions
├── __tests__/          # Test files
├── App.js             # App entry point
└── app.json           # Expo configuration
```

### Configuration

#### Google Maps API Keys

Add your Google Maps API key to `app.json`:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY_HERE"
        }
      }
    }
  }
}
```

### Development Status

See `docs/stories/1.1.real-time-truck-location-tracking.md` for current implementation status.
