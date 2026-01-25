'use client';

import { useState } from 'react';
import { ProductMatch } from '@/types';

interface AddGearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  searchResults: ProductMatch[];
  addingGear: ProductMatch | null;
  onSelectGear: (product: ProductMatch) => void;
  onClearSelectedGear: () => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedGender: string;
  onGenderChange: (value: string) => void;
  gearNotes: string;
  onNotesChange: (value: string) => void;
}

export default function AddGearModal({
  isOpen,
  onClose,
  onSave,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  isSearching,
  searchResults,
  addingGear,
  onSelectGear,
  onClearSelectedGear,
  selectedCategory,
  onCategoryChange,
  selectedGender,
  onGenderChange,
  gearNotes,
  onNotesChange,
}: AddGearModalProps) {
  const [brokenUrls, setBrokenUrls] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="settings-modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <span className="settings-title">ADD GEAR</span>
          <button type="button" onClick={onClose} className="settings-close">×</button>
        </div>

        <div className="settings-content">
          {!addingGear ? (
            <>
              {/* Search */}
              <div className="mb-4">
                <label className="settings-label">Search for gear</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                    placeholder="e.g. Arc'teryx Beta AR"
                    className="input-small flex-1"
                  />
                  <button
                    onClick={onSearch}
                    disabled={isSearching || searchQuery.length < 2}
                    className="btn-action"
                  >
                    {isSearching ? '...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* Results */}
              {searchResults.length > 0 && (
                <div className="gear-box-dropdown" style={{ maxHeight: '300px' }}>
                  {searchResults.map((product, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSelectGear(product)}
                      className="gear-box-dropdown-item flex items-center gap-3"
                    >
                      {product.imageUrl && !brokenUrls.has(product.imageUrl) && (
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="w-12 h-12 object-cover rounded flex-shrink-0"
                          onError={() => setBrokenUrls(prev => new Set(prev).add(product.imageUrl!))}
                        />
                      )}
                      <div className="flex-1 text-left">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted">{product.specs}</div>
                        {product.category && (
                          <div className="text-xs link">{product.category} {product.gender && `• ${product.gender}`}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Selected gear details */}
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  {addingGear.imageUrl && !brokenUrls.has(addingGear.imageUrl) && (
                    <img
                      src={addingGear.imageUrl}
                      alt=""
                      className="w-16 h-16 object-cover rounded flex-shrink-0"
                      onError={() => setBrokenUrls(prev => new Set(prev).add(addingGear.imageUrl!))}
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{addingGear.name}</div>
                    <div className="text-sm text-muted">{addingGear.specs}</div>
                    {addingGear.productUrl && (
                      <a href={addingGear.productUrl} target="_blank" rel="noopener noreferrer" className="text-xs link hover:underline">
                        View on manufacturer site
                      </a>
                    )}
                  </div>
                </div>

                {/* Expandable description & reviews */}
                {(addingGear.description || addingGear.reviews?.length) && (
                  <div className="mt-3 border-t pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDetails(!showDetails)}
                      className="text-xs link hover:underline flex items-center gap-1"
                    >
                      {showDetails ? '▼' : '▶'} Details & Reviews
                    </button>
                    {showDetails && (
                      <div className="mt-2 text-sm space-y-2">
                        {addingGear.description && (
                          <p className="text-gray-600">{addingGear.description}</p>
                        )}
                        {addingGear.reviews && addingGear.reviews.length > 0 && (
                          <div>
                            <div className="font-medium text-xs text-gray-500 mb-1">REVIEWS</div>
                            <div className="space-y-1">
                              {addingGear.reviews.map((review, idx) => (
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

              {/* Category & Gender */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="settings-label">Category</label>
                  <input
                    type="text"
                    value={selectedCategory}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    placeholder="e.g. Shell Jackets, Footwear"
                    className="input-small w-full"
                  />
                </div>
                <div className="w-28">
                  <label className="settings-label">Gender</label>
                  <select
                    value={selectedGender}
                    onChange={(e) => onGenderChange(e.target.value)}
                    className="input-small w-full"
                  >
                    <option value="">-</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>
              </div>
              {addingGear?.subcategory && (
                <div className="text-xs text-muted mb-4">Activity: {addingGear.subcategory}</div>
              )}

              {/* Notes */}
              <div className="mb-4">
                <label className="settings-label">Notes (optional)</label>
                <input
                  type="text"
                  value={gearNotes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  placeholder="e.g. Size M, bought 2023"
                  className="input-small w-full"
                />
              </div>
            </>
          )}
        </div>

        {addingGear && (
          <div className="settings-footer">
            <div className="flex gap-2">
              <button
                onClick={onClearSelectedGear}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={onSave}
                disabled={!selectedCategory}
                className="settings-save flex-1"
              >
                Save to Portfolio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
