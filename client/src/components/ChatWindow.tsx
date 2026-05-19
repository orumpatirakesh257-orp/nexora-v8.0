import { useEffect, useRef } from 'react';
import type { Chat } from '../types';
import MessageBubble from './MessageBubble';
import ThinkingIndicator from './ThinkingIndicator';

const SUGGESTED_PROMPTS = [
  'Explain quantum computing in simple terms',
  'Help me write a professional email',
  'What are 5 creative weekend project ideas?',
];

interface ChatWindowProps {
  chat: Chat | null;
  isStreaming: boolean;
  error: string | null;
  onSendPrompt: (prompt: string) => void;
  onRegenerate?: () => void;
  canRegenerate?: boolean;
}

export default function ChatWindow({
  chat,
  isStreaming,
  error,
  onSendPrompt,
  onRegenerate,
  canRegenerate,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = chat?.messages ?? [];
  const isEmpty = messages.length === 0;

  const lastMessage = messages[messages.length - 1];
  const showThinking =
    isStreaming &&
    (!lastMessage ||
      lastMessage.role !== 'assistant' ||
      lastMessage.content.length === 0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, showThinking]);

  if (isEmpty && !isStreaming) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-32">
        <h1 className="mb-2 text-5xl font-bold tracking-tight text-indigo-400 sm:text-6xl">
          Nexora
        </h1>
        <p className="mb-10 text-lg text-gray-400">Think deeper with Nexora</p>
        <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-1">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onSendPrompt(prompt)}
              className="rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3 text-left text-sm text-gray-300 transition hover:border-indigo-500/40 hover:bg-gray-800/80 hover:text-gray-100"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((message, index) => {
            const isLast = index === messages.length - 1;
            const streamingThis =
              isStreaming && isLast && message.role === 'assistant';

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isStreaming={streamingThis}
              />
            );
          })}
          {showThinking && <ThinkingIndicator />}
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}
          {canRegenerate && onRegenerate && !isStreaming && (
            <div className="flex justify-start pl-1">
              <button
                type="button"
                onClick={onRegenerate}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate response
              </button>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
