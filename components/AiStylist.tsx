import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getStyleAdvice } from '../services/gemini';
import { Button } from './ui/Button';
import { MessageRole, ChatMessage } from '../types';
import { Sparkles, Send, X, MessageCircle } from 'lucide-react';

export const AiStylist: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: MessageRole.MODEL,
      text: "Hello! I'm your virtual style assistant. Need help matching colors or choosing an outfit for an event?"
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    // Focus the input when modal opens
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && chatWindowRef.current) {
        const focusableElements = chatWindowRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await getStyleAdvice(input);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        text: responseText
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 bg-stone-900 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-sage-500 hover:scale-105 transition-all z-50 group cursor-pointer"
          aria-label="Open AI Stylist"
        >
          <Sparkles className="group-hover:animate-pulse" size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          ref={chatWindowRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-title"
          className="fixed bottom-6 right-6 w-[90vw] md:w-[380px] h-[500px] bg-white rounded-xl shadow-2xl border border-stone-200 z-50 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300"
        >
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-stone-100 bg-sage-50 rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="bg-sage-200 p-1.5 rounded-full" aria-hidden="true">
                <Sparkles size={16} className="text-sage-700" />
              </div>
              <h3 id="chat-title" className="font-serif font-medium text-stone-900">AI Stylist</h3>
            </div>
            <button 
              ref={closeButtonRef}
              onClick={() => setIsOpen(false)}
              className="text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
              aria-label="Close chat"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50" role="log" aria-live="polite" aria-label="Chat messages">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm
                    ${msg.role === MessageRole.USER 
                      ? 'bg-stone-900 text-white rounded-tr-none' 
                      : 'bg-white text-stone-700 border border-stone-100 rounded-tl-none'
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start" aria-live="polite" aria-busy="true">
                 <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-stone-100 shadow-sm flex gap-1" role="status" aria-label="Loading response">
                    <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" aria-hidden="true"></span>
                    <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-75" aria-hidden="true"></span>
                    <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-150" aria-hidden="true"></span>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-stone-100 bg-white rounded-b-xl">
            <div className="relative flex items-center">
              <label htmlFor="chat-input" className="sr-only">Ask a style question</label>
              <input
                ref={inputRef}
                id="chat-input"
                type="text"
                placeholder="Ask about colors, fits, or trends..."
                className="w-full pr-12 pl-4 py-3 bg-stone-50 border-none rounded-full focus:ring-1 focus:ring-sage-400 focus:outline-none text-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                aria-describedby="chat-input-hint"
              />
              <span id="chat-input-hint" className="sr-only">Press Enter to send your message</span>
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 bg-sage-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sage-600 transition-colors cursor-pointer"
                aria-label="Send message"
              >
                <Send size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};