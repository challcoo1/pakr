'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import AnimatedLogo from '@/components/AnimatedLogo';
import { BackpackIcon, MountainIcon } from '@/components/NavIcons';
import WeatherWidget from '@/components/WeatherWidget';
import PackSummary from '@/components/PackSummary';

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
  weightG?: number | null;
}

interface ProductMatch {
  id?: string;
  name: string;
  brand: string;
  specs: string;
  source?: 'database' | 'online';
  isNew?: boolean;
  weightG?: number | null;
}

interface CommunityRating {
  avgRating: number;
  reviewCount: number;
}

interface WeatherData {
  type: 'forecast' | 'historical';
  location: string;
  tempHigh: number;
  tempLow: number;
  precipitation: number;
  description: string;
  days?: {
    date: string;
    tempHigh: number;
    tempLow: number;
    precipitation: number;
  }[];
  distribution?: {
    month: string;
    tempMean: number;
    tempStdDev: number;
    tempMin: number;
    tempMax: number;
    precipMean: number;
    precipStdDev: number;
  };
}

interface Recommendation {
  topPick: {
    name: string;
    brand: string;
    reason: string;
    source: string;
    communityRating?: CommunityRating | null;
  } | null;
  alternatives: {
    name: string;
    brand: string;
    comparison: string;
    source: string;
    communityRating?: CommunityRating | null;
  }[];
}

interface GearSearchState {
  isSearching: boolean;
  isSearchingOnline: boolean;
  results: ProductMatch[];
  recommendation: Recommendation | null;
  showResults: boolean;
}

// Activity types for trip planning
const ACTIVITY_TYPES = [
  { value: 'hiking', label: 'Hiking / Tramping' },
  { value: 'mountaineering', label: 'Mountaineering' },
  { value: 'ski-touring', label: 'Ski Touring' },
  { value: 'ski-mountaineering', label: 'Ski Mountaineering' },
  { value: 'climbing', label: 'Rock Climbing' },
  { value: 'snowshoeing', label: 'Snowshoeing' },
] as const;

// Confirmation step fields
interface TripConfirm {
  place: string;
  plannedDate: string;
  activity: string;
  duration: string;
}

// Country data for location selector
const COUNTRIES = [
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'CA', name: 'Canada' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'NO', name: 'Norway' },
  { code: 'SE', name: 'Sweden' },
  { code: 'FI', name: 'Finland' },
  { code: 'CL', name: 'Chile' },
  { code: 'AR', name: 'Argentina' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'IN', name: 'India' },
  { code: 'CN', name: 'China' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IE', name: 'Ireland' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'TW', name: 'Taiwan' },
];

const getFlagUrl = (code: string) => `https://flagcdn.com/24x18/${code.toLowerCase()}.png`;

export default function Home() {
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [objective, setObjective] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
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

  // User location
  const [userCountry, setUserCountry] = useState<{ code: string; name: string } | null>(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Save trip
  const [isSavingTrip, setIsSavingTrip] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [plannedDate, setPlannedDate] = useState('');

  // Gear editing
  const [excludedGear, setExcludedGear] = useState<Set<string>>(new Set());
  const [inventoryGear, setInventoryGear] = useState<{ id: string; name: string; category: string }[]>([]);
  const [showInventoryPicker, setShowInventoryPicker] = useState(false);
  const [userInventory, setUserInventory] = useState<{ id: string; name: string; category: string }[]>([]);

  // Weather
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Gear matching (runs in background after trip loads)
  const [isMatchingGear, setIsMatchingGear] = useState(false);

  // Ignored gear (persisted in localStorage)
  const [ignoredGear, setIgnoredGear] = useState<Set<string>>(new Set());

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSpecs = localStorage.getItem('pakr-specs-mode');
    const savedTheme = localStorage.getItem('pakr-theme');
    const savedIgnored = localStorage.getItem('pakr-ignored-gear');
    if (savedSpecs === 'detailed') setExactSpecs(true);
    if (savedTheme === 'dark') setTheme('dark');
    if (savedIgnored) {
      try {
        setIgnoredGear(new Set(JSON.parse(savedIgnored)));
      } catch { /* ignore parse errors */ }
    }
  }, []);

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const saveSettings = () => {
    localStorage.setItem('pakr-specs-mode', exactSpecs ? 'detailed' : 'general');
    localStorage.setItem('pakr-theme', theme);
    setShowSettings(false);
  };

  // Remove gear from current trip only (not global)
  const handleRemoveGear = (item: string) => {
    setExcludedGear(prev => new Set([...prev, item]));
  };

  // Check if gear is ignored globally (case-insensitive) - used by preferences
  const isGearIgnored = (item: string) => ignoredGear.has(item.toLowerCase());

  // Auto-detect location on mount
  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Use IP-based geolocation (free, no permission needed)
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const countryCode = data.country_code;
        const found = COUNTRIES.find(c => c.code === countryCode);
        if (found) {
          setUserCountry(found);
        } else if (countryCode) {
          // Country not in our list, use US as fallback but show detected
          setUserCountry({ code: countryCode, name: data.country_name || countryCode });
        }
      } catch {
        // Silent fail - location is optional
      }
    };
    detectLocation();
  }, []);

  // Initial search - shows confirmation step
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
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

      setTripConfirm({
        place: match?.name || objective.trim(),
        plannedDate: '',
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

  // User selects from multiple trip options - goes to confirmation
  const handleSelectTrip = (tripMatch: TripMatch) => {
    setShowTripResults(false);

    setTripConfirm({
      place: tripMatch.name,
      plannedDate: '',
      activity: 'hiking',
      duration: tripMatch.duration,
    });
    setSelectedTrip(tripMatch);
    setShowConfirm(true);
  };

  // Get month name from date string
  const getMonthFromDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long' });
  };

  // Re-search with updated confirmation fields
  const handleResearch = async () => {
    if (!tripConfirm?.place.trim()) return;

    setIsLoading(true);

    try {
      // Build query from fields
      let query = tripConfirm.place;
      const month = getMonthFromDate(tripConfirm.plannedDate);
      if (month) query += ` in ${month}`;

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
    setLoadingStatus('Researching trip details and conditions...');
    setShowConfirm(false);

    try {
      // Build full objective from confirmed fields
      const activityLabel = ACTIVITY_TYPES.find(t => t.value === tripConfirm.activity)?.label || tripConfirm.activity;
      let fullObjective = `${activityLabel}: ${tripConfirm.place}`;
      const month = getMonthFromDate(tripConfirm.plannedDate);
      if (month) fullObjective += ` in ${month}`;
      if (tripConfirm.duration && !tripConfirm.duration.includes('missing')) {
        fullObjective += `, ${tripConfirm.duration}`;
      }

      setLoadingStatus('Analyzing terrain, hazards, and gear requirements...');
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective: fullObjective }),
      });
      const analyzeData = await analyzeResponse.json();

      if (analyzeData.trip) {
        setTrip(analyzeData.trip);
        setExcludedGear(new Set());
        setInventoryGear([]);
        setWeather(null);

        const initial: Record<string, UserGearEntry> = {};
        analyzeData.trip.gear.forEach((g: GearRequirement) => {
          initial[g.item] = { input: '', status: 'empty', reasons: [] };
        });
        setUserGear(initial);

        // Show trip immediately - don't wait for gear matching
        setIsLoading(false);

        // Fetch weather and match gear in parallel (background)
        fetchWeather(analyzeData.trip, tripConfirm.plannedDate);

        // If logged in, try to auto-populate with user's gear (background)
        if (session?.user) {
          setIsMatchingGear(true);
          fetch('/api/optimize-gear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requirements: analyzeData.trip.gear,
              tripContext: {
                name: analyzeData.trip.name,
                region: analyzeData.trip.region,
                duration: analyzeData.trip.duration,
                terrain: analyzeData.trip.terrain,
                hazards: analyzeData.trip.hazards,
                conditions: analyzeData.trip.conditions,
              },
            }),
          })
            .then(res => res.json())
            .then(optimizeData => {
              if (optimizeData.matches) {
                // Pre-populate matched gear
                const populated: Record<string, UserGearEntry> = { ...initial };
                for (const [itemName, match] of Object.entries(optimizeData.matches)) {
                  if (match && typeof match === 'object' && 'name' in match) {
                    const m = match as { name: string; score: number; reason: string; weightG?: number | null };
                    populated[itemName] = {
                      input: m.name,
                      status: m.score >= 80 ? 'ideal' : m.score >= 60 ? 'suitable' : 'adequate',
                      reasons: [m.reason],
                      weightG: m.weightG,
                    };
                  }
                }
                setUserGear(populated);
              }
            })
            .catch(err => {
              console.error('Gear optimization failed:', err);
            })
            .finally(() => {
              setIsMatchingGear(false);
            });
        }
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setIsLoading(false);
    }
  };

  // Fetch weather for trip
  const fetchWeather = async (tripData: TripAnalysis, plannedDate?: string) => {
    setWeatherLoading(true);
    try {
      const response = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: tripData.name,
          region: tripData.region,
          timeOfYear: tripData.timeOfYear,
          plannedDate: plannedDate || null,
        }),
      });
      const data = await response.json();
      if (data.weather) {
        setWeather(data.weather);
      }
    } catch (error) {
      console.error('Weather fetch failed:', error);
    } finally {
      setWeatherLoading(false);
    }
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

  // Save trip setup
  const handleSaveTrip = async () => {
    if (!trip || !session) return;

    setIsSavingTrip(true);
    try {
      // Collect gear entries (excluding removed items)
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

      // Add inventory gear items
      const inventoryGearList = inventoryGear.map(g => ({
        name: g.name,
        category: g.category,
        isOwned: true,
        isRecommended: false,
        userGearId: g.id,
      }));

      // Find missing gear (empty entries, excluding removed items)
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
        // Redirect to My Trips
        window.location.href = '/trips';
      }
    } catch (error) {
      console.error('Failed to save trip:', error);
    } finally {
      setIsSavingTrip(false);
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
      [item]: { ...prev[item], input: product.name, weightG: product.weightG }
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
          } : null,
          userLocation: userCountry ? {
            code: userCountry.code,
            name: userCountry.name
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
    <>
      {/* Red Band - Full width stripe at top */}
      <div className="red-band">
        <div className="red-band-container">
          <AnimatedLogo variant="light" size="small" />
          <div className="flex items-center gap-4">
            {/* Nav links - show when logged in */}
            {session?.user && (
              <div className="flex items-center gap-1 md:gap-3">
                <a href="/gear" className="nav-link text-white/80 hover:text-white text-sm font-medium transition-colors" aria-label="My Gear">
                  <span className="nav-link-icon"><BackpackIcon /></span>
                  <span className="nav-link-text">My Gear</span>
                </a>
                <a href="/trips" className="nav-link text-white/80 hover:text-white text-sm font-medium transition-colors" aria-label="My Trips">
                  <span className="nav-link-icon"><MountainIcon /></span>
                  <span className="nav-link-text">My Trips</span>
                </a>
              </div>
            )}

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
                      <a
                        href="/gear"
                        className="block w-full px-3 py-2 text-left text-sm text-charcoal hover:bg-gray-100"
                      >
                        My Gear
                      </a>
                      <a
                        href="/trips"
                        className="block w-full px-3 py-2 text-left text-sm text-charcoal hover:bg-gray-100"
                      >
                        My Trips
                      </a>
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

            {/* Settings gear icon */}
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
              title="Settings"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Cream background */}
      <div className="main-content">
        {/* Search */}
        <div className="max-w-4xl mx-auto p-4">
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

        {/* Results */}
        <main className="max-w-4xl mx-auto px-4 pb-4">
        {isLoading && !showConfirm && (
          <div className="text-center py-12 text-muted">
            <div className="flex items-center justify-center gap-3">
              <span className="inline-block w-4 h-4 border-2 border-muted border-t-burnt rounded-full animate-spin" />
              <span>{loadingStatus || 'Loading...'}</span>
            </div>
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

              {/* Trip Date */}
              <div>
                <label className="block text-sm font-medium mb-1">Trip Date</label>
                <input
                  type="date"
                  value={tripConfirm.plannedDate}
                  onChange={(e) => setTripConfirm({ ...tripConfirm, plannedDate: e.target.value })}
                  className={`input-small w-full ${!tripConfirm.plannedDate ? 'border-burnt' : ''}`}
                  min={new Date().toISOString().split('T')[0]}
                />
                {!tripConfirm.plannedDate && (
                  <div className="text-xs text-burnt mt-1">Required</div>
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

              {/* Activity Type */}
              <div>
                <label className="block text-sm font-medium mb-1">Activity</label>
                <select
                  value={tripConfirm.activity}
                  onChange={(e) => setTripConfirm({ ...tripConfirm, activity: e.target.value })}
                  className="input-small w-full"
                >
                  {ACTIVITY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
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
                disabled={!tripConfirm.place || !tripConfirm.plannedDate || isLoading}
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

              {/* Weather Widget */}
              <WeatherWidget
                weather={weather}
                elevation={trip.elevation}
                loading={weatherLoading}
              />
            </div>

            {/* Pack Weight Summary */}
            <PackSummary
              gear={trip.gear
                .filter(g => !excludedGear.has(g.item) && !isGearIgnored(g.item))
                .map(g => ({
                  item: g.item,
                  specs: g.specs,
                  weightG: userGear[g.item]?.weightG,
                  status: userGear[g.item]?.status || 'empty'
                }))}
              isMatching={isMatchingGear}
            />

            {/* Gear Requirements */}
            {isMatchingGear && (
              <div className="text-sm text-muted italic mb-3 flex items-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-muted border-t-burnt rounded-full animate-spin" />
                Checking your gear inventory for matches...
              </div>
            )}
            <div className="gear-boxes">
              {trip.gear.filter(g => !excludedGear.has(g.item) && !isGearIgnored(g.item)).map((g) => {
                const entry = userGear[g.item] || { input: '', status: 'empty', reasons: [] };
                const search = gearSearch[g.item] || { isSearching: false, isSearchingOnline: false, results: [], recommendation: null, showResults: false };
                const status = getStatusIndicator(entry.status);

                return (
                  <div key={g.item} className="gear-box">
                    {/* Header */}
                    <div className="gear-box-header">
                      <span className="gear-box-bullet">●</span>
                      <span className="gear-box-title">{g.item.toUpperCase()}</span>
                      <button
                        onClick={() => setExcludedGear(prev => new Set([...prev, g.item]))}
                        className="gear-box-remove"
                        title="Remove from trip"
                      >
                        ×
                      </button>
                    </div>
                    <div className="gear-box-specs">{g.specs}</div>

                    <div className="gear-box-divider" />

                    {/* Empty/typing state - show search input */}
                    {entry.status === 'empty' && (
                      <div>
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
                        <button
                          onClick={() => handleRemoveGear(g.item)}
                          className="gear-box-action"
                          style={{ marginTop: '0.5rem' }}
                        >
                          Remove
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
                            onClick={() => handleRemoveGear(g.item)}
                            className="gear-box-action"
                          >
                            Remove
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
                                {search.recommendation.topPick.communityRating && (
                                  <div className="text-sm star-rating mt-1">
                                    {'★'.repeat(Math.round(search.recommendation.topPick.communityRating.avgRating))}
                                    {'☆'.repeat(5 - Math.round(search.recommendation.topPick.communityRating.avgRating))}
                                    <span className="text-muted ml-1">
                                      {search.recommendation.topPick.communityRating.avgRating} from {search.recommendation.topPick.communityRating.reviewCount} {search.recommendation.topPick.communityRating.reviewCount === 1 ? 'user' : 'users'}
                                    </span>
                                  </div>
                                )}
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
                                    <div className="flex-1">
                                      <span className="gear-rec-alt-name">{alt.name}</span>
                                      {alt.communityRating && (
                                        <span className="star-rating text-xs ml-2">
                                          {'★'.repeat(Math.round(alt.communityRating.avgRating))}
                                          <span className="text-muted ml-1">({alt.communityRating.reviewCount})</span>
                                        </span>
                                      )}
                                    </div>
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

              {/* Added inventory gear */}
              {inventoryGear.map(g => (
                <div key={g.id} className="gear-box gear-box-added">
                  <div className="gear-box-header">
                    <span className="gear-box-bullet" style={{ color: '#059669' }}>●</span>
                    <span className="gear-box-title">{g.name.toUpperCase()}</span>
                    <button
                      onClick={() => setInventoryGear(prev => prev.filter(item => item.id !== g.id))}
                      className="gear-box-remove"
                      title="Remove from trip"
                    >
                      ×
                    </button>
                  </div>
                  <div className="gear-box-specs">{g.category} • From your gear</div>
                </div>
              ))}
            </div>

            {/* Add from My Gear */}
            {session && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    loadUserInventory();
                    setShowInventoryPicker(true);
                  }}
                  className="text-sm link font-medium"
                >
                  + Add from My Gear
                </button>
              </div>
            )}

            {/* Excluded items */}
            {excludedGear.size > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-muted mb-2">Removed items (click to restore):</div>
                <div className="flex flex-wrap gap-2">
                  {[...excludedGear].map(item => (
                    <button
                      key={item}
                      onClick={() => setExcludedGear(prev => {
                        const next = new Set(prev);
                        next.delete(item);
                        return next;
                      })}
                      className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                    >
                      {item} +
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add Trip Button */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => {
                  if (!session) {
                    signIn('google');
                  } else {
                    setPlannedDate(tripConfirm?.plannedDate || '');
                    setShowSaveModal(true);
                  }
                }}
                className="btn-primary px-8"
              >
                Add Trip
              </button>
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

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={e => e.stopPropagation()}>
            <div className="settings-header">
              <span className="settings-title">SETTINGS</span>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="settings-close"
              >
                ×
              </button>
            </div>

            <div className="settings-content">
              {/* Display Mode */}
              <div className="settings-section">
                <div className="settings-label">Display</div>
                <label className="settings-option">
                  <input
                    type="radio"
                    name="specsMode"
                    checked={!exactSpecs}
                    onChange={() => setExactSpecs(false)}
                    className="settings-radio"
                  />
                  <span>General specs (default)</span>
                </label>
                <label className="settings-option">
                  <input
                    type="radio"
                    name="specsMode"
                    checked={exactSpecs}
                    onChange={() => setExactSpecs(true)}
                    className="settings-radio"
                  />
                  <span>Detailed specs</span>
                </label>
              </div>

              {/* Theme */}
              <div className="settings-section">
                <div className="settings-label">Theme</div>
                <label className="settings-option">
                  <input
                    type="radio"
                    name="theme"
                    checked={theme === 'light'}
                    onChange={() => setTheme('light')}
                    className="settings-radio"
                  />
                  <span>Light mode (default)</span>
                </label>
                <label className="settings-option">
                  <input
                    type="radio"
                    name="theme"
                    checked={theme === 'dark'}
                    onChange={() => setTheme('dark')}
                    className="settings-radio"
                  />
                  <span>Dark mode</span>
                </label>
              </div>
            </div>

            <div className="settings-footer">
              <button
                type="button"
                onClick={saveSettings}
                className="settings-save"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Trip Modal */}
      {showSaveModal && trip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSaveModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-2">Add Trip</h2>
            <p className="text-sm text-muted mb-4">{trip.name}</p>

            {/* Missing gear warning */}
            {trip.gear.filter(g => !excludedGear.has(g.item)).some(g => !userGear[g.item]?.input || userGear[g.item]?.status === 'empty') && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-4">
                <div className="text-sm font-medium text-orange-800 mb-1">Missing gear:</div>
                <div className="text-xs text-orange-700">
                  {trip.gear
                    .filter(g => !excludedGear.has(g.item))
                    .filter(g => !userGear[g.item]?.input || userGear[g.item]?.status === 'empty')
                    .map(g => g.item)
                    .join(', ')}
                </div>
                <div className="text-xs text-orange-600 mt-1">You can still save and add gear later.</div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Trip Date</label>
              <input
                type="date"
                value={plannedDate}
                onChange={e => setPlannedDate(e.target.value)}
                className="w-full border rounded px-3 py-2"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTrip}
                disabled={isSavingTrip}
                className="flex-1 px-4 py-2 btn-primary disabled:opacity-50"
              >
                {isSavingTrip ? 'Adding...' : 'Add Trip'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Picker Modal */}
      {showInventoryPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInventoryPicker(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Add from My Gear</h2>

            {userInventory.length === 0 ? (
              <p className="text-muted text-sm">No gear in your inventory yet.</p>
            ) : (
              <div className="overflow-y-auto flex-1 -mx-2 px-2">
                <div className="space-y-2">
                  {userInventory
                    .filter(g => !inventoryGear.some(added => added.id === g.id))
                    .map(g => (
                      <button
                        key={g.id}
                        onClick={() => {
                          setInventoryGear(prev => [...prev, g]);
                          setShowInventoryPicker(false);
                        }}
                        className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium">{g.name}</div>
                        <div className="text-xs text-muted">{g.category}</div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setShowInventoryPicker(false)}
                className="w-full px-4 py-2 border rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
