import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { apiUrl } from '../config/api';
import type { Chat, Message } from '../types';
import { formatChatError } from '../utils/formatError';
import {
  generateId,
  loadChats,
  loadSystemPrompt,
  saveChats,
  saveSystemPrompt,
  DEFAULT_SYSTEM_PROMPT,
} from '../utils/storage';

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  isStreaming: boolean;
  error: string | null;
  systemPrompt: string;
}

type ChatAction =
  | { type: 'INIT'; chats: Chat[]; systemPrompt: string }
  | { type: 'SET_ACTIVE'; chatId: string }
  | { type: 'NEW_CHAT' }
  | { type: 'DELETE_CHAT'; chatId: string }
  | { type: 'ADD_USER_MESSAGE'; content: string }
  | { type: 'START_ASSISTANT_MESSAGE' }
  | { type: 'APPEND_ASSISTANT'; text: string }
  | { type: 'FINISH_STREAM' }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_STREAMING'; isStreaming: boolean }
  | { type: 'REMOVE_LAST_ASSISTANT' }
  | { type: 'SET_SYSTEM_PROMPT'; prompt: string }
  | { type: 'UPDATE_TITLE'; chatId: string; title: string }
  | { type: 'SET_CHAT_MESSAGES'; messages: Message[] };

function createEmptyChat(): Chat {
  return {
    id: generateId(),
    title: 'New chat',
    messages: [],
    createdAt: new Date(),
  };
}

function getActiveChat(state: ChatState): Chat | null {
  if (!state.activeChatId) return null;
  return state.chats.find((c) => c.id === state.activeChatId) ?? null;
}

function deriveTitle(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) return 'New chat';
  const text = firstUser.content.trim();
  return text.length > 40 ? `${text.slice(0, 40)}…` : text;
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        chats: action.chats,
        systemPrompt: action.systemPrompt,
        activeChatId: action.chats[0]?.id ?? null,
      };

    case 'SET_ACTIVE':
      return { ...state, activeChatId: action.chatId, error: null };

    case 'NEW_CHAT': {
      const chat = createEmptyChat();
      return {
        ...state,
        chats: [chat, ...state.chats],
        activeChatId: chat.id,
        error: null,
      };
    }

    case 'DELETE_CHAT': {
      const chats = state.chats.filter((c) => c.id !== action.chatId);
      const activeChatId =
        state.activeChatId === action.chatId
          ? chats[0]?.id ?? null
          : state.activeChatId;
      return { ...state, chats, activeChatId };
    }

    case 'ADD_USER_MESSAGE': {
      let chats = [...state.chats];
      let activeChatId = state.activeChatId;

      if (!activeChatId || !chats.find((c) => c.id === activeChatId)) {
        const chat = createEmptyChat();
        chats = [chat, ...chats];
        activeChatId = chat.id;
      }

      const message: Message = {
        id: generateId(),
        role: 'user',
        content: action.content,
        timestamp: new Date(),
      };

      chats = chats.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              messages: [...c.messages, message],
              title: c.messages.length === 0 ? deriveTitle([message]) : c.title,
            }
          : c
      );

      return { ...state, chats, activeChatId, error: null };
    }

    case 'START_ASSISTANT_MESSAGE': {
      const message: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      const chats = state.chats.map((c) =>
        c.id === state.activeChatId
          ? { ...c, messages: [...c.messages, message] }
          : c
      );

      return { ...state, chats, isStreaming: true };
    }

    case 'APPEND_ASSISTANT': {
      const chats = state.chats.map((c) => {
        if (c.id !== state.activeChatId) return c;
        const messages = [...c.messages];
        const last = messages[messages.length - 1];
        if (last?.role === 'assistant') {
          messages[messages.length - 1] = {
            ...last,
            content: last.content + action.text,
          };
        }
        return { ...c, messages };
      });
      return { ...state, chats };
    }

    case 'FINISH_STREAM':
      return { ...state, isStreaming: false };

    case 'SET_ERROR':
      return { ...state, error: action.error, isStreaming: false };

    case 'SET_STREAMING':
      return { ...state, isStreaming: action.isStreaming };

    case 'REMOVE_LAST_ASSISTANT': {
      const chats = state.chats.map((c) => {
        if (c.id !== state.activeChatId) return c;
        const messages = [...c.messages];
        if (messages[messages.length - 1]?.role === 'assistant') {
          messages.pop();
        }
        return { ...c, messages };
      });
      return { ...state, chats };
    }

    case 'SET_SYSTEM_PROMPT':
      saveSystemPrompt(action.prompt);
      return { ...state, systemPrompt: action.prompt };

    case 'UPDATE_TITLE':
      return {
        ...state,
        chats: state.chats.map((c) =>
          c.id === action.chatId ? { ...c, title: action.title } : c
        ),
      };

    case 'SET_CHAT_MESSAGES': {
      const chats = state.chats.map((c) =>
        c.id === state.activeChatId ? { ...c, messages: action.messages } : c
      );
      return { ...state, chats };
    }

    default:
      return state;
  }
}

const initialState: ChatState = {
  chats: [],
  activeChatId: null,
  isStreaming: false,
  error: null,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
};

function parseSSEChunk(buffer: string): { events: string[]; rest: string } {
  const parts = buffer.split('\n\n');
  const rest = parts.pop() ?? '';
  return { events: parts, rest };
}

export function useChat() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [isReady, setIsReady] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const chats = loadChats();
    const systemPrompt = loadSystemPrompt();
    if (chats.length === 0) {
      const chat = createEmptyChat();
      dispatch({ type: 'INIT', chats: [chat], systemPrompt });
    } else {
      dispatch({ type: 'INIT', chats, systemPrompt });
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    if (state.chats.length > 0) {
      saveChats(state.chats);
    }
  }, [state.chats]);

  const activeChat = getActiveChat(state);

  const streamChat = useCallback(
    async (messagesForApi: { role: 'user' | 'assistant'; content: string }[]) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      dispatch({ type: 'SET_ERROR', error: null });
      dispatch({ type: 'START_ASSISTANT_MESSAGE' });

      try {
        const response = await fetch(apiUrl('/api/chat'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messagesForApi,
            systemPrompt: state.systemPrompt,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(
            (errBody as { error?: string }).error ||
              `Request failed (${response.status})`
          );
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const { events, rest } = parseSSEChunk(buffer);
          buffer = rest;

          for (const event of events) {
            const lines = event.split('\n');
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data) as {
                  text?: string;
                  error?: string;
                };
                if (parsed.error) throw new Error(parsed.error);
                if (parsed.text) {
                  dispatch({ type: 'APPEND_ASSISTANT', text: parsed.text });
                }
              } catch (e) {
                if (e instanceof SyntaxError) continue;
                throw e;
              }
            }
          }
        }

        dispatch({ type: 'FINISH_STREAM' });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          dispatch({ type: 'FINISH_STREAM' });
          return;
        }
        const message = formatChatError(
          err instanceof Error ? err.message : 'Something went wrong'
        );
        dispatch({ type: 'SET_ERROR', error: message });
        dispatch({ type: 'REMOVE_LAST_ASSISTANT' });
      }
    },
    [state.systemPrompt]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || state.isStreaming) return;

      const chat = getActiveChat(state);
      const existingMessages = chat?.messages ?? [];
      const apiMessages = [
        ...existingMessages,
        { role: 'user' as const, content: trimmed },
      ].map((m) => ({ role: m.role, content: m.content }));

      dispatch({ type: 'ADD_USER_MESSAGE', content: trimmed });
      await streamChat(apiMessages);
    },
    [state, streamChat]
  );

  const regenerate = useCallback(async () => {
    if (!activeChat || state.isStreaming) return;

    const messages = [...activeChat.messages];
    while (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      messages.pop();
    }

    if (messages.length === 0) return;

    const apiMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    dispatch({ type: 'SET_CHAT_MESSAGES', messages });
    await streamChat(apiMessages);
  }, [activeChat, state.isStreaming, streamChat]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: 'FINISH_STREAM' });
  }, []);

  const newChat = useCallback(() => dispatch({ type: 'NEW_CHAT' }), []);
  const selectChat = useCallback(
    (chatId: string) => dispatch({ type: 'SET_ACTIVE', chatId }),
    []
  );
  const deleteChat = useCallback(
    (chatId: string) => dispatch({ type: 'DELETE_CHAT', chatId }),
    []
  );
  const setSystemPrompt = useCallback(
    (prompt: string) => dispatch({ type: 'SET_SYSTEM_PROMPT', prompt }),
    []
  );
  const resetSystemPrompt = useCallback(
    () => dispatch({ type: 'SET_SYSTEM_PROMPT', prompt: DEFAULT_SYSTEM_PROMPT }),
    []
  );

  return {
    isReady,
    chats: state.chats,
    activeChat,
    activeChatId: state.activeChatId,
    isStreaming: state.isStreaming,
    error: state.error,
    systemPrompt: state.systemPrompt,
    sendMessage,
    regenerate,
    stopStreaming,
    newChat,
    selectChat,
    deleteChat,
    setSystemPrompt,
    resetSystemPrompt,
  };
}
