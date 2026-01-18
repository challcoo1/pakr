'use client';

import { useState, useEffect } from 'react';
import { COUNTRIES, Country } from '@/lib/constants';

const STORAGE_KEY = 'pakr-country';

export function useCountry() {
  const [country, setCountry] = useState<Country | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from storage or auto-detect on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCountry(JSON.parse(saved));
        setIsLoading(false);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    if (!saved) {
      fetch('https://ipapi.co/json/')
        .then(r => r.json())
        .then(data => {
          const detected = COUNTRIES.find(c => c.code === data.country_code);
          if (detected) {
            setCountry(detected);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(detected));
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, []);

  // Save to storage when changed
  const updateCountry = (newCountry: Country) => {
    setCountry(newCountry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCountry));
  };

  return {
    country,
    setCountry: updateCountry,
    isLoading,
  };
}
