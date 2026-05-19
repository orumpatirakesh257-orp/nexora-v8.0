export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950">
      <h1 className="mb-3 text-4xl font-bold text-indigo-400">Nexora</h1>
      <p className="mb-8 text-gray-400">Think deeper with Nexora</p>
      <div className="flex gap-1.5" aria-label="Loading">
        <span
          className="h-2 w-2 rounded-full bg-indigo-500 animate-thinking-dot"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="h-2 w-2 rounded-full bg-indigo-500 animate-thinking-dot"
          style={{ animationDelay: '160ms' }}
        />
        <span
          className="h-2 w-2 rounded-full bg-indigo-500 animate-thinking-dot"
          style={{ animationDelay: '320ms' }}
        />
      </div>
    </div>
  );
}
