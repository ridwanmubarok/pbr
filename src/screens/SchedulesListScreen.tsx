import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useSQLiteDatabase, Schedule } from '../hooks/useSQLiteDatabase';
import NotificationService from '../services/notificationService';
import notifee from '@notifee/react-native';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface SchedulesListScreenProps {
  onClose: () => void;
}

export const SchedulesListScreen: React.FC<SchedulesListScreenProps> = ({
  onClose,
}) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(
    null,
  );
  const { getSchedules, deleteSchedule, toggleSchedule, isInitialized } =
    useSQLiteDatabase();

  useEffect(() => {
    setupNotifications();
    if (isInitialized) {
      loadSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  const setupNotifications = async () => {
    try {
      if (Platform.OS === 'ios') {
        await notifee.requestPermission();
      }
      await NotificationService.createChannel();
    } catch (error) {
      console.error('❌ Failed to setup notifications:', error);
    }
  };

  const loadSchedules = async () => {
    try {
      setIsLoading(true);
      const data = await getSchedules();
      setSchedules(data);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (schedule: Schedule) => {
    setScheduleToDelete(schedule);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!scheduleToDelete) return;

    try {
      await NotificationService.cancelNotification(scheduleToDelete.id);
      await deleteSchedule(scheduleToDelete.id);
      await loadSchedules();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };

  const handleToggle = async (schedule: Schedule) => {
    try {
      const newEnabledState = !schedule.enabled;
      await toggleSchedule(schedule.id, newEnabledState);
      if (newEnabledState) {
        await NotificationService.scheduleNotification(schedule);
      } else {
        await NotificationService.cancelNotification(schedule.id);
      }
      await loadSchedules();
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
    }
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')}`;
  };

  const getRepeatDaysText = (repeatDays: string) => {
    try {
      const days = JSON.parse(repeatDays) as number[];
      if (days.length === 0) return 'Sekali saja';

      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      return days.map(d => dayNames[d]).join(', ');
    } catch {
      return 'Sekali saja';
    }
  };

  const renderScheduleItem = ({ item }: { item: Schedule }) => (
    <View
      style={[
        styles.scheduleItem,
        !item.enabled && styles.scheduleItemDisabled,
      ]}
    >
      <View style={styles.scheduleContent}>
        <View style={styles.scheduleHeader}>
          <Text
            style={[
              styles.scheduleTitle,
              !item.enabled && styles.scheduleTitleDisabled,
            ]}
          >
            {item.title}
          </Text>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => handleToggle(item)}
          >
            <Icon
              name={item.enabled ? 'toggle' : 'toggle-outline'}
              size={32}
              color={item.enabled ? '#10b981' : '#9ca3af'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleDetails}>
          <View style={styles.scheduleDetailRow}>
            <Icon name="time-outline" size={16} color="#6b7280" />
            <Text style={styles.scheduleDetailText}>
              {formatTime(item.hour, item.minute)}
            </Text>
          </View>

          <View style={styles.scheduleDetailRow}>
            <Icon name="repeat-outline" size={16} color="#6b7280" />
            <Text style={styles.scheduleDetailText}>
              {getRepeatDaysText(item.repeatDays)}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
      >
        <Icon name="trash-outline" size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daftar Jadwal Belajar</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={28} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Schedules List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Memuat jadwal...</Text>
        </View>
      ) : schedules.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="time-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Belum Ada Jadwal</Text>
          <Text style={styles.emptyText}>
            Buat jadwal belajar pertama Anda dengan mengklik menu "Jadwal
            Belajar"
          </Text>
        </View>
      ) : (
        <FlatList
          data={schedules}
          renderItem={renderScheduleItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ConfirmationModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={confirmDelete}
        title="Hapus Jadwal"
        message={`Apakah Anda yakin ingin menghapus "${scheduleToDelete?.title}"?`}
        confirmText="Hapus"
        cancelText="Batal"
        iconName="trash"
        iconColor="#ef4444"
        confirmColor={['#ef4444', '#dc2626']}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
  },
  scheduleItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scheduleItemDisabled: {
    opacity: 0.6,
    backgroundColor: '#f9fafb',
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  scheduleTitleDisabled: {
    color: '#9ca3af',
  },
  toggleButton: {
    padding: 4,
  },
  scheduleDetails: {
    gap: 8,
  },
  scheduleDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleDetailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  deleteButton: {
    padding: 12,
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
