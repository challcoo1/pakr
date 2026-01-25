'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  TripMatch,
  TripAnalysis,
  TripConfirm,
  UserGearEntry,
  GearSearchState,
  ProductMatch,
  WeatherData,
  GearRequirement,
  SystemCheck,
} from '@/types';
import { ACTIVITY_TYPES } from '@/types';

interface UseTripPlannerOptions {
  onGearMatched?: () => void;
  session: { user?: { email?: string | null } } | null;
}

export function useTripPlanner({ onGearMatched, session }: UseTripPlannerOptions) {
  // Core trip state
  const [objective, setObjective] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [tripResults, setTripResults] = useState<TripMatch[]>([]);
  const [showTripResults, setShowTripResults] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripMatch | null>(null);
  const [trip, setTrip] = useState<TripAnalysis | null>(null);

  // Confirmation step
  const [tripConfirm, setTripConfirm] = useState<TripConfirm | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Gear state
  const [userGear, setUserGear] = useState<Record<string, UserGearEntry>>({});
  const [gearSearch, setGearSearch] = useState<Record<string, GearSearchState>>({});
  const [excludedGear, setExcludedGear] = useState<Set<string>>(new Set());
  const [inventoryGear, setInventoryGear] = useState<{ id: string; name: string; category: string }[]>([]);
  const [isMatchingGear, setIsMatchingGear] = useState(false);

  // Weather
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // System check
  const [systemCheck, setSystemCheck] = useState<SystemCheck | null>(null);
  const [isCheckingSystem, setIsCheckingSystem] = useState(false);

  // Save trip modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [plannedDate, setPlannedDate] = useState('');
  const [isSavingTrip, setIsSavingTrip] = useState(false);

  // Inventory picker
  const [showInventoryPicker, setShowInventoryPicker] = useState(false);
  const [userInventory, setUserInventory] = useState<{ id: string; name: string; category: string }[]>([]);

  // Ignored gear (persisted in localStorage)
  const [ignoredGear, setIgnoredGear] = useState<Set<string>>(new Set());

  // Load ignored gear from localStorage on mount
  useEffect(() => {
    const savedIgnored = localStorage.getItem('pakr-ignored-gear');
    if (savedIgnored) {
      try {
        setIgnoredGear(new Set(JSON.parse(savedIgnored)));
      } catch { /* ignore parse errors */ }
    }
  }, []);

  // Check if gear is ignored globally (case-insensitive)
  const isGearIgnored = (item: string) => ignoredGear.has(item.toLowerCase());

  // Extract time of year from query
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

  // Fetch weather for trip
  const fetchWeather = async (tripData: TripAnalysis) => {
    setWeatherLoading(true);
    try {
      const response = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: tripData.name,
          region: tripData.region,
          timeOfYear: tripData.timeOfYear,
        }),
      });
      const data = await response.json();
      if (data.weather) setWeather(data.weather);
    } catch (error) {
      console.error('Weather fetch failed:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Initial search
  const handleSearch = async () => {
    if (!objective.trim() || isLoading) return;

    setIsLoading(true);
    setLoadingStatus('Finding trips matching your search...');
    setTrip(null);
    setSelectedTrip(null);
    setTripResults([]);
    setShowTripResults(false);
    setShowConfirm(false);
    setTripConfirm(null);
    setUserGear({});

    try {
      const response = await fetch('/api/search-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: objective.trim() }),
      });
      const data = await response.json();

      if (data.results && data.results.length > 1) {
        setTripResults(data.results);
        setShowTripResults(true);
        setIsLoading(false);
        return;
      }

      const match = data.results?.[0];
      const timeOfYear = extractTimeOfYear(objective);

      setTripConfirm({
        place: match?.name || objective.trim(),
        timeOfYear,
        activity: 'hiking',
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

  // Select from multiple trip options
  const handleSelectTrip = (tripMatch: TripMatch) => {
    setShowTripResults(false);
    const timeOfYear = extractTimeOfYear(objective);

    setTripConfirm({
      place: tripMatch.name,
      timeOfYear,
      activity: 'hiking',
      duration: tripMatch.duration,
    });
    setSelectedTrip(tripMatch);
    setShowConfirm(true);
  };

  // Re-search with updated fields
  const handleResearch = async () => {
    if (!tripConfirm?.place.trim()) return;

    setIsLoading(true);
    try {
      let query = tripConfirm.place;
      if (tripConfirm.timeOfYear) query += ` in ${tripConfirm.timeOfYear}`;

      const response = await fetch('/api/search-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();

      const match = data.results?.[0];
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
    setLoadingStatus('Researching trip details and conditions...');
    setShowConfirm(false);

    try {
      const activityLabel = ACTIVITY_TYPES.find(t => t.value === tripConfirm.activity)?.label || tripConfirm.activity;
      let fullObjective = `${activityLabel}: ${tripConfirm.place}`;
      if (tripConfirm.timeOfYear) fullObjective += ` in ${tripConfirm.timeOfYear}`;
      if (tripConfirm.duration && !tripConfirm.duration.includes('missing')) {
        fullObjective += `, ${tripConfirm.duration}`;
      }

      setLoadingStatus('Analyzing terrain, hazards, and gear requirements...');
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective: fullObjective }),
      });
      const data = await response.json();

      if (data.trip) {
        setTrip(data.trip);
        setExcludedGear(new Set());
        setInventoryGear([]);
        setWeather(null);

        const initial: Record<string, UserGearEntry> = {};
        data.trip.gear.forEach((g: GearRequirement) => {
          initial[g.item] = { input: '', status: 'empty', reasons: [] };
        });
        setUserGear(initial);
        setIsLoading(false);

        fetchWeather(data.trip);

        // Auto-match gear if logged in
        console.log('[GEAR MATCH] session?.user:', !!session?.user, 'session:', session);
        if (session?.user) {
          console.log('[GEAR MATCH] Starting gear optimization...');
          setIsMatchingGear(true);
          fetch('/api/optimize-gear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requirements: data.trip.gear,
              tripContext: {
                name: data.trip.name,
                region: data.trip.region,
                duration: data.trip.duration,
                terrain: data.trip.terrain,
                hazards: data.trip.hazards,
                conditions: data.trip.conditions,
              },
            }),
          })
            .then(res => res.json())
            .then(optimizeData => {
              console.log('[GEAR MATCH] Response:', optimizeData);
              if (optimizeData.matches) {
                console.log('[GEAR MATCH] Found matches:', Object.keys(optimizeData.matches).length);
                const populated: Record<string, UserGearEntry> = { ...initial };
                for (const [itemName, match] of Object.entries(optimizeData.matches)) {
                  if (match && typeof match === 'object' && 'name' in match) {
                    const m = match as { name: string; score: number; reason: string; weightG?: number | null; weightEstimated?: boolean };
                    populated[itemName] = {
                      input: m.name,
                      status: m.score >= 80 ? 'ideal' : m.score >= 60 ? 'suitable' : 'adequate',
                      reasons: [m.reason],
                      weightG: m.weightG,
                      weightEstimated: m.weightEstimated,
                    };
                  }
                }
                console.log('[GEAR MATCH] Setting populated gear:', Object.keys(populated).filter(k => populated[k].input).length, 'items matched');
                setUserGear(populated);
                onGearMatched?.();
              }
            })
            .catch(err => console.error('Gear optimization failed:', err))
            .finally(() => setIsMatchingGear(false));
        }
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setIsLoading(false);
    }
  };

  // Gear handlers
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

  const handleGearClear = (item: string) => {
    setUserGear(prev => ({
      ...prev,
      [item]: { input: '', status: 'empty', reasons: [] }
    }));
  };

  const handleRemoveGear = (item: string) => {
    setExcludedGear(prev => new Set([...prev, item]));
  };

  const handleRestoreGear = (item: string) => {
    setExcludedGear(prev => {
      const next = new Set(prev);
      next.delete(item);
      return next;
    });
  };

  const validateGear = async (item: string, gearText: string) => {
    const requirement = trip?.gear.find(g => g.item === item);
    if (!requirement) return;

    try {
      const response = await fetch('/api/validate-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userGear: gearText,
          requirement,
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
      // Keep as is on error
    }
  };

  const handleGearSubmit = async (item: string, exactSpecs: boolean) => {
    const entry = userGear[item];
    if (!entry?.input.trim()) {
      handleGearClear(item);
      return;
    }

    if (exactSpecs) {
      await handleGearSearch(item);
    } else {
      await validateGear(item, entry.input.trim());
    }
  };

  const handleGearSearch = async (item: string) => {
    const entry = userGear[item];
    if (!entry?.input.trim() || entry.input.trim().length < 2) return;

    setGearSearch(prev => ({
      ...prev,
      [item]: { isSearching: true, isSearchingOnline: false, results: [], recommendation: null, showResults: true }
    }));

    try {
      const response = await fetch('/api/search-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: entry.input.trim(), category: item }),
      });
      const data = await response.json();

      setGearSearch(prev => ({
        ...prev,
        [item]: { isSearching: false, isSearchingOnline: false, results: data.results || [], recommendation: null, showResults: true }
      }));
    } catch {
      setGearSearch(prev => ({
        ...prev,
        [item]: { isSearching: false, isSearchingOnline: false, results: [], recommendation: null, showResults: false }
      }));
    }
  };

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
        body: JSON.stringify({ query, category: item, online: true }),
      });
      const data = await response.json();

      setGearSearch(prev => ({
        ...prev,
        [item]: { isSearching: false, isSearchingOnline: false, results: data.results || [], recommendation: null, showResults: true }
      }));
    } catch {
      setGearSearch(prev => ({
        ...prev,
        [item]: { ...prev[item], isSearchingOnline: false }
      }));
    }
  };

  const handleRecommend = async (item: string, userCountry?: { code: string; name: string } | null) => {
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
          } : null,
          userLocation: userCountry ? { code: userCountry.code, name: userCountry.name } : null
        }),
      });
      const data = await response.json();

      setGearSearch(prev => ({
        ...prev,
        [item]: { isSearching: false, isSearchingOnline: false, results: data.results || [], recommendation: data.recommendation || null, showResults: true }
      }));
    } catch {
      setGearSearch(prev => ({
        ...prev,
        [item]: { isSearching: false, isSearchingOnline: false, results: [], recommendation: null, showResults: false }
      }));
    }
  };

  const handleSelectProduct = async (item: string, product: ProductMatch) => {
    setUserGear(prev => ({
      ...prev,
      [item]: { ...prev[item], input: product.name, weightG: product.weightG }
    }));
    setGearSearch(prev => ({
      ...prev,
      [item]: { ...prev[item], showResults: false }
    }));

    if (product.source === 'online') {
      fetch('/api/add-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: product.name, brand: product.brand, specs: product.specs, category: item }),
      }).catch(console.error);
    }

    await validateGear(item, product.name);
  };

  const handleCloseSearch = (item: string) => {
    setGearSearch(prev => ({
      ...prev,
      [item]: { ...prev[item], showResults: false }
    }));
  };

  // Load user's gear inventory
  const loadUserInventory = async () => {
    if (!session?.user) return;
    try {
      const res = await fetch('/api/gear');
      const data = await res.json();
      setUserInventory(data.gear?.map((g: { id: string; name: string; category?: string }) => ({
        id: g.id,
        name: g.name,
        category: g.category || 'Other'
      })) || []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    }
  };

  // Add gear from inventory
  const handleAddInventoryGear = (gear: { id: string; name: string; category: string }) => {
    setInventoryGear(prev => [...prev, gear]);
  };

  // Remove inventory gear from trip
  const handleRemoveInventoryGear = (id: string) => {
    setInventoryGear(prev => prev.filter(g => g.id !== id));
  };

  // Save trip
  const handleSaveTrip = async () => {
    if (!trip || !session) return;

    setIsSavingTrip(true);
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

      const missingGear = trip.gear
        .filter(g => !excludedGear.has(g.item))
        .filter(g => !userGear[g.item]?.input || userGear[g.item]?.status === 'empty')
        .map(g => g.item);

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
        setShowSaveModal(false);
        setPlannedDate('');
        window.location.href = '/trips';
      }
    } catch (error) {
      console.error('Failed to save trip:', error);
    } finally {
      setIsSavingTrip(false);
    }
  };

  return {
    // State
    objective,
    setObjective,
    isLoading,
    loadingStatus,
    tripResults,
    showTripResults,
    selectedTrip,
    trip,
    tripConfirm,
    setTripConfirm,
    showConfirm,
    userGear,
    gearSearch,
    excludedGear,
    inventoryGear,
    setInventoryGear,
    isMatchingGear,
    weather,
    weatherLoading,

    // System check
    systemCheck,
    isCheckingSystem,

    // Save trip
    showSaveModal,
    setShowSaveModal,
    plannedDate,
    setPlannedDate,
    isSavingTrip,

    // Inventory picker
    showInventoryPicker,
    setShowInventoryPicker,
    userInventory,

    // Ignored gear
    ignoredGear,
    isGearIgnored,

    // Actions
    handleSearch,
    handleSelectTrip,
    handleResearch,
    handleConfirmAnalyze,
    handleGearChange,
    handleGearClear,
    handleRemoveGear,
    handleRestoreGear,
    handleGearSubmit,
    handleGearSearch,
    handleOnlineSearch,
    handleRecommend,
    handleSelectProduct,
    handleCloseSearch,
    loadUserInventory,
    handleAddInventoryGear,
    handleRemoveInventoryGear,
    handleSaveTrip,
  };
}
