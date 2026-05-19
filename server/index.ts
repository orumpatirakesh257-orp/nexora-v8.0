import { existsSync } from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import chatRouter from './routes/chat.js';
import { getGroqKeyError } from './utils/apiKey.js';Y
import { getClientDistPath, getEnvPath } from './utils/paths.js';

dotenv.config({ path: getEnvPath(), override: true });

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const clientDist = getClientDistPath();
const servesFrontend = existsSync(path.join(clientDist, 'index.html'));

const defaultClientUrl = servesFrontend
  ? `http://localhost:${PORT}`
  : 'http://localhost:5173';
const CLIENT_URL = process.env.CLIENT_URL || defaultClientUrl;

const corsOrigins = new Set<string>([
  CLIENT_URL,
  `http://localhost:${PORT}`,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  `http://127.0.0.1:${PORT}`,
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  const keyError = getGroqKeyError(process.env.GROQ_API_KEY);
  res.json({
    status: 'ok',
    name: 'Nexora',
    provider: process.env.AI_PROVIDER || 'groq',
    model: GROQ_MODEL,
    apiKeyConfigured: !keyError,
    apiKeyError: keyError,
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
    `Client build not found at ${clientDist}. Run "npm run build" from the project root, or use "npm run dev" for development.`
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

app.listen(PORT, () => {
  const keyError = getGroqKeyError(process.env.GROQ_API_KEY);
  console.log(`Nexora server running on http://localhost:${PORT}`);
  console.log(`AI provider: Groq (${GROQ_MODEL})`);
  console.log(`Env file: ${getEnvPath()}`);
  if (servesFrontend) {
    console.log(`Serving UI from ${clientDist}`);
  }
  console.log(
    keyError ? `GROQ_API_KEY: ${keyError}` : 'GROQ_API_KEY: configured'
  );
});
