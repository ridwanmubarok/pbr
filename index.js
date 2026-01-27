/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Import headless task for notification rescheduling after boot
import './src/services/notificationRescheduleTask';

AppRegistry.registerComponent(appName, () => App);
