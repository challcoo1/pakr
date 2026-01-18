'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Header from '@/components/Header';
import HistoricalWeatherCurve from '@/components/HistoricalWeatherCurve';
import PackSummary from '@/components/PackSummary';
import GearBox from '@/components/GearBox';
import SettingsModal from '@/components/SettingsModal';
import SaveTripModal from '@/components/SaveTripModal';
import { useCountry } from '@/hooks/useCountry';
import { useTripPlanner } from '@/hooks/useTripPlanner';
import { ACTIVITY_TYPES } from '@/types';

export default function Home() {
  const { data: session } = useSession();
  const { country: userCountry } = useCountry();

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [exactSpecs, setExactSpecs] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [ignoredGear, setIgnoredGear] = useState<Set<string>>(new Set());

  // Inventory picker
  const [showInventoryPicker, setShowInventoryPicker] = useState(false);
  const [userInventory, setUserInventory] = useState<{ id: string; name: string; category: string }[]>([]);

  // Trip planner hook
  const planner = useTripPlanner({ isLoggedIn: !!session?.user });

  // Load settings
  useEffect(() => {
    const savedSpecs = localStorage.getItem('pakr-specs-mode');
    const savedTheme = localStorage.getItem('pakr-theme');
    const savedIgnored = localStorage.getItem('pakr-ignored-gear');
    if (savedSpecs === 'detailed') setExactSpecs(true);
    if (savedTheme === 'dark') setTheme('dark');
    if (savedIgnored) {
      try { setIgnoredGear(new Set(JSON.parse(savedIgnored))); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const isGearIgnored = (item: string) => ignoredGear.has(item.toLowerCase());

  const loadUserInventory = async () => {
    if (!session?.user) return;
    try {
      const res = await fetch('/api/gear');
      const data = await res.json();
      setUserInventory(data.gear?.map((g: { id: string; name: string; category?: string }) => ({
        id: g.id, name: g.name, category: g.category || 'Other'
      })) || []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    planner.handleSearch();
  };

  const settingsButton = (
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
  );

  const visibleGear = planner.trip?.gear.filter(g => !planner.excludedGear.has(g.item) && !isGearIgnored(g.item)) || [];

  return (
    <>
      <Header activePage="home" rightContent={settingsButton} />

      <div className="main-content">
        {/* Search */}
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="relative">
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

        <main className="max-w-4xl mx-auto px-4 pb-4">
          {/* Loading */}
          {planner.isLoading && !planner.showConfirm && (
            <div className="text-center py-12 text-muted">
              <div className="flex items-center justify-center gap-3">
                <span className="inline-block w-4 h-4 border-2 border-muted border-t-burnt rounded-full animate-spin" />
                <span>{planner.loadingStatus || 'Loading...'}</span>
              </div>
            </div>
          )}

          {/* Trip selection */}
          {planner.showTripResults && planner.tripResults.length > 0 && !planner.isLoading && (
            <div className="space-y-3">
              <p className="text-muted text-sm">Which trip do you mean?</p>
              {planner.tripResults.map((t, idx) => (
                <button key={idx} onClick={() => planner.handleSelectTrip(t)} className="w-full text-left p-4 bg-white border-2 border-charcoal rounded hover:border-burnt transition-colors">
                  <div className="font-bold">{t.name}</div>
                  <div className="text-sm text-muted">{t.location}</div>
                  <div className="text-sm mt-1">{t.duration} · {t.difficulty} · {t.distance}</div>
                  <div className="text-xs text-muted mt-1">{t.summary}</div>
                </button>
              ))}
            </div>
          )}

          {/* Confirmation */}
          {planner.showConfirm && planner.tripConfirm && !planner.isLoading && (() => {
            const tc = planner.tripConfirm;
            return (
              <div className="trip-summary">
                <h2 className="text-lg font-bold mb-4">Confirm your trip</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Place</label>
                    <div className="flex gap-2">
                      <input type="text" value={tc.place} onChange={(e) => planner.setTripConfirm({ ...tc, place: e.target.value })} className="input-small flex-1" />
                      <button type="button" onClick={planner.handleResearch} disabled={planner.isLoading} className="px-3 py-1 text-sm border border-charcoal rounded hover:bg-gray-100">Search</button>
                    </div>
                    {planner.selectedTrip && <div className="text-xs text-muted mt-1">{planner.selectedTrip.location}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Time of Year</label>
                    <input type="text" value={tc.timeOfYear} onChange={(e) => planner.setTripConfirm({ ...tc, timeOfYear: e.target.value })} className={`input-small w-full ${!tc.timeOfYear ? 'border-burnt' : ''}`} placeholder="Enter month or season" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration</label>
                    <input type="text" value={tc.duration} onChange={(e) => planner.setTripConfirm({ ...tc, duration: e.target.value })} className={`input-small w-full ${!tc.duration ? 'border-burnt' : ''}`} placeholder="e.g. 3 days" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Activity</label>
                    <select value={tc.activity} onChange={(e) => planner.setTripConfirm({ ...tc, activity: e.target.value })} className="input-small w-full">
                      {ACTIVITY_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                  </div>
                  {planner.selectedTrip && (
                    <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                      <div className="font-medium">{planner.selectedTrip.name}</div>
                      <div className="text-muted">{planner.selectedTrip.summary}</div>
                    </div>
                  )}
                  <button onClick={planner.handleConfirmAnalyze} disabled={!tc.place} className="btn-primary w-full mt-4">
                    Analyze Gear Requirements
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Trip results */}
          {planner.trip && !planner.isLoading && !planner.showTripResults && !planner.showConfirm && (
            <>
              <div className="trip-box mb-6">
                <h2 className="trip-box-name">{planner.trip.name.toUpperCase()}</h2>
                <p className="trip-box-line">{planner.trip.region}{planner.trip.timeOfYear && ` | ${planner.trip.timeOfYear}`}{planner.trip.duration && ` | ${planner.trip.duration}`}</p>
                {planner.trip.grading?.local && <p className="trip-box-line">{planner.trip.grading.local}{planner.trip.grading.international && ` | International: ${planner.trip.grading.international}`}</p>}
                {planner.weather?.type === 'historical' && planner.weather.distribution && (
                  <HistoricalWeatherCurve month={planner.weather.distribution.month} tempMean={planner.weather.distribution.tempMean} tempStdDev={planner.weather.distribution.tempStdDev} tempMin={planner.weather.distribution.tempMin} tempMax={planner.weather.distribution.tempMax} precipMean={planner.weather.distribution.precipMean} />
                )}
              </div>

              <PackSummary
                gear={visibleGear.map(g => ({ item: g.item, specs: g.specs, weightG: planner.userGear[g.item]?.weightG, status: planner.userGear[g.item]?.status || 'empty' }))}
                isMatching={planner.isMatchingGear}
              />

              {planner.isMatchingGear && (
                <div className="text-sm text-muted italic mb-3 flex items-center gap-2">
                  <span className="inline-block w-3 h-3 border-2 border-muted border-t-burnt rounded-full animate-spin" />
                  Checking your gear inventory...
                </div>
              )}

              <div className="gear-boxes">
                {visibleGear.map((g) => (
                  <GearBox
                    key={g.item}
                    requirement={g}
                    entry={planner.userGear[g.item] || { input: '', status: 'empty', reasons: [] }}
                    search={planner.gearSearch[g.item] || { isSearching: false, isSearchingOnline: false, results: [], recommendation: null, showResults: false }}
                    onInputChange={(v) => planner.handleGearChange(g.item, v)}
                    onSubmit={() => planner.handleGearSubmit(g.item, exactSpecs)}
                    onRemove={() => planner.handleRemoveGear(g.item)}
                    onClear={() => planner.handleGearClear(g.item)}
                    onRecommend={() => planner.handleRecommend(g.item, userCountry)}
                    onSelectProduct={(p) => planner.handleSelectProduct(g.item, p)}
                    onOnlineSearch={() => planner.handleOnlineSearch(g.item)}
                  />
                ))}

                {planner.inventoryGear.map(g => (
                  <div key={g.id} className="gear-box gear-box-added">
                    <div className="gear-box-header">
                      <span className="gear-box-bullet" style={{ color: '#059669' }}>●</span>
                      <span className="gear-box-title">{g.name.toUpperCase()}</span>
                      <button onClick={() => planner.setInventoryGear(prev => prev.filter(item => item.id !== g.id))} className="gear-box-remove">×</button>
                    </div>
                    <div className="gear-box-specs">{g.category} • From your gear</div>
                  </div>
                ))}
              </div>

              {session && (
                <div className="mt-4">
                  <button onClick={() => { loadUserInventory(); setShowInventoryPicker(true); }} className="text-sm link font-medium">+ Add from My Gear</button>
                </div>
              )}

              {planner.excludedGear.size > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-muted mb-2">Removed items:</div>
                  <div className="flex flex-wrap gap-2">
                    {[...planner.excludedGear].map(item => (
                      <button key={item} onClick={() => planner.handleRestoreGear(item)} className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded">{item} +</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-center">
                <button onClick={() => session ? setShowSaveModal(true) : signIn('google')} className="btn-primary px-8">Add Trip</button>
              </div>
            </>
          )}

          {!planner.trip && !planner.isLoading && !planner.showTripResults && !planner.showConfirm && (
            <div className="text-center py-12 text-muted">Enter your destination above to get started</div>
          )}
        </main>
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} exactSpecs={exactSpecs} setExactSpecs={setExactSpecs} theme={theme} setTheme={setTheme} />

      {planner.trip && (
        <SaveTripModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} trip={planner.trip} userGear={planner.userGear} excludedGear={planner.excludedGear} inventoryGear={planner.inventoryGear} />
      )}

      {showInventoryPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInventoryPicker(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Add from My Gear</h2>
            {userInventory.length === 0 ? (
              <p className="text-muted text-sm">No gear in your inventory yet.</p>
            ) : (
              <div className="overflow-y-auto flex-1">
                {userInventory.filter(g => !planner.inventoryGear.some(added => added.id === g.id)).map(g => (
                  <button key={g.id} onClick={() => { planner.setInventoryGear(prev => [...prev, g]); setShowInventoryPicker(false); }} className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 mb-2">
                    <div className="font-medium">{g.name}</div>
                    <div className="text-xs text-muted">{g.category}</div>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowInventoryPicker(false)} className="w-full px-4 py-2 border rounded hover:bg-gray-50 mt-4">Close</button>
          </div>
        </div>
      )}
    </>
  );
}
