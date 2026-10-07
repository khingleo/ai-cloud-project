/**
 * AI ASSISTANT PAGE
 *
 * Route: /ai-assistant
 * Full-page conversational AI interface powered by OpenAI (GPT-4o-mini).
 * Gives real, generic AI responses — no hardcoded scripts.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  RefreshCw,
  Zap,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { callGroqAIStreaming, getActiveProviderInfo } from '../services/groqService';
import type { AIChatMessage } from '../types';
import type { GroqMessage } from '../services/groqService';

const SUGGESTED_PROMPTS = [
  'Summarize the key metrics I should track for enterprise clients',
  'What are best practices for customer onboarding?',
  'How do I structure a proposal for a large business?',
  'Explain the difference between SLA tiers',
  'What questions should I ask a new potential customer?',
  'How can I improve customer retention?',
  'Give me tips for presenting a pricing proposal',
];

export const AIAssistantPage: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerInfo, setProviderInfo] = useState(() => getActiveProviderInfo());

  const conversationHistory = useRef<GroqMessage[]>([]);

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Hello 👋 I'm your MTN Ghana Enterprise AI Assistant, powered by ${providerInfo.label}.\n\nAsk me anything — I'll stream real AI answers as they are generated.`,
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgIdCounter = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isTyping) return;

    setError(null);

    const userMsg: AIChatMessage = {
      id: `user-${++msgIdCounter.current}`,
      sender: 'user',
      text,
      timestamp: 'Just now',
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    conversationHistory.current.push({ role: 'user', content: text });

    const assistantId = `assistant-${++msgIdCounter.current}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantId, sender: 'assistant', text: '', timestamp: 'Just now' },
    ]);

    let currentText = '';
    let finalFullText = '';

    try {
      const stream = callGroqAIStreaming(conversationHistory.current);
      for await (const ev of stream) {
        if (ev.type === 'provider') {
          setProviderInfo({ provider: ev.provider, label: ev.label, model: ev.model });
        } else if (ev.type === 'content') {
          currentText += ev.delta;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, text: currentText } : m,
            ),
          );
        } else if (ev.type === 'complete') {
          finalFullText = ev.text;
        } else if (ev.type === 'error') {
          throw new Error(ev.error || 'Unknown AI error');
        }
      }
      const finalText = finalFullText || currentText;
      conversationHistory.current.push({ role: 'assistant', content: finalText });
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, text: finalText } : m)),
      );
      setIsTyping(false);
    } catch (e: any) {
      const errMsg = e?.message || 'Failed to get AI response.';
      setError(`AI Error: ${errMsg}`);
      conversationHistory.current.pop();
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    conversationHistory.current = [];
    setError(null);
    setMessages([
      {
        id: `msg-welcome-${Date.now()}`,
        sender: 'assistant',
        text: 'Chat cleared. How can I help you?',
        timestamp: 'Just now',
      },
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="AI Assistant"
        subtitle={`Powered by ${providerInfo.label} · Streaming live responses`}
        breadcrumbs={[{ label: 'AI Assistant' }]}
      />

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[74vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-mtn-yellow text-black flex items-center justify-center font-black shadow-mtn-glow">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-heading">
                AI Assistant
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" /> Live — NVIDIA
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {providerInfo.label} · MTN Enterprise Context · Streaming
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <Bot className="w-4 h-4 text-mtn-yellow" />
              <span>Nemotron 3.5 · NVIDIA</span>
            </div>
            <button
              onClick={handleClearChat}
              title="Clear conversation"
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="px-4 py-2.5 bg-rose-50 border-b border-rose-100 flex items-center gap-2 text-xs text-rose-700 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-rose-400 hover:text-rose-700 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${msg.sender === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-slate-950 text-mtn-yellow flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                  AI
                </div>
              )}

              <div
                className={`rounded-3xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-br-none shadow-sm'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                }`}
              >
                <div className="whitespace-pre-line space-y-1.5">
                  {msg.text.split('\n').map((line, idx) => {
                    if (line === '---') return <hr key={idx} className="my-2 border-slate-200" />;
                    const parts = line.split(/\*\*(.*?)\*\*/g);
                    return (
                      <p key={idx}>
                        {parts.map((part, pi) =>
                          pi % 2 === 1 ? (
                            <strong key={pi} className="font-bold">
                              {part}
                            </strong>
                          ) : (
                            <span key={pi}>{part}</span>
                          )
                        )}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-3 text-xs text-slate-500 pl-11">
              <RefreshCw className="w-4 h-4 animate-spin text-mtn-yellow" />
              <span>AI is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">Try asking:</span>
          {SUGGESTED_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              disabled={isTyping}
              className="whitespace-nowrap px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-slate-900 rounded-xl transition-colors shrink-0 disabled:opacity-40"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-4 bg-white border-t border-slate-200 flex items-center gap-3 shrink-0"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50 focus:bg-white transition-all"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="p-3 bg-mtn-yellow hover:bg-mtn-yellow-400 text-black font-bold rounded-2xl shadow-mtn-glow disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
