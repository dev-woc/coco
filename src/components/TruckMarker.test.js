import React from 'react';
import { render } from '@testing-library/react-native';
import TruckMarker from './TruckMarker';

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    Marker: ({ children, coordinate, title, testID }) => {
      return (
        <View testID={testID || 'marker'}>
          {children}
          <View testID="marker-coordinate">
            {coordinate && JSON.stringify(coordinate)}
          </View>
          <View testID="marker-title">{title}</View>
        </View>
      );
    },
  };
});

describe('TruckMarker', () => {
  const validCoordinate = {
    latitude: 25.7617,
    longitude: -80.1918,
  };

  it('should render when valid coordinates provided', () => {
    const { getByTestID } = render(
      <TruckMarker coordinate={validCoordinate} />
    );

    expect(getByTestID('marker')).toBeTruthy();
  });

  it('should not render when coordinate is null', () => {
    const { queryByTestID } = render(
      <TruckMarker coordinate={null} />
    );

    expect(queryByTestID('marker')).toBeNull();
  });

  it('should not render when coordinate is undefined', () => {
    const { queryByTestID } = render(
      <TruckMarker coordinate={undefined} />
    );

    expect(queryByTestID('marker')).toBeNull();
  });

  it('should not render when latitude is missing', () => {
    const { queryByTestID } = render(
      <TruckMarker coordinate={{ longitude: -80.1918 }} />
    );

    expect(queryByTestID('marker')).toBeNull();
  });

  it('should not render when longitude is missing', () => {
    const { queryByTestID } = render(
      <TruckMarker coordinate={{ latitude: 25.7617 }} />
    );

    expect(queryByTestID('marker')).toBeNull();
  });

  it('should display correct coordinates', () => {
    const { getByTestID } = render(
      <TruckMarker coordinate={validCoordinate} />
    );

    const coordinateText = getByTestID('marker-coordinate').children[0];
    const coordinate = JSON.parse(coordinateText);

    expect(coordinate.latitude).toBe(validCoordinate.latitude);
    expect(coordinate.longitude).toBe(validCoordinate.longitude);
  });

  it('should display custom title when provided', () => {
    const customTitle = 'Fresh Coconuts Here!';
    const { getByTestID } = render(
      <TruckMarker coordinate={validCoordinate} title={customTitle} />
    );

    const titleElement = getByTestID('marker-title');
    expect(titleElement.children[0]).toBe(customTitle);
  });

  it('should display default title when not provided', () => {
    const { getByTestID } = render(
      <TruckMarker coordinate={validCoordinate} />
    );

    const titleElement = getByTestID('marker-title');
    expect(titleElement.children[0]).toBe('Coconut Truck');
  });
});
