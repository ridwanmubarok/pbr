import notifee, {
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
} from '@notifee/react-native';
import { Schedule } from '../hooks/useSQLiteDatabase';

// Channel ID for study reminders
const CHANNEL_ID = 'study-reminders';

export class NotificationService {
  /**
   * Initialize notification channel (Android)
   */
  static async createChannel() {
    try {
      await notifee.createChannel({
        id: CHANNEL_ID,
        name: 'Pengingat Belajar',
        importance: 4, // High importance
        sound: 'default',
        vibration: true,
        badge: true,
      });
      console.log('✅ Notification channel created');
    } catch (error) {
      console.error('❌ Failed to create notification channel:', error);
    }
  }

  /**
   * Request notification permissions
   */
  static async requestPermission() {
    try {
      const result = await notifee.requestPermission();
      console.log('Notification permission:', result);

      // Note: Exact alarm permission is automatically handled by Android
      // when creating alarms with alarmManager: true
      // Users may need to manually grant it in Settings if needed

      return result;
    } catch (error) {
      console.error('❌ Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Schedule a notification for a study session
   */
  static async scheduleNotification(schedule: Schedule) {
    try {
      // Check if schedule is enabled
      if (!schedule.enabled) {
        console.log('Schedule is disabled, skipping notification');
        return;
      }

      const { title, hour, minute, repeatDays } = schedule;
      const parsedRepeatDays = JSON.parse(repeatDays) as number[];

      if (parsedRepeatDays.length === 0) {
        console.log('⚠️ No repeat days selected, skipping notification');
        return;
      }

      // Calculate the next occurrence for each selected day
      const now = new Date();
      const currentDay = now.getDay();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Sort days to find the next upcoming day
      const sortedDays = parsedRepeatDays.sort((a, b) => a - b);

      for (const day of sortedDays) {
        let notificationDate = new Date();
        notificationDate.setHours(hour, minute, 0, 0);

        // Calculate days until next occurrence
        let daysUntil = day - currentDay;

        // If the day is earlier in the week, schedule for next week
        if (daysUntil < 0) {
          daysUntil += 7;
        }
        // If it's the same day but the time has passed, schedule for next week
        else if (
          daysUntil === 0 &&
          (hour < currentHour ||
            (hour === currentHour && minute <= currentMinute))
        ) {
          daysUntil += 7;
        }

        notificationDate.setDate(now.getDate() + daysUntil);

        // Create notification trigger
        const trigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: notificationDate.getTime(),
          repeatFrequency: RepeatFrequency.WEEKLY,
          alarmManager: true, // Use Android AlarmManager for exact timing
        };

        // Create notification with unique ID for each day
        const notificationId = `${schedule.id}_${day}`;

        await notifee.createTriggerNotification(
          {
            id: notificationId,
            title: `⏰ Waktunya Belajar: ${title}`,
            body: `Sudah waktunya belajar ${title}. Semangat! 💪`,
            android: {
              channelId: CHANNEL_ID,
              pressAction: {
                id: 'default',
              },
            },
            ios: {
              sound: 'default',
            },
          },
          trigger,
        );

        console.log(
          '✅ Notification scheduled:',
          title,
          'on day',
          day,
          'at',
          notificationDate.toLocaleString('id-ID'),
        );
      }
    } catch (error) {
      console.error('❌ Failed to schedule notification:', error);
    }
  }

  /**
   * Cancel a scheduled notification (for all days)
   */
  static async cancelNotification(scheduleId: string) {
    try {
      // Cancel notifications for all days (0-6)
      for (let day = 0; day < 7; day++) {
        const notificationId = `${scheduleId}_${day}`;
        await notifee.cancelNotification(notificationId);
      }
      console.log('✅ Notification cancelled for schedule:', scheduleId);
    } catch (error) {
      console.error('❌ Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications() {
    try {
      await notifee.cancelAllNotifications();
      console.log('✅ All notifications cancelled');
    } catch (error) {
      console.error('❌ Failed to cancel all notifications:', error);
    }
  }

  /**
   * Display an immediate test notification
   */
  static async showTestNotification() {
    try {
      await notifee.displayNotification({
        title: '🔔 Pengingat Belajar',
        body: 'Notifikasi berhasil diatur! Anda akan menerima pengingat saat jadwal belajar tiba.',
        android: {
          channelId: CHANNEL_ID,
          pressAction: {
            id: 'default',
          },
        },
      });
      console.log('✅ Test notification displayed');
    } catch (error) {
      console.error('❌ Failed to display test notification:', error);
    }
  }
}

export default NotificationService;
