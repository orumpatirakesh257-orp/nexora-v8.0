import Groq from 'groq-sdk';
import { Router, type Request, type Response } from 'express';
import { formatGroqApiError, getGroqKeyError } from '../utils/apiKey.js';

const router = Router();

const NEXORA_SYSTEM_PROMPT =
  'You are Nexora, a highly intelligent and helpful AI assistant. You are thoughtful, concise, and friendly. Always introduce yourself as Nexora.';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  model?: string;
  systemPrompt?: string;
}

function setupSSE(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
}

function sendSSE(res: Response, data: unknown) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function sendError(res: Response, message: string, status = 500) {
  if (!res.headersSent) {
    res.status(status).json({ error: message });
    return;
  }
  sendSSE(res, { error: message });
  res.write('data: [DONE]\n\n');
  res.end();
}

async function streamGroq(
  res: Response,
  messages: ChatMessage[],
  systemPrompt: string
) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  const keyError = getGroqKeyError(apiKey);
  if (keyError) {
    sendError(res, keyError, 401);
    return;
  }

  const client = new Groq({ apiKey: apiKey! });
  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

  setupSSE(res);

  try {
    const stream = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      stream: true,
      max_tokens: 1024,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        sendSSE(res, { text });
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Groq API error';
    const message = formatGroqApiError(raw);
    console.error('Groq stream error:', message);
    const status =
      raw.includes('Invalid API Key') ||
      raw.includes('invalid_api_key') ||
      raw.includes('401') ||
      raw.includes('403')
        ? 401
        : 500;
    if (!res.headersSent) {
      sendError(res, message, status);
    } else {
      sendSSE(res, { error: message });
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
}

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const body = req.body as ChatRequestBody;
    const { messages, systemPrompt } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    const validMessages = messages.filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string'
    );

    if (validMessages.length === 0) {
      res.status(400).json({ error: 'No valid messages provided' });
      return;
    }

    const prompt = systemPrompt?.trim() || NEXORA_SYSTEM_PROMPT;
    await streamGroq(res, validMessages, prompt);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Chat request failed';
    console.error('Chat route error:', message);
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  }
});

export default router;
