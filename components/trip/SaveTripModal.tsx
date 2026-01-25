'use client';

import { TripAnalysis, UserGearEntry } from '@/types';

interface SaveTripModalProps {
  isOpen: boolean;
  trip: TripAnalysis;
  excludedGear: Set<string>;
  userGear: Record<string, UserGearEntry>;
  plannedDate: string;
  isSaving: boolean;
  onClose: () => void;
  onDateChange: (date: string) => void;
  onSave: () => void;
}

export default function SaveTripModal({
  isOpen,
  trip,
  excludedGear,
  userGear,
  plannedDate,
  isSaving,
  onClose,
  onDateChange,
  onSave,
}: SaveTripModalProps) {
  if (!isOpen) return null;

  const missingGear = trip.gear
    .filter(g => !excludedGear.has(g.item))
    .filter(g => !userGear[g.item]?.input || userGear[g.item]?.status === 'empty');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-2">Add Trip</h2>
        <p className="text-sm text-muted mb-4">{trip.name}</p>

        {/* Missing gear warning */}
        {missingGear.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-4">
            <div className="text-sm font-medium text-orange-800 mb-1">Missing gear:</div>
            <div className="text-xs text-orange-700">
              {missingGear.map(g => g.item).join(', ')}
            </div>
            <div className="text-xs text-orange-600 mt-1">You can still save and add gear later.</div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Trip Date</label>
          <input
            type="date"
            value={plannedDate}
            onChange={e => onDateChange(e.target.value)}
            className="w-full border rounded px-3 py-2"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 btn-primary disabled:opacity-50"
          >
            {isSaving ? 'Adding...' : 'Add Trip'}
          </button>
        </div>
      </div>
    </div>
  );
}
