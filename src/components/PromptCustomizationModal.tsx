import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { SystemPromptPreset } from '../hooks/useSystemPrompt';

interface PromptCustomizationModalProps {
  visible: boolean;
  onClose: () => void;
  selectedPreset: SystemPromptPreset;
  customPrompt: string;
  presets: SystemPromptPreset[];
  onSelectPreset: (presetId: string) => void;
  onSaveCustomPrompt: (prompt: string) => void;
  onReset: () => void;
}

export const PromptCustomizationModal: React.FC<
  PromptCustomizationModalProps
> = ({
  visible,
  onClose,
  selectedPreset,
  customPrompt,
  presets,
  onSelectPreset,
  onSaveCustomPrompt,
  onReset,
}) => {
  const [localCustomPrompt, setLocalCustomPrompt] = useState(customPrompt);
  const [isCustomMode, setIsCustomMode] = useState(false);

  const handleSave = () => {
    if (isCustomMode && localCustomPrompt.trim()) {
      onSaveCustomPrompt(localCustomPrompt);
    }
    onClose();
  };

  const handleSelectPreset = (presetId: string) => {
    onSelectPreset(presetId);
    setIsCustomMode(false);
  };

  const handleCustomMode = () => {
    setIsCustomMode(true);
    setLocalCustomPrompt(customPrompt || selectedPreset.prompt);
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
            <View style={styles.modalContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>Penyesuaian Prompt AI</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Icon name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                <Text style={styles.sectionTitle}>Pilih Gaya AI</Text>

                {presets.map(preset => (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.presetCard,
                      selectedPreset.id === preset.id &&
                        !isCustomMode &&
                        styles.presetCardActive,
                    ]}
                    onPress={() => handleSelectPreset(preset.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.presetHeader}>
                      <Text
                        style={[
                          styles.presetName,
                          selectedPreset.id === preset.id &&
                            !isCustomMode &&
                            styles.presetNameActive,
                        ]}
                      >
                        {preset.name}
                      </Text>
                      {selectedPreset.id === preset.id && !isCustomMode && (
                        <Icon name="checkmark-circle" size={20} color="#667eea" />
                      )}
                    </View>
                    <Text style={styles.presetDescription}>{preset.prompt}</Text>
                  </TouchableOpacity>
                ))}

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Atau Buat Custom</Text>

                <TouchableOpacity
                  style={[
                    styles.customButton,
                    isCustomMode && styles.customButtonActive,
                  ]}
                  onPress={handleCustomMode}
                  activeOpacity={0.7}
                >
                  <Icon
                    name="create-outline"
                    size={20}
                    color={isCustomMode ? '#667eea' : '#6b7280'}
                  />
                  <Text
                    style={[
                      styles.customButtonText,
                      isCustomMode && styles.customButtonTextActive,
                    ]}
                  >
                    Custom Prompt
                  </Text>
                  {isCustomMode && (
                    <Icon name="checkmark-circle" size={20} color="#667eea" />
                  )}
                </TouchableOpacity>

                {isCustomMode && (
                  <View style={styles.customInputContainer}>
                    <Text style={styles.inputLabel}>
                      Tulis instruksi untuk AI:
                    </Text>
                    <TextInput
                      style={styles.customInput}
                      value={localCustomPrompt}
                      onChangeText={setLocalCustomPrompt}
                      placeholder="Contoh: Kamu adalah tutor matematika yang sabar dan ramah. Jelaskan setiap konsep dengan detail dan berikan contoh konkret..."
                      placeholderTextColor="#9ca3af"
                      multiline
                      numberOfLines={8}
                      textAlignVertical="top"
                      scrollEnabled={false}
                    />
                    <Text style={styles.helperText}>
                      💡 Tip: Semakin detail instruksi Anda, semakin baik AI memahami gaya yang Anda inginkan
                    </Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={() => {
                    onReset();
                    setIsCustomMode(false);
                    setLocalCustomPrompt('');
                  }}
                >
                  <Text style={styles.resetButtonText}>Reset ke Default</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>Terapkan</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
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
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 20,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  presetCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetCardActive: {
    borderColor: '#667eea',
    backgroundColor: '#eef2ff',
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  presetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  presetNameActive: {
    color: '#667eea',
  },
  presetDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  customButtonActive: {
    borderColor: '#667eea',
    backgroundColor: '#eef2ff',
  },
  customButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  customButtonTextActive: {
    color: '#667eea',
  },
  customInputContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  customInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    borderWidth: 2,
    borderColor: '#667eea',
    minHeight: 150,
    maxHeight: 200,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
