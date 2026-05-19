import type { Chat, StoredChat } from '../types';

const STORAGE_KEY = 'nexora-chats';
const SYSTEM_PROMPT_KEY = 'nexora-system-prompt';

export const DEFAULT_SYSTEM_PROMPT = `You are Nexora, a highly intelligent and helpful AI assistant. 
You are thoughtful, concise, and friendly. 
When greeting users for the first time, introduce yourself as Nexora.
Always aim to give clear, accurate, and well-structured responses.`;

export function loadChats(): Chat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredChat[];
    return parsed.map((c) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      messages: c.messages.map((m) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    }));
  } catch {
    return [];
  }
}

export function saveChats(chats: Chat[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

export function loadSystemPrompt(): string {
  return localStorage.getItem(SYSTEM_PROMPT_KEY) || DEFAULT_SYSTEM_PROMPT;
}

export function saveSystemPrompt(prompt: string) {
  localStorage.setItem(SYSTEM_PROMPT_KEY, prompt);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
