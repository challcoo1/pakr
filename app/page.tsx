'use client';

import { useState, FormEvent } from 'react';

interface GearRequirement {
  item: string;
  specs: string;
  category?: string;
  priority: 'critical' | 'recommended' | 'optional';
}

interface TripMatch {
  name: string;
  location: string;
  difficulty: string;
  duration: string;
  distance: string;
  terrain: string;
  elevation: string;
  hazards: string;
  summary: string;
}

interface TripAnalysis {
  name: string;
  region: string;
  timeOfYear: string;
  duration: string;
  distance: string;
  elevation: string;
  grading: {
    local: string;
    international: string;
    description: string;
  };
  terrain: string;
  hazards: string;
  conditions: string[];
  gear: GearRequirement[];
}

interface UserGearEntry {
  input: string;
  status: 'ideal' | 'suitable' | 'adequate' | 'unsuitable' | 'empty';
  reasons: string[];
}

interface ProductMatch {
  id?: string;
  name: string;
  brand: string;
  specs: string;
  source?: 'database' | 'online';
  isNew?: boolean;
}

interface Recommendation {
  topPick: {
    name: string;
    brand: string;
    reason: string;
    source: string;
  } | null;
  alternatives: {
    name: string;
    brand: string;
    comparison: string;
    source: string;
  }[];
}

interface GearSearchState {
  isSearching: boolean;
  isSearchingOnline: boolean;
  results: ProductMatch[];
  recommendation: Recommendation | null;
  showResults: boolean;
}

// Confirmation step fields
interface TripConfirm {
  place: string;
  timeOfYear: string;
  duration: string;
}

export default function Home() {
  const [objective, setObjective] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tripResults, setTripResults] = useState<TripMatch[]>([]);
  const [showTripResults, setShowTripResults] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripMatch | null>(null);
  const [trip, setTrip] = useState<TripAnalysis | null>(null);
  const [userGear, setUserGear] = useState<Record<string, UserGearEntry>>({});
  const [exactSpecs, setExactSpecs] = useState(false);
  const [gearSearch, setGearSearch] = useState<Record<string, GearSearchState>>({});

  // Confirmation step
  const [tripConfirm, setTripConfirm] = useState<TripConfirm | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Extract time of year from query string
  const extractTimeOfYear = (query: string): string => {
    const months = ['january', 'february', 'march', 'april', 'may', 'june',
                    'july', 'august', 'september', 'october', 'november', 'december'];
    const seasons = ['spring', 'summer', 'autumn', 'fall', 'winter'];
    const lower = query.toLowerCase();

    for (const month of months) {
      if (lower.includes(month)) return month.charAt(0).toUpperCase() + month.slice(1);
    }
    for (const season of seasons) {
      if (lower.includes(season)) return season.charAt(0).toUpperCase() + season.slice(1);
    }
    return '';
  };

  // Initial search - shows confirmation step
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!objective.trim() || isLoading) return;

    setIsLoading(true);
    setTrip(null);
    setSelectedTrip(null);
    setTripResults([]);
    setShowTripResults(false);
    setShowConfirm(false);
    setTripConfirm(null);
    setUserGear({});

    try {
      const searchResponse = await fetch('/api/search-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: objective.trim() }),
      });
      const searchData = await searchResponse.json();

      // If multiple matches, let user choose first
      if (searchData.results && searchData.results.length > 1) {
        setTripResults(searchData.results);
        setShowTripResults(true);
        setIsLoading(false);
        return;
      }

      // Single match or no match - show confirmation
      const match = searchData.results?.[0];
      const timeOfYear = extractTimeOfYear(objective);

      setTripConfirm({
        place: match?.name || objective.trim(),
        timeOfYear: timeOfYear,
        duration: match?.duration || '',
      });
      setSelectedTrip(match || null);
      setShowConfirm(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // User selects from multiple trip options - goes to confirmation
  const handleSelectTrip = (tripMatch: TripMatch) => {
    setShowTripResults(false);
    const timeOfYear = extractTimeOfYear(objective);

    setTripConfirm({
      place: tripMatch.name,
      timeOfYear: timeOfYear,
      duration: tripMatch.duration,
    });
    setSelectedTrip(tripMatch);
    setShowConfirm(true);
  };

  // Re-search with updated confirmation fields
  const handleResearch = async () => {
    if (!tripConfirm?.place.trim()) return;

    setIsLoading(true);

    try {
      // Build query from fields
      let query = tripConfirm.place;
      if (tripConfirm.timeOfYear) query += ` in ${tripConfirm.timeOfYear}`;

      const searchResponse = await fetch('/api/search-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const searchData = await searchResponse.json();

      const match = searchData.results?.[0];
      if (match) {
        setTripConfirm(prev => ({
          ...prev!,
          place: match.name,
          duration: prev?.duration || match.duration,
        }));
        setSelectedTrip(match);
      }
    } catch (error) {
      console.error('Research failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm and analyze
  const handleConfirmAnalyze = async () => {
    if (!tripConfirm) return;

    setIsLoading(true);
    setShowConfirm(false);

    try {
      // Build full objective from confirmed fields
      let fullObjective = tripConfirm.place;
      if (tripConfirm.timeOfYear) fullObjective += ` in ${tripConfirm.timeOfYear}`;
      if (tripConfirm.duration && !tripConfirm.duration.includes('missing')) {
        fullObjective += `, ${tripConfirm.duration}`;
      }

      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective: fullObjective }),
      });
      const analyzeData = await analyzeResponse.json();

      if (analyzeData.trip) {
        setTrip(analyzeData.trip);

        const initial: Record<string, UserGearEntry> = {};
        analyzeData.trip.gear.forEach((g: GearRequirement) => {
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
    setGearSearch(prev => ({
      ...prev,
      [item]: { isSearching: false, isSearchingOnline: false, results: [], recommendation: null, showResults: false }
    }));
  };

  // Search for matching products - DB only (fast)
  const handleGearSearch = async (item: string) => {
    const entry = userGear[item];
    if (!entry?.input.trim() || entry.input.trim().length < 2) {
      return;
    }

    setGearSearch(prev => ({
      ...prev,
      [item]: { isSearching: true, isSearchingOnline: false, results: [], recommendation: null, showResults: true }
    }));

    try {
      const response = await fetch('/api/search-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: entry.input.trim(),
          category: item
        }),
      });
      const data = await response.json();

      setGearSearch(prev => ({
        ...prev,
        [item]: {
          isSearching: false,
          isSearchingOnline: false,
          results: data.results || [],
          recommendation: null,
          showResults: true
        }
      }));
    } catch {
      setGearSearch(prev => ({
        ...prev,
        [item]: { isSearching: false, isSearchingOnline: false, results: [], recommendation: null, showResults: false }
      }));
    }
  };

  // Search online for latest products
  const handleOnlineSearch = async (item: string) => {
    const entry = userGear[item];
    const query = entry?.input.trim() || item;

    setGearSearch(prev => ({
      ...prev,
      [item]: { ...prev[item], isSearchingOnline: true }
    }));

    try {
      const response = await fetch('/api/search-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          category: item,
          online: true
        }),
      });
      const data = await response.json();

      setGearSearch(prev => ({
        ...prev,
        [item]: {
          isSearching: false,
          isSearchingOnline: false,
          results: data.results || [],
          recommendation: null,
          showResults: true
        }
      }));
    } catch {
      setGearSearch(prev => ({
        ...prev,
        [item]: { ...prev[item], isSearchingOnline: false, recommendation: null }
      }));
    }
  };

  // Select a product from search results
  const handleSelectProduct = async (item: string, product: ProductMatch) => {
    setUserGear(prev => ({
      ...prev,
      [item]: { ...prev[item], input: product.name }
    }));
    setGearSearch(prev => ({
      ...prev,
      [item]: { ...prev[item], showResults: false }
    }));

    // If gear is from online search, add to database (self-building)
    if (product.source === 'online') {
      fetch('/api/add-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: product.name,
          brand: product.brand,
          specs: product.specs,
          category: item
        }),
      }).catch(console.error);
    }

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
            grading: trip.grading,
            terrain: trip.terrain,
            hazards: trip.hazards,
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

  // Handle blur/Enter
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

  const handleCloseSearch = (item: string) => {
    setGearSearch(prev => ({
      ...prev,
      [item]: { ...prev[item], showResults: false }
    }));
  };

  const handleRecommend = async (item: string) => {
    const requirement = trip?.gear.find(g => g.item === item);

    setGearSearch(prev => ({
      ...prev,
      [item]: { isSearching: true, isSearchingOnline: false, results: [], recommendation: null, showResults: true }
    }));

    try {
      const response = await fetch('/api/search-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: item,
          category: item,
          online: true,
          tripContext: trip ? {
            name: trip.name,
            region: trip.region,
            duration: trip.duration,
            grading: trip.grading,
            conditions: trip.conditions,
            terrain: trip.terrain,
            hazards: trip.hazards
          } : null,
          requirement: requirement ? {
            item: requirement.item,
            specs: requirement.specs,
            priority: requirement.priority
          } : null
        }),
      });
      const data = await response.json();

      setGearSearch(prev => ({
        ...prev,
        [item]: {
          isSearching: false,
          isSearchingOnline: false,
          results: data.results || [],
          recommendation: data.recommendation || null,
          showResults: true
        }
      }));
    } catch {
      setGearSearch(prev => ({
        ...prev,
        [item]: { isSearching: false, isSearchingOnline: false, results: [], recommendation: null, showResults: false }
      }));
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'ideal': return { icon: '●', color: '#2C5530', label: 'Ideal' };
      case 'suitable': return { icon: '●', color: '#2C5530', label: 'Good' };
      case 'adequate': return { icon: '◐', color: '#CC5500', label: 'OK' };
      case 'unsuitable': return { icon: '○', color: '#2B2B2B', label: 'No' };
      default: return { icon: '–', color: '#6B6B6B', label: '' };
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
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
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Where are you going? e.g. Routeburn Track in October"
              className="input-field w-full pr-10"
              autoFocus
            />
            <button
              type="submit"
              disabled={!objective.trim() || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal disabled:opacity-30"
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </header>

      {/* Results */}
      <main className="max-w-4xl mx-auto p-4">
        {isLoading && !showConfirm && (
          <div className="text-center py-12 text-muted">
            Searching...
          </div>
        )}

        {/* Trip Selection - multiple matches */}
        {showTripResults && tripResults.length > 0 && !isLoading && (
          <div className="space-y-3">
            <p className="text-muted text-sm">Which trip do you mean?</p>
            {tripResults.map((t, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectTrip(t)}
                className="w-full text-left p-4 bg-white border-2 border-charcoal rounded hover:border-burnt transition-colors"
              >
                <div className="font-bold">{t.name}</div>
                <div className="text-sm text-muted">{t.location}</div>
                <div className="text-sm mt-1">{t.duration} · {t.difficulty} · {t.distance}</div>
                <div className="text-xs text-muted mt-1">{t.summary}</div>
              </button>
            ))}
          </div>
        )}

        {/* Confirmation Step */}
        {showConfirm && tripConfirm && !isLoading && (
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
                    onChange={(e) => setTripConfirm({ ...tripConfirm, place: e.target.value })}
                    className="input-small flex-1"
                    placeholder="Trail or destination name"
                  />
                  <button
                    type="button"
                    onClick={handleResearch}
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

              {/* Time of Year */}
              <div>
                <label className="block text-sm font-medium mb-1">Time of Year</label>
                <input
                  type="text"
                  value={tripConfirm.timeOfYear}
                  onChange={(e) => setTripConfirm({ ...tripConfirm, timeOfYear: e.target.value })}
                  className={`input-small w-full ${!tripConfirm.timeOfYear ? 'border-burnt' : ''}`}
                  placeholder={tripConfirm.timeOfYear || 'Missing - enter month or season'}
                />
                {!tripConfirm.timeOfYear && (
                  <div className="text-xs text-burnt mt-1">Missing</div>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium mb-1">Duration</label>
                <input
                  type="text"
                  value={tripConfirm.duration}
                  onChange={(e) => setTripConfirm({ ...tripConfirm, duration: e.target.value })}
                  className={`input-small w-full ${!tripConfirm.duration ? 'border-burnt' : ''}`}
                  placeholder={tripConfirm.duration || 'Missing - e.g. 3 days, 4 hours'}
                />
                {!tripConfirm.duration && (
                  <div className="text-xs text-burnt mt-1">Missing</div>
                )}
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
                onClick={handleConfirmAnalyze}
                disabled={!tripConfirm.place || isLoading}
                className="btn-primary w-full mt-4"
              >
                {isLoading ? 'Analyzing...' : 'Analyze Gear Requirements'}
              </button>
            </div>
          </div>
        )}

        {/* Trip Analysis Results */}
        {trip && !isLoading && !showTripResults && !showConfirm && (
          <>
            {/* Trip Summary Box */}
            <div className="trip-box mb-6">
              <h2 className="trip-box-name">{trip.name.toUpperCase()}</h2>
              <p className="trip-box-line">
                {trip.region}{trip.timeOfYear && ` | ${trip.timeOfYear}`}{trip.duration && ` | ${trip.duration}`}
              </p>
              {trip.grading?.local && (
                <p className="trip-box-line">
                  {trip.grading.local}{trip.grading.international && ` | International: ${trip.grading.international}`}
                </p>
              )}
              {trip.grading?.description && (
                <p className="trip-box-line text-muted">{trip.grading.description}</p>
              )}
              {(trip.elevation || trip.distance) && (
                <p className="trip-box-line">
                  {trip.elevation && `Elevation: ${trip.elevation}`}
                  {trip.elevation && trip.distance && ' | '}
                  {trip.distance && `Distance: ${trip.distance}`}
                </p>
              )}
            </div>

            {/* Gear Requirements */}
            <div className="gear-boxes">
              {trip.gear.map((g) => {
                const entry = userGear[g.item] || { input: '', status: 'empty', reasons: [] };
                const search = gearSearch[g.item] || { isSearching: false, isSearchingOnline: false, results: [], recommendation: null, showResults: false };
                const status = getStatusIndicator(entry.status);

                return (
                  <div key={g.item} className="gear-box">
                    {/* Header */}
                    <div className="gear-box-header">
                      <span className="gear-box-bullet">●</span>
                      <span className="gear-box-title">{g.item.toUpperCase()}</span>
                    </div>
                    <div className="gear-box-specs">{g.specs}</div>

                    <div className="gear-box-divider" />

                    {/* Empty state - show search */}
                    {entry.status === 'empty' && !entry.input && (
                      <div className="gear-box-input-row">
                        <input
                          type="text"
                          value={entry.input}
                          onChange={(e) => handleGearChange(g.item, e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleGearSubmit(g.item)}
                          placeholder="Search your gear..."
                          className="gear-box-input"
                        />
                        <button
                          onClick={() => handleRecommend(g.item)}
                          disabled={search.isSearching || search.isSearchingOnline}
                          className="gear-box-recommend"
                        >
                          {search.isSearching || search.isSearchingOnline ? 'Loading...' : 'Get recommendations →'}
                        </button>
                      </div>
                    )}

                    {/* Has input but not validated yet */}
                    {entry.input && entry.status === 'empty' && (
                      <div className="gear-box-input-row">
                        <input
                          type="text"
                          value={entry.input}
                          onChange={(e) => handleGearChange(g.item, e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleGearSubmit(g.item)}
                          placeholder="Search your gear..."
                          className="gear-box-input"
                        />
                        <button
                          onClick={() => handleRecommend(g.item)}
                          disabled={search.isSearching || search.isSearchingOnline}
                          className="gear-box-recommend"
                        >
                          {search.isSearching || search.isSearchingOnline ? 'Loading...' : 'Get recommendations →'}
                        </button>
                      </div>
                    )}

                    {/* Validated state - show result */}
                    {entry.status !== 'empty' && (
                      <div className="gear-box-result">
                        <div className="gear-box-result-header">
                          <span style={{ color: status.color }}>{status.icon}</span>
                          <span className="gear-box-result-name">{entry.input}</span>
                        </div>
                        {entry.reasons.length > 0 && (
                          <div className={`gear-box-result-status ${entry.status}`}>
                            {entry.status === 'ideal' && 'IDEAL'}
                            {entry.status === 'suitable' && 'SUITABLE'}
                            {entry.status === 'adequate' && 'MARGINAL'}
                            {entry.status === 'unsuitable' && 'UNSUITABLE'}
                            {' - '}{entry.reasons[0]}
                          </div>
                        )}
                        <div className="gear-box-actions">
                          <button
                            onClick={() => {
                              setUserGear(prev => ({
                                ...prev,
                                [g.item]: { input: '', status: 'empty', reasons: [] }
                              }));
                            }}
                            className="gear-box-action"
                          >
                            Change
                          </button>
                          <button
                            onClick={() => handleRecommend(g.item)}
                            disabled={search.isSearching || search.isSearchingOnline}
                            className="gear-box-action-primary"
                          >
                            {search.isSearching || search.isSearchingOnline ? 'Loading...' : 'Get better options →'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Search results / Recommendations */}
                    {search.showResults && (
                      <div className="gear-box-dropdown">
                        {search.isSearching ? (
                          <div className="gear-box-dropdown-item text-muted">Finding recommendations...</div>
                        ) : search.recommendation?.topPick ? (
                          <>
                            {/* Top Pick */}
                            <div className="gear-rec-top">
                              <div className="gear-rec-label">⭐ TOP PICK</div>
                              <button
                                type="button"
                                onClick={() => handleSelectProduct(g.item, {
                                  name: search.recommendation!.topPick!.name,
                                  brand: search.recommendation!.topPick!.brand,
                                  specs: search.recommendation!.topPick!.reason,
                                  source: 'online'
                                })}
                                className="gear-rec-pick"
                              >
                                <div className="gear-rec-name">{search.recommendation.topPick.name}</div>
                                <div className="gear-rec-reason">{search.recommendation.topPick.reason}</div>
                                <div className="gear-rec-select">Select this →</div>
                              </button>
                            </div>

                            {/* Alternatives */}
                            {search.recommendation.alternatives.length > 0 && (
                              <div className="gear-rec-alts">
                                <div className="gear-rec-alt-label">ALSO CONSIDER</div>
                                {search.recommendation.alternatives.map((alt, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelectProduct(g.item, {
                                      name: alt.name,
                                      brand: alt.brand,
                                      specs: alt.comparison,
                                      source: 'online'
                                    })}
                                    className="gear-rec-alt"
                                  >
                                    <span className="gear-rec-alt-name">{alt.name}</span>
                                    <span className="gear-rec-alt-diff">{alt.comparison}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        ) : search.results.length > 0 ? (
                          <>
                            {search.results.map((product, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelectProduct(g.item, product)}
                                className="gear-box-dropdown-item"
                              >
                                <div className="font-medium">{product.name}</div>
                                <div className="text-xs text-muted">{product.specs}</div>
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleOnlineSearch(g.item)}
                              disabled={search.isSearchingOnline}
                              className="gear-box-dropdown-online"
                            >
                              {search.isSearchingOnline ? 'Searching...' : 'Search online for more →'}
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="gear-box-dropdown-item text-muted">No matches found</div>
                            <button
                              type="button"
                              onClick={() => handleOnlineSearch(g.item)}
                              disabled={search.isSearchingOnline}
                              className="gear-box-dropdown-online"
                            >
                              {search.isSearchingOnline ? 'Searching...' : 'Search online →'}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!trip && !isLoading && !showTripResults && !showConfirm && (
          <div className="text-center py-12 text-muted">
            Enter your destination above to get started
          </div>
        )}
      </main>
    </div>
  );
}
