import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { deviceHeight, deviceWidth, getDeviceType } from '../utils/deviceInfo';

interface DebugPanelProps {
  visible: boolean;
  onClose: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'device' | 'performance' | 'actions'>('device');

  const handleTestAction = (action: string) => {
    Alert.alert('Test Action', `Executing: ${action}`);
  };

  const deviceInfo = {
    'Device Type': getDeviceType(),
    'Screen Width': `${deviceWidth}px`,
    'Screen Height': `${deviceHeight}px`,
    'Aspect Ratio': (deviceHeight / deviceWidth).toFixed(2),
  };

  const performanceMetrics = {
    'Memory Usage': 'Simulated: 45MB',
    'Bundle Size': 'Simulated: 2.1MB',
    'Render Time': 'Simulated: 16ms',
    'FPS': 'Simulated: 60fps',
  };

  const testActions = [
    'Test Navigation Flow',
    'Test Message Sending',
    'Test Input Validation',
    'Test Error Handling',
    'Test Responsive Design',
    'Test Accessibility',
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'device':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Device Information</Text>
            {Object.entries(deviceInfo).map(([key, value]) => (
              <View key={key} style={styles.infoRow}>
                <Text style={styles.infoKey}>{key}:</Text>
                <Text style={styles.infoValue}>{value}</Text>
              </View>
            ))}
          </View>
        );
      case 'performance':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>
            {Object.entries(performanceMetrics).map(([key, value]) => (
              <View key={key} style={styles.infoRow}>
                <Text style={styles.infoKey}>{key}:</Text>
                <Text style={styles.infoValue}>{value}</Text>
              </View>
            ))}
          </View>
        );
      case 'actions':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Test Actions</Text>
            {testActions.map((action) => (
              <TouchableOpacity
                key={action}
                style={styles.actionButton}
                onPress={() => handleTestAction(action)}>
                <Text style={styles.actionButtonText}>{action}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Debug Panel</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          {(['device', 'performance', 'actions'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.content}>{renderTabContent()}</ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#667eea',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tabContent: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 8,
  },
  infoKey: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  infoValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default DebugPanel;