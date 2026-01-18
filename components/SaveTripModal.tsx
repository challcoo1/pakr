'use client';

import { useState } from 'react';
import type { TripAnalysis, UserGearEntry } from '@/types';

interface SaveTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripAnalysis;
  userGear: Record<string, UserGearEntry>;
  excludedGear: Set<string>;
  inventoryGear: { id: string; name: string; category: string }[];
}

export default function SaveTripModal({
  isOpen,
  onClose,
  trip,
  userGear,
  excludedGear,
  inventoryGear,
}: SaveTripModalProps) {
  const [plannedDate, setPlannedDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const missingGear = trip.gear
    .filter(g => !excludedGear.has(g.item))
    .filter(g => !userGear[g.item]?.input || userGear[g.item]?.status === 'empty')
    .map(g => g.item);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const gearList = trip.gear
        .filter(g => !excludedGear.has(g.item))
        .map(g => {
          const entry = userGear[g.item];
          return {
            name: entry?.input || g.item,
            category: g.category,
            isOwned: entry?.status !== 'empty' && entry?.input,
            isRecommended: !entry?.input,
          };
        }).filter(g => g.isOwned || g.isRecommended);

      const inventoryGearList = inventoryGear.map(g => ({
        name: g.name,
        category: g.category,
        isOwned: true,
        isRecommended: false,
        userGearId: g.id,
      }));

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip: {
            name: trip.name,
            region: trip.region,
            duration: trip.duration,
            terrain: trip.terrain,
            conditions: trip.conditions,
            grading: trip.grading,
            hazards: trip.hazards,
          },
          gear: [...gearList, ...inventoryGearList],
          missingGear: missingGear.length > 0 ? missingGear : null,
          plannedDate: plannedDate || null,
        }),
      });

      if (response.ok) {
        window.location.href = '/trips';
      }
    } catch (error) {
      console.error('Failed to save trip:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-2">Add Trip</h2>
        <p className="text-sm text-muted mb-4">{trip.name}</p>

        {missingGear.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-4">
            <div className="text-sm font-medium text-orange-800 mb-1">Missing gear:</div>
            <div className="text-xs text-orange-700">{missingGear.join(', ')}</div>
            <div className="text-xs text-orange-600 mt-1">You can still save and add gear later.</div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Planned Date (optional)</label>
          <input
            type="date"
            value={plannedDate}
            onChange={e => setPlannedDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 border rounded hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
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
