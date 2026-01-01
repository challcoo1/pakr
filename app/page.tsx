'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/chat?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xl text-center">
        <h1 className="logo mb-12">pakr</h1>

        <p className="prompt-text">What's your objective?</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Overland Track in October..."
            className="main-input"
            autoFocus
            autoComplete="off"
          />
        </form>
      </div>
    </div>
  );
}
