'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Simple mountain range SVG
function MountainRange() {
  return (
    <svg
      viewBox="0 0 1200 120"
      className="w-full h-auto mountain-illustration"
      preserveAspectRatio="none"
    >
      <path
        d="M0 120 L0 80 L100 40 L180 70 L260 25 L340 55 L400 15 L480 50 L560 20 L620 45 L700 10 L780 40 L860 5 L940 35 L1000 18 L1060 42 L1120 28 L1200 60 L1200 120 Z"
        fill="currentColor"
      />
    </svg>
  );
}

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
    <div className="min-h-screen flex flex-col paper-bg topo-watermark">
      {/* Header */}
      <header className="site-header">
        <div className="h-full max-w-5xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="logo">
            pakr
          </Link>
          <nav className="flex gap-8">
            <Link href="/chat?q=Show%20my%20gear" className="nav-link">
              My Gear
            </Link>
            <Link href="/chat" className="nav-link">
              Plan Trip
            </Link>
          </nav>
        </div>
      </header>

      {/* Mountain illustration */}
      <div className="text-[#5C4033]">
        <MountainRange />
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        <div className="max-w-xl">
          {/* Headline */}
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--charcoal)' }}>
            Where are you headed?
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--charcoal-light)' }}>
            Enter your destination and we&apos;ll help you pack.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <label htmlFor="destination" className="form-label">
              Destination / Expedition
            </label>
            <input
              id="destination"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Matterhorn in August..."
              className="form-field w-full mb-6"
              autoFocus
              autoComplete="off"
            />

            <button type="submit" className="submit-btn" disabled={!query.trim()}>
              Get Gear List
            </button>
          </form>

          {/* Divider */}
          <div className="divider my-10" />

          {/* Secondary actions */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--charcoal-light)' }}>
                Already have gear?
              </h3>
              <p className="text-sm mb-3" style={{ color: 'var(--charcoal)' }}>
                Tell us what you own and we&apos;ll track it.
              </p>
              <Link
                href="/chat?q=I%20have%20"
                className="text-sm font-medium"
                style={{ color: 'var(--burnt-orange)' }}
              >
                Add to collection →
              </Link>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--charcoal-light)' }}>
                View your kit
              </h3>
              <p className="text-sm mb-3" style={{ color: 'var(--charcoal)' }}>
                See everything in your gear locker.
              </p>
              <Link
                href="/chat?q=Show%20my%20gear"
                className="text-sm font-medium"
                style={{ color: 'var(--burnt-orange)' }}
              >
                Open gear list →
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <span className="footer-text">Pack smart. Travel light.</span>
          <span className="footer-text">Est. 2025</span>
        </div>
      </footer>
    </div>
  );
}
