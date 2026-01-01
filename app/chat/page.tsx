'use client';

import { Suspense } from 'react';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChatMessages, Message } from '@/components/ChatMessage';

function ChatContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasProcessedInitial = useRef(false);

  useEffect(() => {
    if (initialQuery && !hasProcessedInitial.current) {
      hasProcessedInitial.current = true;
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: messages,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        gear: data.gear,
        tripAnalysis: data.tripAnalysis,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Error processing request. Try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className="min-h-screen flex flex-col grain">
      <hr className="rule-orange" />

      {/* Header */}
      <header className="px-6 md:px-12 py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
        <Link href="/" className="text-xl font-bold">pakr</Link>
        <nav className="flex gap-6">
          <button onClick={() => handleSend('Show my gear')} className="nav-item">
            My Gear
          </button>
          <Link href="/" className="nav-item">
            New Analysis
          </Link>
        </nav>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-6 md:px-12 py-8">
        <div className="max-w-2xl">
          {messages.length === 0 ? (
            <div className="py-8">
              <p className="font-semibold mb-2">Ready</p>
              <p className="text-sm" style={{ color: 'var(--ink-light)' }}>
                Enter an objective to analyze gear requirements, or log gear you own.
              </p>
            </div>
          ) : (
            <ChatMessages messages={messages} />
          )}

          {isLoading && (
            <div className="message-them fade-in">
              <p style={{ color: 'var(--ink-light)' }}>Analyzing...</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="px-6 md:px-12 py-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleSubmit} className="max-w-2xl flex gap-4">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe objective or gear..."
            className="speak-input flex-1"
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="text-sm font-semibold uppercase tracking-wide disabled:opacity-30 shrink-0"
            style={{ color: 'var(--burnt)' }}
          >
            Send →
          </button>
        </form>
      </footer>
    </div>
  );
}

function ChatLoading() {
  return (
    <div className="min-h-screen grain flex items-center justify-center">
      <p style={{ color: 'var(--ink-light)' }}>Loading...</p>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatContent />
    </Suspense>
  );
}
