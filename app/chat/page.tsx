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

  // Process initial query from URL
  useEffect(() => {
    if (initialQuery && !hasProcessedInitial.current) {
      hasProcessedInitial.current = true;
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  // Scroll to bottom on new messages
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
          content: 'Sorry, something went wrong. Please try again.',
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
    <div className="min-h-screen flex flex-col paper-bg topo-watermark">
      {/* Header */}
      <header className="site-header">
        <div className="h-full max-w-5xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="logo">
            pakr
          </Link>
          <nav className="flex gap-8">
            <button
              onClick={() => handleSend('Show my gear')}
              className="nav-link"
            >
              My Gear
            </button>
            <Link href="/" className="nav-link">
              New Trip
            </Link>
          </nav>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="py-16">
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--charcoal)' }}>
                Ready for your next expedition
              </h2>
              <p className="text-sm" style={{ color: 'var(--charcoal-light)' }}>
                Tell me where you&apos;re headed, or what gear you have.
              </p>
            </div>
          ) : (
            <ChatMessages messages={messages} />
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="message-system fade-in">
              <p style={{ color: 'var(--charcoal-light)' }}>Checking records...</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="site-footer">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-6">
          <div className="flex gap-4">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type here..."
              className="form-field flex-1"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="submit-btn disabled:opacity-30"
            >
              Send
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
}

function ChatLoading() {
  return (
    <div className="min-h-screen paper-bg flex items-center justify-center">
      <p style={{ color: 'var(--charcoal-light)' }}>Loading...</p>
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
