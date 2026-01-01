'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [objective, setObjective] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!objective.trim()) return;

    setIsLoading(true);
    router.push(`/analyze?trip=${encodeURIComponent(objective.trim())}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="logo text-center mb-12">pakr</h1>

        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-sm font-medium">
            What's your objective?
          </label>

          <input
            type="text"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="e.g. Overland Track in October"
            className="input-field mb-4"
            autoFocus
            autoComplete="off"
          />

          <button
            type="submit"
            disabled={!objective.trim() || isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>
      </div>
    </div>
  );
}
