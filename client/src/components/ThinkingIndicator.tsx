export default function ThinkingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] sm:max-w-[75%]">
        <span className="mb-1 block text-xs font-semibold text-indigo-400">Nexora</span>
        <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md bg-gray-800 px-4 py-3 text-sm text-gray-400">
          <span>Nexora is thinking</span>
          <span className="flex gap-1" aria-hidden>
            <span
              className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-thinking-dot"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-thinking-dot"
              style={{ animationDelay: '160ms' }}
            />
            <span
              className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-thinking-dot"
              style={{ animationDelay: '320ms' }}
            />
          </span>
        </div>
      </div>
    </div>
  );
}
