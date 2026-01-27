import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  TextInput,
  ScrollView,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import LinearGradient from 'react-native-linear-gradient';

interface ScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onSchedule: (
    title: string,
    hour: number,
    minute: number,
    days: number[],
  ) => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  visible,
  onClose,
  onSchedule,
}) => {
  const [title, setTitle] = useState('');
  const [selectedTime, setSelectedTime] = useState(() => {
    const now = new Date();
    return {
      hour: now.getHours(),
      minute: now.getMinutes(),
    };
  });
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  const daysOfWeek = [
    { id: 0, label: 'Min' },
    { id: 1, label: 'Sen' },
    { id: 2, label: 'Sel' },
    { id: 3, label: 'Rab' },
    { id: 4, label: 'Kam' },
    { id: 5, label: 'Jum' },
    { id: 6, label: 'Sab' },
  ];

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  const toggleDay = (dayId: number) => {
    setSelectedDays(prev =>
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId],
    );
  };

  const handleSchedule = () => {
    if (title.trim() && selectedDays.length > 0) {
      onSchedule(
        title.trim(),
        selectedTime.hour,
        selectedTime.minute,
        selectedDays,
      );
      setTitle('');

      const resetTime = new Date();
      setSelectedTime({
        hour: resetTime.getHours(),
        minute: resetTime.getMinutes(),
      });
      setSelectedDays([]);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <View
                  style={[styles.iconCircle, { backgroundColor: '#10b98120' }]}
                >
                  <Icon name="time-outline" size={32} color="#10b981" />
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Icon name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <Text style={styles.title}>Jadwal Belajar</Text>
              <Text style={styles.subtitle}>
                Atur pengingat untuk jadwal belajar Anda
              </Text>

              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
              >
                {/* Judul Jadwal */}
                <View style={styles.section}>
                  <Text style={styles.label}>Judul Jadwal</Text>
                  <View style={styles.inputWrapper}>
                    <Icon
                      name="book-outline"
                      size={20}
                      color="#9ca3af"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Contoh: Belajar Matematika"
                      placeholderTextColor="#9ca3af"
                      value={title}
                      onChangeText={setTitle}
                    />
                  </View>
                </View>

                {/* Waktu - Simple Input */}
                <View style={styles.section}>
                  <Text style={styles.label}>Waktu (Jam : Menit)</Text>
                  <View style={styles.timeInputRow}>
                    <View style={styles.timeInputBox}>
                      <TextInput
                        style={styles.timeInput}
                        value={selectedTime.hour.toString().padStart(2, '0')}
                        onChangeText={text => {
                          const hour = parseInt(text) || 0;
                          if (hour >= 0 && hour <= 23) {
                            setSelectedTime(prev => ({ ...prev, hour }));
                          }
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                        textAlign="center"
                      />
                    </View>
                    <Text style={styles.timeColon}>:</Text>
                    <View style={styles.timeInputBox}>
                      <TextInput
                        style={styles.timeInput}
                        value={selectedTime.minute.toString().padStart(2, '0')}
                        onChangeText={text => {
                          const minute = parseInt(text) || 0;
                          if (minute >= 0 && minute <= 59) {
                            setSelectedTime(prev => ({ ...prev, minute }));
                          }
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                        textAlign="center"
                      />
                    </View>
                  </View>
                  <Text style={styles.hint}>
                    Ketik jam (00-23) dan menit (00-59)
                  </Text>
                </View>

                {/* Pilih Hari Berulang */}
                <View style={styles.section}>
                  <Text style={styles.label}>Pilih Hari *</Text>
                  <Text style={styles.hint}>
                    Pilih minimal satu hari untuk pengingat berulang setiap
                    minggu
                  </Text>
                  <View style={styles.daysContainer}>
                    {daysOfWeek.map(day => (
                      <TouchableOpacity
                        key={day.id}
                        style={[
                          styles.dayButton,
                          selectedDays.includes(day.id) &&
                            styles.dayButtonActive,
                        ]}
                        onPress={() => toggleDay(day.id)}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            selectedDays.includes(day.id) &&
                              styles.dayTextActive,
                          ]}
                        >
                          {day.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.scheduleButton,
                    (!title.trim() || selectedDays.length === 0) &&
                      styles.scheduleButtonDisabled,
                  ]}
                  onPress={handleSchedule}
                  activeOpacity={0.8}
                  disabled={!title.trim() || selectedDays.length === 0}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.scheduleButtonGradient,
                      !title.trim() && styles.scheduleButtonGradientDisabled,
                    ]}
                  >
                    <Icon name="alarm-outline" size={18} color="#fff" />
                    <Text style={styles.scheduleButtonText}>Simpan Jadwal</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  content: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1f2937',
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  timeInputBox: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timeInput: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    paddingVertical: 16,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  timeColon: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10b981',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  dayTextActive: {
    color: '#ffffff',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  scheduleButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  scheduleButtonDisabled: {
    opacity: 0.5,
  },
  scheduleButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  scheduleButtonGradientDisabled: {
    opacity: 0.5,
  },
  scheduleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
