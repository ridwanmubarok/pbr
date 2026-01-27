import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSQLiteDatabase, Conversation } from './useSQLiteDatabase';

const CURRENT_CONVERSATION_KEY = '@current_conversation_id';

export interface UseChatSessionsReturn {
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  createNewConversation: (title?: string) => Promise<string>;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
  createConversationFromMessage: (message: string) => Promise<string>;
}

export const useChatSessions = (): UseChatSessionsReturn => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    isInitialized,
    createConversation,
    getConversations,
    deleteConversation: deleteConv,
    updateConversationTitle,
  } = useSQLiteDatabase();

  // Load current conversation ID from AsyncStorage
  useEffect(() => {
    const loadCurrentConversationId = async () => {
      try {
        const savedId = await AsyncStorage.getItem(CURRENT_CONVERSATION_KEY);
        if (savedId) {
          setCurrentConversationId(savedId);
        }
      } catch (error) {
        console.error('Failed to load current conversation ID:', error);
      }
    };

    loadCurrentConversationId();
  }, []);

  const selectConversation = useCallback(async (id: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(CURRENT_CONVERSATION_KEY, id);
      setCurrentConversationId(id);
      console.log('Selected conversation:', id);
    } catch (error) {
      console.error('Failed to select conversation:', error);
      throw error;
    }
  }, []);

  const createNewConversation = useCallback(
    async (title?: string): Promise<string> => {
      try {
        const defaultTitle = title || `Chat ${conversations.length + 1}`;
        const newId = await createConversation(defaultTitle);

        // Refresh conversations list
        const updatedConversations = await getConversations();
        setConversations(updatedConversations);

        // Set as current conversation
        await selectConversation(newId);

        console.log('Created new conversation:', newId);
        return newId;
      } catch (error) {
        console.error('Failed to create conversation:', error);
        throw error;
      }
    },
    [
      conversations.length,
      createConversation,
      getConversations,
      selectConversation,
    ],
  );

  const createConversationFromMessage = useCallback(
    async (message: string): Promise<string> => {
      try {
        // Generate title from first message (max 50 chars, truncate at word boundary)
        let title = message.trim();
        if (title.length > 50) {
          title = title.substring(0, 47).trim() + '...';
        }

        const newId = await createConversation(title);

        // Set as current conversation
        await selectConversation(newId);

        // Refresh conversations list
        const updatedConversations = await getConversations();
        setConversations(updatedConversations);

        console.log('Created conversation from message:', newId);
        return newId;
      } catch (error) {
        console.error('Failed to create conversation from message:', error);
        throw error;
      }
    },
    [createConversation, selectConversation, getConversations],
  );

  const deleteConversation = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteConv(id);

        // Refresh conversations list
        const updatedConversations = await getConversations();
        setConversations(updatedConversations);

        // If we deleted the current conversation, select another one
        if (id === currentConversationId) {
          if (updatedConversations.length > 0) {
            await selectConversation(updatedConversations[0].id);
          } else {
            // No conversations left, create a new one
            const newId = await createNewConversation('Chat Baru');
            await selectConversation(newId);
          }
        }

        console.log('Deleted conversation:', id);
      } catch (error) {
        console.error('Failed to delete conversation:', error);
        throw error;
      }
    },
    [
      currentConversationId,
      deleteConv,
      getConversations,
      createNewConversation,
      selectConversation,
    ],
  );

  const renameConversation = useCallback(
    async (id: string, title: string): Promise<void> => {
      try {
        await updateConversationTitle(id, title);

        // Refresh conversations list
        const updatedConversations = await getConversations();
        setConversations(updatedConversations);

        console.log('Renamed conversation:', id);
      } catch (error) {
        console.error('Failed to rename conversation:', error);
        throw error;
      }
    },
    [updateConversationTitle, getConversations],
  );

  const refreshConversations = useCallback(async () => {
    try {
      const updatedConversations = await getConversations();
      setConversations(updatedConversations);
    } catch (error) {
      console.error('Failed to refresh conversations:', error);
    }
  }, [getConversations]);

  // Load conversations when database is initialized
  useEffect(() => {
    const loadConversations = async () => {
      if (isInitialized) {
        setIsLoading(true);
        try {
          const convs = await getConversations();
          setConversations(convs);

          // Only set initial conversation if not already set and we have conversations
          if (!currentConversationId && convs.length > 0) {
            await selectConversation(convs[0].id);
          }
          // If no conversations exist, DON'T create one automatically
          // Let it be null, will create when user sends first message
        } catch (error) {
          console.error('Failed to load conversations:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  return {
    conversations,
    currentConversationId,
    isLoading,
    createNewConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    refreshConversations,
    createConversationFromMessage,
  };
};
