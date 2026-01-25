'use client';

import { useState } from 'react';

interface TripGear {
  id: string;
  gearName: string;
  category: string;
  isOwned: boolean;
  isRecommended: boolean;
  wasUsed?: boolean;
  wouldBringAgain?: boolean;
  usageNotes?: string;
}

interface GearUsageUpdate {
  id: string;
  wasUsed: boolean;
  wouldBringAgain: boolean | null;
}

interface Trip {
  id: string;
  name: string;
  gear: TripGear[];
}

interface CompleteTripModalProps {
  trip: Trip;
  onClose: () => void;
  onComplete: () => void;
}

export default function CompleteTripModal({ trip, onClose, onComplete }: CompleteTripModalProps) {
  const [completedDate, setCompletedDate] = useState(new Date().toISOString().split('T')[0]);
  const [actualDuration, setActualDuration] = useState('');
  const [tripNotes, setTripNotes] = useState('');
  const [completionStatus, setCompletionStatus] = useState<'full' | 'partial' | 'bailed'>('full');
  const [trailRating, setTrailRating] = useState(0);
  const [trailReview, setTrailReview] = useState('');
  const [gearUsage, setGearUsage] = useState<Record<string, GearUsageUpdate>>(() => {
    const initial: Record<string, GearUsageUpdate> = {};
    trip.gear?.forEach(g => {
      initial[g.id] = { id: g.id, wasUsed: true, wouldBringAgain: null };
    });
    return initial;
  });

  const handleComplete = async () => {
    try {
      await fetch('/api/trips', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: trip.id,
          status: 'completed',
          completedDate: completedDate || new Date().toISOString().split('T')[0],
          actualDuration,
          notes: tripNotes,
          completionStatus,
          trailRating: trailRating > 0 ? trailRating : null,
          trailReview: trailReview || null,
          gearUpdates: Object.values(gearUsage),
        }),
      });
      onComplete();
      onClose();
    } catch (error) {
      console.error('Failed to complete trip:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-1">Complete Trip</h2>
        <p className="text-sm text-muted mb-4">{trip.name}</p>

        <div className="space-y-5">
          {/* Basic Info Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Completion Date</label>
              <input
                type="date"
                value={completedDate}
                onChange={e => setCompletedDate(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Actual Duration</label>
              <input
                type="text"
                value={actualDuration}
                onChange={e => setActualDuration(e.target.value)}
                placeholder="e.g. 5 days, 3 hours"
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          {/* Completion Status */}
          <div>
            <label className="block text-sm font-medium mb-1">How did it go?</label>
            <div className="flex gap-2">
              {[
                { value: 'full', label: 'Completed fully', style: 'success' },
                { value: 'partial', label: 'Partial completion', style: 'warning' },
                { value: 'bailed', label: 'Bailed / turned back', style: 'neutral' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setCompletionStatus(opt.value as 'full' | 'partial' | 'bailed')}
                  className={`flex-1 px-3 py-2 text-sm rounded border transition-colors ${
                    completionStatus === opt.value
                      ? opt.style === 'success' ? 'tag-success border-forest'
                      : opt.style === 'warning' ? 'tag-warning border-burnt'
                      : 'tag-neutral border-muted'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trail Rating */}
          <div>
            <label className="block text-sm font-medium mb-1">Rate this trail</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setTrailRating(star)}
                  className={`text-2xl transition-colors ${star <= trailRating ? 'star-rating' : 'star-rating-empty'}`}
                >
                  {star <= trailRating ? '★' : '☆'}
                </button>
              ))}
              {trailRating > 0 && (
                <span className="text-sm text-muted ml-2 self-center">
                  {trailRating === 5 ? 'Amazing!' : trailRating === 4 ? 'Great' : trailRating === 3 ? 'Good' : trailRating === 2 ? 'Fair' : 'Poor'}
                </span>
              )}
            </div>
          </div>

          {/* Trail Review */}
          <div>
            <label className="block text-sm font-medium mb-1">Trail Review (optional)</label>
            <textarea
              value={trailReview}
              onChange={e => setTrailReview(e.target.value)}
              placeholder="How was the trail? Conditions, highlights, tips for others..."
              className="w-full border rounded px-3 py-2 h-20"
            />
          </div>

          {/* Gear Usage Checklist */}
          {trip.gear && trip.gear.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Gear Used</label>
              <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                {trip.gear.map(g => {
                  const usage = gearUsage[g.id] || { id: g.id, wasUsed: true, wouldBringAgain: null };
                  return (
                    <div key={g.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{g.gearName}</div>
                        <div className="text-xs text-muted">{g.category}</div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <label className="flex items-center gap-1.5 text-xs">
                          <input
                            type="checkbox"
                            checked={usage.wasUsed}
                            onChange={e => setGearUsage(prev => ({
                              ...prev,
                              [g.id]: { ...usage, wasUsed: e.target.checked, wouldBringAgain: e.target.checked ? usage.wouldBringAgain : null }
                            }))}
                            className="rounded"
                          />
                          Used
                        </label>
                        {usage.wasUsed && (
                          <label className="flex items-center gap-1.5 text-xs">
                            <input
                              type="checkbox"
                              checked={usage.wouldBringAgain === true}
                              onChange={e => setGearUsage(prev => ({
                                ...prev,
                                [g.id]: { ...usage, wouldBringAgain: e.target.checked ? true : false }
                              }))}
                              className="rounded"
                            />
                            Bring again
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted mt-1">
                {Object.values(gearUsage).filter(g => g.wasUsed).length} of {trip.gear.length} items used
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              value={tripNotes}
              onChange={e => setTripNotes(e.target.value)}
              placeholder="Any other learnings? Gear that failed?"
              className="w-full border rounded px-3 py-2 h-20"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleComplete}
            className="flex-1 px-4 py-2 bg-forest text-white rounded hover:opacity-90"
          >
            Mark Complete
          </button>
        </div>
      </div>
    </div>
  );
}
