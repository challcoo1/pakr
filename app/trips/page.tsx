'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';

interface TripGear {
  id: string;
  gearName: string;
  category: string;
  isOwned: boolean;
  isRecommended: boolean;
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
}

export default function TripsPage() {
  const { data: session, status } = useSession();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completeModal, setCompleteModal] = useState<Trip | null>(null);
  const [completedDate, setCompletedDate] = useState('');
  const [actualDuration, setActualDuration] = useState('');
  const [tripNotes, setTripNotes] = useState('');

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
        }),
      });
      await loadTrips();
      setCompleteModal(null);
      setCompletedDate('');
      setActualDuration('');
      setTripNotes('');
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
        <div className="red-band">
          <div className="red-band-container">
            <Link href="/" className="logo-light">pakr</Link>
          </div>
        </div>
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
      <div className="red-band">
        <div className="red-band-container">
          <Link href="/" className="logo-light">pakr</Link>
          <div className="flex items-center gap-4">
            <Link href="/gear" className="text-white/80 hover:text-white text-sm">My Gear</Link>
          </div>
        </div>
      </div>

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
                          onClick={() => {
                            setCompleteModal(trip);
                            setCompletedDate(new Date().toISOString().split('T')[0]);
                          }}
                          className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Mark Complete
                        </button>
                        <button
                          onClick={() => handleDelete(trip.id)}
                          className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
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
                      <div className="text-xs text-orange-600 mb-2">
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
                              className={`text-xs px-2 py-0.5 rounded ${g.isOwned ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}
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
                      <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                        Completed {trip.completedDate}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted mb-2">
                      {trip.actualDuration && <span className="bg-gray-200 px-2 py-1 rounded">{trip.actualDuration}</span>}
                      {trip.terrain && <span className="bg-gray-200 px-2 py-1 rounded">{trip.terrain}</span>}
                    </div>

                    {trip.notes && (
                      <p className="text-sm text-muted italic">{trip.notes}</p>
                    )}

                    {trip.gear && trip.gear.length > 0 && (
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="text-xs text-muted">Used {trip.gear.length} items</div>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setCompleteModal(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Complete Trip</h2>
            <p className="text-sm text-muted mb-4">{completeModal.name}</p>

            <div className="space-y-4">
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

              <div>
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <textarea
                  value={tripNotes}
                  onChange={e => setTripNotes(e.target.value)}
                  placeholder="How did the gear perform? Any learnings?"
                  className="w-full border rounded px-3 py-2 h-24"
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
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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
