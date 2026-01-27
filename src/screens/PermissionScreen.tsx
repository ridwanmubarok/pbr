import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import LinearGradient from 'react-native-linear-gradient';
import permissionService from '../services/permissionService';
import NotificationService from '../services/notificationService';

interface PermissionScreenProps {
  navigation: any;
}

interface PermissionItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'pending' | 'granted' | 'denied' | 'not_requested';
  required: boolean;
}

export const PermissionScreen: React.FC<PermissionScreenProps> = ({
  navigation,
}) => {
  const [permissions, setPermissions] = useState<PermissionItem[]>([
    {
      id: 'notification',
      title: 'Notifikasi',
      description: 'Untuk menerima pengingat jadwal belajar',
      icon: 'notifications-outline',
      status: 'pending',
      required: true,
    },
    {
      id: 'exactAlarm',
      title: 'Alarm & Pengingat',
      description: 'Untuk jadwal belajar yang tepat waktu',
      icon: 'alarm-outline',
      status: 'pending',
      required: true,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPermissionIndex, setCurrentPermissionIndex] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkPermissions = async () => {
    try {
      await NotificationService.createChannel();
      const updatedPermissions = [...permissions];
      for (let i = 0; i < updatedPermissions.length; i++) {
        if (updatedPermissions[i].id === 'exactAlarm') {
          if (permissionService.isAndroid12OrHigher()) {
            const status = await permissionService.checkExactAlarmPermission();
            updatedPermissions[i].status =
              status === 'granted' ? 'granted' : 'pending';
          } else {
            updatedPermissions[i].status = 'granted';
          }
        } else if (updatedPermissions[i].id === 'notification') {
          const status = await permissionService.checkNotificationPermission();
          updatedPermissions[i].status =
            status === 'granted' ? 'granted' : 'pending';
        }
      }

      setPermissions(updatedPermissions);
      const firstPending = updatedPermissions.findIndex(
        p => p.status === 'pending',
      );
      setCurrentPermissionIndex(firstPending >= 0 ? firstPending : 0);
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const requestPermission = async (permissionId: string) => {
    try {
      setIsLoading(true);

      if (permissionId === 'notification') {
        const status = await permissionService.requestNotificationPermission();
        updatePermissionStatus(permissionId, status);
      } else if (permissionId === 'exactAlarm') {
        permissionService.showOpenSettingsAlert(
          'Aktifkan izin "Alarms & Reminders" di pengaturan untuk memastikan jadwal belajar berjalan tepat waktu.',
        );
        updatePermissionStatus(permissionId, 'denied');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePermissionStatus = (
    permissionId: string,
    status: 'granted' | 'denied' | 'not_requested',
  ) => {
    const updatedPermissions = permissions.map(p =>
      p.id === permissionId ? { ...p, status } : p,
    );
    setPermissions(updatedPermissions);
    if (status === 'granted') {
      const currentIndex = permissions.findIndex(p => p.id === permissionId);
      const nextPending = updatedPermissions.findIndex(
        (p, i) => i > currentIndex && p.status === 'pending',
      );

      if (nextPending === -1) {
        setTimeout(() => {
          navigation.replace('Login');
        }, 500);
      } else {
        setCurrentPermissionIndex(nextPending);
      }
    }
  };

  const handleContinue = () => {
    const current = permissions[currentPermissionIndex];
    if (current && current.status !== 'granted') {
      requestPermission(current.id);
    } else {
      // Find next pending
      const nextPending = permissions.findIndex(p => p.status === 'pending');
      if (nextPending === -1) {
        navigation.replace('Login');
      } else {
        setCurrentPermissionIndex(nextPending);
      }
    }
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  const allGranted = permissions.every(p => p.status === 'granted');

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.iconContainer}
          >
            <Icon name="shield-checkmark-outline" size={64} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>Izin Diperlukan</Text>
          <Text style={styles.subtitle}>
            Untuk pengalaman belajar terbaik, izinkan aplikasi mengakses fitur
            berikut:
          </Text>
        </View>

        {/* Permissions List */}
        <View style={styles.permissionsList}>
          {permissions.map((permission, index) => (
            <View
              key={permission.id}
              style={[
                styles.permissionItem,
                index === currentPermissionIndex && styles.currentPermission,
              ]}
            >
              <View
                style={[
                  styles.permissionIcon,
                  // eslint-disable-next-line react-native/no-inline-styles
                  {
                    backgroundColor:
                      permission.status === 'granted' ? '#10b98120' : '#f3f4f6',
                  },
                ]}
              >
                <Icon
                  name={permission.icon as any}
                  size={28}
                  color={
                    permission.status === 'granted' ? '#10b981' : '#6b7280'
                  }
                />
              </View>

              <View style={styles.permissionContent}>
                <View style={styles.permissionHeader}>
                  <Text style={styles.permissionTitle}>{permission.title}</Text>
                  {permission.status === 'granted' && (
                    <Icon name="checkmark-circle" size={20} color="#10b981" />
                  )}
                </View>
                <Text style={styles.permissionDescription}>
                  {permission.description}
                </Text>
                {permission.required && permission.status !== 'granted' && (
                  <Text style={styles.requiredText}>Wajib diizinkan</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Android Version Info */}
        {Platform.OS === 'android' && (
          <View style={styles.infoBox}>
            <Icon name="information-circle-outline" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              Untuk Android 12+, izin tambahan mungkin diperlukan. Pastikan
              mengaktifkan "Alarms & Reminders" di pengaturan aplikasi.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !allGranted && isLoading && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>
                {allGranted ? 'Lanjut' : 'Izinkan'}
              </Text>
              {!allGranted && (
                <Icon name="arrow-forward" size={20} color="#fff" />
              )}
            </>
          )}
        </TouchableOpacity>

        {!allGranted && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Lewati</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionsList: {
    gap: 16,
    marginBottom: 24,
  },
  permissionItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  currentPermission: {
    borderColor: '#10b981',
  },
  permissionIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  permissionContent: {
    flex: 1,
  },
  permissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  requiredText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 8,
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  continueButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
});
