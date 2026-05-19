import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export default function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (isUser) {
    return (
      <div className="group flex justify-end">
        <div className="relative max-w-[85%] sm:max-w-[75%]">
          <div className="rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2.5 text-sm text-white shadow-lg shadow-indigo-900/20">
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="absolute -left-9 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-500 opacity-0 transition hover:bg-gray-800 hover:text-gray-300 group-hover:opacity-100"
            title="Copy message"
            aria-label="Copy message"
          >
            {copied ? (
              <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex justify-start">
      <div className="relative max-w-[85%] sm:max-w-[75%]">
        <span className="mb-1 block text-xs font-semibold text-indigo-400">Nexora</span>
        <div className="rounded-2xl rounded-bl-md bg-gray-800 px-4 py-3 text-gray-100 shadow-md">
          {message.content ? (
            <div className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    const inline = !match && !codeString.includes('\n');

                    if (inline) {
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }

                    return (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match?.[1] || 'text'}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          borderRadius: '0.75rem',
                          fontSize: '0.8rem',
                          padding: '1rem',
                        }}
                      >
                        {codeString}
                      </SyntaxHighlighter>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : isStreaming ? null : (
            <span className="text-gray-500">…</span>
          )}
          {isStreaming && message.content && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-indigo-400" />
          )}
        </div>
        {message.content && (
          <button
            type="button"
            onClick={handleCopy}
            className="absolute -right-9 top-8 rounded-md p-1.5 text-gray-500 opacity-0 transition hover:bg-gray-800 hover:text-gray-300 group-hover:opacity-100"
            title="Copy message"
            aria-label="Copy message"
          >
            {copied ? (
              <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
