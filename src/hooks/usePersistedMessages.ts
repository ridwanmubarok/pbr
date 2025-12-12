import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from './useChatMessages';

const STORAGE_KEY = '@chat_messages';

const INITIAL_MESSAGE: Message = {
  id: '1',
  text: 'Halo! Saya asisten belajar AI Anda. Apa yang ingin Anda pelajari hari ini?',
  isUser: false,
  timestamp: new Date(),
};

interface UsePersistedMessagesReturn {
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  clearMessages: () => void;
  isLoading: boolean;
}

export const usePersistedMessages = (): UsePersistedMessagesReturn => {
  const [messages, setMessagesState] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(true);

  // Load messages from storage on mount
  useEffect(() => {
    loadMessages();
  }, []);

  // Save messages to storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveMessages(messages);
    }
  }, [messages, isLoading]);

  const loadMessages = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessagesState(messagesWithDates);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMessages = async (msgs: Message[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const setMessages = (
    value: Message[] | ((prev: Message[]) => Message[]),
  ) => {
    if (typeof value === 'function') {
      setMessagesState(prev => {
        const newMessages = value(prev);
        return newMessages;
      });
    } else {
      setMessagesState(value);
    }
  };

  const clearMessages = async () => {
    try {
      setMessagesState([INITIAL_MESSAGE]);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([INITIAL_MESSAGE]));
    } catch (error) {
      console.error('Error clearing messages:', error);
    }
  };

  return {
    messages,
    setMessages,
    clearMessages,
    isLoading,
  };
};
