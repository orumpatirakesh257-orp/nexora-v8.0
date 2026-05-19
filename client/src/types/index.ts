export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export interface StoredChat extends Omit<Chat, 'createdAt' | 'messages'> {
  createdAt: string;
  messages: StoredMessage[];
}

export interface StoredMessage extends Omit<Message, 'timestamp'> {
  timestamp: string;
}
