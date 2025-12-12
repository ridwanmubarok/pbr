/**
 * @format
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => children,
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: any) => children,
}));

jest.mock('react-native-linear-gradient', () => 'LinearGradient');

jest.mock('../src/screens/LoginScreen', () => {
  const MockReact = require('react');
  const { Text } = require('react-native');
  return () => MockReact.createElement(Text, {}, 'LoginScreen');
});

jest.mock('../src/screens/AIChatScreen', () => {
  const MockReact = require('react');
  const { Text } = require('react-native');
  return () => MockReact.createElement(Text, {}, 'AIChatScreen');
});

describe('App', () => {
  test('renders correctly', () => {
    const { getByText } = render(<App />);
    expect(getByText('LoginScreen')).toBeTruthy();
  });
});
