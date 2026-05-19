export function formatChatError(raw: string): string {
  if (
    raw.includes('model_decommissioned') ||
    raw.includes('no longer available')
  ) {
    return 'This Groq model is outdated. Set GROQ_MODEL=llama-3.1-8b-instant in nexora/.env and restart the server.';
  }
  if (
    raw.includes('Invalid API Key') ||
    raw.includes('invalid_api_key') ||
    raw.includes('GROQ_API_KEY') ||
    raw.includes('placeholder')
  ) {
    return 'Invalid or missing Groq API key. Add GROQ_API_KEY to nexora/.env (starts with gsk_) — get one at https://console.groq.com/';
  }
  if (raw.includes('sk-ant-') || raw.includes('sk-proj-')) {
    return raw;
  }

  const jsonStart = raw.indexOf('{');
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(raw.slice(jsonStart)) as {
        error?: { message?: string } | string;
        message?: string;
      };
      const nested =
        typeof parsed.error === 'object' && parsed.error?.message
          ? parsed.error.message
          : typeof parsed.error === 'string'
            ? parsed.error
            : parsed.message;
      if (nested) return formatChatError(nested);
    } catch {
      /* fall through */
    }
  }

  return raw.length > 280 ? `${raw.slice(0, 280)}…` : raw;
}
