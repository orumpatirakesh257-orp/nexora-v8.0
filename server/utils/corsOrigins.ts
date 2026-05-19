const LOCAL_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
];

function parseOriginList(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function buildAllowedOrigins(port: number): Set<string> {
  const origins = new Set<string>([
    ...parseOriginList(process.env.CLIENT_URL),
    ...parseOriginList(process.env.CORS_ORIGINS),
    ...LOCAL_DEV_ORIGINS,
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,
  ]);

  return origins;
}

export function isOriginAllowed(origin: string, allowed: Set<string>): boolean {
  if (allowed.has(origin)) return true;

  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol !== 'http:' && protocol !== 'https:') return false;

    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;

    // Vercel production, preview, and branch deploys
    if (hostname.endsWith('.vercel.app')) return true;
  } catch {
    return false;
  }

  return false;
}
