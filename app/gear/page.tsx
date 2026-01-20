'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Header from '@/components/Header';
import StarRating, { getRatingLabel } from '@/components/StarRating';
import { CATEGORY_CONFIG } from '@/lib/constants';

interface ExternalReview {
  source: string;
  url: string;
  rating?: string;
}

interface GearItem {
  id: string;
  gearCatalogId: string;
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  gender?: string;
  imageUrl?: string;
  description?: string;
  productUrl?: string;
  reviews?: ExternalReview[];
  specs: string;
  notes?: string;
  addedAt: string;
  weightG?: number | null;
  weightEstimated?: boolean;
  userReview?: {
    rating: number;
    title?: string;
    review?: string;
    conditions?: string;
    created_at: string;
  };
}

interface ProductMatch {
  id?: string;
  name: string;
  brand: string;
  category?: string;
  subcategory?: string;
  gender?: string;
  imageUrl?: string;
  description?: string;
  productUrl?: string;
  reviews?: ExternalReview[];
  specs: string;
  source?: 'database' | 'online';
}

export default function GearPage() {
  const { data: session, status } = useSession();
  const [gear, setGear] = useState<GearItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [addingGear, setAddingGear] = useState<ProductMatch | null>(null);
  const [gearNotes, setGearNotes] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [brokenUrls, setBrokenUrls] = useState<Set<string>>(new Set());
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Review modal state
  const [reviewingGear, setReviewingGear] = useState<GearItem | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewConditions, setReviewConditions] = useState('');
  const [isSavingReview, setIsSavingReview] = useState(false);

  // Weight editing state
  const [editingWeightId, setEditingWeightId] = useState<string | null>(null);
  const [editingWeightValue, setEditingWeightValue] = useState('');

  // Load user's gear
  useEffect(() => {
    if (session?.user?.id) {
      loadGear();
    } else if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [session, status]);

  const loadGear = async () => {
    try {
      const response = await fetch('/api/gear');
      const data = await response.json();
      setGear(data.gear || []);
    } catch (error) {
      console.error('Failed to load gear:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;

    setIsSearching(true);
    try {
      const response = await fetch('/api/search-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery.trim(),
          online: true,
        }),
      });
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectGear = (product: ProductMatch) => {
    setAddingGear(product);
    setSearchResults([]);
    if (product.category) setSelectedCategory(product.category);
    if (product.gender) setSelectedGender(product.gender);
  };

  const handleSaveGear = async () => {
    if (!addingGear || !selectedCategory) return;

    try {
      const response = await fetch('/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addingGear.name,
          brand: addingGear.brand,
          specs: addingGear.specs,
          category: selectedCategory,
          subcategory: addingGear.subcategory,
          gender: selectedGender,
          imageUrl: addingGear.imageUrl,
          description: addingGear.description,
          productUrl: addingGear.productUrl,
          reviews: addingGear.reviews,
          notes: gearNotes,
        }),
      });

      if (response.ok) {
        await loadGear();
        closeAddModal();
      }
    } catch (error) {
      console.error('Failed to save gear:', error);
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddingGear(null);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedCategory('');
    setSelectedGender('');
    setGearNotes('');
    setShowDetails(false);
  };

  const handleDeleteGear = async (id: string) => {
    if (!confirm('Remove this gear from your portfolio?')) return;

    try {
      await fetch(`/api/gear?id=${id}`, { method: 'DELETE' });
      await loadGear();
    } catch (error) {
      console.error('Failed to delete gear:', error);
    }
  };

  const openReviewModal = (item: GearItem) => {
    setReviewingGear(item);
    setReviewRating(item.userReview?.rating || 0);
    setReviewTitle(item.userReview?.title || '');
    setReviewText(item.userReview?.review || '');
    setReviewConditions(item.userReview?.conditions || '');
  };

  const closeReviewModal = () => {
    setReviewingGear(null);
    setReviewRating(0);
    setReviewTitle('');
    setReviewText('');
    setReviewConditions('');
  };

  const handleSaveReview = async () => {
    if (!reviewingGear || reviewRating === 0) return;

    setIsSavingReview(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gearId: reviewingGear.gearCatalogId,
          rating: reviewRating,
          title: reviewTitle || null,
          review: reviewText || null,
          conditions: reviewConditions || null,
        }),
      });

      if (response.ok) {
        await loadGear();
        closeReviewModal();
      }
    } catch (error) {
      console.error('Failed to save review:', error);
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleSaveWeight = async (gearCatalogId: string) => {
    const weightG = parseInt(editingWeightValue);
    if (isNaN(weightG) || weightG < 0) {
      setEditingWeightId(null);
      return;
    }

    try {
      await fetch('/api/gear/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gearCatalogId, weightG }),
      });
      await loadGear();
    } catch (error) {
      console.error('Failed to save weight:', error);
    } finally {
      setEditingWeightId(null);
      setEditingWeightValue('');
    }
  };

  const formatWeight = (g: number | null | undefined, estimated?: boolean) => {
    if (!g) return null;
    const prefix = estimated ? '~' : '';
    return g >= 1000 ? `${prefix}${(g / 1000).toFixed(2)}kg` : `${prefix}${g}g`;
  };

  // Group gear by category
  const gearByCategory = gear.reduce((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, GearItem[]>);

  // Default all categories to collapsed on initial load
  useEffect(() => {
    if (gear.length > 0 && collapsedCategories.size === 0) {
      const allCategories = new Set(gear.map(g => g.category || 'other'));
      setCollapsedCategories(allCategories);
    }
  }, [gear, collapsedCategories.size]);

  // Not logged in
  if (status !== 'loading' && !session) {
    return (
      <>
        <Header activePage="gear" />
        <div className="main-content">
          <div className="max-w-4xl mx-auto p-4">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4">Your Gear Portfolio</h1>
              <p className="text-muted mb-6">Sign in to save and manage your gear collection.</p>
              <button onClick={() => signIn('google')} className="btn-primary">Sign in with Google</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header activePage="gear" />

      <div className="main-content">
        <div className="max-w-4xl mx-auto p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-xl font-bold">Your Gear Portfolio</h1>
              <p className="text-muted text-sm">{gear.length} items</p>
            </div>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              + Add Gear
            </button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="text-center py-12 text-muted">Loading your gear...</div>
          )}

          {/* Empty state */}
          {!isLoading && gear.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted mb-4">No gear in your portfolio yet.</p>
              <button onClick={() => setShowAddModal(true)} className="btn-primary">
                Add Your First Item
              </button>
            </div>
          )}

          {/* Gear by category */}
          {!isLoading && gear.length > 0 && (
            <div className="space-y-6">
              {Object.entries(gearByCategory).map(([category, items]) => {
                if (!items || items.length === 0) return null;

                const isCategoryCollapsed = collapsedCategories.has(category);

                const toggleCategory = () => {
                  setCollapsedCategories(prev => {
                    const newSet = new Set(prev);
                    if (isCategoryCollapsed) {
                      newSet.delete(category);
                    } else {
                      newSet.add(category);
                    }
                    return newSet;
                  });
                };

                return (
                  <div key={category} className="gear-portfolio-section">
                    <button
                      type="button"
                      onClick={toggleCategory}
                      className="gear-portfolio-header gear-portfolio-header-toggle"
                    >
                      <span className="flex items-center gap-2">
                        <svg
                          className={`w-3 h-3 transition-transform ${isCategoryCollapsed ? '' : 'rotate-90'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M6 6L14 10L6 14V6Z" />
                        </svg>
                        {category.toUpperCase()}
                      </span>
                      <span className="text-muted text-xs ml-1">({items.length})</span>
                    </button>
                    {!isCategoryCollapsed && (
                      <div className="gear-portfolio-items">
                        {items.map((item) => {
                          const isExpanded = expandedItems.has(item.id);
                          const hasDetails = item.description || (item.reviews && item.reviews.length > 0);
                          const isEditingWeight = editingWeightId === item.id;

                          return (
                            <div key={item.id} className="gear-portfolio-item flex-col items-stretch">
                              <div className="flex items-start gap-3">
                                {item.imageUrl && !brokenImages.has(item.id) && (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-16 h-16 object-cover rounded flex-shrink-0"
                                    onError={() => setBrokenImages(prev => new Set(prev).add(item.id))}
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
                                          onChange={(e) => setEditingWeightValue(e.target.value)}
                                          placeholder="grams"
                                          className="w-20 px-2 py-0.5 text-xs border rounded"
                                          autoFocus
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveWeight(item.gearCatalogId);
                                            if (e.key === 'Escape') setEditingWeightId(null);
                                          }}
                                        />
                                        <span className="text-xs text-muted">g</span>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveWeight(item.gearCatalogId)}
                                          className="text-xs link"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingWeightId(item.id);
                                          setEditingWeightValue(item.weightG?.toString() || '');
                                        }}
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
                                        onClick={() => openReviewModal(item)}
                                        className="flex items-center gap-1 star-rating hover:opacity-80"
                                        title="Edit your review"
                                      >
                                        <StarRating rating={item.userReview.rating} readonly />
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => openReviewModal(item)}
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
                                  onClick={() => handleDeleteGear(item.id)}
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
                                    onClick={() => {
                                      setExpandedItems(prev => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(item.id)) {
                                          newSet.delete(item.id);
                                        } else {
                                          newSet.add(item.id);
                                        }
                                        return newSet;
                                      });
                                    }}
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
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Gear Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeAddModal}>
          <div className="settings-modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="settings-header">
              <span className="settings-title">ADD GEAR</span>
              <button type="button" onClick={closeAddModal} className="settings-close">×</button>
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
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="e.g. Arc'teryx Beta AR"
                        className="input-small flex-1"
                      />
                      <button
                        onClick={handleSearch}
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
                          onClick={() => handleSelectGear(product)}
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
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        placeholder="e.g. Shell Jackets, Footwear"
                        className="input-small w-full"
                      />
                    </div>
                    <div className="w-28">
                      <label className="settings-label">Gender</label>
                      <select
                        value={selectedGender}
                        onChange={(e) => setSelectedGender(e.target.value)}
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
                      onChange={(e) => setGearNotes(e.target.value)}
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
                    onClick={() => setAddingGear(null)}
                    className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSaveGear}
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
      )}

      {/* Review Modal */}
      {reviewingGear && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeReviewModal}>
          <div className="settings-modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="settings-header">
              <span className="settings-title">REVIEW GEAR</span>
              <button type="button" onClick={closeReviewModal} className="settings-close">×</button>
            </div>

            <div className="settings-content">
              {/* Gear being reviewed */}
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <div className="font-medium">{reviewingGear.name}</div>
                <div className="text-sm text-muted">{reviewingGear.specs}</div>
              </div>

              {/* Star rating */}
              <div className="mb-4">
                <label className="settings-label">Your Rating *</label>
                <div className="flex items-center gap-2">
                  <StarRating rating={reviewRating} onRate={setReviewRating} />
                  {reviewRating > 0 && (
                    <span className="text-sm text-muted">{getRatingLabel(reviewRating)}</span>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="settings-label">Review Title (optional)</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g. Bombproof in all conditions"
                  className="input-small w-full"
                />
              </div>

              {/* Conditions */}
              <div className="mb-4">
                <label className="settings-label">Conditions Tested (optional)</label>
                <input
                  type="text"
                  value={reviewConditions}
                  onChange={(e) => setReviewConditions(e.target.value)}
                  placeholder="e.g. Heavy rain, -10°C, alpine terrain"
                  className="input-small w-full"
                />
              </div>

              {/* Review text */}
              <div className="mb-4">
                <label className="settings-label">Your Review (optional)</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this gear..."
                  className="input-small w-full"
                  rows={4}
                />
              </div>
            </div>

            <div className="settings-footer">
              <div className="flex gap-2">
                <button onClick={closeReviewModal} className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleSaveReview}
                  disabled={reviewRating === 0 || isSavingReview}
                  className="settings-save flex-1"
                >
                  {isSavingReview ? 'Saving...' : reviewingGear.userReview ? 'Update Review' : 'Save Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
