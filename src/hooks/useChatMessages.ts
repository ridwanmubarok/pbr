import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@env';
import { Attachment } from './useAttachments';
import { usePersistedMessages } from './usePersistedMessages';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  attachments?: Attachment[];
}

interface UseChatMessagesReturn {
  messages: Message[];
  isTyping: boolean;
  inputText: string;
  setInputText: (text: string) => void;
  sendMessage: (attachments: Attachment[], systemPrompt?: string) => Promise<void>;
  clearChat: (onConfirm: () => void) => void;
  performClearChat: () => void;
  isLoadingMessages: boolean;
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const useChatMessages = (): UseChatMessagesReturn => {
  const { messages, setMessages, clearMessages, isLoading: isLoadingMessages } = usePersistedMessages();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (attachments: Attachment[], systemPrompt?: string) => {
    if (!inputText.trim() && attachments.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.9,
        },
      });

      const parts: any[] = [];

      if (userMessage.attachments) {
        for (const attachment of userMessage.attachments) {
          if (attachment.base64) {
            parts.push({
              inlineData: {
                data: attachment.base64,
                mimeType:
                  attachment.mimeType ||
                  (attachment.type === 'image'
                    ? 'image/jpeg'
                    : 'application/pdf'),
              },
            });
          }
        }
      }

      // Add system prompt if provided
      const finalText = systemPrompt
        ? `${systemPrompt}\n\nUser: ${userMessage.text || 'Tolong analisis gambar/dokumen ini.'}`
        : userMessage.text || 'Tolong analisis gambar/dokumen ini.';

      parts.push({
        text: finalText,
      });

      const result = await model.generateContent(parts);
      const response = await result.response;
      const aiText = response.text();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    } catch (error: any) {
      console.error('Error calling Gemini API:', error);
      let errorText = 'Maaf, terjadi kesalahan. Silakan coba lagi.';

      if (
        error?.message?.includes('quota') ||
        error?.message?.includes('429')
      ) {
        errorText =
          '⚠️ API Quota Exceeded!\n\nAnda sudah mencapai limit harian Gemini API.\n\nSolusi:\n1. Tunggu 24 jam untuk quota reset\n2. Atau buat API key baru di:\n   https://makersuite.google.com/app/apikey\n3. Atau upgrade ke paid plan\n\nCek usage di:\nhttps://ai.dev/usage?tab=rate-limit';
      } else if (
        error?.message?.includes('API key') ||
        error?.message?.includes('401')
      ) {
        errorText =
          '⚠️ Invalid API Key!\n\nAPI key tidak valid. Mohon cek API key Anda di file .env:\nGEMINI_API_KEY=your_api_key_here';
      } else if (
        error?.message?.includes('network') ||
        error?.message?.includes('fetch')
      ) {
        errorText = '⚠️ Network Error!\n\nMohon cek koneksi internet Anda.';
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  const performClearChat = () => {
    clearMessages();
    setInputText('');
  };

  const clearChat = (onConfirm: () => void) => {
    onConfirm();
  };

  return {
    messages,
    isTyping,
    inputText,
    setInputText,
    sendMessage,
    clearChat,
    performClearChat,
    isLoadingMessages,
  };
};
