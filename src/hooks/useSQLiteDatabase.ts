import { useState, useEffect, useCallback } from 'react';
const QuickSQLite = require('react-native-quick-sqlite');

// Database configuration
const DB_NAME = 'chat_history.db';
const MESSAGES_TABLE = 'messages';
const CONVERSATIONS_TABLE = 'conversations';
const SCHEDULES_TABLE = 'schedules';

export interface Message {
  id: string;
  conversationId: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  attachments?: string; // JSON stringified attachments
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  title: string;
  hour: number;
  minute: number;
  repeatDays: string; // JSON array of day numbers
  enabled: boolean;
  createdAt: string;
}

export interface Attachment {
  uri: string;
  type: 'image' | 'document';
  name?: string;
  base64?: string;
  mimeType?: string;
}

// Type definitions for SQLite
interface SQLiteRow {
  [key: string]: string | number | null;
}

interface SQLiteResultSet {
  _array: SQLiteRow[];
  length: number;
}

interface SQLiteResult {
  rows: SQLiteResultSet | SQLiteRow[];
  rowsAffected?: number;
  insertId?: number;
}

interface SQLiteDatabase {
  execute: (
    query: string,
    params?: (string | number | null)[],
  ) => Promise<SQLiteResult>;
  close: () => Promise<void>;
}

// Helper function to extract rows from SQLite result
function extractRows(result: SQLiteResult): SQLiteRow[] {
  const rows = result.rows;
  // Check if rows has _array property (SQLiteResultSet)
  if (rows && typeof rows === 'object' && '_array' in rows) {
    return (rows as SQLiteResultSet)._array;
  }
  // Otherwise rows is already an array
  return (rows as SQLiteRow[]) || [];
}

class DatabaseService {
  private db: SQLiteDatabase | null = null;
  private schedulesTableMigrated = false;

  async init(): Promise<void> {
    try {
      this.db = QuickSQLite.open({ name: DB_NAME });
      await this.createTable();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTable(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create conversations table
    const conversationsQuery = `
      CREATE TABLE IF NOT EXISTS ${CONVERSATIONS_TABLE} (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `;

    // Create messages table with conversationId
    const messagesQuery = `
      CREATE TABLE IF NOT EXISTS ${MESSAGES_TABLE} (
        id TEXT PRIMARY KEY,
        conversationId TEXT NOT NULL,
        text TEXT NOT NULL,
        isUser INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        attachments TEXT,
        FOREIGN KEY (conversationId) REFERENCES ${CONVERSATIONS_TABLE}(id) ON DELETE CASCADE
      )
    `;

    // Create schedules table
    const schedulesQuery = `
      CREATE TABLE IF NOT EXISTS ${SCHEDULES_TABLE} (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        hour INTEGER NOT NULL,
        minute INTEGER NOT NULL,
        repeatDays TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL
      )
    `;

    try {
      await this.db.execute(conversationsQuery);
      await this.db.execute(messagesQuery);

      // Drop and recreate schedules table only once for migration
      if (!this.schedulesTableMigrated) {
        try {
          await this.db.execute(`DROP TABLE IF EXISTS ${SCHEDULES_TABLE}`);
          console.log('Old schedules table dropped for migration');
          this.schedulesTableMigrated = true;
        } catch (error) {
          console.error('Failed to drop old schedules table:', error);
          throw error;
        }
      }

      await this.db.execute(schedulesQuery);
      console.log('Tables created successfully');
    } catch (error) {
      console.error('Failed to create tables:', error);
      throw error;
    }
  }

  async insertMessage(message: Message): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      INSERT OR REPLACE INTO ${MESSAGES_TABLE} (id, conversationId, text, isUser, timestamp, attachments)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const params = [
      message.id,
      message.conversationId,
      message.text,
      message.isUser ? 1 : 0,
      message.timestamp,
      message.attachments || null,
    ];

    try {
      await this.db.execute(query, params);
      // Update conversation's updatedAt timestamp
      await this.updateConversationTimestamp(message.conversationId);
      console.log('Message inserted successfully');
    } catch (error) {
      console.error('Failed to insert message:', error);
      throw error;
    }
  }

  async getMessages(conversationId?: string): Promise<Message[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = `SELECT * FROM ${MESSAGES_TABLE}`;
    const params: (string | number | null)[] = [];

    if (conversationId) {
      query += ' WHERE conversationId = ?';
      params.push(conversationId);
    }

    query += ' ORDER BY timestamp ASC';

    try {
      const result = await this.db.execute(query);
      const messages: Message[] = [];

      const rowsArray = extractRows(result);

      if (Array.isArray(rowsArray)) {
        for (let i = 0; i < rowsArray.length; i++) {
          const row = rowsArray[i];
          // Validate row exists and has required properties
          if (row && row.id !== undefined && row.id !== null) {
            messages.push({
              id: String(row.id),
              conversationId: String(row.conversationId || ''),
              text: String(row.text || ''),
              isUser: Number(row.isUser || 0) === 1,
              timestamp: String(row.timestamp || new Date().toISOString()),
              attachments: row.attachments
                ? String(row.attachments)
                : undefined,
            });
          }
        }
      }

      console.log(`Retrieved ${messages.length} messages`);
      return messages;
    } catch (error) {
      console.error('Failed to get messages:', error);
      throw error;
    }
  }

  async clearMessages(conversationId?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    let query = `DELETE FROM ${MESSAGES_TABLE}`;
    const params: (string | number | null)[] = [];

    if (conversationId) {
      query += ' WHERE conversationId = ?';
      params.push(conversationId);
    }

    try {
      await this.db.execute(query, params);
      console.log(
        `Messages cleared${
          conversationId ? ' for conversation ' + conversationId : ''
        }`,
      );
    } catch (error) {
      console.error('Failed to clear messages:', error);
      throw error;
    }
  }

  async getMessageCount(conversationId?: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    let query = `SELECT COUNT(*) as count FROM ${MESSAGES_TABLE}`;
    const params: (string | number | null)[] = [];

    if (conversationId) {
      query += ' WHERE conversationId = ?';
      params.push(conversationId);
    }

    try {
      const result = await this.db.execute(query, params);
      const rowsArray = extractRows(result);
      if (rowsArray.length > 0) {
        return Number(rowsArray[0].count);
      }
      return 0;
    } catch (error) {
      console.error('Failed to get message count:', error);
      throw error;
    }
  }

  async deleteMessage(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `DELETE FROM ${MESSAGES_TABLE} WHERE id = ?`;

    try {
      await this.db.execute(query, [id]);
      console.log('Message deleted successfully');
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }

  // Conversation management methods

  async createConversation(title: string): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = Date.now().toString();
    const now = new Date().toISOString();

    const query = `
      INSERT INTO ${CONVERSATIONS_TABLE} (id, title, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
    `;

    try {
      await this.db.execute(query, [id, title, now, now]);
      console.log('Conversation created successfully with id:', id);
      return id;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  }

  async getConversations(): Promise<Conversation[]> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `SELECT * FROM ${CONVERSATIONS_TABLE} ORDER BY updatedAt DESC`;

    try {
      const result = await this.db.execute(query);

      const conversations: Conversation[] = [];

      const rowsArray = extractRows(result);

      if (Array.isArray(rowsArray)) {
        console.log(`Processing ${rowsArray.length} rows`);
        for (let i = 0; i < rowsArray.length; i++) {
          const row = rowsArray[i];
          // Validate row exists and has required properties
          if (row && row.id !== undefined && row.id !== null) {
            conversations.push({
              id: String(row.id),
              title: String(row.title || 'Untitled Chat'),
              createdAt: String(row.createdAt || new Date().toISOString()),
              updatedAt: String(row.updatedAt || new Date().toISOString()),
            });
          }
        }
      }

      console.log(
        `Retrieved ${conversations.length} conversations:`,
        conversations,
      );
      return conversations;
    } catch (error) {
      console.error('Failed to get conversations:', error);
      throw error;
    }
  }

  async getConversation(id: string): Promise<Conversation | null> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `SELECT * FROM ${CONVERSATIONS_TABLE} WHERE id = ?`;

    try {
      const result = await this.db.execute(query, [id]);
      const rowsArray = extractRows(result);
      if (rowsArray.length > 0) {
        const row = rowsArray[0];
        // Validate row exists and has required properties
        if (row && row.id !== undefined && row.id !== null) {
          return {
            id: String(row.id),
            title: String(row.title || 'Untitled Chat'),
            createdAt: String(row.createdAt || new Date().toISOString()),
            updatedAt: String(row.updatedAt || new Date().toISOString()),
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get conversation:', error);
      throw error;
    }
  }

  async updateConversationTitle(id: string, title: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      UPDATE ${CONVERSATIONS_TABLE}
      SET title = ?, updatedAt = ?
      WHERE id = ?
    `;

    try {
      const now = new Date().toISOString();
      await this.db.execute(query, [title, now, id]);
      console.log('Conversation title updated successfully');
    } catch (error) {
      console.error('Failed to update conversation title:', error);
      throw error;
    }
  }

  async updateConversationTimestamp(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      UPDATE ${CONVERSATIONS_TABLE}
      SET updatedAt = ?
      WHERE id = ?
    `;

    try {
      const now = new Date().toISOString();
      await this.db.execute(query, [now, id]);
    } catch (error) {
      console.error('Failed to update conversation timestamp:', error);
      throw error;
    }
  }

  async deleteConversation(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Delete all messages in this conversation first (CASCADE should handle this, but let's be safe)
      await this.clearMessages(id);
      // Delete the conversation
      const query = `DELETE FROM ${CONVERSATIONS_TABLE} WHERE id = ?`;
      await this.db.execute(query, [id]);
      console.log('Conversation deleted successfully');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  }

  // Schedule management methods

  async createSchedule(
    schedule: Omit<Schedule, 'id' | 'createdAt'>,
  ): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = Date.now().toString();
    const now = new Date().toISOString();

    const query = `
      INSERT INTO ${SCHEDULES_TABLE} (id, title, hour, minute, repeatDays, enabled, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      await this.db.execute(query, [
        id,
        schedule.title,
        schedule.hour,
        schedule.minute,
        schedule.repeatDays ? JSON.stringify(schedule.repeatDays) : '[]',
        schedule.enabled ? 1 : 0,
        now,
      ]);
      console.log('Schedule created successfully with id:', id);
      return id;
    } catch (error) {
      console.error('Failed to create schedule:', error);
      throw error;
    }
  }

  async getSchedules(): Promise<Schedule[]> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `SELECT * FROM ${SCHEDULES_TABLE} ORDER BY hour, minute`;

    try {
      const result = await this.db.execute(query);
      const schedules: Schedule[] = [];

      const rowsArray = extractRows(result);

      if (Array.isArray(rowsArray)) {
        for (let i = 0; i < rowsArray.length; i++) {
          const row = rowsArray[i];
          if (row && row.id !== undefined && row.id !== null) {
            schedules.push({
              id: String(row.id),
              title: String(row.title || ''),
              hour: Number(row.hour || 0),
              minute: Number(row.minute || 0),
              repeatDays: row.repeatDays ? String(row.repeatDays) : '[]',
              enabled: Number(row.enabled || 1) === 1,
              createdAt: String(row.createdAt || new Date().toISOString()),
            });
          }
        }
      }

      console.log(`Retrieved ${schedules.length} schedules`);
      return schedules;
    } catch (error) {
      console.error('Failed to get schedules:', error);
      throw error;
    }
  }

  async deleteSchedule(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `DELETE FROM ${SCHEDULES_TABLE} WHERE id = ?`;

    try {
      await this.db.execute(query, [id]);
      console.log('Schedule deleted successfully');
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      throw error;
    }
  }

  async toggleSchedule(id: string, enabled: boolean): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      UPDATE ${SCHEDULES_TABLE}
      SET enabled = ?
      WHERE id = ?
    `;

    try {
      await this.db.execute(query, [enabled ? 1 : 0, id]);
      console.log('Schedule toggled successfully');
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
      throw error;
    }
  }
}

// Singleton instance
const dbService = new DatabaseService();

export const useSQLiteDatabase = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize database on mount
  useEffect(() => {
    const initDB = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await dbService.init();
        setIsInitialized(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to initialize database',
        );
        console.error('Database initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initDB();
  }, []);

  const insertMessage = useCallback(
    async (message: Message) => {
      if (!isInitialized) {
        throw new Error('Database not initialized');
      }
      await dbService.insertMessage(message);
    },
    [isInitialized],
  );

  const getMessages = useCallback(
    async (conversationId?: string) => {
      if (!isInitialized) {
        throw new Error('Database not initialized');
      }
      return await dbService.getMessages(conversationId);
    },
    [isInitialized],
  );

  const clearMessages = useCallback(
    async (conversationId?: string) => {
      if (!isInitialized) {
        throw new Error('Database not initialized');
      }
      await dbService.clearMessages(conversationId);
    },
    [isInitialized],
  );

  const getMessageCount = useCallback(
    async (conversationId?: string) => {
      if (!isInitialized) {
        throw new Error('Database not initialized');
      }
      return await dbService.getMessageCount(conversationId);
    },
    [isInitialized],
  );

  const deleteMessage = useCallback(
    async (id: string) => {
      if (!isInitialized) {
        throw new Error('Database not initialized');
      }
      await dbService.deleteMessage(id);
    },
    [isInitialized],
  );

  // Conversation management functions
  const createConversation = useCallback(
    async (title: string) => {
      if (!isInitialized) {
        throw new Error('Database not initialized');
      }
      return await dbService.createConversation(title);
    },
    [isInitialized],
  );

  const getConversations = useCallback(async () => {
    if (!isInitialized) {
      throw new Error('Database not initialized');
    }
    return await dbService.getConversations();
  }, [isInitialized]);

  const getConversation = useCallback(
    async (id: string) => {
      if (!isInitialized) {
        throw new Error('Database not initialized');
      }
      return await dbService.getConversation(id);
    },
    [isInitialized],
  );

  const updateConversationTitle = useCallback(
    async (id: string, title: string) => {
      if (!isInitialized) {
        throw new Error('Database not initialized');
      }
      await dbService.updateConversationTitle(id, title);
    },
    [isInitialized],
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      if (!isInitialized) {
        throw new Error('Database not initialized');
      }
      await dbService.deleteConversation(id);
    },
    [isInitialized],
  );

  // Schedule management functions
  const createSchedule = useCallback(
    async (schedule: Omit<Schedule, 'id' | 'createdAt'>) => {
      if (!isInitialized) {
        throw new Error('Database not initialized');
      }
      return await dbService.createSchedule(schedule);
    },
    [isInitialized],
  );

  const getSchedules = useCallback(async () => {
    if (!isInitialized) {
      throw new Error('Database not initialized');
    }
    return await dbService.getSchedules();
  }, [isInitialized]);

  const deleteSchedule = useCallback(
    async (id: string) => {
      if (!isInitialized) {
        throw new Error('Database not initialized');
      }
      await dbService.deleteSchedule(id);
    },
    [isInitialized],
  );

  const toggleSchedule = useCallback(
    async (id: string, enabled: boolean) => {
      if (!isInitialized) {
        throw new Error('Database not initialized');
      }
      await dbService.toggleSchedule(id, enabled);
    },
    [isInitialized],
  );

  return {
    isInitialized,
    isLoading,
    error,
    insertMessage,
    getMessages,
    clearMessages,
    getMessageCount,
    deleteMessage,
    // Conversation management
    createConversation,
    getConversations,
    getConversation,
    updateConversationTitle,
    deleteConversation,
    // Schedule management
    createSchedule,
    getSchedules,
    deleteSchedule,
    toggleSchedule,
  };
};

export default dbService;
