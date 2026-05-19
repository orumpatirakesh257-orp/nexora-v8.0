const DEFAULT_PRODUCTION_API = 'https://nexora-v-8-0-production.up.railway.app';
const DEFAULT_DEV_API = 'http://localhost:3001';

/** Base URL without trailing slash, or null to use same-origin (Vite dev proxy). */
export function getApiBaseUrl(): string | null {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (import.meta.env.DEV) return null;

  return DEFAULT_PRODUCTION_API.replace(/\/$/, '');
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${normalized}` : normalized;
}

export function getApiDisplayUrl(): string {
  return getApiBaseUrl() ?? DEFAULT_DEV_API;
}
