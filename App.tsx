/**
 * AI Learn App
 * Modern Learning Platform with AI Assistant
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import AIChatScreen from './src/screens/AIChatScreen';
import { PermissionScreen } from './src/screens/PermissionScreen';

const Stack = createStackNavigator();

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Permission"
            screenOptions={{
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
            }}>
            <Stack.Screen
              name="Permission"
              component={PermissionScreen}
              options={{
                animationTypeForReplace: 'push',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                animationTypeForReplace: 'push',
              }}
            />
            <Stack.Screen
              name="AIChat"
              component={AIChatScreen}
              options={{
                gestureEnabled: false,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = {
  container: {
    flex: 1,
  },
};

export default App;
