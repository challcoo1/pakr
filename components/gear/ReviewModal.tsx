'use client';

import StarRating, { getRatingLabel } from '@/components/StarRating';
import { GearItem } from '@/types';

interface ReviewModalProps {
  gear: GearItem | null;
  rating: number;
  title: string;
  text: string;
  conditions: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
  onRatingChange: (rating: number) => void;
  onTitleChange: (title: string) => void;
  onTextChange: (text: string) => void;
  onConditionsChange: (conditions: string) => void;
}

export default function ReviewModal({
  gear,
  rating,
  title,
  text,
  conditions,
  isSaving,
  onClose,
  onSave,
  onRatingChange,
  onTitleChange,
  onTextChange,
  onConditionsChange,
}: ReviewModalProps) {
  if (!gear) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="settings-modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <span className="settings-title">REVIEW GEAR</span>
          <button type="button" onClick={onClose} className="settings-close">×</button>
        </div>

        <div className="settings-content">
          {/* Gear being reviewed */}
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <div className="font-medium">{gear.name}</div>
            <div className="text-sm text-muted">{gear.specs}</div>
          </div>

          {/* Star rating */}
          <div className="mb-4">
            <label className="settings-label">Your Rating *</label>
            <div className="flex items-center gap-2">
              <StarRating rating={rating} onRate={onRatingChange} />
              {rating > 0 && (
                <span className="text-sm text-muted">{getRatingLabel(rating)}</span>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="settings-label">Review Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g. Bombproof in all conditions"
              className="input-small w-full"
            />
          </div>

          {/* Conditions */}
          <div className="mb-4">
            <label className="settings-label">Conditions Tested (optional)</label>
            <input
              type="text"
              value={conditions}
              onChange={(e) => onConditionsChange(e.target.value)}
              placeholder="e.g. Heavy rain, -10°C, alpine terrain"
              className="input-small w-full"
            />
          </div>

          {/* Review text */}
          <div className="mb-4">
            <label className="settings-label">Your Review (optional)</label>
            <textarea
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="Share your experience with this gear..."
              className="input-small w-full"
              rows={4}
            />
          </div>
        </div>

        <div className="settings-footer">
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={rating === 0 || isSaving}
              className="settings-save flex-1"
            >
              {isSaving ? 'Saving...' : gear.userReview ? 'Update Review' : 'Save Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
