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
    <div className="min-h-screen paper-texture flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b" style={{ borderColor: 'rgba(43,43,43,0.1)' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="logo text-2xl hover:opacity-70 transition-opacity">
            p.a.k.r
          </Link>
          <nav className="flex gap-6 text-sm">
            <button
              onClick={() => handleSend('Show my gear')}
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              My Gear
            </button>
          </nav>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-16 opacity-50">
              <p className="text-lg mb-4">Ready for your next expedition</p>
              <p className="text-sm">
                Tell me where you&apos;re going, or what gear you have
              </p>
            </div>
          ) : (
            <ChatMessages messages={messages} />
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="message-system fade-in">
              <p className="opacity-50">Thinking...</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="px-6 py-4 border-t" style={{ borderColor: 'rgba(43,43,43,0.1)' }}>
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-4">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type here..."
              className="catalog-input flex-1"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="catalog-button disabled:opacity-30"
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
    <div className="min-h-screen paper-texture flex items-center justify-center">
      <p className="opacity-50">Loading...</p>
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
