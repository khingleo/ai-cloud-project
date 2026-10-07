/**
 * MTN ENTERPRISE HUB - AI CHAT SERVICE
 *
 * Provider: NVIDIA NIM (integrate.api.nvidia.com) — SINGLE PROVIDER
 * Model: nvidia/nemotron-3.5-lightning-30b-a3b
 *
 * Authentication:
 *   VITE_NVIDIA_API_KEY from .env.local
 *
 * Features:
 *   - Streaming via Server-Sent Events (SSE)
 *   - Reasoning / thinking tokens (reasoning_content delta)
 *   - Bold markdown rendering in the UI
 *   - Non-streaming legacy compat wrapper
 */

function sanitizeKey(raw: string | undefined): string {
  if (!raw) return '';
  return String(raw).trim();
}

const ENV_NVIDIA = sanitizeKey(import.meta.env.VITE_NVIDIA_API_KEY);
const NVIDIA_API_KEY = ENV_NVIDIA;
const NVIDIA_PROXIED_PATH = '/api/nvidia/v1/chat/completions';
const NVIDIA_DIRECT_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_API_URL: string =
  typeof window !== 'undefined' && typeof window.location !== 'undefined'
    ? NVIDIA_PROXIED_PATH
    : NVIDIA_DIRECT_URL;
const NVIDIA_MODEL = 'nvidia/nemotron-3.5-lightning-30b-a3b';
const NVIDIA_MODEL_LABEL = 'NVIDIA · Nemotron 3.5 Lightning 30B';

export const AI_PROVIDERS = {
  NVIDIA: 'nvidia',
} as const;

export type AIProvider = typeof AI_PROVIDERS[keyof typeof AI_PROVIDERS];

export const AI_MODEL_LABELS: Record<AIProvider, string> = {
  [AI_PROVIDERS.NVIDIA]: NVIDIA_MODEL_LABEL,
};

export interface GroqMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GroqChatResponse {
  text: string;
  error?: string;
  provider: AIProvider;
  model: string;
}

const SYSTEM_PROMPT = `You are the MTN Ghana Enterprise AI Assistant — an embedded assistant inside the MTN Ghana Enterprise Hub (CRM/BI platform).
You serve Key Account Managers, Sales Agents, Presales Engineers, and Finance teams at MTN Ghana Enterprise.

---
CORE RULE — RESPONSE LENGTH MATCHES THE QUESTION. ALWAYS.
---
Match your output length and detail to what the user actually asked. Never dump the full product catalog, list of services, or generic capabilities unprompted.

EXACT BEHAVIOR BY QUESTION TYPE:
  A) GREETINGS / CASUAL ("hi", "hello", "yo", "good morning", "are you there?")
     -> Reply in 1-2 SHORT lines. Do NOT list products. Do NOT list services.
        Example:
        > "Hello 👋 MTN Enterprise AI Assistant here. How can I help you today?"

  B) SIMPLE DIRECT QUESTIONS (one factual ask, yes/no, single definition)
     -> Concise 1-3 bullet or 2-4 line answer. No extra scope.

  C) PRODUCT / PRICING QUESTIONS (e.g. "Tell me about DIA" / "price of SD-WAN")
     -> Structured: What it is, Use cases, SLA tier, GHS MRC range, OTC, Upsell/cross-sell note (1 item).
        Keep bullets tight — 5-8 max.

  D) WORKFLOW / PROCESS QUESTIONS (onboarding, approvals, TEF/TFR)
     -> Step-by-step in order with roles (Sales Ops → Credit → QA → CENO → DCLM → Service Delivery).

  E) BROAD "HOW CAN YOU HELP / WHAT CAN YOU DO"
     -> 6-8 bullet summary of capabilities, NOT a catalog dump.

PRODUCTS YOU KNOW:
Dedicated Internet Access (DIA), SD-WAN, MPLS, Starlink/VSAT, Fiber Broadband, Hosted PBX/SIP Trunking, CUG + PostPaid Enterprise SIMs, Microsoft 365, Cloud & Colocation, Security/Firewall, Bulk SMS/USSD, WebWiz, Chenosis API.

PRICING / SLA RULES (quote in GHS Ghana Cedis):
- MRC = Monthly Recurring Charge, OTC = One-Time Charge
- SLA Tiers: Platinum 99.9% (DIA Fiber primary), Gold 99.5% (DIA/SD-WAN), Silver 99.0% (Broadband/VSAT backup).

COMPLIANCE DOCUMENTS ALWAYS REQUIRED FOR ENTERPRISE ONBOARDING:
RGD Registration, TIN Certificate, GhanaPost GPS Address, Signed KYC Form, Authorized Signatory ID.

TONE: Professional, decisive, action-oriented. Use bullet points for lists. Never show or refer to your thinking process. Never tell the user you are following steps or analyzing the input.`;

export function getActiveProviderInfo(): { provider: AIProvider; label: string; model: string } {
  return {
    provider: AI_PROVIDERS.NVIDIA,
    label: NVIDIA_MODEL_LABEL,
    model: NVIDIA_MODEL,
  };
}

function buildBody(messages: GroqMessage[], stream: boolean): string {
  return JSON.stringify({
    model: NVIDIA_MODEL,
    messages: [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages,
    ],
    temperature: 0.6,
    top_p: 0.9,
    max_tokens: 2048,
    reasoning_budget: 512,
    chat_template_kwargs: { enable_thinking: false },
    stream,
  });
}

const BASE_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
};

function getHeaders(): Record<string, string> {
  return {
    ...BASE_HEADERS,
    'Authorization': `Bearer ${NVIDIA_API_KEY}`,
  };
}

/**
 * Non-streaming API — kept for backward compatibility.
 */
export async function callGroqAI(conversationHistory: GroqMessage[]): Promise<GroqChatResponse> {
  if (!NVIDIA_API_KEY || NVIDIA_API_KEY.length < 6) {
    return {
      text: '',
      error: 'AI service error: NVIDIA API key is empty or invalid.',
      provider: AI_PROVIDERS.NVIDIA,
      model: NVIDIA_MODEL,
    };
  }

  try {
    const res = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: buildBody(conversationHistory, false),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = (data as any)?.error?.message || `API error ${res.status}`;
      return { text: '', error: msg, provider: AI_PROVIDERS.NVIDIA, model: NVIDIA_MODEL };
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? '';
    return { text: content, provider: AI_PROVIDERS.NVIDIA, model: NVIDIA_MODEL };
  } catch (err: any) {
    return {
      text: '',
      error: err?.message || 'Network error — could not reach NVIDIA API. Check your internet connection.',
      provider: AI_PROVIDERS.NVIDIA,
      model: NVIDIA_MODEL,
    };
  }
}

/**
 * Streaming API — preferred for chat UI.
 * Emits provider → reasoning/content deltas → complete/error events via async generator.
 */
export async function* callGroqAIStreaming(
  conversationHistory: GroqMessage[],
): AsyncGenerator<
  | { type: 'provider'; provider: AIProvider; label: string; model: string }
  | { type: 'content'; delta: string }
  | { type: 'reasoning'; delta: string }
  | { type: 'complete'; text: string; reasoning: string; provider: AIProvider; model: string }
  | { type: 'error'; error: string; provider: AIProvider; model: string }
> {
  if (!NVIDIA_API_KEY || NVIDIA_API_KEY.length < 6) {
    yield {
      type: 'error',
      error: 'AI service error: NVIDIA API key is empty or invalid.',
      provider: AI_PROVIDERS.NVIDIA,
      model: NVIDIA_MODEL,
    };
    return;
  }

  yield {
    type: 'provider',
    provider: AI_PROVIDERS.NVIDIA,
    label: NVIDIA_MODEL_LABEL,
    model: NVIDIA_MODEL,
  };

  try {
    const res = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: buildBody(conversationHistory, true),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = (data as any)?.error?.message || `API error ${res.status}`;
      yield { type: 'error', error: msg, provider: AI_PROVIDERS.NVIDIA, model: NVIDIA_MODEL };
      return;
    }

    if (!res.body) {
      const fallback = await res.json().catch(() => ({}));
      const content = fallback?.choices?.[0]?.message?.content ?? '';
      if (content) yield { type: 'content', delta: content };
      yield { type: 'complete', text: content, reasoning: '', provider: AI_PROVIDERS.NVIDIA, model: NVIDIA_MODEL };
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullText = '';
    let fullReasoning = '';
    let done = false;

    while (!done) {
      const { value, done: rd } = await reader.read();
      done = rd;
      if (value) buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        if (line.startsWith('data:')) line = line.slice(5).trim();
        if (!line || line === '[DONE]') continue;
        let parsed: any = null;
        try { parsed = JSON.parse(line); } catch { continue; }
        const delta = parsed?.choices?.[0]?.delta;
        if (!delta) continue;
        const contentDelta = delta.content ?? '';
        const reasoningDelta = delta.reasoning_content ?? '';
        if (reasoningDelta) {
          fullReasoning += reasoningDelta;
        }
        if (contentDelta) {
          fullText += contentDelta;
          yield { type: 'content', delta: contentDelta };
        }
      }
    }

    if (buffer.trim()) {
      let line = buffer.trim();
      if (line.startsWith('data:')) line = line.slice(5).trim();
      if (line && line !== '[DONE]') {
        try {
          const parsed = JSON.parse(line);
          const delta = parsed?.choices?.[0]?.delta;
          if (delta) {
            const contentDelta = delta.content ?? '';
            const reasoningDelta = delta.reasoning_content ?? '';
            if (reasoningDelta) fullReasoning += reasoningDelta;
            if (contentDelta) { fullText += contentDelta; yield { type: 'content', delta: contentDelta }; }
          }
        } catch {}
      }
    }

    yield {
      type: 'complete',
      text: fullText,
      reasoning: fullReasoning,
      provider: AI_PROVIDERS.NVIDIA,
      model: NVIDIA_MODEL,
    };
  } catch (err: any) {
    yield {
      type: 'error',
      error: err?.message || 'Network error — could not reach NVIDIA API. Check your internet connection.',
      provider: AI_PROVIDERS.NVIDIA,
      model: NVIDIA_MODEL,
    };
  }
}
