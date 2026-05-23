import { existsSync } from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import chatRouter from './routes/chat';
import { getGroqKeyError } from './utils/apiKey';
import { buildAllowedOrigins, isOriginAllowed } from './utils/corsOrigins';
import { getClientDistPath, getEnvPath } from './utils/paths';

dotenv.config({ path: getEnvPath(), override: true });

const app = express();
app.set('trust proxy', 1);

const PORT = Number(process.env.PORT) || 3001;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const clientDist = getClientDistPath();
const servesFrontend = existsSync(path.join(clientDist, 'index.html'));

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  const keyError = getGroqKeyError(process.env.GROQ_API_KEY);
  const tavilyApiKey = process.env.TAVILY_API_KEY?.trim();
  const tavilyKeyConfigured = Boolean(tavilyApiKey);

  res.json({
    status: 'ok',
    name: 'Nexora',
    provider: process.env.AI_PROVIDER || 'groq',
    model: GROQ_MODEL,
    apiKeyConfigured: !keyError,
    apiKeyError: keyError,
    tavilyApiKeyConfigured: tavilyKeyConfigured,
    tavilyApiKeyError: tavilyKeyConfigured ? null : 'TAVILY_API_KEY not configured',
    servesFrontend,
  });
});

app.use('/api', chatRouter);

if (servesFrontend) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      next();
      return;
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  console.warn(
    `Client build not found at ${clientDist}. API-only mode (frontend hosted separately).`
  );
}

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Unhandled error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
);

app.listen(PORT, '0.0.0.0', () => {
  const keyError = getGroqKeyError(process.env.GROQ_API_KEY);
  console.log(`Nexora server listening on port ${PORT}`);
  console.log(`AI provider: Groq (${GROQ_MODEL})`);
  console.log(`Env file: ${getEnvPath()}`);
  if (servesFrontend) {
    console.log(`Serving UI from ${clientDist}`);
  }
  console.log(
    keyError ? `GROQ_API_KEY: ${keyError}` : 'GROQ_API_KEY: configured'
  );
});
