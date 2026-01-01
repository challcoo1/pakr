'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const trip = searchParams.get('trip');

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="logo text-xl">pakr</Link>

        <div className="mt-8 p-4 bg-white border-2 border-charcoal rounded">
          <p className="text-sm text-muted mb-2">Step 2: Analyze</p>
          <p className="font-medium">Trip: {trip}</p>
          <p className="mt-4 text-muted">Coming next...</p>
        </div>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <AnalyzeContent />
    </Suspense>
  );
}
