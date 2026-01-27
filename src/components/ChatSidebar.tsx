import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useChatSessions } from '../hooks/useChatSessions';
import { Conversation } from '../hooks/useSQLiteDatabase';
import { ConfirmationModal } from './ConfirmationModal';

interface ChatSidebarProps {
  onClose: () => void;
  currentConversationId: string | null;
  onConversationSelect: (id: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  onClose,
  currentConversationId,
  onConversationSelect,
}) => {
  const {
    conversations,
    isLoading,
    createNewConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
  } = useChatSessions();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] =
    useState<Conversation | null>(null);

  // Debug log
  console.log('ChatSidebar render - conversations:', conversations);
  console.log(
    'ChatSidebar render - currentConversationId:',
    currentConversationId,
  );

  const handleDeleteConversation = (conversation: Conversation) => {
    setConversationToDelete(conversation);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (conversationToDelete) {
      try {
        await deleteConversation(conversationToDelete.id);
        setShowDeleteModal(false);
        setConversationToDelete(null);
      } catch (error) {
        console.error('Failed to delete conversation:', error);
        setShowDeleteModal(false);
        setConversationToDelete(null);
      }
    }
  };

  const handleStartEditing = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const handleSaveTitle = async () => {
    if (editingId && editingTitle.trim()) {
      try {
        await renameConversation(editingId, editingTitle.trim());
        setEditingId(null);
        setEditingTitle('');
      } catch (error) {
        console.error('Failed to rename conversation:', error);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Hari ini';
    } else if (diffDays === 1) {
      return 'Kemarin';
    } else if (diffDays < 7) {
      return `${diffDays} hari lalu`;
    } else {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat History</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* New Chat Button */}
      <TouchableOpacity
        style={styles.newChatButton}
        onPress={async () => {
          try {
            const newId = await createNewConversation();
            onConversationSelect(newId);
            onClose();
          } catch (error) {
            console.error('Failed to create new conversation:', error);
          }
        }}
      >
        <Icon name="add-circle" size={20} color="#007AFF" />
        <Text style={styles.newChatButtonText}>Chat Baru</Text>
      </TouchableOpacity>

      {/* Conversations List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <Text style={styles.loadingText}>Memuat...</Text>
        ) : conversations.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada chat</Text>
        ) : (
          conversations.map(conversation => (
            <View key={conversation.id} style={styles.conversationItem}>
              {editingId === conversation.id ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={editingTitle}
                    onChangeText={setEditingTitle}
                    onSubmitEditing={handleSaveTitle}
                    autoFocus
                    selectTextOnFocus
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity onPress={handleSaveTitle}>
                      <Icon name="checkmark" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleCancelEdit}>
                      <Icon name="close" size={20} color="#999" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.conversationButton,
                    currentConversationId === conversation.id &&
                      styles.conversationButtonActive,
                  ]}
                  onPress={async () => {
                    await selectConversation(conversation.id);
                    onConversationSelect(conversation.id);
                    onClose();
                  }}
                  onLongPress={() => handleStartEditing(conversation)}
                >
                  <View style={styles.conversationContent}>
                    <View style={styles.conversationTextContainer}>
                      <Text
                        style={[
                          styles.conversationTitle,
                          currentConversationId === conversation.id &&
                            styles.conversationTitleActive,
                        ]}
                        numberOfLines={1}
                      >
                        {conversation.title}
                      </Text>
                      <Text style={styles.conversationDate}>
                        {formatDate(conversation.updatedAt)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteConversation(conversation)}
                    >
                      <Icon name="trash-outline" size={18} color="#999" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <ConfirmationModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setConversationToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Hapus Chat?"
        message={`Apakah Anda yakin ingin menghapus "${
          conversationToDelete?.title || ''
        }"? Semua riwayat percakapan akan dihapus secara permanen.`}
        confirmText="Hapus"
        cancelText="Batal"
        iconName="trash-outline"
        iconColor="#ef4444"
        confirmColor={['#ef4444', '#dc2626']}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  newChatButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  loadingText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
  conversationItem: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  conversationButton: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  conversationButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  conversationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationTextContainer: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  conversationTitleActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  conversationDate: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  editContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    paddingVertical: 4,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
});
