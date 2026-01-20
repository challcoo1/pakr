'use client';

import { useState, useEffect } from 'react';

interface Destination {
  name: string;
  country: string;
  lat: number;
  lon: number;
  temp?: number;
  condition?: string;
}

const DESTINATIONS: Destination[] = [
  { name: 'Chamonix', country: 'France', lat: 45.92, lon: 6.87 },
  { name: 'Queenstown', country: 'New Zealand', lat: -45.03, lon: 168.66 },
  { name: 'Torres del Paine', country: 'Chile', lat: -51.25, lon: -72.35 },
  { name: 'Zermatt', country: 'Switzerland', lat: 46.02, lon: 7.75 },
  { name: 'Yosemite', country: 'USA', lat: 37.87, lon: -119.54 },
  { name: 'Hokkaido', country: 'Japan', lat: 43.06, lon: 141.35 },
  { name: 'Milford Sound', country: 'New Zealand', lat: -44.67, lon: 167.93 },
  { name: 'Dolomites', country: 'Italy', lat: 46.41, lon: 11.84 },
];

function getConditionIcon(code: number): string {
  if (code === 0) return '☀';
  if (code <= 3) return '⛅';
  if (code <= 49) return '🌫';
  if (code <= 69) return '🌧';
  if (code <= 79) return '❄';
  if (code <= 84) return '🌧';
  if (code <= 86) return '🌨';
  if (code >= 95) return '⛈';
  return '☁';
}

function getConditionText(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 49) return 'Foggy';
  if (code <= 59) return 'Drizzle';
  if (code <= 69) return 'Rain';
  if (code <= 79) return 'Snow';
  if (code <= 84) return 'Showers';
  if (code <= 86) return 'Snow showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
}

interface DestinationTickerProps {
  onSelectDestination?: (name: string) => void;
}

export default function DestinationTicker({ onSelectDestination }: DestinationTickerProps) {
  const [destinations, setDestinations] = useState<Destination[]>(DESTINATIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Fetch weather for all destinations in parallel
        const coords = DESTINATIONS.map(d => `${d.lat},${d.lon}`).join('|');
        const lats = DESTINATIONS.map(d => d.lat).join(',');
        const lons = DESTINATIONS.map(d => d.lon).join(',');

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,weathercode&timezone=auto`
        );
        const data = await response.json();

        // Open-Meteo returns array when multiple locations
        const updated = DESTINATIONS.map((dest, i) => {
          const current = Array.isArray(data) ? data[i]?.current : data.current;
          return {
            ...dest,
            temp: current?.temperature_2m ? Math.round(current.temperature_2m) : undefined,
            condition: current?.weathercode !== undefined ? getConditionText(current.weathercode) : undefined,
          };
        });

        setDestinations(updated);
      } catch (error) {
        console.error('Failed to fetch destination weather:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const handleClick = (name: string, country: string) => {
    if (onSelectDestination) {
      onSelectDestination(`${name}, ${country}`);
    }
  };

  // Double the items for seamless loop
  const tickerItems = [...destinations, ...destinations];

  return (
    <div className="destination-ticker">
      <div className="destination-ticker-label">Explore</div>
      <div className="destination-ticker-track">
        <div className="destination-ticker-scroll">
          {tickerItems.map((dest, idx) => (
            <button
              key={`${dest.name}-${idx}`}
              className="destination-card"
              onClick={() => handleClick(dest.name, dest.country)}
              type="button"
            >
              <div className="destination-card-main">
                <span className="destination-name">{dest.name}</span>
                <span className="destination-country">{dest.country}</span>
              </div>
              <div className="destination-weather">
                {loading ? (
                  <span className="destination-loading">...</span>
                ) : dest.temp !== undefined ? (
                  <>
                    <span className="destination-temp">{dest.temp}°</span>
                    <span className="destination-condition">{dest.condition}</span>
                  </>
                ) : (
                  <span className="destination-condition">--</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
