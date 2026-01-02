'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface GearItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  specs: string;
  notes?: string;
  addedAt: string;
}

interface ProductMatch {
  id?: string;
  name: string;
  brand: string;
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
  const [addingGear, setAddingGear] = useState<ProductMatch | null>(null);
  const [gearNotes, setGearNotes] = useState('');

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
      const response = await fetch('/api/user-gear');
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
  };

  const handleSaveGear = async () => {
    if (!addingGear || !selectedCategory) return;

    try {
      const response = await fetch('/api/user-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addingGear.name,
          brand: addingGear.brand,
          specs: addingGear.specs,
          category: selectedCategory,
          notes: gearNotes,
        }),
      });

      if (response.ok) {
        await loadGear();
        setShowAddModal(false);
        setAddingGear(null);
        setSearchQuery('');
        setSelectedCategory('');
        setGearNotes('');
      }
    } catch (error) {
      console.error('Failed to save gear:', error);
    }
  };

  const handleDeleteGear = async (id: string) => {
    if (!confirm('Remove this gear from your portfolio?')) return;

    try {
      await fetch(`/api/user-gear?id=${id}`, { method: 'DELETE' });
      await loadGear();
    } catch (error) {
      console.error('Failed to delete gear:', error);
    }
  };

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
            <Link href="/" className="logo-light">pakr</Link>
          </div>
        </div>
        <div className="main-content">
          <div className="max-w-4xl mx-auto p-4">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4">Your Gear Portfolio</h1>
              <p className="text-muted mb-6">Sign in to save and manage your gear collection.</p>
              <Link href="/" className="btn-primary">← Back to Home</Link>
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
          <Link href="/" className="logo-light">pakr</Link>
          <div className="flex items-center gap-4">
            <span className="text-white/70 text-sm">My Gear</span>
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
              {Object.entries(CATEGORY_CONFIG).map(([catKey, config]) => {
                const items = gearByCategory[catKey];
                if (!items || items.length === 0) return null;

                return (
                  <div key={catKey} className="gear-portfolio-section">
                    <div className="gear-portfolio-header">
                      <span>{config.icon}</span>
                      <span>{config.label}</span>
                      <span className="text-muted text-sm ml-2">({items.length})</span>
                    </div>
                    <div className="gear-portfolio-items">
                      {items.map((item) => (
                        <div key={item.id} className="gear-portfolio-item">
                          <div className="gear-portfolio-item-main">
                            <div className="gear-portfolio-item-name">{item.name}</div>
                            <div className="gear-portfolio-item-specs">{item.specs}</div>
                            {item.notes && (
                              <div className="gear-portfolio-item-notes">{item.notes}</div>
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
                      ))}
                    </div>
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
                    <div className="gear-box-dropdown" style={{ maxHeight: '250px' }}>
                      {searchResults.map((product, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectGear(product)}
                          className="gear-box-dropdown-item"
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-muted">{product.specs}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Selected gear details */}
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <div className="font-medium">{addingGear.name}</div>
                    <div className="text-sm text-muted">{addingGear.specs}</div>
                  </div>

                  {/* Category selection */}
                  <div className="mb-4">
                    <label className="settings-label">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="input-small w-full"
                    >
                      <option value="">Select category...</option>
                      {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>

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
    </>
  );
}
