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

export default function Home() {
  const [objective, setObjective] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trip, setTrip] = useState<TripAnalysis | null>(null);
  const [userGear, setUserGear] = useState<Record<string, UserGearEntry>>({});

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
  };

  // Validate on blur or Enter
  const handleGearValidate = async (item: string) => {
    const entry = userGear[item];
    if (!entry?.input.trim()) {
      setUserGear(prev => ({
        ...prev,
        [item]: { input: '', status: 'empty', reasons: [] }
      }));
      return;
    }

    const requirement = trip?.gear.find(g => g.item === item);
    if (!requirement) return;

    try {
      const response = await fetch('/api/validate-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userGear: entry.input.trim(),
          requirement: requirement
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
          <div className="flex items-center gap-4 mb-4">
            <span className="logo">pakr</span>
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
                  const status = getStatusIndicator(entry.status);
                  const needsAction = entry.status === 'empty' || entry.status === 'unsuitable';
                  const needsUpgrade = entry.status === 'marginal';

                  return (
                    <tr key={g.item} className={g.priority === 'critical' ? 'critical' : ''}>
                      <td>
                        <div className="font-medium">{g.item}</div>
                        <div className="text-sm text-muted">{g.specs}</div>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={entry.input}
                          onChange={(e) => handleGearChange(g.item, e.target.value)}
                          onBlur={() => handleGearValidate(g.item)}
                          onKeyDown={(e) => e.key === 'Enter' && handleGearValidate(g.item)}
                          placeholder="What do you have?"
                          className="input-small"
                        />
                        {entry.reasons.length > 0 && (
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
                          <button className="btn-action">FIND</button>
                        )}
                        {needsUpgrade && (
                          <button className="btn-action btn-upgrade">UPGRADE</button>
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
