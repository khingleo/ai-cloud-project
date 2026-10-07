import type { IncomingMessage, ServerResponse } from 'node:http';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';

interface ChatRequest extends IncomingMessage {
  body?: unknown;
}

function sendJson(res: ServerResponse, status: number, message: string) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: { message } }));
}

export default async function handler(req: ChatRequest, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, 'Method not allowed.');
    return;
  }

  const authorization = req.headers.authorization;
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    sendJson(res, 401, 'Sign in to use the AI assistant.');
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/+$/, '');
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
    || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('AI proxy is missing Supabase authentication configuration.');
    sendJson(res, 500, 'The AI service is not configured correctly.');
    return;
  }

  if (!openaiKey) {
    console.error('AI proxy is missing OPENAI_API_KEY.');
    sendJson(res, 503, 'The AI assistant is not configured yet.');
    return;
  }

  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!authResponse.ok) {
      sendJson(res, 401, 'Your session is invalid or expired. Sign in again.');
      return;
    }

    const payload = req.body;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      sendJson(res, 400, 'A valid chat request is required.');
      return;
    }

    const requestBody = payload as Record<string, unknown>;
    const messages = requestBody.messages;
    if (
      !Array.isArray(messages)
      || messages.length === 0
      || messages.some((message) =>
        !message
        || typeof message !== 'object'
        || !['system', 'user', 'assistant'].includes(String(message.role))
        || typeof message.content !== 'string'
      )
    ) {
      sendJson(res, 400, 'The chat messages are invalid.');
      return;
    }

    const upstream = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({ ...requestBody, model: OPENAI_MODEL }),
    });

    if (!upstream.ok) {
      const errorBody = await upstream.text();
      res.statusCode = upstream.status;
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
      res.end(errorBody);
      return;
    }

    res.statusCode = upstream.status;
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');

    if (!upstream.body) {
      res.end();
      return;
    }

    for await (const chunk of upstream.body) {
      if (!res.write(chunk)) {
        await new Promise<void>((resolve, reject) => {
          res.once('drain', resolve);
          res.once('error', reject);
        });
      }
    }
    res.end();
  } catch (error) {
    console.error('AI proxy request failed:', error);
    if (res.headersSent) {
      res.destroy(error instanceof Error ? error : undefined);
      return;
    }
    sendJson(res, 502, 'The AI service could not complete your request.');
  }
}
