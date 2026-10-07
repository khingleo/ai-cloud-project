/**
 * FLOATING AI ASSISTANT WIDGET
 *
 * Embeddable floating drawer widget accessible from any page.
 * Powered by NVIDIA NIM — real AI responses, no hardcoded scripts.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  RefreshCw,
  Zap,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { callGroqAIStreaming, getActiveProviderInfo } from '../../services/groqService';
import type { AIChatMessage } from '../../types';
import type { GroqMessage } from '../../services/groqService';

const QUICK_PROMPTS = [
  'How do I improve customer satisfaction?',
  'What are best practices for sales proposals?',
  'Explain SLA tiers',
  'Tips for onboarding new clients',
  'How do I track KPIs effectively?',
];

export const AIChatWidget: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerInfo, setProviderInfo] = useState(() => getActiveProviderInfo());

  const groqHistory = useRef<GroqMessage[]>([]);

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: `Hi there 👋 I'm your MTN Ghana Enterprise AI Assistant, powered by ${providerInfo.label}.\n\nAsk me anything — I give real answers, not pre-written scripts.`,
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const msgIdCounter = useRef(0);

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

    groqHistory.current.push({ role: 'user', content: text });

    const assistantId = `assistant-${++msgIdCounter.current}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        sender: 'assistant',
        text: '',
        timestamp: 'Just now',
      },
    ]);

    let currentText = '';
    let finalFullText = '';

    try {
      const stream = callGroqAIStreaming(groqHistory.current);
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
          throw new Error(ev.error || 'Unknown error');
        }
      }

      const finalText = finalFullText || currentText;
      groqHistory.current.push({ role: 'assistant', content: finalText });
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, text: finalText } : m)),
      );
      setIsTyping(false);
    } catch (e: any) {
      const errMsg = e?.message || 'Failed to get AI response.';
      setError(errMsg);
      groqHistory.current.pop();
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-slate-950 text-white rounded-full shadow-2xl border-2 border-mtn-yellow/60 hover:border-mtn-yellow hover:scale-105 transition-all duration-200 group"
          aria-label="Open AI Enterprise Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-mtn-yellow group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>
          <span className="text-xs font-bold font-heading hidden sm:inline">
            AI Assistant
          </span>
        </button>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 shadow-2xl rounded-3xl bg-white border border-slate-300 flex flex-col overflow-hidden ${
            isExpanded
              ? 'inset-4 sm:inset-10'
              : 'bottom-6 right-6 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-mtn-yellow text-slate-950 flex items-center justify-center font-bold shadow-mtn-glow">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  AI Assistant
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                    <Zap className="w-2 h-2" /> NVIDIA
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">{providerInfo.label} · Streaming</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="px-3 py-2 bg-rose-50 border-b border-rose-100 flex items-center gap-2 text-xs text-rose-700 shrink-0">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="flex-1 truncate">{error}</span>
              <button onClick={() => setError(null)} className="text-rose-400 font-bold">✕</button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-950 text-mtn-yellow flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-slate-950 text-white rounded-br-none shadow-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {/* Render **bold** markdown + strike reasoning line-break separator nicely */}
                  <div className="whitespace-pre-line space-y-1 prose-sm prose-slate max-w-none">
                    {msg.text.split('\n').map((line, idx) => {
                      if (line === '---') {
                        return <hr key={idx} className="my-2 border-slate-200" />;
                      }
                      const parts = line.split(/\*\*(.*?)\*\*/g);
                      return (
                        <p key={idx}>
                          {parts.map((part, pi) =>
                            pi % 2 === 1 ? (
                              <strong key={pi} className="font-bold">{part}</strong>
                            ) : (
                              <span key={pi}>{part}</span>
                            )
                          )}
                        </p>
                      );
                    })}
                  </div>

                  {msg.actionSuggestions && msg.actionSuggestions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {msg.actionSuggestions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => navigate(action.path)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-colors"
                        >
                          <span>{action.label}</span>
                          {action.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-200 rounded font-bold">
                              {action.badge}
                            </span>
                          )}
                          <ExternalLink className="w-3 h-3 text-amber-600" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-400 pl-9">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-mtn-yellow" />
                <span>AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                disabled={isTyping}
                className="whitespace-nowrap px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-slate-900 rounded-full transition-colors shrink-0 disabled:opacity-40"
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
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50 focus:bg-white transition-all"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="p-2.5 bg-mtn-yellow text-black rounded-xl hover:bg-mtn-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
