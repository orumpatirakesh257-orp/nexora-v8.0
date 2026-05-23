const PLACEHOLDER_KEYS = new Set([
  'your-groq-api-key-here',
  'your_groq_api_key_here',
  'changeme',
  'replace-me',
]);

/** Returns a user-facing error message, or null if the key looks valid. */
export function getGroqKeyError(apiKey: string | undefined): string | null {
  const key = apiKey?.trim();
  if (!key) {
    return 'GROQ_API_KEY is not set. Add your Groq key to nexora/.env (get one at https://console.groq.com/).';
  }
  if (PLACEHOLDER_KEYS.has(key.toLowerCase())) {
    return 'GROQ_API_KEY is still the placeholder. Replace it in nexora/.env with a real key from https://console.groq.com/ (starts with gsk_).';
  }
  if (key.startsWith('sk-ant-')) {
    return 'Wrong API key: sk-ant- is an Anthropic key. Set GROQ_API_KEY to a key from https://console.groq.com/ (starts with gsk_).';
  }
  if (key.startsWith('sk-proj-')) {
    return 'Wrong API key: sk-proj- is an OpenAI key. Set GROQ_API_KEY to a key from https://console.groq.com/ (starts with gsk_).';
  }
  if (!key.startsWith('gsk_')) {
    return 'Invalid Groq API key format. Keys must start with gsk_. Create one at https://console.groq.com/';
  }
  return null;
}

export function formatGroqApiError(raw: string): string {
  if (
    raw.includes('model_decommissioned') ||
    raw.includes('has been decommissioned')
  ) {
    return 'This Groq model is no longer available. Set GROQ_MODEL=llama-3.1-8b-instant in nexora/.env and restart the server.';
  }
  if (
    raw.includes('Invalid API Key') ||
    raw.includes('invalid_api_key') ||
    raw.includes('401')
  ) {
    return 'Invalid Groq API key. Check GROQ_API_KEY in nexora/.env — get one at https://console.groq.com/';
  }
  const jsonStart = raw.indexOf('{');
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(raw.slice(jsonStart)) as {
        error?: { message?: string };
      };
      if (parsed.error?.message) return formatGroqApiError(parsed.error.message);
    } catch {
      /* use raw */
    }
  }
  return raw;
}
