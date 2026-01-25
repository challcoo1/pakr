'use client';

import { TripMatch, TripConfirm, ACTIVITY_TYPES } from '@/types';

interface TripConfirmationProps {
  tripConfirm: TripConfirm;
  selectedTrip: TripMatch | null;
  isLoading: boolean;
  onTripConfirmChange: (confirm: TripConfirm) => void;
  onResearch: () => void;
  onConfirmAnalyze: () => void;
}

export default function TripConfirmation({
  tripConfirm,
  selectedTrip,
  isLoading,
  onTripConfirmChange,
  onResearch,
  onConfirmAnalyze,
}: TripConfirmationProps) {
  return (
    <div className="trip-summary">
      <h2 className="text-lg font-bold mb-4">Confirm your trip</h2>

      <div className="space-y-4">
        {/* Place */}
        <div>
          <label className="block text-sm font-medium mb-1">Place</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tripConfirm.place}
              onChange={(e) => onTripConfirmChange({ ...tripConfirm, place: e.target.value })}
              className="input-small flex-1"
              placeholder="Trail or destination name"
            />
            <button
              type="button"
              onClick={onResearch}
              disabled={isLoading}
              className="px-3 py-1 text-sm border border-charcoal rounded hover:bg-gray-100"
            >
              Search
            </button>
          </div>
          {selectedTrip && (
            <div className="text-xs text-muted mt-1">{selectedTrip.location}</div>
          )}
        </div>

        {/* Trip Date */}
        <div>
          <label className="block text-sm font-medium mb-1">Trip Date</label>
          <input
            type="date"
            value={tripConfirm.plannedDate || ''}
            onChange={(e) => onTripConfirmChange({ ...tripConfirm, plannedDate: e.target.value })}
            className={`input-small w-full ${!tripConfirm.plannedDate ? 'border-burnt' : ''}`}
            min={new Date().toISOString().split('T')[0]}
          />
          {!tripConfirm.plannedDate && (
            <div className="text-xs text-burnt mt-1">Required</div>
          )}
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium mb-1">Duration</label>
          <input
            type="text"
            value={tripConfirm.duration}
            onChange={(e) => onTripConfirmChange({ ...tripConfirm, duration: e.target.value })}
            className={`input-small w-full ${!tripConfirm.duration ? 'border-burnt' : ''}`}
            placeholder={tripConfirm.duration || 'Missing - e.g. 3 days, 4 hours'}
          />
          {!tripConfirm.duration && (
            <div className="text-xs text-burnt mt-1">Missing</div>
          )}
        </div>

        {/* Activity Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Activity</label>
          <select
            value={tripConfirm.activity}
            onChange={(e) => onTripConfirmChange({ ...tripConfirm, activity: e.target.value })}
            className="input-small w-full"
          >
            {ACTIVITY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Selected trip details */}
        {selectedTrip && (
          <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
            <div className="font-medium">{selectedTrip.name}</div>
            <div className="text-muted">{selectedTrip.summary}</div>
            <div className="text-xs text-muted mt-1">
              {selectedTrip.difficulty} · {selectedTrip.distance} · {selectedTrip.terrain}
            </div>
          </div>
        )}

        {/* Confirm button */}
        <button
          onClick={onConfirmAnalyze}
          disabled={!tripConfirm.place || !tripConfirm.plannedDate || isLoading}
          className="btn-primary w-full mt-4"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Gear Requirements'}
        </button>
      </div>
    </div>
  );
}
