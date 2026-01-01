'use client';

import { useState, FormEvent } from 'react';

interface GearRequirement {
  item: string;
  specs: string;
  category?: string;
  priority: 'critical' | 'recommended' | 'optional';
}

interface TripAnalysis {
  name: string;
  region: string;
  duration: string;
  conditions: string[];
  gear: GearRequirement[];
}

interface UserGearEntry {
  input: string;
  status: 'suitable' | 'marginal' | 'unsuitable' | 'empty';
  reasons: string[];
}

interface ProductMatch {
  name: string;
  brand: string;
  specs: string;
}

interface GearSearchState {
  isSearching: boolean;
  results: ProductMatch[];
  showResults: boolean;
}

export default function Home() {
  const [objective, setObjective] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trip, setTrip] = useState<TripAnalysis | null>(null);
  const [userGear, setUserGear] = useState<Record<string, UserGearEntry>>({});
  const [exactSpecs, setExactSpecs] = useState(false);
  const [gearSearch, setGearSearch] = useState<Record<string, GearSearchState>>({});

  const handleAnalyze = async (e: FormEvent) => {
    e.preventDefault();
    if (!objective.trim() || isLoading) return;

    setIsLoading(true);
    setTrip(null);
    setUserGear({});

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective: objective.trim() }),
      });

      const data = await response.json();
      if (data.trip) {
        setTrip(data.trip);
        // Initialize empty user gear entries
        const initial: Record<string, UserGearEntry> = {};
        data.trip.gear.forEach((g: GearRequirement) => {
          initial[g.item] = { input: '', status: 'empty', reasons: [] };
        });
        setUserGear(initial);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Just update the input value - no validation
  const handleGearChange = (item: string, value: string) => {
    setUserGear(prev => ({
      ...prev,
      [item]: { ...prev[item], input: value }
    }));
    // Clear any previous search results when typing
    setGearSearch(prev => ({
      ...prev,
      [item]: { isSearching: false, results: [], showResults: false }
    }));
  };

  // Search for matching products (exact specs mode)
  const handleGearSearch = async (item: string) => {
    const entry = userGear[item];
    if (!entry?.input.trim() || entry.input.trim().length < 2) {
      return;
    }

    const requirement = trip?.gear.find(g => g.item === item);

    setGearSearch(prev => ({
      ...prev,
      [item]: { isSearching: true, results: [], showResults: true }
    }));

    try {
      const response = await fetch('/api/search-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: entry.input.trim(),
          category: requirement?.category
        }),
      });
      const data = await response.json();

      setGearSearch(prev => ({
        ...prev,
        [item]: {
          isSearching: false,
          results: data.results || [],
          showResults: true
        }
      }));
    } catch {
      setGearSearch(prev => ({
        ...prev,
        [item]: { isSearching: false, results: [], showResults: false }
      }));
    }
  };

  // Select a product from search results
  const handleSelectProduct = async (item: string, product: ProductMatch) => {
    // Set the input to the selected product name
    setUserGear(prev => ({
      ...prev,
      [item]: { ...prev[item], input: product.name }
    }));
    // Hide search results
    setGearSearch(prev => ({
      ...prev,
      [item]: { ...prev[item], showResults: false }
    }));
    // Now validate
    await validateGear(item, product.name);
  };

  // Core validation function
  const validateGear = async (item: string, gearText: string) => {
    const requirement = trip?.gear.find(g => g.item === item);
    if (!requirement) return;

    try {
      const response = await fetch('/api/validate-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userGear: gearText,
          requirement: requirement,
          tripContext: trip ? {
            name: trip.name,
            region: trip.region,
            duration: trip.duration,
            conditions: trip.conditions
          } : null
        }),
      });
      const data = await response.json();
      setUserGear(prev => ({
        ...prev,
        [item]: {
          input: prev[item].input,
          status: data.status || 'empty',
          reasons: data.reasons || []
        }
      }));
    } catch {
      // Validation failed, keep as is
    }
  };

  // Handle blur/Enter - search if exact specs, validate if general
  const handleGearSubmit = async (item: string) => {
    const entry = userGear[item];
    if (!entry?.input.trim()) {
      setUserGear(prev => ({
        ...prev,
        [item]: { input: '', status: 'empty', reasons: [] }
      }));
      return;
    }

    if (exactSpecs) {
      await handleGearSearch(item);
    } else {
      await validateGear(item, entry.input.trim());
    }
  };

  // Close search dropdown
  const handleCloseSearch = (item: string) => {
    setGearSearch(prev => ({
      ...prev,
      [item]: { ...prev[item], showResults: false }
    }));
  };

  // FIND button - search for gear recommendations
  const handleFindGear = async (item: string, category?: string) => {
    // Use the requirement item as the search query
    setGearSearch(prev => ({
      ...prev,
      [item]: { isSearching: true, results: [], showResults: true }
    }));

    try {
      const response = await fetch('/api/search-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: item, // Search for the required item type
          category: category
        }),
      });
      const data = await response.json();

      setGearSearch(prev => ({
        ...prev,
        [item]: {
          isSearching: false,
          results: data.results || [],
          showResults: true
        }
      }));
    } catch {
      setGearSearch(prev => ({
        ...prev,
        [item]: { isSearching: false, results: [], showResults: false }
      }));
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'suitable': return { icon: '●', color: '#2C5530', label: 'Good' };
      case 'marginal': return { icon: '◐', color: '#CC5500', label: 'Check' };
      case 'unsuitable': return { icon: '○', color: '#2B2B2B', label: 'No' };
      default: return { icon: '–', color: '#6B6B6B', label: '' };
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header with input - always visible */}
      <header className="sticky top-0 bg-cream border-b-2 border-charcoal p-4 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="logo">pakr</span>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <span className="text-muted">{exactSpecs ? 'Exact specs' : 'General'}</span>
              <button
                type="button"
                onClick={() => setExactSpecs(!exactSpecs)}
                className={`relative w-10 h-5 rounded-full transition-colors ${exactSpecs ? 'bg-forest' : 'bg-gray-300'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${exactSpecs ? 'translate-x-5' : ''}`}
                />
              </button>
            </label>
          </div>
          <form onSubmit={handleAnalyze} className="flex gap-3">
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="What's your objective? e.g. Overland Track in October"
              className="input-field flex-1"
              autoFocus
            />
            <button
              type="submit"
              disabled={!objective.trim() || isLoading}
              className="btn-primary whitespace-nowrap"
            >
              {isLoading ? 'Analyzing...' : 'Analyze'}
            </button>
          </form>
        </div>
      </header>

      {/* Results */}
      <main className="max-w-4xl mx-auto p-4">
        {isLoading && (
          <div className="text-center py-12 text-muted">
            Analyzing trip requirements...
          </div>
        )}

        {trip && !isLoading && (
          <>
            {/* Trip Summary */}
            <div className="trip-summary mb-6">
              <h2 className="text-xl font-bold mb-2">{trip.name}</h2>
              <p className="text-muted">{trip.region} · {trip.duration}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {trip.conditions.map((c, i) => (
                  <span key={i} className="condition-tag">{c}</span>
                ))}
              </div>
            </div>

            {/* Gear Table */}
            <table className="gear-table">
              <thead>
                <tr>
                  <th className="text-left">Required</th>
                  <th className="text-left">You Have</th>
                  <th className="text-center w-20">Status</th>
                  <th className="text-right w-28">Action</th>
                </tr>
              </thead>
              <tbody>
                {trip.gear.map((g) => {
                  const entry = userGear[g.item] || { input: '', status: 'empty', reasons: [] };
                  const search = gearSearch[g.item] || { isSearching: false, results: [], showResults: false };
                  const status = getStatusIndicator(entry.status);
                  const needsAction = entry.status === 'empty' || entry.status === 'unsuitable';
                  const needsUpgrade = entry.status === 'marginal';

                  return (
                    <tr key={g.item} className={g.priority === 'critical' ? 'critical' : ''}>
                      <td>
                        <div className="font-medium">{g.item}</div>
                        <div className="text-sm text-muted">{g.specs}</div>
                      </td>
                      <td className="relative">
                        <input
                          type="text"
                          value={entry.input}
                          onChange={(e) => handleGearChange(g.item, e.target.value)}
                          onBlur={() => {
                            // Delay to allow click on results
                            setTimeout(() => handleCloseSearch(g.item), 200);
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && handleGearSubmit(g.item)}
                          placeholder={exactSpecs ? "Search your gear..." : "What do you have?"}
                          className="input-small"
                        />
                        {/* Search results dropdown */}
                        {search.showResults && (
                          <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                            {search.isSearching ? (
                              <div className="p-3 text-sm text-muted">Searching...</div>
                            ) : search.results.length === 0 ? (
                              <div className="p-3 text-sm text-muted">No matches found</div>
                            ) : (
                              search.results.map((product, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSelectProduct(g.item, product)}
                                  className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-sm">{product.name}</div>
                                  <div className="text-xs text-muted">{product.specs}</div>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                        {entry.reasons.length > 0 && !search.showResults && (
                          <div className="text-xs text-muted mt-1">
                            {entry.reasons[0]}
                          </div>
                        )}
                      </td>
                      <td className="text-center">
                        <span style={{ color: status.color, fontSize: '1.25rem' }}>
                          {status.icon}
                        </span>
                      </td>
                      <td className="text-right">
                        {needsAction && (
                          <button
                            className="btn-action"
                            onClick={() => handleFindGear(g.item, g.category)}
                          >
                            FIND
                          </button>
                        )}
                        {needsUpgrade && (
                          <button
                            className="btn-action btn-upgrade"
                            onClick={() => handleFindGear(g.item, g.category)}
                          >
                            UPGRADE
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {!trip && !isLoading && (
          <div className="text-center py-12 text-muted">
            Enter your objective above to see gear requirements
          </div>
        )}
      </main>
    </div>
  );
}
