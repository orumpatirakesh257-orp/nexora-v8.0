import { useState } from 'react';
import ChatWindow from './components/ChatWindow';
import LoadingScreen from './components/LoadingScreen';
import MessageInput from './components/MessageInput';
import SettingsModal from './components/SettingsModal';
import Sidebar from './components/Sidebar';
import { useChat } from './hooks/useChat';

export default function App() {
  const {
    isReady,
    chats,
    activeChat,
    activeChatId,
    isStreaming,
    error,
    systemPrompt,
    sendMessage,
    regenerate,
    stopStreaming,
    newChat,
    selectChat,
    deleteChat,
    setSystemPrompt,
    resetSystemPrompt,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!isReady) {
    return <LoadingScreen />;
  }

  const lastMessage = activeChat?.messages[activeChat.messages.length - 1];
  const canRegenerate =
    !!lastMessage &&
    lastMessage.role === 'assistant' &&
    (activeChat?.messages.some((m) => m.role === 'user') ?? false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={() => {
          newChat();
          setSidebarOpen(false);
        }}
        onSelectChat={selectChat}
        onDeleteChat={deleteChat}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-gray-800 bg-gray-900/80 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-800"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-indigo-400">Nexora</span>
        </header>

        <ChatWindow
          chat={activeChat}
          isStreaming={isStreaming}
          error={error}
          onSendPrompt={sendMessage}
          onRegenerate={regenerate}
          canRegenerate={canRegenerate}
        />

        <MessageInput
          onSend={sendMessage}
          onStop={stopStreaming}
          disabled={isStreaming}
          isStreaming={isStreaming}
        />
      </main>

      <SettingsModal
        isOpen={settingsOpen}
        systemPrompt={systemPrompt}
        onClose={() => setSettingsOpen(false)}
        onSave={setSystemPrompt}
        onReset={resetSystemPrompt}
      />
    </div>
  );
}
