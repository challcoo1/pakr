'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Navigate to chat with initial query
      router.push(`/chat?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <main className="min-h-screen paper-texture flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xl text-center">
        {/* Logo */}
        <h1 className="logo text-5xl md:text-6xl mb-4" style={{ color: 'var(--charcoal)' }}>
          p.a.k.r
        </h1>

        {/* Tagline */}
        <p className="text-lg mb-16 opacity-70" style={{ color: 'var(--charcoal-light)' }}>
          Your personal expedition outfitter
        </p>

        {/* Main Input */}
        <form onSubmit={handleSubmit} className="w-full">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Where are you going?"
            className="catalog-input text-center text-2xl"
            autoFocus
          />

          {/* Subtle hint */}
          <p className="mt-8 text-sm opacity-50">
            Tell us about your next adventure
          </p>
        </form>

        {/* Example prompts */}
        <div className="mt-16 flex flex-wrap justify-center gap-3">
          {[
            'Matterhorn in August',
            'Overland Track',
            'Show my gear',
          ].map((example) => (
            <button
              key={example}
              onClick={() => {
                setQuery(example);
                router.push(`/chat?q=${encodeURIComponent(example)}`);
              }}
              className="px-4 py-2 text-sm border opacity-60 hover:opacity-100 transition-opacity"
              style={{
                borderColor: 'var(--charcoal)',
                color: 'var(--charcoal)',
              }}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-8 text-xs opacity-40">
        Pack smart. Travel light.
      </footer>
    </main>
  );
}
