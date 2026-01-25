'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import AnimatedLogo from '@/components/AnimatedLogo';
import { BackpackIcon, MountainIcon, GlobeIcon } from '@/components/NavIcons';
import PackSummary from '@/components/PackSummary';
import DestinationTicker from '@/components/DestinationTicker';
import { COUNTRIES, getFlagUrl } from '@/lib/constants';
import { useTripPlanner } from '@/hooks/useTripPlanner';

// Trip components
import TripResultsList from '@/components/trip/TripResultsList';
import TripConfirmation from '@/components/trip/TripConfirmation';
import TripSummaryBox from '@/components/trip/TripSummaryBox';
import GearRequirementCard from '@/components/trip/GearRequirementCard';
import SystemCheckDisplay from '@/components/trip/SystemCheckDisplay';
import SettingsModal from '@/components/trip/SettingsModal';
import SaveTripModal from '@/components/trip/SaveTripModal';
import InventoryPickerModal from '@/components/trip/InventoryPickerModal';

export default function Home() {
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // User location
  const [userCountry, setUserCountry] = useState<{ code: string; name: string } | null>(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [exactSpecs, setExactSpecs] = useState(false);

  // Use trip planner hook
  const planner = useTripPlanner({ session });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSpecs = localStorage.getItem('pakr-specs-mode');
    const savedTheme = localStorage.getItem('pakr-theme');
    if (savedSpecs === 'detailed') setExactSpecs(true);
    if (savedTheme === 'dark') setTheme('dark');
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

  // Auto-detect location on mount
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const countryCode = data.country_code;
        const found = COUNTRIES.find(c => c.code === countryCode);
        if (found) {
          setUserCountry(found);
        } else if (countryCode) {
          setUserCountry({ code: countryCode, name: data.country_name || countryCode });
        }
      } catch {
        // Silent fail - location is optional
      }
    };
    detectLocation();
  }, []);

  // Handle search form submit
  const onSearchSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await planner.handleSearch();
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
                  <GlobeIcon />
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
                      <a href="/gear" className="block w-full px-3 py-2 text-left text-sm text-charcoal hover:bg-gray-100">My Gear</a>
                      <a href="/trips" className="block w-full px-3 py-2 text-left text-sm text-charcoal hover:bg-gray-100">My Trips</a>
                      <button type="button" onClick={() => signOut()} className="w-full px-3 py-2 text-left text-sm text-charcoal hover:bg-gray-100">Sign out</button>
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
          <form onSubmit={onSearchSubmit} className="relative">
            <input
              type="text"
              value={planner.objective}
              onChange={(e) => planner.setObjective(e.target.value)}
              placeholder="Where are you going? e.g. Routeburn Track in October"
              className="input-field w-full pr-10"
              autoFocus
            />
            <button
              type="submit"
              disabled={!planner.objective.trim() || planner.isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal disabled:opacity-30"
            >
              {planner.isLoading ? (
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
          {planner.isLoading && !planner.showConfirm && (
            <div className="text-center py-12 text-muted">
              <div className="flex items-center justify-center gap-3">
                <span className="inline-block w-4 h-4 border-2 border-muted border-t-burnt rounded-full animate-spin" />
                <span>{planner.loadingStatus || 'Loading...'}</span>
              </div>
            </div>
          )}

          {/* Trip Selection - multiple matches */}
          {planner.showTripResults && planner.tripResults.length > 0 && !planner.isLoading && (
            <TripResultsList
              results={planner.tripResults}
              onSelectTrip={planner.handleSelectTrip}
            />
          )}

          {/* Confirmation Step */}
          {planner.showConfirm && planner.tripConfirm && !planner.isLoading && (
            <TripConfirmation
              tripConfirm={planner.tripConfirm}
              selectedTrip={planner.selectedTrip}
              isLoading={planner.isLoading}
              onTripConfirmChange={planner.setTripConfirm}
              onResearch={planner.handleResearch}
              onConfirmAnalyze={planner.handleConfirmAnalyze}
            />
          )}

          {/* Trip Analysis Results */}
          {planner.trip && !planner.isLoading && !planner.showTripResults && !planner.showConfirm && (
            <>
              {/* Trip Summary Box */}
              <TripSummaryBox
                trip={planner.trip}
                weather={planner.weather}
                weatherLoading={planner.weatherLoading}
              />

              {/* Pack Weight Summary */}
              <PackSummary
                gear={planner.trip.gear
                  .filter(g => !planner.excludedGear.has(g.item) && !planner.isGearIgnored(g.item))
                  .map(g => ({
                    item: g.item,
                    specs: g.specs,
                    weightG: planner.userGear[g.item]?.weightG,
                    status: planner.userGear[g.item]?.status || 'empty'
                  }))}
                isMatching={planner.isMatchingGear}
              />

              {/* Gear Requirements */}
              {planner.isMatchingGear && (
                <div className="text-sm text-muted italic mb-3 flex items-center gap-2">
                  <span className="inline-block w-3 h-3 border-2 border-muted border-t-burnt rounded-full animate-spin" />
                  Checking your gear inventory for matches...
                </div>
              )}
              <div className="gear-boxes">
                {planner.trip.gear
                  .filter(g => !planner.excludedGear.has(g.item) && !planner.isGearIgnored(g.item))
                  .map((g) => {
                    const entry = planner.userGear[g.item] || { input: '', status: 'empty', reasons: [] };
                    const search = planner.gearSearch[g.item] || { isSearching: false, isSearchingOnline: false, results: [], recommendation: null, showResults: false };

                    return (
                      <GearRequirementCard
                        key={g.item}
                        requirement={g}
                        entry={entry}
                        search={search}
                        onGearChange={(value) => planner.handleGearChange(g.item, value)}
                        onGearSubmit={() => planner.handleGearSubmit(g.item, exactSpecs)}
                        onRecommend={() => planner.handleRecommend(g.item, userCountry)}
                        onRemove={() => planner.handleRemoveGear(g.item)}
                        onClear={() => planner.handleGearClear(g.item)}
                        onSelectProduct={(product) => planner.handleSelectProduct(g.item, product)}
                        onOnlineSearch={() => planner.handleOnlineSearch(g.item)}
                      />
                    );
                  })}

                {/* Added inventory gear */}
                {planner.inventoryGear.map(g => (
                  <div key={g.id} className="gear-box gear-box-added">
                    <div className="gear-box-header">
                      <span className="gear-box-bullet" style={{ color: '#059669' }}>●</span>
                      <span className="gear-box-title">{g.name.toUpperCase()}</span>
                      <button
                        onClick={() => planner.setInventoryGear(prev => prev.filter(item => item.id !== g.id))}
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

              {/* System Compatibility Check */}
              <SystemCheckDisplay
                systemCheck={planner.systemCheck}
                isChecking={planner.isCheckingSystem}
              />

              {/* Add from My Gear */}
              {session && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      planner.loadUserInventory();
                      planner.setShowInventoryPicker(true);
                    }}
                    className="text-sm link font-medium"
                  >
                    + Add from My Gear
                  </button>
                </div>
              )}

              {/* Excluded items */}
              {planner.excludedGear.size > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-muted mb-2">Removed items (click to restore):</div>
                  <div className="flex flex-wrap gap-2">
                    {[...planner.excludedGear].map(item => (
                      <button
                        key={item}
                        onClick={() => planner.handleRestoreGear(item)}
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
                      planner.setPlannedDate(planner.tripConfirm?.plannedDate || '');
                      planner.setShowSaveModal(true);
                    }
                  }}
                  className="btn-primary px-8"
                >
                  Add Trip
                </button>
              </div>
            </>
          )}

          {!planner.trip && !planner.isLoading && !planner.showTripResults && !planner.showConfirm && (
            <DestinationTicker
              onSelectDestination={(dest) => {
                planner.setObjective(dest);
              }}
            />
          )}
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        exactSpecs={exactSpecs}
        theme={theme}
        onClose={() => setShowSettings(false)}
        onExactSpecsChange={setExactSpecs}
        onThemeChange={setTheme}
        onSave={saveSettings}
      />

      {/* Add Trip Modal */}
      {planner.trip && (
        <SaveTripModal
          isOpen={planner.showSaveModal}
          trip={planner.trip}
          excludedGear={planner.excludedGear}
          userGear={planner.userGear}
          plannedDate={planner.plannedDate}
          isSaving={planner.isSavingTrip}
          onClose={() => planner.setShowSaveModal(false)}
          onDateChange={planner.setPlannedDate}
          onSave={planner.handleSaveTrip}
        />
      )}

      {/* Inventory Picker Modal */}
      <InventoryPickerModal
        isOpen={planner.showInventoryPicker}
        userInventory={planner.userInventory}
        addedGear={planner.inventoryGear}
        onClose={() => planner.setShowInventoryPicker(false)}
        onSelectGear={planner.handleAddInventoryGear}
      />
    </>
  );
}
