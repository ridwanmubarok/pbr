import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from './useChatMessages';
import { useSQLiteDatabase } from './useSQLiteDatabase';

const STORAGE_KEY = '@chat_messages';
const MIGRATION_KEY = '@sqlitedb_migrated';

const INITIAL_MESSAGE: Message = {
  id: '1',
  text: 'Halo! Saya asisten belajar AI Anda. Apa yang ingin Anda pelajari hari ini?',
  isUser: false,
  timestamp: new Date(),
};

interface UsePersistedMessagesProps {
  conversationId?: string | null;
}

interface UsePersistedMessagesReturn {
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  clearMessages: () => void;
  isLoading: boolean;
}

export const usePersistedMessages = ({
  conversationId,
}: UsePersistedMessagesProps = {}): UsePersistedMessagesReturn => {
  const [messages, setMessagesState] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(true);
  const {
    isInitialized,
    getMessages,
    insertMessage,
    clearMessages: clearSQLite,
    createConversation,
  } = useSQLiteDatabase();
  const isSavingRef = useRef(false);
  const lastSavedLengthRef = useRef(0);

  // Migrate data from AsyncStorage to SQLite
  const migrateFromAsyncStorage = useCallback(async () => {
    try {
      const hasMigrated = await AsyncStorage.getItem(MIGRATION_KEY);
      if (hasMigrated) {
        console.log('Already migrated from AsyncStorage');
        return;
      }

      console.log('Starting migration from AsyncStorage to SQLite...');
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Skip if only initial message
        if (parsed.length <= 1 && parsed[0]?.id === '1') {
          console.log('Only initial message found, skipping migration');
          await AsyncStorage.setItem(MIGRATION_KEY, 'true');
          return;
        }

        // Create a default conversation for migrated messages
        const migrationConversationId = await createConversation('Migrated Chat');
        console.log(`Created migration conversation: ${migrationConversationId}`);

        // Convert and insert each message into SQLite with conversationId
        for (const msg of parsed) {
          await insertMessage({
            ...msg,
            conversationId: migrationConversationId, // Add conversationId
            timestamp: (msg.timestamp instanceof Date
              ? msg.timestamp
              : new Date(msg.timestamp)
            ).toISOString(),
            attachments: msg.attachments
              ? JSON.stringify(msg.attachments)
              : undefined,
          });
        }
        console.log(`Migrated ${parsed.length} messages to SQLite`);

        // Mark migration as complete
        await AsyncStorage.setItem(MIGRATION_KEY, 'true');
      } else {
        // No data to migrate, mark as complete
        await AsyncStorage.setItem(MIGRATION_KEY, 'true');
      }
    } catch (error) {
      console.error('Error migrating from AsyncStorage:', error);
      // Mark migration as complete even on error to prevent repeated attempts
      await AsyncStorage.setItem(MIGRATION_KEY, 'true');
    }
  }, [insertMessage, createConversation]);

  // Load messages from SQLite on mount or when conversationId changes
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        setMessagesState([INITIAL_MESSAGE]);
        lastSavedLengthRef.current = 1; // Reset to initial message

        // First, migrate from AsyncStorage if needed
        await migrateFromAsyncStorage();

        // Then load from SQLite based on conversationId
        if (isInitialized && conversationId) {
          const stored = await getMessages(conversationId);
          if (stored && stored.length > 0) {
            // Convert timestamp strings back to Date objects and parse attachments
            const messagesWithDates = stored.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
              attachments: msg.attachments
                ? JSON.parse(msg.attachments)
                : undefined,
            }));
            setMessagesState(messagesWithDates);
            lastSavedLengthRef.current = messagesWithDates.length;
          } else {
            // No messages in this conversation yet, start with initial message
            setMessagesState([INITIAL_MESSAGE]);
            lastSavedLengthRef.current = 1;
          }
        } else if (isInitialized && !conversationId) {
          // If no conversationId yet, just show initial message
          setMessagesState([INITIAL_MESSAGE]);
          lastSavedLengthRef.current = 1;
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        // On error, just show initial message
        setMessagesState([INITIAL_MESSAGE]);
        lastSavedLengthRef.current = 1;
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [isInitialized, conversationId, getMessages, migrateFromAsyncStorage]);

  // Save messages to SQLite whenever they change
  useEffect(() => {
    const saveMessages = async () => {
      if (
        !isLoading &&
        isInitialized &&
        !isSavingRef.current &&
        messages.length > 0 &&
        conversationId
      ) {
        // Skip if only initial message (no need to save)
        if (messages.length === 1 && messages[0].id === '1') {
          return;
        }

        // Skip if no new messages since last save
        if (messages.length === lastSavedLengthRef.current) {
          return;
        }

        isSavingRef.current = true;
        try {
          // Save only NEW messages (since last save)
          const messagesToSave = messages.slice(lastSavedLengthRef.current);
          for (const msg of messagesToSave) {
            await insertMessage({
              ...msg,
              conversationId: conversationId,
              timestamp: msg.timestamp.toISOString(),
              attachments: msg.attachments
                ? JSON.stringify(msg.attachments)
                : undefined,
            });
          }
          lastSavedLengthRef.current = messages.length;
          console.log(
            `Saved ${messagesToSave.length} new messages to SQLite for conversation ${conversationId}`,
          );
        } catch (error) {
          console.error('Error saving messages to SQLite:', error);
          // Fallback to AsyncStorage
          try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
            console.log('Saved to AsyncStorage as fallback');
          } catch (fallbackError) {
            console.error(
              'Error saving to AsyncStorage fallback:',
              fallbackError,
            );
          }
        } finally {
          isSavingRef.current = false;
        }
      }
    };

    saveMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isLoading, isInitialized, conversationId]);

  const setMessages = useCallback(
    (value: Message[] | ((prev: Message[]) => Message[])) => {
      if (typeof value === 'function') {
        setMessagesState(prev => {
          const newMessages = value(prev);
          return newMessages;
        });
      } else {
        setMessagesState(value);
      }
    },
    [],
  );

  const clearMessages = useCallback(async () => {
    try {
      setMessagesState([INITIAL_MESSAGE]);

      // Clear from SQLite for current conversation
      if (isInitialized && conversationId) {
        await clearSQLite(conversationId);
      }

      // Also clear from AsyncStorage for consistency
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([INITIAL_MESSAGE]),
      );

      console.log(`Messages cleared for conversation ${conversationId}`);
    } catch (error) {
      console.error('Error clearing messages:', error);
    }
  }, [isInitialized, clearSQLite, conversationId]);

  return {
    messages,
    setMessages,
    clearMessages,
    isLoading: isLoading || !isInitialized,
  };
};
