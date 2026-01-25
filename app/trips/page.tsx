'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import Header from '@/components/Header';
import CompleteTripModal from '@/components/trip/CompleteTripModal';

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
  completionStatus?: 'full' | 'partial' | 'bailed';
  trailRating?: number;
  trailReview?: string;
}

export default function TripsPage() {
  const { data: session, status } = useSession();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completeModal, setCompleteModal] = useState<Trip | null>(null);

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
                          onClick={() => setCompleteModal(trip)}
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
        <CompleteTripModal
          trip={completeModal}
          onClose={() => setCompleteModal(null)}
          onComplete={loadTrips}
        />
      )}
    </>
  );
}
