import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RefreshCw, Zap, Coffee, Clock, Bot, User } from 'lucide-react';
import { ChatMessage } from '../types';

interface CoachChatProps {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onQuickAction: (actionText: string) => void;
}

const QUICK_ACTIONS = [
  { text: "Extend breaks by 10m", icon: <Coffee size={12} className="text-emerald-500" /> },
  { text: "Push schedule back 1hr", icon: <Clock size={12} className="text-amber-500" /> },
  { text: "Make afternoon high-focus", icon: <Zap size={12} className="text-indigo-500" /> },
];

export default function CoachChat({
  chatHistory,
  onSendMessage,
  isLoading,
  onQuickAction,
}: CoachChatProps) {
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom of the chat view when a new message arrives
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div id="coach-chat-container" className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      
      {/* Dynamic Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-sm">
              <Bot size={18} className="animate-pulse" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
          </div>
          <div>
            <h2 id="chat-title" className="font-sans font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              Coach Workspace
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Ask to customize schedule, add breaks, or request motivation</p>
          </div>
        </div>

        {isLoading && (
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/30">
            <RefreshCw size={10} className="animate-spin" /> Thinking...
          </span>
        )}
      </div>

      {/* Messages Viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[100px] bg-slate-50/20 dark:bg-slate-900/20">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 px-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Interactive Rescheduling</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-[240px] mt-1 leading-relaxed">
              Ask your coach adjustments like "Move my exercise to 8 PM" or "Make my morning focus sessions shorter."
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((msg) => {
              const isCoach = msg.sender === 'coach';
              return (
                <div
                  key={msg.id}
                  id={`chat-message-${msg.id}`}
                  className={`flex gap-3 items-start ${isCoach ? 'justify-start' : 'justify-end'}`}
                >
                  {isCoach && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                      <Bot size={14} />
                    </div>
                  )}

                  <div className="flex flex-col max-w-[82%]">
                    <div
                      className={`rounded-2xl p-3 text-xs md:text-sm leading-relaxed shadow-sm transition-all ${
                        isCoach
                           ? 'bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700/50'
                           : 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100 dark:shadow-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                    {/* Timestamp */}
                    <span className={`text-[9px] text-slate-400 dark:text-slate-500 mt-1 ${!isCoach ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp || 'Just now'}
                    </span>
                  </div>

                  {!isCoach && (
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 flex-shrink-0">
                      <User size={14} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Custom Animated Typing Indicator */}
            {isLoading && (
              <div className="flex gap-3 items-center justify-start animate-pulse">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                  <Bot size={14} />
                </div>
                <div className="bg-white dark:bg-slate-800 text-slate-400 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-200 dark:border-slate-700/50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Action Chips with enhanced contrast, brand colors, and borders - Horizontally scrollable on mobile to save vertical space */}
      <div className="px-4 pb-2 pt-2 flex flex-nowrap overflow-x-auto gap-2 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 scrollbar-none">
        {QUICK_ACTIONS.map((act) => (
          <button
            key={act.text}
            onClick={() => !isLoading && onQuickAction(act.text)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50/70 hover:bg-indigo-100/90 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-[11px] text-indigo-950 dark:text-indigo-200 font-extrabold rounded-full border border-indigo-200/60 dark:border-indigo-800/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer shadow-xs flex-shrink-0"
            disabled={isLoading}
          >
            {act.icon}
            {act.text}
          </button>
        ))}
      </div>

      {/* Input Form with modern floating action button */}
      <form onSubmit={handleSubmit} id="chat-input-form" className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2">
        <input
          id="chat-user-message-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach to optimize your day..."
          disabled={isLoading}
          className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs md:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-shadow disabled:opacity-60"
        />
        <button
          id="send-chat-message-btn"
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0 cursor-pointer shadow-sm active:scale-95"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
