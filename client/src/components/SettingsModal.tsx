import { useEffect, useState } from 'react';
import { DEFAULT_SYSTEM_PROMPT } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  systemPrompt: string;
  onClose: () => void;
  onSave: (prompt: string) => void;
  onReset: () => void;
}

export default function SettingsModal({
  isOpen,
  systemPrompt,
  onClose,
  onSave,
  onReset,
}: SettingsModalProps) {
  const [draft, setDraft] = useState(systemPrompt);

  useEffect(() => {
    if (isOpen) setDraft(systemPrompt);
  }, [isOpen, systemPrompt]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(draft.trim() || DEFAULT_SYSTEM_PROMPT);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="settings-title" className="text-lg font-semibold text-gray-100">
            System prompt
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            aria-label="Close settings"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="mb-3 text-sm text-gray-400">
          Customize how Nexora behaves. The default persona introduces Nexora as your AI assistant.
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={8}
          className="w-full resize-y rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-gray-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
          aria-label="System prompt"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              onReset();
              setDraft(DEFAULT_SYSTEM_PROMPT);
            }}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
          >
            Reset to default
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
