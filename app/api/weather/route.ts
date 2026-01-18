import { NextResponse } from 'next/server';

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
  // Historical distribution data for bell curve visualization
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

// Geocode location using OpenStreetMap Nominatim (free, no API key)
async function geocodeLocation(location: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'Pakr/1.0 (trip planning app)',
        },
      }
    );
    const data = await response.json();
    if (data && data[0]) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Get 7-day forecast from Open-Meteo
async function getForecast(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&forecast_days=7`
    );
    const data = await response.json();

    if (!data.daily) return null;

    const days = data.daily.time.map((date: string, i: number) => ({
      date,
      tempHigh: Math.round(data.daily.temperature_2m_max[i]),
      tempLow: Math.round(data.daily.temperature_2m_min[i]),
      precipitation: data.daily.precipitation_probability_max[i] || 0,
    }));

    // Calculate averages for the period
    const avgHigh = Math.round(days.reduce((sum: number, d: { tempHigh: number }) => sum + d.tempHigh, 0) / days.length);
    const avgLow = Math.round(days.reduce((sum: number, d: { tempLow: number }) => sum + d.tempLow, 0) / days.length);
    const avgPrecip = Math.round(days.reduce((sum: number, d: { precipitation: number }) => sum + d.precipitation, 0) / days.length);

    return {
      type: 'forecast',
      location: '',
      tempHigh: avgHigh,
      tempLow: avgLow,
      precipitation: avgPrecip,
      description: getWeatherDescription(avgHigh, avgPrecip),
      days,
    };
  } catch {
    return null;
  }
}

// Calculate standard deviation
function calculateStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

// Month names for display
const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Get historical averages for a specific month
async function getHistoricalAverages(
  lat: number,
  lon: number,
  month: number
): Promise<WeatherData | null> {
  try {
    // Use Open-Meteo's historical data for the past 10 years for this month
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 10;

    // Get historical data for the target month across multiple years
    const startDate = `${startYear}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${currentYear - 1}-${String(month).padStart(2, '0')}-28`;

    const response = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
    );
    const data = await response.json();

    if (!data.daily || !data.daily.time) return null;

    // Filter to only include days in the target month and calculate averages
    const monthDays = data.daily.time
      .map((date: string, i: number) => ({
        month: new Date(date).getMonth() + 1,
        tempHigh: data.daily.temperature_2m_max[i],
        tempLow: data.daily.temperature_2m_min[i],
        precipitation: data.daily.precipitation_sum[i] || 0,
      }))
      .filter((d: { month: number; tempHigh: number | null }) => d.month === month && d.tempHigh !== null);

    if (monthDays.length === 0) return null;

    // Calculate temperature statistics (using daily average: (high+low)/2)
    const dailyAvgTemps = monthDays.map((d: { tempHigh: number; tempLow: number }) => (d.tempHigh + d.tempLow) / 2);
    const tempMean = dailyAvgTemps.reduce((sum: number, t: number) => sum + t, 0) / dailyAvgTemps.length;
    const tempStdDev = calculateStdDev(dailyAvgTemps, tempMean);
    const tempMin = Math.min(...dailyAvgTemps);
    const tempMax = Math.max(...dailyAvgTemps);

    // Calculate precipitation statistics
    const precipValues = monthDays.map((d: { precipitation: number }) => d.precipitation);
    const precipMean = precipValues.reduce((sum: number, p: number) => sum + p, 0) / precipValues.length;
    const precipStdDev = calculateStdDev(precipValues, precipMean);

    const avgHigh = Math.round(
      monthDays.reduce((sum: number, d: { tempHigh: number }) => sum + d.tempHigh, 0) / monthDays.length
    );
    const avgLow = Math.round(
      monthDays.reduce((sum: number, d: { tempLow: number }) => sum + d.tempLow, 0) / monthDays.length
    );
    const avgPrecip = Math.round(
      monthDays.reduce((sum: number, d: { precipitation: number }) => sum + d.precipitation, 0) / monthDays.length
    );
    // Convert daily precipitation to approximate rain chance percentage
    const rainChance = Math.min(90, Math.round(avgPrecip * 10));

    return {
      type: 'historical',
      location: '',
      tempHigh: avgHigh,
      tempLow: avgLow,
      precipitation: rainChance,
      description: getWeatherDescription(avgHigh, rainChance),
      distribution: {
        month: MONTH_NAMES[month],
        tempMean: Math.round(tempMean * 10) / 10,
        tempStdDev: Math.round(tempStdDev * 10) / 10,
        tempMin: Math.round(tempMin),
        tempMax: Math.round(tempMax),
        precipMean: Math.round(precipMean * 10) / 10,
        precipStdDev: Math.round(precipStdDev * 10) / 10,
      },
    };
  } catch (error) {
    console.error('Historical weather error:', error);
    return null;
  }
}

function getWeatherDescription(temp: number, precipitation: number): string {
  let desc = '';

  if (temp >= 25) desc = 'Warm';
  else if (temp >= 15) desc = 'Mild';
  else if (temp >= 5) desc = 'Cool';
  else desc = 'Cold';

  if (precipitation >= 60) desc += ', wet conditions likely';
  else if (precipitation >= 30) desc += ', chance of rain';
  else desc += ', mostly dry';

  return desc;
}

function getMonthFromString(timeOfYear: string): number | null {
  const months: Record<string, number> = {
    january: 1, february: 2, march: 3, april: 4,
    may: 5, june: 6, july: 7, august: 8,
    september: 9, october: 10, november: 11, december: 12,
    jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };

  const lower = timeOfYear.toLowerCase();

  // Check for month names
  for (const [name, num] of Object.entries(months)) {
    if (lower.includes(name)) return num;
  }

  // Check for seasons (approximate middle month)
  if (lower.includes('summer')) return 7; // July (NH) - will need adjustment for SH
  if (lower.includes('winter')) return 1;
  if (lower.includes('spring')) return 4;
  if (lower.includes('autumn') || lower.includes('fall')) return 10;

  return null;
}

export async function POST(request: Request) {
  try {
    const { location, region, timeOfYear, plannedDate } = await request.json();

    if (!location && !region) {
      return NextResponse.json({ error: 'Location required' }, { status: 400 });
    }

    // Build search query - prefer region for better geocoding
    const searchQuery = region || location;

    // Geocode the location
    const coords = await geocodeLocation(searchQuery);
    if (!coords) {
      return NextResponse.json({ error: 'Could not find location' }, { status: 404 });
    }

    // Determine if we should show forecast or historical
    let weather: WeatherData | null = null;
    const now = new Date();

    if (plannedDate) {
      const planned = new Date(plannedDate);
      const daysUntil = Math.ceil((planned.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil <= 10 && daysUntil >= 0) {
        // Within forecast range (10 days)
        weather = await getForecast(coords.lat, coords.lon);
      } else {
        // Use historical distribution for trips >10 days away
        const month = planned.getMonth() + 1;
        weather = await getHistoricalAverages(coords.lat, coords.lon, month);
      }
    } else if (timeOfYear) {
      // No specific date, use time of year for historical
      const month = getMonthFromString(timeOfYear);
      if (month) {
        weather = await getHistoricalAverages(coords.lat, coords.lon, month);
      }
    }

    // Fallback to forecast if nothing else worked
    if (!weather) {
      weather = await getForecast(coords.lat, coords.lon);
    }

    if (!weather) {
      return NextResponse.json({ error: 'Could not fetch weather data' }, { status: 500 });
    }

    weather.location = searchQuery;

    return NextResponse.json({ weather });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json({ error: 'Weather fetch failed' }, { status: 500 });
  }
}
