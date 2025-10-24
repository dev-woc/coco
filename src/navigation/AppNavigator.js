import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from '../components/MapScreen';
import AdminScreen from '../components/AdminScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Map">
        <Stack.Screen
          name="Map"
          component={MapScreen}
          options={{
            title: 'Coco-Track',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="Admin"
          component={AdminScreen}
          options={{
            title: 'Admin Panel',
            headerShown: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
