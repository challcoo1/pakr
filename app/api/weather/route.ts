import { NextResponse } from 'next/server';

interface WeatherDay {
  date: string;
  tempHigh: number;
  tempLow: number;
  precipitation: number;
  weatherCode?: number;
  condition?: string;
}

interface WeatherData {
  type: 'forecast' | 'historical' | 'mountain';
  location: string;
  tempHigh: number;
  tempLow: number;
  precipitation: number;
  description: string;
  days?: WeatherDay[];
  // Warnings for near-term forecasts
  warnings?: string[];
  // Historical distribution data for bell curve visualization
  distribution?: {
    month: string;
    tempMean: number;
    tempStdDev: number;
    tempMin: number;
    tempMax: number;
    precipMean: number;
    precipStdDev: number;
    // Enhanced stats
    snowDays: number;
    rainyDays: number;
    avgSnowfall: number;
    sunnyDays: number;
  };
  // LLM-generated recommendations
  recommendations?: string[];
  // Mountain-Forecast elevation bands
  elevationBands?: {
    elevation: number;
    label: string;
    tempHigh: number;
    tempLow: number;
    wind: number;
    windDirection: string;
    snow: number;
    freezingLevel: number;
    conditions: string;
  }[];
  // Calculated elevation range info
  elevationRange?: {
    gain: number;
    maxAltitude: number | null;
    summitTemp: number;
  };
  source?: 'mountain-forecast' | 'open-meteo';
}

// Convert trip/peak name to Mountain-Forecast URL slug
function toMountainForecastSlug(name: string): string {
  return name
    .replace(/['']/g, '')
    .replace(/\//g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Try to find a peak on Mountain-Forecast
async function findMountainForecastPeak(tripName: string): Promise<{ slug: string; elevation: number; levels: number[] } | null> {
  // Extract potential peak name from trip name
  // e.g., "Aoraki/Mount Cook Summit Route" -> try "Aoraki-Mount-Cook"
  const peakPatterns = [
    tripName,
    tripName.replace(/\s+(track|trail|route|hike|trek|circuit|loop)$/i, ''),
    tripName.replace(/^the\s+/i, ''),
  ];

  for (const pattern of peakPatterns) {
    const slug = toMountainForecastSlug(pattern);
    if (!slug) continue;

    try {
      // Try to fetch the peak page
      const response = await fetch(`https://www.mountain-forecast.com/peaks/${slug}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) continue;

      const html = await response.text();

      // Extract elevation from the page
      const elevMatch = html.match(/forecasts\/(\d+)/);
      const elevation = elevMatch ? parseInt(elevMatch[1]) : null;

      if (!elevation) continue;

      // Try to extract levels array from FCGON
      const levelsMatch = html.match(/levels['"]\s*:\s*\[([\d,\s"']+)\]/);
      let levels: number[] = [elevation];
      if (levelsMatch) {
        levels = levelsMatch[1]
          .split(',')
          .map(s => parseInt(s.replace(/['"]/g, '').trim()))
          .filter(n => !isNaN(n));
      }

      return { slug, elevation, levels };
    } catch {
      continue;
    }
  }

  return null;
}

// Fetch and parse Mountain-Forecast data
async function getMountainForecast(
  slug: string,
  elevation: number,
  levels: number[]
): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `https://www.mountain-forecast.com/peaks/${slug}/forecasts/${elevation}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (!response.ok) return null;

    const html = await response.text();

    // Parse forecast data from HTML
    // Extract temperatures (look for patterns like "-18" in max/min rows)
    const tempMaxMatch = html.match(/max[^<]*<[^>]*>([+-]?\d+)/i);
    const tempMinMatch = html.match(/min[^<]*<[^>]*>([+-]?\d+)/i);

    const tempHigh = tempMaxMatch ? parseInt(tempMaxMatch[1]) : null;
    const tempLow = tempMinMatch ? parseInt(tempMinMatch[1]) : null;

    if (tempHigh === null || tempLow === null) return null;

    // Extract wind speed (look for patterns like "40 SSW")
    const windMatch = html.match(/(\d+)\s*(N|NE|E|SE|S|SW|W|NW|NNE|ENE|ESE|SSE|SSW|WSW|WNW|NNW)/);
    const windSpeed = windMatch ? parseInt(windMatch[1]) : 0;
    const windDir = windMatch ? windMatch[2] : '';

    // Extract snow (look for cm values near snowflake icons)
    const snowMatch = html.match(/(\d+)\s*cm/);
    const snow = snowMatch ? parseInt(snowMatch[1]) : 0;

    // Extract freezing level
    const freezingMatch = html.match(/freezing[^<]*level[^<]*<[^>]*>(\d+)/i);
    const freezingLevel = freezingMatch ? parseInt(freezingMatch[1]) : 0;

    // Build elevation bands
    const elevationBands = levels.slice(0, 4).map((elev, idx) => {
      // Estimate temps at lower elevations (6.5°C per 1000m)
      const elevDiff = (elevation - elev) / 1000;
      const tempAdjust = Math.round(elevDiff * 6.5);

      let label = 'Base';
      if (idx === 0) label = 'Summit';
      else if (idx === levels.length - 1) label = 'Base';
      else label = `${elev}m`;

      return {
        elevation: elev,
        label,
        tempHigh: tempHigh + tempAdjust,
        tempLow: tempLow + tempAdjust,
        wind: Math.round(windSpeed * (idx === 0 ? 1 : 0.7 - idx * 0.1)),
        windDirection: windDir,
        snow: idx === 0 ? snow : Math.round(snow * 0.7),
        freezingLevel,
        conditions: getConditionsFromTemp(tempHigh + tempAdjust, snow > 0),
      };
    });

    // Calculate precipitation chance from snow/conditions
    const precipChance = snow > 0 ? 70 : 20;

    return {
      type: 'mountain',
      location: slug.replace(/-/g, ' '),
      tempHigh,
      tempLow,
      precipitation: precipChance,
      description: getConditionsFromTemp(tempHigh, snow > 0),
      elevationBands,
      source: 'mountain-forecast',
    };
  } catch (error) {
    console.error('Mountain-Forecast parse error:', error);
    return null;
  }
}

function getConditionsFromTemp(temp: number, hasSnow: boolean): string {
  let cond = '';
  if (temp <= -10) cond = 'Very cold';
  else if (temp <= -5) cond = 'Cold, snow likely';
  else if (temp <= 0) cond = 'Near freezing';
  else if (temp <= 5) cond = 'Cold';
  else if (temp <= 10) cond = 'Cool';
  else if (temp <= 18) cond = 'Mild';
  else cond = 'Warm';

  if (hasSnow && temp <= 2) cond += ', snow';
  return cond;
}

// Temperature lapse rate: ~6.5°C per 1000m elevation gain
const LAPSE_RATE = 6.5;

// Parse elevation string to extract gain and max altitude
// Examples: "over 2,800m gain | Max: 4,478m", "1,500m - 2,400m", "~1200m gain"
function parseElevationInfo(elevation: string): { gain: number | null; maxAltitude: number | null; minAltitude: number | null } {
  const result = { gain: null as number | null, maxAltitude: null as number | null, minAltitude: null as number | null };

  // Try to find max altitude (e.g., "Max: 4,478m" or "summit 4478m")
  const maxMatch = elevation.match(/(?:max|summit|peak|top)[:\s]*([0-9,]+)\s*m/i);
  if (maxMatch) {
    result.maxAltitude = parseInt(maxMatch[1].replace(/,/g, ''));
  }

  // Try to find elevation gain (e.g., "2,800m gain" or "over 1200m")
  const gainMatch = elevation.match(/(?:over\s+)?([0-9,]+)\s*m?\s*(?:gain|elevation)/i);
  if (gainMatch) {
    result.gain = parseInt(gainMatch[1].replace(/,/g, ''));
  }

  // Try to find elevation range (e.g., "1,500m - 2,400m")
  const rangeMatch = elevation.match(/([0-9,]+)\s*m?\s*[-–]\s*([0-9,]+)\s*m/i);
  if (rangeMatch) {
    result.minAltitude = parseInt(rangeMatch[1].replace(/,/g, ''));
    result.maxAltitude = parseInt(rangeMatch[2].replace(/,/g, ''));
    if (!result.gain) {
      result.gain = result.maxAltitude - result.minAltitude;
    }
  }

  // If we have max but no gain, look for any large number as potential gain
  if (!result.gain && !rangeMatch) {
    const numberMatch = elevation.match(/([0-9,]+)\s*m/);
    if (numberMatch) {
      const num = parseInt(numberMatch[1].replace(/,/g, ''));
      // If number is less than 9000, it's probably gain, not altitude
      if (num < 9000 && !result.maxAltitude) {
        result.gain = num;
      }
    }
  }

  return result;
}

// Generate elevation-based weather warnings
function generateElevationWarnings(
  baseTemp: number,
  elevationInfo: { gain: number | null; maxAltitude: number | null },
  precipitation: number
): string[] {
  const warnings: string[] = [];

  if (!elevationInfo.gain || elevationInfo.gain < 500) {
    return warnings;
  }

  // Calculate temperature at summit using lapse rate
  const tempDrop = (elevationInfo.gain / 1000) * LAPSE_RATE;
  const summitTemp = Math.round(baseTemp - tempDrop);

  // Significant temperature difference warning
  if (tempDrop >= 10) {
    warnings.push(`Summit will be ~${Math.round(tempDrop)}°C colder than trailhead (expect ${summitTemp}° vs ${Math.round(baseTemp)}°)`);
  }

  // Snow/ice at summit while warm at base
  if (baseTemp >= 15 && summitTemp <= 0) {
    warnings.push('Shorts weather at base, but freezing with possible snow/ice at summit - pack full alpine kit');
  } else if (baseTemp >= 10 && summitTemp <= 2) {
    warnings.push('Mild at trailhead but near-freezing at summit - bring warm layers and wind protection');
  }

  // High altitude specific warnings
  if (elevationInfo.maxAltitude && elevationInfo.maxAltitude >= 4000) {
    warnings.push('High altitude: acclimatization needed, weather can change rapidly');
  } else if (elevationInfo.maxAltitude && elevationInfo.maxAltitude >= 3000) {
    warnings.push('Significant altitude: expect stronger winds and UV exposure at summit');
  }

  // Snow at summit
  if (summitTemp <= -5 && precipitation >= 30) {
    warnings.push(`Snow likely at summit (${summitTemp}°) - check conditions and bring traction devices`);
  } else if (summitTemp <= 0 && precipitation >= 40) {
    warnings.push('Precipitation may fall as snow above treeline');
  }

  return warnings;
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

// Weather code to condition mapping (WMO codes)
function getWeatherCondition(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 49) return 'Foggy';
  if (code <= 59) return 'Drizzle';
  if (code <= 69) return 'Rain';
  if (code <= 79) return 'Snow';
  if (code <= 84) return 'Rain showers';
  if (code <= 86) return 'Snow showers';
  if (code === 95) return 'Thunderstorm';
  if (code <= 99) return 'Thunderstorm with hail';
  return 'Unknown';
}

// Generate warnings based on weather codes and conditions
function generateWarnings(days: WeatherDay[]): string[] {
  const warnings: string[] = [];

  const hasThunderstorm = days.some(d => d.weatherCode && d.weatherCode >= 95);
  const hasHeavyRain = days.some(d => d.precipitation >= 70);
  const hasSnow = days.some(d => d.weatherCode && d.weatherCode >= 70 && d.weatherCode <= 79);
  const hasFreezing = days.some(d => d.tempLow <= 0);
  const hasHeat = days.some(d => d.tempHigh >= 30);
  const consecutiveRain = days.filter(d => d.precipitation >= 50).length >= 3;

  if (hasThunderstorm) warnings.push('Thunderstorms expected - avoid exposed ridges');
  if (hasHeavyRain) warnings.push('Heavy rain likely - waterproof gear essential');
  if (hasSnow) warnings.push('Snow expected - check conditions and bring traction');
  if (hasFreezing) warnings.push('Below freezing overnight - pack warm layers');
  if (hasHeat) warnings.push('High temperatures - carry extra water');
  if (consecutiveRain) warnings.push('Extended wet period - plan for mud and river crossings');

  return warnings;
}

// Get 7-day forecast from Open-Meteo
async function getForecast(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,snowfall_sum,weathercode,wind_speed_10m_max&timezone=auto&forecast_days=10`
    );
    const data = await response.json();

    if (!data.daily) return null;

    const days: WeatherDay[] = data.daily.time.map((date: string, i: number) => ({
      date,
      tempHigh: Math.round(data.daily.temperature_2m_max[i]),
      tempLow: Math.round(data.daily.temperature_2m_min[i]),
      precipitation: data.daily.precipitation_probability_max[i] || 0,
      weatherCode: data.daily.weathercode[i],
      condition: getWeatherCondition(data.daily.weathercode[i]),
    }));

    // Calculate averages for the period
    const avgHigh = Math.round(days.reduce((sum, d) => sum + d.tempHigh, 0) / days.length);
    const avgLow = Math.round(days.reduce((sum, d) => sum + d.tempLow, 0) / days.length);
    const avgPrecip = Math.round(days.reduce((sum, d) => sum + d.precipitation, 0) / days.length);

    // Generate warnings
    const warnings = generateWarnings(days);

    return {
      type: 'forecast',
      location: '',
      tempHigh: avgHigh,
      tempLow: avgLow,
      precipitation: avgPrecip,
      description: getWeatherDescription(avgHigh, avgPrecip),
      days,
      warnings: warnings.length > 0 ? warnings : undefined,
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
        // Estimate snow based on temperature and precipitation
        snowfall: (data.daily.temperature_2m_max[i] <= 2 && data.daily.precipitation_sum[i] > 0)
          ? data.daily.precipitation_sum[i] * 0.5 : 0,
        // Estimate weather code: clear if no precip, rain/snow otherwise
        weatherCode: data.daily.precipitation_sum[i] > 1
          ? (data.daily.temperature_2m_max[i] <= 2 ? 73 : 63) : 0,
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

    // Calculate enhanced stats
    const totalDays = monthDays.length;
    const yearsOfData = Math.max(1, Math.round(totalDays / 30)); // Approximate, minimum 1 to avoid division by zero
    const rainyDays = Math.round(monthDays.filter((d: { precipitation: number }) => d.precipitation > 1).length / yearsOfData);
    const snowDays = Math.round(monthDays.filter((d: { snowfall: number }) => d.snowfall > 0).length / yearsOfData);
    const sunnyDays = Math.round(monthDays.filter((d: { weatherCode: number }) => d.weatherCode <= 3).length / yearsOfData);
    const avgSnowfall = monthDays.reduce((sum: number, d: { snowfall: number }) => sum + d.snowfall, 0) / yearsOfData;

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

    // Generate recommendations based on historical data
    const recommendations = generateHistoricalRecommendations({
      avgHigh,
      avgLow,
      rainyDays,
      snowDays,
      avgSnowfall,
      month: MONTH_NAMES[month],
    });

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
        snowDays,
        rainyDays,
        avgSnowfall: Math.round(avgSnowfall * 10) / 10,
        sunnyDays,
      },
      recommendations,
    };
  } catch (error) {
    console.error('Historical weather error:', error);
    return null;
  }
}

// Generate recommendations based on historical weather patterns
function generateHistoricalRecommendations(stats: {
  avgHigh: number;
  avgLow: number;
  rainyDays: number;
  snowDays: number;
  avgSnowfall: number;
  month: string;
}): string[] {
  const recs: string[] = [];

  // Temperature-based recommendations
  if (stats.avgLow <= 0) {
    recs.push('Sub-zero temperatures common - pack insulated layers and consider a 4-season tent');
  } else if (stats.avgLow <= 5) {
    recs.push('Cold nights expected - bring warm sleeping bag (comfort rating 0°C or lower)');
  } else if (stats.avgHigh >= 28) {
    recs.push('Hot conditions typical - start early, carry extra water, and plan for shade breaks');
  }

  // Precipitation recommendations
  if (stats.rainyDays >= 15) {
    recs.push(`${stats.month} is historically wet (~${stats.rainyDays} rainy days) - waterproof everything`);
  } else if (stats.rainyDays >= 8) {
    recs.push('Moderate rainfall expected - pack rain gear and dry bags for electronics');
  } else if (stats.rainyDays <= 3) {
    recs.push(`${stats.month} is typically dry - good conditions but UV protection essential`);
  }

  // Snow recommendations
  if (stats.snowDays >= 10) {
    recs.push(`Heavy snow month (~${Math.round(stats.avgSnowfall)}cm avg) - crampons and ice axe likely needed`);
  } else if (stats.snowDays >= 3) {
    recs.push('Snow possible at altitude - check conditions and consider microspikes');
  }

  // Variability warning
  if (stats.avgHigh - stats.avgLow >= 15) {
    recs.push('Large temperature swings - layer system essential for adapting throughout day');
  }

  return recs;
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
    const { location, region, timeOfYear, plannedDate, elevation } = await request.json();

    if (!location && !region) {
      return NextResponse.json({ error: 'Location required' }, { status: 400 });
    }

    // Build search query - prefer region for better geocoding
    const searchQuery = region || location;

    let weather: WeatherData | null = null;

    // Try Mountain-Forecast first for accurate summit weather
    const peak = await findMountainForecastPeak(location || region);
    if (peak) {
      weather = await getMountainForecast(peak.slug, peak.elevation, peak.levels);
    }

    // If Mountain-Forecast didn't work, fall back to Open-Meteo
    if (!weather) {
      // Geocode the location
      const coords = await geocodeLocation(searchQuery);
      if (!coords) {
        return NextResponse.json({ error: 'Could not find location' }, { status: 404 });
      }

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

      if (weather) {
        weather.source = 'open-meteo';
      }
    }

    if (!weather) {
      return NextResponse.json({ error: 'Could not fetch weather data' }, { status: 500 });
    }

    weather.location = searchQuery;

    // Add elevation-based warnings if elevation data provided
    if (elevation) {
      const elevationInfo = parseElevationInfo(elevation);
      if (elevationInfo.gain && elevationInfo.gain >= 500) {
        const elevationWarnings = generateElevationWarnings(
          weather.tempHigh,
          elevationInfo,
          weather.precipitation
        );

        if (elevationWarnings.length > 0) {
          weather.warnings = [...(weather.warnings || []), ...elevationWarnings];
        }

        // Add elevation info to weather for widget display
        weather.elevationRange = {
          gain: elevationInfo.gain,
          maxAltitude: elevationInfo.maxAltitude,
          summitTemp: Math.round(weather.tempHigh - (elevationInfo.gain / 1000) * LAPSE_RATE),
        };
      }
    }

    return NextResponse.json({ weather });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json({ error: 'Weather fetch failed' }, { status: 500 });
  }
}
