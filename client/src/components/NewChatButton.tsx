interface NewChatButtonProps {
  onClick: () => void;
  className?: string;
}

export default function NewChatButton({ onClick, className = '' }: NewChatButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2.5 text-sm font-medium text-gray-200 transition hover:border-indigo-500/50 hover:bg-gray-800 ${className}`}
    >
      <svg
        className="h-4 w-4 shrink-0 text-indigo-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      New chat
    </button>
  );
}
