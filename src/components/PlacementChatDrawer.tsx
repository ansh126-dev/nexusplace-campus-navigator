import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bot,
  Send,
  X,
  RotateCcw,
  Sparkles,
  Square,
  AlertCircle,
  Compass,
  Mic,
  FileText,
} from 'lucide-react';
import { ChatMessage, ChatRoleMode, WorkspaceTab } from '../types/placement';
import { SPRING_DRAWER, SPRING_SNAPPY, EASE_OUT_EXPO } from './MotionPrimitives';

export interface ChatStudentContext {
  name: string;
  branch: string;
  batchYear: number;
  cgpa: number;
  activeBacklogs: number;
  skills: string[];
  eligibleCount: number;
  totalDrives: number;
  prepPercent: number;
  applicationsSummary: string[];
  upcomingDeadlinesSummary: string[];
}

interface PlacementChatDrawerProps {
  open: boolean;
  messages: ChatMessage[];
  roleMode: ChatRoleMode;
  studentContext: ChatStudentContext;
  pendingPrompt: string | null;
  onConsumePendingPrompt: () => void;
  onChangeRoleMode: (mode: ChatRoleMode) => void;
  onUpdateMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  onClearHistory: () => void;
  onNavigateTab?: (tab: WorkspaceTab) => void;
  onClose: () => void;
}

const ROLE_OPTIONS: Array<{
  id: ChatRoleMode;
  label: string;
  description: string;
  icon: typeof Compass;
  prompts: string[];
}> = [
  {
    id: 'placement_advisor',
    label: 'Placement Advisor',
    description: 'Drive prioritization, eligibility strategy & deadline planning.',
    icon: Compass,
    prompts: [
      'Find opportunities for my branch.',
      'Help me prepare for placements.',
      'Explain company eligibility.',
      'Create a placement preparation plan.',
      'Suggest skills for software roles.',
    ],
  },
  {
    id: 'mock_interviewer',
    label: 'Mock Interviewer',
    description: 'Interactive technical DSA, CS core & behavioral STAR rounds.',
    icon: Mic,
    prompts: [
      'Start a mock technical interview for Google SDE-1.',
      'Ask me a behavioral STAR question for an HR & Managerial round.',
      'Quiz me on OS & DBMS fundamentals with follow-ups.',
    ],
  },
  {
    id: 'resume_coach',
    label: 'Resume & OA Coach',
    description: 'Skill-gap analysis, resume bullet tuning & OA revision plans.',
    icon: FileText,
    prompts: [
      'What skill gaps should I close for Microsoft and NVIDIA?',
      'Help me rewrite a backend project bullet with measurable impact.',
      'Build a 5-day OA prep plan around my remaining checklist topics.',
    ],
  },
];

function formatInlineSegments(text: string): Array<{ type: 'text' | 'bold' | 'code'; value: string }> {
  const tokens: Array<{ type: 'text' | 'bold' | 'code'; value: string }> = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    const segment = match[0];
    if (segment.startsWith('**') && segment.endsWith('**')) {
      tokens.push({ type: 'bold', value: segment.slice(2, -2) });
    } else if (segment.startsWith('`') && segment.endsWith('`')) {
      tokens.push({ type: 'code', value: segment.slice(1, -1) });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return tokens;
}

function FormattedMessageBody({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 text-[13.5px] leading-relaxed break-words">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        const isBullet = /^[-*•]\s+/.test(trimmed);
        const isNumbered = /^\d+\.\s+/.test(trimmed);
        const cleanLine = isBullet
          ? trimmed.replace(/^[-*•]\s+/, '')
          : trimmed;

        const segments = formatInlineSegments(cleanLine);

        const rendered = segments.map((seg, sIdx) => {
          if (seg.type === 'bold') {
            return (
              <strong key={sIdx} className="font-semibold text-[#181A1F]">
                {seg.value}
              </strong>
            );
          }
          if (seg.type === 'code') {
            return (
              <code
                key={sIdx}
                className="px-1.5 py-0.5 rounded bg-[#F3EFE8] text-[#0D5C63] font-mono text-[12px]"
              >
                {seg.value}
              </code>
            );
          }
          return <span key={sIdx}>{seg.value}</span>;
        });

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#0D5C63] shrink-0" />
              <span>{rendered}</span>
            </div>
          );
        }

        if (isNumbered) {
          return (
            <p key={idx} className="pl-1">
              {rendered}
            </p>
          );
        }

        return <p key={idx}>{rendered}</p>;
      })}
    </div>
  );
}

function formatNowTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function PlacementChatDrawer({
  open,
  messages,
  roleMode,
  studentContext,
  pendingPrompt,
  onConsumePendingPrompt,
  onChangeRoleMode,
  onUpdateMessages,
  onClearHistory,
  onNavigateTab,
  onClose,
}: PlacementChatDrawerProps) {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);

  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);
  messagesRef.current = messages;

  const activeRole =
    ROLE_OPTIONS.find((r) => r.id === roleMode) ?? ROLE_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        if (threadRef.current) {
          threadRef.current.scrollTop = threadRef.current.scrollHeight;
        }
      }, 120);
    }
  }, [open]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const sendPrompt = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isStreaming) return;

    setErrorBanner(null);
    setLastFailedPrompt(null);
    setInput('');

    const priorHistory = messagesRef.current
      .filter((m) => !m.isError && m.text.trim().length > 0)
      .map((m) => ({ role: m.role, text: m.text }));

    const userMsg: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: formatNowTime(),
      roleMode,
    };

    const assistantMsgId = `msg-a-${Date.now() + 1}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantMsgId,
      role: 'model',
      text: '',
      timestamp: formatNowTime(),
      roleMode,
    };

    onUpdateMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: trimmed,
          history: priorHistory,
          roleMode,
          studentContext,
        }),
      });

      const contentType = response.headers.get('content-type') ?? '';
      if (!response.ok) {
        let errMessage = `Request failed (${response.status})`;
        if (contentType.includes('application/json')) {
          const data = (await response.json()) as { error?: string };
          if (data.error) errMessage = data.error;
        }
        throw new Error(errMessage);
      }

      if (!response.body) {
        throw new Error('Streaming response body unavailable.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamError: string | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const evt of events) {
          const dataLines = evt
            .split('\n')
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trim());

          for (const jsonLine of dataLines) {
            if (!jsonLine) continue;
            try {
              const parsed = JSON.parse(jsonLine) as {
                text?: string;
                done?: boolean;
                error?: string;
              };
              if (parsed.error) {
                streamError = parsed.error;
                break;
              }
              if (parsed.text) {
                onUpdateMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, text: m.text + parsed.text }
                      : m
                  )
                );
              }
            } catch {
              // Ignore partial chunk framing
            }
          }
          if (streamError) break;
        }

        if (streamError) {
          throw new Error(streamError);
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        onUpdateMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId && m.text.trim() === ''
              ? { ...m, text: 'Response stopped.' }
              : m
          )
        );
      } else {
        const message =
          err instanceof Error ? err.message : 'Unable to reach Placement AI.';
        setErrorBanner(message);
        setLastFailedPrompt(trimmed);
        onUpdateMessages((prev) =>
          prev.filter((m) => !(m.id === assistantMsgId && m.text.trim() === ''))
        );
      }
    } finally {
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    if (open && pendingPrompt && !isStreaming) {
      const promptToSend = pendingPrompt;
      onConsumePendingPrompt();
      void sendPrompt(promptToSend);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pendingPrompt]);

  const handleStop = () => {
    abortControllerRef.current?.abort();
  };

  const handleClear = () => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
    }
    setErrorBanner(null);
    setLastFailedPrompt(null);
    onClearHistory();
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="NexusPlace Placement AI Assistant"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#181A1F]/25 backdrop-blur-[2px]"
          />

          {/* Slide-over Chat Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={SPRING_DRAWER}
            className="relative z-10 w-full max-w-lg bg-[#FAF8F5] h-full shadow-2xl border-l border-[#E8E3DA] flex flex-col"
          >
            {/* Header */}
            <div className="bg-white border-b border-[#E8E3DA] px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#EAF3F3] text-[#0D5C63] flex items-center justify-center shrink-0">
                    <Bot strokeWidth={1.75} className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-base font-bold text-[#181A1F] truncate">
                        NexusPlace AI Coach
                      </h2>
                      <span className="text-[11px] font-mono text-[#0D5C63] font-medium">
                        · Gemini
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {studentContext.name} · {studentContext.branch} ·{' '}
                      <span className="font-mono tabular-nums">
                        {studentContext.cgpa.toFixed(2)} CGPA
                      </span>{' '}
                      · {studentContext.eligibleCount}/{studentContext.totalDrives} eligible
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {messages.length > 0 && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={handleClear}
                      title="Start new conversation"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E8E3DA] bg-[#FAF8F5] text-xs font-medium text-slate-600 hover:text-[#181A1F] hover:bg-[#F3EFE8] transition-colors"
                    >
                      <RotateCcw strokeWidth={1.75} className="w-3.5 h-3.5" />
                      <span>New</span>
                    </motion.button>
                  )}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={onClose}
                    aria-label="Close AI Coach"
                    className="p-2 rounded-lg text-slate-400 hover:text-[#181A1F] hover:bg-[#FAF8F5] transition-colors"
                  >
                    <X strokeWidth={1.75} className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* System Instruction Role Switcher */}
              <div className="mt-3.5">
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA]">
                  {ROLE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const active = roleMode === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onChangeRoleMode(option.id)}
                        className={`relative px-2.5 py-2 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                          active
                            ? 'text-[#0D5C63]'
                            : 'text-slate-600 hover:text-[#181A1F]'
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="chat-role-pill"
                            transition={SPRING_SNAPPY}
                            className="absolute inset-0 rounded-lg bg-white border border-[#E8E3DA] shadow-[0_1px_2px_rgba(24,26,31,0.06)]"
                          />
                        )}
                        <Icon strokeWidth={1.75} className="relative z-10 w-3.5 h-3.5 shrink-0" />
                        <span className="relative z-10 truncate">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 mt-2 px-0.5">
                  <span className="font-medium text-slate-700">Role prompt:</span>{' '}
                  {activeRole.description}
                </p>
              </div>
            </div>

            {/* Scrollable Conversation Thread */}
            <div
              ref={threadRef}
              className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
            >
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                  className="bg-white border border-[#E8E3DA] rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F3F0FA] text-[#6D59A6] flex items-center justify-center shrink-0">
                      <Sparkles strokeWidth={1.75} className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-semibold text-[#181A1F]">
                        Ready in {activeRole.label} mode
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Ask anything about your {studentContext.eligibleCount} eligible campus
                        drives, deadlines, interview rounds, or practice a live mock question.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Try a prompt
                    </p>
                    {activeRole.prompts.map((prompt) => (
                      <motion.button
                        key={prompt}
                        type="button"
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => void sendPrompt(prompt)}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5]/70 hover:bg-white hover:border-[#0D5C63]/40 text-xs font-medium text-[#181A1F] transition-colors"
                      >
                        {prompt}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  const isPendingEmpty = !isUser && msg.text.length === 0 && isStreaming;
                  const msgRoleLabel =
                    ROLE_OPTIONS.find((r) => r.id === msg.roleMode)?.label ??
                    'Placement AI';

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                      className={`flex flex-col ${
                        isUser ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400">
                        <span className="font-medium text-slate-500">
                          {isUser ? studentContext.name.split(' ')[0] : msgRoleLabel}
                        </span>
                        <span>·</span>
                        <span className="tabular-nums">{msg.timestamp}</span>
                      </div>

                      <div
                        className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                          isUser
                            ? 'bg-[#0D5C63] text-white rounded-br-sm shadow-[0_2px_8px_rgba(13,92,99,0.2)]'
                            : 'bg-white border border-[#E8E3DA] text-[#181A1F] rounded-bl-sm shadow-[0_1px_2px_rgba(24,26,31,0.03)]'
                        }`}
                      >
                        {isPendingEmpty ? (
                          <div className="flex items-center gap-1.5 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0D5C63]/70 animate-bounce" />
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-[#0D5C63]/70 animate-bounce"
                              style={{ animationDelay: '0.15s' }}
                            />
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-[#0D5C63]/70 animate-bounce"
                              style={{ animationDelay: '0.3s' }}
                            />
                          </div>
                        ) : isUser ? (
                          <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">
                            {msg.text}
                          </p>
                        ) : (
                          <FormattedMessageBody text={msg.text} />
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}

              {errorBanner && (
                <div className="rounded-xl border border-[#C96D3B]/30 bg-[#FCF3EC] p-3.5 text-xs text-[#181A1F] flex items-start gap-2.5">
                  <AlertCircle strokeWidth={1.75} className="w-4 h-4 text-[#C96D3B] shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="font-medium text-[#181A1F]">{errorBanner}</p>
                    {lastFailedPrompt && (
                      <button
                        type="button"
                        onClick={() => void sendPrompt(lastFailedPrompt)}
                        className="font-semibold text-[#0D5C63] hover:underline"
                      >
                        Retry message
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggested Prompts & Workspace Actions */}
            <div className="bg-white border-t border-[#F0ECE4] px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto">
              {activeRole.prompts.slice(0, 3).map((quickPrompt) => (
                <button
                  key={quickPrompt}
                  type="button"
                  disabled={isStreaming}
                  onClick={() => void sendPrompt(quickPrompt)}
                  className="px-2.5 py-1 rounded-lg border border-[#E8E3DA] bg-[#FAF8F5] text-[11px] font-medium text-slate-700 hover:border-[#0D5C63]/40 hover:text-[#0D5C63] whitespace-nowrap shrink-0 transition-colors"
                >
                  {quickPrompt}
                </button>
              ))}
              {onNavigateTab && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateTab('skill-gap');
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded-lg border border-[#6D59A6]/25 bg-[#F3F0FA] text-[11px] font-semibold text-[#6D59A6] whitespace-nowrap shrink-0"
                  >
                    Skill Gap
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateTab('roadmap');
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded-lg border border-[#0D5C63]/25 bg-[#EAF3F3] text-[11px] font-semibold text-[#0D5C63] whitespace-nowrap shrink-0"
                  >
                    Roadmap
                  </button>
                </>
              )}
            </div>

            {/* Composer Footer */}
            <div className="bg-white border-t border-[#E8E3DA] p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendPrompt(input);
                }}
                className="flex items-end gap-2.5"
              >
                <textarea
                  ref={inputRef}
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void sendPrompt(input);
                    }
                  }}
                  placeholder={`Ask ${activeRole.label} anything...`}
                  aria-label="Message Placement AI Coach"
                  className="flex-1 resize-none rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#181A1F] placeholder:text-slate-400 focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
                />

                {isStreaming ? (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={handleStop}
                    aria-label="Stop generating"
                    className="h-11 px-3.5 rounded-xl bg-[#FCF3EC] border border-[#C96D3B]/30 text-[#C96D3B] text-xs font-semibold hover:bg-[#F9E7D8] transition-colors inline-flex items-center gap-1.5 shrink-0"
                  >
                    <Square strokeWidth={1.75} className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </motion.button>
                ) : (
                  <motion.button
                    type="submit"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!input.trim()}
                    aria-label="Send message"
                    className="h-11 px-4 rounded-xl bg-[#0D5C63] text-white text-xs font-semibold hover:bg-[#09454B] disabled:opacity-45 disabled:pointer-events-none transition-colors inline-flex items-center gap-1.5 shrink-0 shadow-[0_2px_6px_rgba(13,92,99,0.2)]"
                  >
                    <Send strokeWidth={1.75} className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </motion.button>
                )}
              </form>
              <p className="text-[10px] text-slate-400 mt-2">
                Press Enter to send · Shift+Enter for new line · Multi-turn session memory active
              </p>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
