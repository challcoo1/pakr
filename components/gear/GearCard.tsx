'use client';

import { useState } from 'react';
import StarRating from '@/components/StarRating';
import { GearItem } from '@/types';

interface GearCardProps {
  item: GearItem;
  isExpanded: boolean;
  isEditingWeight: boolean;
  editingWeightValue: string;
  brokenImage: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  onOpenReview: () => void;
  onStartWeightEdit: (currentWeight: string) => void;
  onSaveWeight: () => void;
  onCancelWeightEdit: () => void;
  onWeightValueChange: (value: string) => void;
  onImageError: () => void;
}

function formatWeight(g: number | null | undefined, estimated?: boolean) {
  if (!g) return null;
  const prefix = estimated ? '~' : '';
  return g >= 1000 ? `${prefix}${(g / 1000).toFixed(2)}kg` : `${prefix}${g}g`;
}

export default function GearCard({
  item,
  isExpanded,
  isEditingWeight,
  editingWeightValue,
  brokenImage,
  onToggleExpand,
  onDelete,
  onOpenReview,
  onStartWeightEdit,
  onSaveWeight,
  onCancelWeightEdit,
  onWeightValueChange,
  onImageError,
}: GearCardProps) {
  const hasDetails = item.description || (item.reviews && item.reviews.length > 0);

  return (
    <div className="gear-portfolio-item flex-col items-stretch">
      <div className="flex items-start gap-3">
        {item.imageUrl && !brokenImage && (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-16 h-16 object-cover rounded flex-shrink-0"
            onError={onImageError}
          />
        )}
        <div className="gear-portfolio-item-main flex-1">
          <div className="gear-portfolio-item-name">{item.name}</div>
          <div className="gear-portfolio-item-specs">{item.specs}</div>

          {/* Weight display/edit */}
          <div className="flex items-center gap-2 mt-1">
            {isEditingWeight ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={editingWeightValue}
                  onChange={(e) => onWeightValueChange(e.target.value)}
                  placeholder="grams"
                  className="w-20 px-2 py-0.5 text-xs border rounded"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSaveWeight();
                    if (e.key === 'Escape') onCancelWeightEdit();
                  }}
                />
                <span className="text-xs text-muted">g</span>
                <button
                  type="button"
                  onClick={onSaveWeight}
                  className="text-xs link"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onStartWeightEdit(item.weightG?.toString() || '')}
                className={`text-xs ${item.weightG ? (item.weightEstimated ? 'text-muted italic' : 'text-charcoal') : 'link'}`}
                title={item.weightEstimated ? 'Estimated weight - click to edit' : 'Click to edit weight'}
              >
                {formatWeight(item.weightG, item.weightEstimated) || '+ Add weight'}
              </button>
            )}
          </div>

          {item.gender && (
            <span className="text-xs text-muted">{item.gender}</span>
          )}
          {item.notes && (
            <div className="gear-portfolio-item-notes">{item.notes}</div>
          )}
          {/* User review display */}
          <div className="mt-1 flex items-center gap-2">
            {item.userReview ? (
              <button
                type="button"
                onClick={onOpenReview}
                className="flex items-center gap-1 star-rating hover:opacity-80"
                title="Edit your review"
              >
                <StarRating rating={item.userReview.rating} readonly />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenReview}
                className="text-xs link hover:underline"
              >
                + Add review
              </button>
            )}
          </div>
          {item.productUrl && (
            <a href={item.productUrl} target="_blank" rel="noopener noreferrer" className="text-xs link hover:underline">
              View product
            </a>
          )}
        </div>
        <button
          onClick={onDelete}
          className="gear-portfolio-item-delete"
          title="Remove"
        >
          ×
        </button>
      </div>
      {hasDetails && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onToggleExpand}
            className="text-xs link hover:underline flex items-center gap-1"
          >
            {isExpanded ? '▼' : '▶'} Details & Reviews
          </button>
          {isExpanded && (
            <div className="mt-2 text-sm space-y-2">
              {item.description && (
                <p className="text-gray-600">{item.description}</p>
              )}
              {item.reviews && item.reviews.length > 0 && (
                <div>
                  <div className="font-medium text-xs text-gray-500 mb-1">REVIEWS</div>
                  <div className="space-y-1">
                    {item.reviews.map((review, idx) => (
                      <a
                        key={idx}
                        href={review.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block link hover:underline text-xs"
                      >
                        {review.source} {review.rating && `(${review.rating})`}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
