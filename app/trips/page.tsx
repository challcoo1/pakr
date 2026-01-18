'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import Header from '@/components/Header';

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
  region?: string;
  duration?: string;
  terrain?: string;
  conditions?: string[];
  grading?: { local?: string; international?: string };
  status: 'planned' | 'completed' | 'cancelled';
  plannedDate?: string;
  completedDate?: string;
  actualDuration?: string;
  notes?: string;
  missingGear?: string[];
  gear: TripGear[];
  createdAt: string;
  // Completion fields
  completionStatus?: 'full' | 'partial' | 'bailed';
  trailRating?: number;
  trailReview?: string;
}

export default function TripsPage() {
  const { data: session, status } = useSession();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completeModal, setCompleteModal] = useState<Trip | null>(null);
  const [completedDate, setCompletedDate] = useState('');
  const [actualDuration, setActualDuration] = useState('');
  const [tripNotes, setTripNotes] = useState('');
  // New completion fields
  const [completionStatus, setCompletionStatus] = useState<'full' | 'partial' | 'bailed'>('full');
  const [trailRating, setTrailRating] = useState(0);
  const [trailReview, setTrailReview] = useState('');
  const [gearUsage, setGearUsage] = useState<Record<string, GearUsageUpdate>>({});

  useEffect(() => {
    if (session?.user) {
      loadTrips();
    } else if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [session, status]);

  const loadTrips = async () => {
    try {
      const res = await fetch('/api/trips');
      const data = await res.json();
      setTrips(data.trips || []);
    } catch (error) {
      console.error('Failed to load trips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCompleteModal = (trip: Trip) => {
    setCompleteModal(trip);
    setCompletedDate(new Date().toISOString().split('T')[0]);
    setCompletionStatus('full');
    setTrailRating(0);
    setTrailReview('');
    // Initialize gear usage - all used by default
    const initialGearUsage: Record<string, GearUsageUpdate> = {};
    trip.gear?.forEach(g => {
      initialGearUsage[g.id] = { id: g.id, wasUsed: true, wouldBringAgain: null };
    });
    setGearUsage(initialGearUsage);
  };

  const handleComplete = async () => {
    if (!completeModal) return;

    try {
      await fetch('/api/trips', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: completeModal.id,
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
      await loadTrips();
      setCompleteModal(null);
      setCompletedDate('');
      setActualDuration('');
      setTripNotes('');
      setCompletionStatus('full');
      setTrailRating(0);
      setTrailReview('');
      setGearUsage({});
    } catch (error) {
      console.error('Failed to complete trip:', error);
    }
  };

  const handleDelete = async (tripId: string) => {
    if (!confirm('Delete this trip?')) return;

    try {
      await fetch(`/api/trips?id=${tripId}`, { method: 'DELETE' });
      await loadTrips();
    } catch (error) {
      console.error('Failed to delete trip:', error);
    }
  };

  const plannedTrips = trips.filter(t => t.status === 'planned');
  const completedTrips = trips.filter(t => t.status === 'completed');

  if (status !== 'loading' && !session) {
    return (
      <>
        <Header activePage="trips" />
        <div className="main-content">
          <div className="max-w-4xl mx-auto p-4 text-center py-12">
            <h1 className="text-2xl font-bold mb-4">My Trips</h1>
            <p className="text-muted mb-6">Sign in to view your saved trips.</p>
            <button onClick={() => signIn('google')} className="btn-primary">Sign in with Google</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header activePage="trips" />

      <div className="main-content">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-xl font-bold">My Trips</h1>
              <p className="text-muted text-sm">{trips.length} trips saved</p>
            </div>
            <Link href="/" className="btn-primary">+ Plan New Trip</Link>
          </div>

          {isLoading && (
            <div className="text-center py-12 text-muted">Loading trips...</div>
          )}

          {!isLoading && trips.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted mb-4">No trips saved yet.</p>
              <Link href="/" className="btn-primary">Plan Your First Trip</Link>
            </div>
          )}

          {/* Planned Trips */}
          {plannedTrips.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-charcoal">Planned ({plannedTrips.length})</h2>
              <div className="space-y-4">
                {plannedTrips.map(trip => (
                  <div key={trip.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-charcoal">{trip.name}</h3>
                        {trip.region && <p className="text-sm text-muted">{trip.region}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openCompleteModal(trip)}
                          className="btn-forest"
                        >
                          Mark Complete
                        </button>
                        <button
                          onClick={() => handleDelete(trip.id)}
                          className="btn-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted mb-3">
                      {trip.duration && <span className="bg-gray-100 px-2 py-1 rounded">{trip.duration}</span>}
                      {trip.terrain && <span className="bg-gray-100 px-2 py-1 rounded">{trip.terrain}</span>}
                      {trip.grading?.local && <span className="bg-gray-100 px-2 py-1 rounded">{trip.grading.local}</span>}
                    </div>

                    {trip.missingGear && trip.missingGear.length > 0 && (
                      <div className="text-xs text-burnt mb-2">
                        Missing: {trip.missingGear.join(', ')}
                      </div>
                    )}

                    {trip.gear && trip.gear.length > 0 && (
                      <div className="border-t pt-2 mt-2">
                        <div className="text-xs text-muted mb-1">Gear ({trip.gear.length} items)</div>
                        <div className="flex flex-wrap gap-1">
                          {trip.gear.slice(0, 8).map(g => (
                            <span
                              key={g.id}
                              className={`text-xs px-2 py-0.5 rounded ${g.isOwned ? 'tag-owned' : 'tag-needed'}`}
                            >
                              {g.gearName.split(' ').slice(0, 2).join(' ')}
                            </span>
                          ))}
                          {trip.gear.length > 8 && (
                            <span className="text-xs text-muted">+{trip.gear.length - 8} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Trips */}
          {completedTrips.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-charcoal">Completed ({completedTrips.length})</h2>
              <div className="space-y-4">
                {completedTrips.map(trip => (
                  <div key={trip.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-charcoal">{trip.name}</h3>
                        {trip.region && <p className="text-sm text-muted">{trip.region}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {trip.completionStatus && trip.completionStatus !== 'full' && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            trip.completionStatus === 'partial' ? 'tag-warning' : 'tag-neutral'
                          }`}>
                            {trip.completionStatus === 'partial' ? 'Partial' : 'Bailed'}
                          </span>
                        )}
                        <span className="text-xs tag-success px-2 py-1 rounded">
                          {trip.completedDate}
                        </span>
                      </div>
                    </div>

                    {/* Trail Rating */}
                    {trip.trailRating && trip.trailRating > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} className={`text-sm ${star <= trip.trailRating! ? 'star-rating' : 'star-rating-empty'}`}>
                            {star <= trip.trailRating! ? '★' : '☆'}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs text-muted mb-2">
                      {trip.actualDuration && <span className="bg-gray-200 px-2 py-1 rounded">{trip.actualDuration}</span>}
                      {trip.terrain && <span className="bg-gray-200 px-2 py-1 rounded">{trip.terrain}</span>}
                    </div>

                    {trip.trailReview && (
                      <p className="text-sm text-charcoal mb-2">{trip.trailReview}</p>
                    )}

                    {trip.notes && (
                      <p className="text-sm text-muted italic">{trip.notes}</p>
                    )}

                    {trip.gear && trip.gear.length > 0 && (
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="text-xs text-muted">
                          {trip.gear.filter(g => g.wasUsed !== false).length} of {trip.gear.length} items used
                          {trip.gear.some(g => g.wouldBringAgain === false) && (
                            <span className="text-burnt ml-2">
                              • {trip.gear.filter(g => g.wouldBringAgain === false).length} wouldn&apos;t bring again
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complete Trip Modal */}
      {completeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setCompleteModal(null)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-1">Complete Trip</h2>
            <p className="text-sm text-muted mb-4">{completeModal.name}</p>

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
              {completeModal.gear && completeModal.gear.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Gear Used</label>
                  <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                    {completeModal.gear.map(g => {
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
                    {Object.values(gearUsage).filter(g => g.wasUsed).length} of {completeModal.gear.length} items used
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
                onClick={() => setCompleteModal(null)}
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
      )}
    </>
  );
}
