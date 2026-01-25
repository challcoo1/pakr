'use client';

import { TripMatch } from '@/types';

interface TripResultsListProps {
  results: TripMatch[];
  onSelectTrip: (trip: TripMatch) => void;
}

export default function TripResultsList({
  results,
  onSelectTrip,
}: TripResultsListProps) {
  return (
    <div className="space-y-3">
      <p className="text-muted text-sm">Which trip do you mean?</p>
      {results.map((t, idx) => (
        <button
          key={idx}
          onClick={() => onSelectTrip(t)}
          className="w-full text-left p-4 bg-white border-2 border-charcoal rounded hover:border-burnt transition-colors"
        >
          <div className="font-bold">{t.name}</div>
          <div className="text-sm text-muted">{t.location}</div>
          <div className="text-sm mt-1">{t.duration} · {t.difficulty} · {t.distance}</div>
          <div className="text-xs text-muted mt-1">{t.summary}</div>
        </button>
      ))}
    </div>
  );
}
