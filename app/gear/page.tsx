'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import AnimatedLogo from '@/components/AnimatedLogo';
import { BackpackIcon, MountainIcon } from '@/components/NavIcons';

const COUNTRIES = [
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'IT', name: 'Italy' },
];

const getFlagUrl = (code: string) => `https://flagcdn.com/24x18/${code.toLowerCase()}.png`;

interface ExternalReview {
  source: string;
  url: string;
  rating?: string;
}

interface UserReview {
  id: string;
  rating: number;
  title?: string;
  review?: string;
  conditions?: string;
  created_at: string;
  gear_id: string;
  trip_name?: string;
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

// Category display configuration
const CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  'footwear': { label: 'FOOTWEAR', icon: '👟' },
  'clothing_base': { label: 'BASE LAYERS', icon: '🧵' },
  'clothing_mid': { label: 'MID LAYERS', icon: '🧥' },
  'clothing_outer': { label: 'OUTER LAYERS', icon: '🧥' },
  'clothing_accessories': { label: 'ACCESSORIES', icon: '🧤' },
  'backpacks': { label: 'BACKPACKS', icon: '🎒' },
  'shelter': { label: 'SHELTER', icon: '⛺' },
  'sleep': { label: 'SLEEP SYSTEM', icon: '🛏️' },
  'climbing': { label: 'CLIMBING GEAR', icon: '🧗' },
  'safety': { label: 'SAFETY & NAVIGATION', icon: '🧭' },
  'cooking': { label: 'COOKING', icon: '🍳' },
  'other': { label: 'OTHER', icon: '📦' },
};

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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [userCountry, setUserCountry] = useState<{ code: string; name: string } | null>(null);
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

  // Auto-detect country on mount
  useEffect(() => {
    const saved = localStorage.getItem('pakr-country');
    if (saved) {
      setUserCountry(JSON.parse(saved));
    } else {
      fetch('https://ipapi.co/json/')
        .then(r => r.json())
        .then(data => {
          const country = COUNTRIES.find(c => c.code === data.country_code);
          if (country) setUserCountry(country);
        })
        .catch(() => {});
    }
  }, []);

  // Save country preference
  useEffect(() => {
    if (userCountry) {
      localStorage.setItem('pakr-country', JSON.stringify(userCountry));
    }
  }, [userCountry]);

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
    // Use category and gender from LLM if provided
    if (product.category) {
      setSelectedCategory(product.category);
    }
    if (product.gender) {
      setSelectedGender(product.gender);
    }
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
        setShowAddModal(false);
        setAddingGear(null);
        setSearchQuery('');
        setSelectedCategory('');
        setSelectedGender('');
        setGearNotes('');
        setShowDetails(false);
      }
    } catch (error) {
      console.error('Failed to save gear:', error);
    }
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

  // Star rating component
  const StarRating = ({ rating, onRate, readonly = false }: { rating: number; onRate?: (r: number) => void; readonly?: boolean }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onRate?.(star)}
          disabled={readonly}
          className={`text-lg ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          {star <= rating ? '★' : '☆'}
        </button>
      ))}
    </div>
  );

  // Group gear by category
  const gearByCategory = gear.reduce((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, GearItem[]>);

  // Not logged in
  if (status !== 'loading' && !session) {
    return (
      <>
        <div className="red-band">
          <div className="red-band-container">
            <AnimatedLogo variant="light" size="small" />
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => signIn('google')}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                title="Sign in"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
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
      <div className="red-band">
        <div className="red-band-container">
          <AnimatedLogo variant="light" size="small" />
          <div className="flex items-center gap-4">
            {/* Nav links */}
            <div className="flex items-center gap-1 md:gap-3">
              <Link href="/gear" className="nav-link nav-link-active text-white text-sm font-medium" aria-label="My Gear">
                <span className="nav-link-icon"><BackpackIcon isActive /></span>
                <span className="nav-link-text">My Gear</span>
              </Link>
              <Link href="/trips" className="nav-link text-white/80 hover:text-white text-sm font-medium transition-colors" aria-label="My Trips">
                <span className="nav-link-icon"><MountainIcon /></span>
                <span className="nav-link-text">My Trips</span>
              </Link>
            </div>

            {/* Country selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                className="hover:opacity-80 transition-opacity"
                title={userCountry?.name || 'Select country'}
              >
                {userCountry ? (
                  <img src={getFlagUrl(userCountry.code)} alt={userCountry.name} className="w-6 h-4 object-cover rounded-sm" />
                ) : (
                  <span className="text-white text-sm">🌍</span>
                )}
              </button>
              {showCountryDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-64 overflow-y-auto min-w-[180px]">
                  {COUNTRIES.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => {
                        setUserCountry(country);
                        setShowCountryDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${userCountry?.code === country.code ? 'bg-gray-50' : ''}`}
                    >
                      <img src={getFlagUrl(country.code)} alt="" className="w-5 h-4 object-cover rounded-sm" />
                      <span className="text-charcoal">{country.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User avatar / login */}
            <div className="relative">
              {session?.user ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/30 hover:border-white/60 transition-colors"
                  >
                    {session.user.image ? (
                      <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/20 flex items-center justify-center text-white text-sm font-medium">
                        {session.user.name?.[0] || session.user.email?.[0] || '?'}
                      </div>
                    )}
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[160px]">
                      <div className="px-3 py-2 border-b border-gray-100">
                        <div className="text-sm font-medium text-charcoal">{session.user.name}</div>
                        <div className="text-xs text-muted">{session.user.email}</div>
                      </div>
                      <Link
                        href="/"
                        className="block w-full px-3 py-2 text-left text-sm text-charcoal hover:bg-gray-100"
                      >
                        Home
                      </Link>
                      <button
                        type="button"
                        onClick={() => signOut()}
                        className="w-full px-3 py-2 text-left text-sm text-charcoal hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => signIn('google')}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                  title="Sign in"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="max-w-4xl mx-auto p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-xl font-bold">Your Gear Portfolio</h1>
              <p className="text-muted text-sm">{gear.length} items</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
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
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary"
              >
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
                      <span className="text-white/60 text-sm ml-2">({items.length})</span>
                    </button>
                    {!isCategoryCollapsed && (
                    <div className="gear-portfolio-items">
                      {items.map((item) => {
                        const isExpanded = expandedItems.has(item.id);
                        const hasDetails = item.description || (item.reviews && item.reviews.length > 0);
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
                                    const newSet = new Set(expandedItems);
                                    if (isExpanded) {
                                      newSet.delete(item.id);
                                    } else {
                                      newSet.add(item.id);
                                    }
                                    setExpandedItems(newSet);
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="settings-modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="settings-header">
              <span className="settings-title">ADD GEAR</span>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setAddingGear(null);
                  setSearchResults([]);
                  setSearchQuery('');
                  setSelectedCategory('');
                  setSelectedGender('');
                  setShowDetails(false);
                }}
                className="settings-close"
              >
                ×
              </button>
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

                  {/* Category & Gender - from manufacturer */}
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
                    <span className="text-sm text-muted">
                      {reviewRating === 5 ? 'Excellent' : reviewRating === 4 ? 'Great' : reviewRating === 3 ? 'Good' : reviewRating === 2 ? 'Fair' : 'Poor'}
                    </span>
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
