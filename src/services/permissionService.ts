import { Platform, Alert, Linking, NativeModules } from 'react-native';
import notifee, {
  AndroidNotificationSetting,
  AuthorizationStatus,
} from '@notifee/react-native';

export type PermissionStatus = 'granted' | 'denied' | 'not_requested';

interface PermissionState {
  notification: PermissionStatus;
  exactAlarm: PermissionStatus;
  bootCompleted: PermissionStatus;
}

class PermissionService {
  private static instance: PermissionService;

  private constructor() {}

  static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  /**
   * Check Android version
   */
  private getAndroidVersion(): number {
    if (Platform.OS !== 'android') return 0;
    const Constants = NativeModules.Constants;
    return Constants?.Version || 0;
  }

  /**
   * Check if Android 13+ (API 33+) - requires POST_NOTIFICATIONS permission
   */
  isAndroid13OrHigher(): boolean {
    return Platform.OS === 'android' && this.getAndroidVersion() >= 33;
  }

  /**
   * Check if Android 12+ (API 31+) - requires SCHEDULE_EXACT_ALARM permission
   */
  isAndroid12OrHigher(): boolean {
    return Platform.OS === 'android' && this.getAndroidVersion() >= 31;
  }

  /**
   * Check all notification-related permissions
   */
  async checkNotificationPermission(): Promise<PermissionStatus> {
    try {
      const settings = await notifee.getNotificationSettings();

      if (settings.android === undefined) {
        // iOS or permission not requested yet
        return 'not_requested';
      }

      // Android 13+ (API 33+) - check authorizationStatus
      if (this.isAndroid13OrHigher()) {
        const authStatus = (settings.android as any).authorizationStatus;
        if (authStatus === AuthorizationStatus.AUTHORIZED) {
          return 'granted';
        }
        if (authStatus === AuthorizationStatus.DENIED) {
          return 'denied';
        }
        return 'not_requested';
      }

      // Below Android 13 - check if notifications are enabled
      const alarmEnabled =
        settings.android.alarm === AndroidNotificationSetting.ENABLED;

      if (alarmEnabled) {
        return 'granted';
      }

      return 'denied';
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return 'not_requested';
    }
  }

  /**
   * Check exact alarm permission (Android 12+)
   */
  async checkExactAlarmPermission(): Promise<PermissionStatus> {
    if (!this.isAndroid12OrHigher()) {
      // Not needed for older Android versions
      return 'granted';
    }

    try {
      const settings = await notifee.getNotificationSettings();

      if (settings.android?.alarm === AndroidNotificationSetting.ENABLED) {
        return 'granted';
      }

      return 'denied';
    } catch (error) {
      console.error('Error checking exact alarm permission:', error);
      return 'not_requested';
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<PermissionStatus> {
    try {
      const result = await notifee.requestPermission();

      if (this.isAndroid13OrHigher()) {
        const authStatus = (result.android as any).authorizationStatus;
        if (authStatus === AuthorizationStatus.AUTHORIZED) {
          return 'granted';
        }
        return 'denied';
      }

      // Below Android 13, permission is granted by default
      return 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Check all permissions
   */
  async checkAllPermissions(): Promise<PermissionState> {
    const notification = await this.checkNotificationPermission();
    const exactAlarm = await this.checkExactAlarmPermission();
    // Boot completed permission is granted via manifest, no runtime check needed
    const bootCompleted: PermissionStatus = 'granted';

    return { notification, exactAlarm, bootCompleted };
  }

  /**
   * Request all necessary permissions
   */
  async requestAllPermissions(): Promise<PermissionState> {
    const notification = await this.requestNotificationPermission();
    const exactAlarm = await this.checkExactAlarmPermission();
    const bootCompleted: PermissionStatus = 'granted';

    return { notification, exactAlarm, bootCompleted };
  }

  /**
   * Show alert to open app settings
   */
  showOpenSettingsAlert(message: string): void {
    Alert.alert(
      'Permission Required',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            Linking.openSettings().catch(err =>
              console.error('Error opening settings:', err),
            );
          },
        },
      ],
      { cancelable: true },
    );
  }

  /**
   * Check if all permissions are granted
   */
  async areAllPermissionsGranted(): Promise<boolean> {
    const permissions = await this.checkAllPermissions();
    return (
      permissions.notification === 'granted' &&
      permissions.exactAlarm === 'granted'
    );
  }

  /**
   * Get helpful message for missing permission
   */
  getPermissionMessage(permission: keyof PermissionState): string {
    if (permission === 'notification') {
      if (this.isAndroid13OrHigher()) {
        return 'Notification permission is required to show study reminders. Please enable it in Settings.';
      }
      return 'Please allow notifications to receive study reminders.';
    }

    if (permission === 'exactAlarm') {
      return 'Alarms & Reminders permission is required for exact timing of study schedules. Please enable it in Settings > Apps > PBR > Special access.';
    }

    return 'This permission is required for the app to work properly.';
  }

  /**
   * Main flow to check and request permissions
   * Returns true if all permissions are granted
   */
  async setupPermissions(): Promise<boolean> {
    try {
      console.log('🔍 Checking permissions...');

      // Check current state
      const permissions = await this.checkAllPermissions();

      // If notification not granted, request it
      if (permissions.notification !== 'granted') {
        console.log('📱 Requesting notification permission...');
        const result = await this.requestNotificationPermission();

        if (result !== 'granted') {
          this.showOpenSettingsAlert(this.getPermissionMessage('notification'));
          return false;
        }
      }

      // Check exact alarm for Android 12+
      if (this.isAndroid12OrHigher()) {
        const exactAlarmStatus = await this.checkExactAlarmPermission();
        if (exactAlarmStatus !== 'granted') {
          console.log('⏰ Exact alarm permission denied');
          this.showOpenSettingsAlert(this.getPermissionMessage('exactAlarm'));
          return false;
        }
      }

      console.log('✅ All permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Error setting up permissions:', error);
      return false;
    }
  }
}

export default PermissionService.getInstance();
