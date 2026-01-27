import { AppRegistry } from 'react-native';
import dbService from '../hooks/useSQLiteDatabase';
import NotificationService from './notificationService';

/**
 * Headless JS task to reschedule all notifications after device reboot
 * This runs in the background without the app UI
 */
const taskFunction = async () => {
  try {
    console.log('🔄 Starting notification reschedule after boot...');
    await new Promise<void>(resolve => setTimeout(resolve, 1000));
    await dbService.init();
    const schedules = await dbService.getSchedules();
    console.log(`Found ${schedules.length} schedules to reschedule`);
    for (const schedule of schedules) {
      if (schedule.enabled) {
        await NotificationService.scheduleNotification(schedule);
      }
    }
  } catch (error) {
    console.error('❌ Failed to reschedule notifications:', error);
  }
};

// Register the headless task
AppRegistry.registerHeadlessTask('NotificationReschedule', () => taskFunction);

export default taskFunction;
