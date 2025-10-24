import React from 'react';
import { render } from '@testing-library/react-native';
import AppNavigator from '../src/navigation/AppNavigator';

// Mock the MapScreen component to avoid complex map rendering in tests
jest.mock('../src/components/MapScreen', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function MockMapScreen() {
    return (
      <View testID="map-screen">
        <Text>Map Screen</Text>
      </View>
    );
  };
});

describe('AppNavigator', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<AppNavigator />);
    expect(getByTestId('map-screen')).toBeTruthy();
  });

  it('sets Map screen as initial route', () => {
    const { getByTestID } = render(<AppNavigator />);
    // Navigation container should render the Map screen by default
    expect(getByTestID('map-screen')).toBeTruthy();
  });
});
