import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  Animated,
  Image,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from '@react-native-vector-icons/ionicons';
import Markdown from 'react-native-markdown-display';
import { useChatMessages, Message } from '../hooks/useChatMessages';
import { useAttachments } from '../hooks/useAttachments';
import { useTypingAnimation } from '../hooks/useTypingAnimation';
import { useDropdownMenu } from '../hooks/useDropdownMenu';
import { useSystemPrompt } from '../hooks/useSystemPrompt';
import { useChatSessions } from '../hooks/useChatSessions';
import { useSQLiteDatabase, Schedule } from '../hooks/useSQLiteDatabase';
import { PromptCustomizationModal } from '../components/PromptCustomizationModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ScheduleModal } from '../components/ScheduleModal';
import { ChatSidebar } from '../components/ChatSidebar';
import { SchedulesListScreen } from '../screens/SchedulesListScreen';
import NotificationService from '../services/notificationService';

interface AIChatScreenProps {
  navigation: any;
}

const AIChatScreen: React.FC<AIChatScreenProps> = ({}) => {
  const flatListRef = useRef<FlatList>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showClearChatModal, setShowClearChatModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSchedulesList, setShowSchedulesList] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const {
    currentConversationId,
    selectConversation,
    refreshConversations,
    createConversationFromMessage,
  } = useChatSessions();

  const {
    messages,
    isTyping,
    inputText,
    setInputText,
    sendMessage,
    clearChat,
    performClearChat,
    isLoadingMessages,
  } = useChatMessages({ conversationId: currentConversationId });

  const {
    attachments,
    showAttachmentMenu,
    setShowAttachmentMenu,
    handleTakePhoto,
    handlePickImage,
    handlePickDocument,
    removeAttachment,
    clearAttachments,
  } = useAttachments();

  const {
    dot1Animation,
    dot2Animation,
    dot3Animation,
    attachmentMenuAnimation,
  } = useTypingAnimation(isTyping, showAttachmentMenu);

  const {
    isOpen: isMenuOpen,
    toggleMenu,
    closeMenu,
    menuAnimation,
  } = useDropdownMenu();

  const {
    selectedPreset,
    customPrompt,
    presets,
    selectPreset,
    setCustomPrompt,
    resetToDefault,
    getCurrentPrompt,
  } = useSystemPrompt();

  const { createSchedule } = useSQLiteDatabase();

  const handleSendMessage = async () => {
    // If no conversation yet, create one from the first message
    if (!currentConversationId && inputText.trim()) {
      const newId = await createConversationFromMessage(inputText.trim());
      console.log('Created new conversation with ID:', newId);
    }
    await sendMessage(attachments, getCurrentPrompt());
    clearAttachments();
  };

  const handleClearChat = () => {
    clearChat(() => setShowClearChatModal(true));
    closeMenu();
  };

  const handleConversationSelect = async (conversationId: string) => {
    console.log('Selecting conversation:', conversationId);
    await selectConversation(conversationId);
    await refreshConversations();
  };

  const handleOpenSidebar = async () => {
    setShowSidebar(true);
    // Refresh conversations when opening sidebar to ensure latest data
    await refreshConversations();
    console.log('Sidebar opened, conversations refreshed');
  };

  const handleConfirmClearChat = () => {
    performClearChat();
    clearAttachments();
  };

  const handleOpenPromptModal = () => {
    setShowPromptModal(true);
    closeMenu();
  };

  const handleOpenScheduleModal = () => {
    setShowScheduleModal(true);
    closeMenu();
  };

  const handleOpenSchedulesList = () => {
    setShowSchedulesList(true);
    closeMenu();
  };

  const handleSchedule = async (title: string, hour: number, minute: number, days: number[]) => {
    try {
      // Save to SQLite
      const scheduleId = await createSchedule({
        title,
        hour,
        minute,
        repeatDays: JSON.stringify(days),
        enabled: true,
      });

      // Schedule notification
      const schedule: Schedule = {
        id: scheduleId,
        title,
        hour,
        minute,
        repeatDays: JSON.stringify(days),
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      await NotificationService.scheduleNotification(schedule);

      // Show test notification to confirm setup
      await NotificationService.showTestNotification();

      console.log('✅ Schedule Created:', title);
      console.log('Time:', `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      if (days.length > 0) {
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const selectedDayNames = days.map(d => dayNames[d]).join(', ');
        console.log('Repeat on:', selectedDayNames);
      }
    } catch (error) {
      console.error('❌ Failed to create schedule:', error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        {item.attachments && item.attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            {item.attachments.map((attachment, index) => (
              <View key={index} style={styles.attachmentItem}>
                {attachment.type === 'image' ? (
                  <Image
                    source={{ uri: attachment.uri }}
                    style={styles.attachmentImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.documentPreview}>
                    <Icon name="document-text" size={24} color="#667eea" />
                    <Text style={styles.documentName} numberOfLines={1}>
                      {attachment.name}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
        {item.text ? (
          item.isUser ? (
            <Text style={[styles.messageText, styles.userText]}>
              {item.text}
            </Text>
          ) : (
            <Markdown
              style={{
                body: styles.aiText,
                paragraph: styles.messageText,
                strong: { fontWeight: 'bold' },
                em: { fontStyle: 'italic' },
                code_inline: {
                  backgroundColor: '#e5e7eb',
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderRadius: 4,
                  fontFamily: 'monospace',
                },
                code_block: {
                  backgroundColor: '#e5e7eb',
                  padding: 8,
                  borderRadius: 8,
                  fontFamily: 'monospace',
                },
                bullet_list: { marginVertical: 4 },
                ordered_list: { marginVertical: 4 },
                list_item: { marginVertical: 2 },
              }}
            >
              {item.text}
            </Markdown>
          )
        ) : null}
        <Text
          style={[
            styles.timestamp,
            item.isUser ? styles.userTimestamp : styles.aiTimestamp,
          ]}
        >
          {formatTime(item.timestamp)}
        </Text>
      </View>
    </View>
  );

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={[styles.messageContainer, styles.aiMessage]}>
        <View style={[styles.messageBubble, styles.aiBubble]}>
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>AI sedang berpikir</Text>
            <View style={styles.typingDotsContainer}>
              <Animated.Text
                style={[
                  styles.typingDot,
                  {
                    opacity: dot1Animation,
                  },
                ]}
              >
                .
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.typingDot,
                  {
                    opacity: dot2Animation,
                  },
                ]}
              >
                .
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.typingDot,
                  {
                    opacity: dot3Animation,
                  },
                ]}
              >
                .
              </Animated.Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (isLoadingMessages) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Memuat Data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.sidebarButton}
          onPress={handleOpenSidebar}
        >
          <Icon name="menu" size={24} color="#374151" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Asisten Belajar AI</Text>
          <Text style={styles.headerSubtitle}>
            {customPrompt ? 'Custom' : selectedPreset.name}
          </Text>
        </View>
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
            <Icon name="ellipsis-vertical" size={20} color="#374151" />
          </TouchableOpacity>

          {isMenuOpen && (
            <Modal
              visible={isMenuOpen}
              transparent={true}
              animationType="none"
              onRequestClose={closeMenu}
            >
              <TouchableWithoutFeedback onPress={closeMenu}>
                <View style={styles.menuBackdrop}>
                  <TouchableWithoutFeedback>
                    <Animated.View
                      style={[
                        styles.dropdownMenu,
                        {
                          opacity: menuAnimation,
                          transform: [
                            {
                              translateY: menuAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-10, 0],
                              }),
                            },
                            {
                              scale: menuAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.95, 1],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleOpenPromptModal}
                        activeOpacity={0.7}
                      >
                        <Icon
                          name="settings-outline"
                          size={20}
                          color="#667eea"
                        />
                        <Text style={styles.menuItemText}>
                          Penyesuaian Prompt AI
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleOpenScheduleModal}
                        activeOpacity={0.7}
                      >
                        <Icon
                          name="time-outline"
                          size={20}
                          color="#10b981"
                        />
                        <Text style={styles.menuItemText}>
                          Jadwal Belajar
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleOpenSchedulesList}
                        activeOpacity={0.7}
                      >
                        <Icon
                          name="list-outline"
                          size={20}
                          color="#8b5cf6"
                        />
                        <Text style={styles.menuItemText}>
                          Lihat Daftar Jadwal
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.menuDivider} />

                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleClearChat}
                        activeOpacity={0.7}
                      >
                        <Icon name="trash-outline" size={20} color="#ef4444" />
                        <Text
                          style={[
                            styles.menuItemText,
                            styles.menuItemTextDanger,
                          ]}
                        >
                          Bersihkan Semua Chat
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          )}
        </View>
        <View style={styles.statusIndicator}>
          <View style={styles.onlineStatus} />
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
        ListFooterComponent={renderTypingIndicator}
      />

      <LinearGradient
        colors={['transparent', 'rgba(248, 250, 252, 0.8)', '#f8fafc']}
        style={styles.inputContainer}
      >
        {attachments.length > 0 && (
          <View style={styles.attachmentPreviewContainer}>
            {attachments.map((attachment, index) => (
              <View key={index} style={styles.attachmentPreview}>
                {attachment.type === 'image' ? (
                  <Image
                    source={{ uri: attachment.uri }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.previewDocument}>
                    <Icon name="document-text" size={28} color="#667eea" />
                    <Text style={styles.previewDocumentName} numberOfLines={1}>
                      {attachment.name}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeAttachmentButton}
                  onPress={() => removeAttachment(index)}
                >
                  <Icon name="close" size={14} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.inputWrapper}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={() => setShowAttachmentMenu(!showAttachmentMenu)}
          >
            <Icon
              name={showAttachmentMenu ? 'close' : 'add'}
              size={24}
              color="#ffffff"
            />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Tanya apa saja..."
            placeholderTextColor="#9ca3af"
            maxLength={500}
            underlineColorAndroid="transparent"
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() || attachments.length > 0
                ? styles.sendButtonActive
                : styles.sendButtonInactive,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() && attachments.length === 0}
          >
            <Text style={styles.sendButtonText}>Kirim</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Modal
        visible={showAttachmentMenu}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowAttachmentMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowAttachmentMenu(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.attachmentMenuFloat,
                  {
                    opacity: attachmentMenuAnimation,
                    transform: [
                      {
                        translateY: attachmentMenuAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      },
                      {
                        scale: attachmentMenuAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.attachmentMenuItem,
                    styles.attachmentMenuItemFirst,
                  ]}
                  onPress={handleTakePhoto}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.attachmentIconCircle,
                      { backgroundColor: '#ef4444' },
                    ]}
                  >
                    <Icon name="camera" size={24} color="#ffffff" />
                  </View>
                  <Text style={styles.attachmentMenuText}>Kamera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.attachmentMenuItem}
                  onPress={handlePickImage}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.attachmentIconCircle,
                      { backgroundColor: '#10b981' },
                    ]}
                  >
                    <Icon name="images" size={24} color="#ffffff" />
                  </View>
                  <Text style={styles.attachmentMenuText}>Galeri</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.attachmentMenuItem,
                    styles.attachmentMenuItemLast,
                  ]}
                  onPress={handlePickDocument}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.attachmentIconCircle,
                      { backgroundColor: '#667eea' },
                    ]}
                  >
                    <Icon name="document-attach" size={24} color="#ffffff" />
                  </View>
                  <Text style={styles.attachmentMenuText}>Dokumen</Text>
                </TouchableOpacity>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <PromptCustomizationModal
        visible={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        selectedPreset={selectedPreset}
        customPrompt={customPrompt}
        presets={presets}
        onSelectPreset={selectPreset}
        onSaveCustomPrompt={setCustomPrompt}
        onReset={resetToDefault}
      />

      <ConfirmationModal
        visible={showClearChatModal}
        onClose={() => setShowClearChatModal(false)}
        onConfirm={handleConfirmClearChat}
        title="Hapus Semua Chat?"
        message="Semua riwayat percakapan akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        iconName="trash-outline"
        iconColor="#ef4444"
        confirmColor={['#ef4444', '#dc2626']}
      />

      <ScheduleModal
        visible={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSchedule={handleSchedule}
      />

      <Modal
        visible={showSchedulesList}
        animationType="slide"
        onRequestClose={() => setShowSchedulesList(false)}
      >
        <SchedulesListScreen onClose={() => setShowSchedulesList(false)} />
      </Modal>

      <Modal
        visible={showSidebar}
        animationType="slide"
        onRequestClose={() => setShowSidebar(false)}
      >
        <ChatSidebar
          onClose={() => setShowSidebar(false)}
          currentConversationId={currentConversationId}
          onConversationSelect={handleConversationSelect}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sidebarButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  menuContainer: {
    position: 'relative',
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  menuItemTextDanger: {
    color: '#ef4444',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  statusIndicator: {
    alignItems: 'center',
  },
  onlineStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#667eea',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  aiText: {
    color: '#1f2937',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#9ca3af',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  typingDotsContainer: {
    flexDirection: 'row',
    marginLeft: 2,
  },
  typingDot: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  inputContainer: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 52,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 0,
    margin: 0,
    height: 44,
    lineHeight: 20,
  },
  sendButton: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: '#667eea',
  },
  sendButtonInactive: {
    backgroundColor: '#e5e7eb',
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    paddingBottom: 90,
  },
  attachmentMenuFloat: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  attachmentMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  attachmentMenuItemFirst: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  attachmentMenuItemLast: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  attachmentIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  attachmentMenuText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },
  attachmentPreviewContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexWrap: 'wrap',
  },
  attachmentPreview: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  previewDocument: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  previewDocumentName: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  attachmentsContainer: {
    marginBottom: 8,
  },
  attachmentItem: {
    marginBottom: 8,
  },
  attachmentImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  documentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    maxWidth: 200,
    gap: 8,
  },
  documentName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
});

export default AIChatScreen;
