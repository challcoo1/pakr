'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    <div className="min-h-screen grain">
      <hr className="rule-orange" />

      {/* Header */}
      <header className="px-6 md:px-12 py-4 flex items-center justify-between">
        <span className="text-xl font-bold">pakr</span>
        <nav className="flex gap-6">
          <Link href="/chat?q=Show%20my%20gear" className="nav-item">My Gear</Link>
        </nav>
      </header>

      {/* Main */}
      <main className="px-6 md:px-12 py-12 md:py-16">
        <div className="max-w-2xl">

          {/* Headline */}
          <h1 className="display mb-4">
            What&apos;s your next objective?
          </h1>

          <p className="text-lg mb-8" style={{ color: 'var(--ink-light)' }}>
            We&apos;ll tell you what gear is required—and what you&apos;re missing.
          </p>

          {/* Input */}
          <form onSubmit={handleSubmit} className="mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Matterhorn via Hörnli Ridge, August"
              className="speak-input"
              autoFocus
              autoComplete="off"
            />
          </form>

          {/* Action */}
          <div className="mb-12">
            <button
              onClick={handleSubmit}
              disabled={!query.trim()}
              className="text-sm font-semibold uppercase tracking-wide disabled:opacity-30"
              style={{ color: 'var(--burnt)' }}
            >
              Analyze requirements →
            </button>
          </div>

          <hr className="border-t mb-8" style={{ borderColor: 'rgba(0,0,0,0.15)' }} />

          {/* Secondary actions */}
          <div className="grid md:grid-cols-2 gap-8 text-sm">
            <div>
              <h3 className="font-semibold mb-2">I already have gear</h3>
              <p className="mb-2" style={{ color: 'var(--ink-light)' }}>
                Log what you own. We&apos;ll check it against requirements.
              </p>
              <Link href="/chat?q=I%20have%20" className="warm">
                Add to my kit →
              </Link>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Browse by objective</h3>
              <p className="mb-2" style={{ color: 'var(--ink-light)' }}>
                Common trip types with standard gear requirements.
              </p>
              <Link href="/chat?q=What%20objectives%20can%20you%20help%20with" className="warm">
                See examples →
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* How it works - dense info block */}
      <section className="accent-block mx-6 md:mx-12 mb-12">
        <div className="max-w-3xl">
          <h2 className="font-bold mb-3">How gap analysis works</h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <span className="font-semibold">1. Define objective</span>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                Route, conditions, duration, technical grade.
              </p>
            </div>
            <div>
              <span className="font-semibold">2. Generate requirements</span>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                Specific specs: temp ratings, weights, features.
              </p>
            </div>
            <div>
              <span className="font-semibold">3. Check your kit</span>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                Match against what you own. Show gaps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-6 text-xs" style={{ color: 'var(--ink-light)' }}>
        <div className="flex gap-8">
          <span>Gear specs from manufacturer data</span>
          <span>Reviews from Outdoor Gear Lab, Switchback Travel</span>
        </div>
      </footer>
    </div>
  );
}
