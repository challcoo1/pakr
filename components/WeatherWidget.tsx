'use client';

import { useState } from 'react';
import { SunIcon, CloudSunIcon, RainIcon, WindIcon, SnowIcon, WarningIcon, getWeatherIcon } from './WeatherIcons';
import { WeatherDay, WeatherDistribution } from '@/types';

interface ElevationWeather {
  elevation: number;
  label: string;
  tempHigh: number;
  tempLow: number;
  conditions: string;
  wind?: number;
  windDirection?: string;
  snow?: number;
}

interface ElevationBand {
  elevation: number;
  label: string;
  tempHigh: number;
  tempLow: number;
  wind: number;
  windDirection: string;
  snow: number;
  freezingLevel: number;
  conditions: string;
}

interface WeatherWidgetProps {
  weather: {
    type: 'forecast' | 'historical' | 'mountain';
    location: string;
    tempHigh: number;
    tempLow: number;
    precipitation: number;
    description: string;
    days?: WeatherDay[];
    distribution?: WeatherDistribution;
    elevationBands?: ElevationBand[];
    elevationRange?: {
      gain: number;
      maxAltitude: number | null;
      summitTemp: number;
    };
    source?: 'mountain-forecast' | 'open-meteo';
    warnings?: {
      severity: 'critical' | 'high' | 'moderate';
      message: string;
      action: string;
    }[];
    recommendations?: string[];
    layering?: {
      base: string;
      summit: string;
      strategy: string;
    };
  } | null;
  elevation?: string; // e.g., "1,500m - 2,400m"
  loading?: boolean;
}

// Temperature lapse rate: ~6.5°C per 1000m elevation gain
const LAPSE_RATE = 6.5;

function parseElevation(elevation: string): { low: number; high: number } | null {
  // Parse strings like "1,500m - 2,400m" or "1500-2400m"
  const matches = elevation.match(/(\d[,\d]*)\s*m?\s*[-–]\s*(\d[,\d]*)\s*m?/i);
  if (matches) {
    return {
      low: parseInt(matches[1].replace(/,/g, '')),
      high: parseInt(matches[2].replace(/,/g, '')),
    };
  }
  // Single elevation
  const single = elevation.match(/(\d[,\d]*)\s*m/i);
  if (single) {
    const val = parseInt(single[1].replace(/,/g, ''));
    return { low: val, high: val };
  }
  return null;
}

function calculateElevationWeather(
  baseTempHigh: number,
  baseTempLow: number,
  baseElevation: number,
  targetElevation: number
): { tempHigh: number; tempLow: number } {
  const elevationDiff = (targetElevation - baseElevation) / 1000;
  const tempDrop = elevationDiff * LAPSE_RATE;
  return {
    tempHigh: Math.round(baseTempHigh - tempDrop),
    tempLow: Math.round(baseTempLow - tempDrop),
  };
}

function getConditionsForTemp(temp: number, precip: number): string {
  let conditions = '';
  if (temp <= -5) conditions = 'Snow likely';
  else if (temp <= 2) conditions = 'Frost/snow possible';
  else if (temp <= 10) conditions = 'Cool';
  else if (temp <= 18) conditions = 'Mild';
  else conditions = 'Warm';

  if (precip >= 50) conditions += ', wet';
  else if (precip >= 25) conditions += ', showers possible';

  return conditions;
}

// Bell curve SVG for historical data
function BellCurve({
  tempMean,
  tempStdDev,
  tempMin,
  tempMax,
}: {
  tempMean: number;
  tempStdDev: number;
  tempMin: number;
  tempMax: number;
}) {
  const width = 200;
  const height = 60;
  const padding = { top: 5, right: 15, bottom: 20, left: 15 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const range = tempMax - tempMin;
  const paddedMin = tempMin - range * 0.1;
  const paddedMax = tempMax + range * 0.1;

  const xScale = (temp: number) =>
    padding.left + ((temp - paddedMin) / (paddedMax - paddedMin)) * chartWidth;
  const yScale = (y: number) => padding.top + chartHeight - y * chartHeight * 0.85;

  // Generate curve points
  const points: { x: number; y: number }[] = [];
  const numPoints = 40;
  const step = (paddedMax - paddedMin) / numPoints;
  for (let i = 0; i <= numPoints; i++) {
    const x = paddedMin + i * step;
    const exponent = -Math.pow(x - tempMean, 2) / (2 * Math.pow(tempStdDev, 2));
    const y = Math.exp(exponent);
    points.push({ x, y });
  }

  const pathData = points
    .map((p, i) => {
      const x = xScale(p.x);
      const y = yScale(p.y);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  const oneSigmaLow = tempMean - tempStdDev;
  const oneSigmaHigh = tempMean + tempStdDev;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={pathData} fill="none" stroke="var(--sage)" strokeWidth="1.5" />
      <line
        x1={xScale(tempMean)}
        y1={padding.top}
        x2={xScale(tempMean)}
        y2={height - padding.bottom}
        stroke="var(--terracotta)"
        strokeWidth="1"
        strokeDasharray="3 2"
      />
      <line
        x1={padding.left}
        y1={height - padding.bottom}
        x2={width - padding.right}
        y2={height - padding.bottom}
        stroke="var(--muted)"
        strokeWidth="0.5"
      />
      <text x={xScale(oneSigmaLow)} y={height - 4} textAnchor="middle" className="weather-curve-label">
        {Math.round(oneSigmaLow)}°
      </text>
      <text x={xScale(tempMean)} y={height - 4} textAnchor="middle" className="weather-curve-label" fill="var(--terracotta)">
        {Math.round(tempMean)}°
      </text>
      <text x={xScale(oneSigmaHigh)} y={height - 4} textAnchor="middle" className="weather-curve-label">
        {Math.round(oneSigmaHigh)}°
      </text>
    </svg>
  );
}

export default function WeatherWidget({ weather, elevation, loading }: WeatherWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) {
    return (
      <div className="weather-compact">
        <span className="weather-compact-loading">Loading weather...</span>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  // Use API-provided elevation bands if available (from Mountain-Forecast)
  const hasMountainData = weather.type === 'mountain' && weather.elevationBands && weather.elevationBands.length > 0;

  // Parse elevation for calculated multi-level weather (fallback)
  const elevationRange = elevation ? parseElevation(elevation) : null;
  const hasElevationRange = elevationRange && elevationRange.high - elevationRange.low >= 500;

  // Calculate elevation-based weather if no API data (assume weather data is for base/valley)
  const elevationWeather: ElevationWeather[] = [];
  if (!hasMountainData && hasElevationRange && elevationRange) {
    const baseElev = elevationRange.low;
    const midElev = Math.round((elevationRange.low + elevationRange.high) / 2);
    const summitElev = elevationRange.high;

    elevationWeather.push({
      elevation: baseElev,
      label: 'Trailhead',
      tempHigh: weather.tempHigh,
      tempLow: weather.tempLow,
      conditions: getConditionsForTemp((weather.tempHigh + weather.tempLow) / 2, weather.precipitation),
    });

    if (summitElev - baseElev >= 800) {
      const midWeather = calculateElevationWeather(weather.tempHigh, weather.tempLow, baseElev, midElev);
      elevationWeather.push({
        elevation: midElev,
        label: 'Mid-route',
        ...midWeather,
        conditions: getConditionsForTemp((midWeather.tempHigh + midWeather.tempLow) / 2, weather.precipitation),
      });
    }

    const summitWeather = calculateElevationWeather(weather.tempHigh, weather.tempLow, baseElev, summitElev);
    elevationWeather.push({
      elevation: summitElev,
      label: 'Summit',
      ...summitWeather,
      conditions: getConditionsForTemp((summitWeather.tempHigh + summitWeather.tempLow) / 2, weather.precipitation + 10),
    });
  }

  // Get summit temp for compact display (prefer API-calculated, then Mountain-Forecast, then local calc)
  const summitTemp = weather.elevationRange?.summitTemp
    ?? (hasMountainData && weather.elevationBands ? weather.elevationBands[0]?.tempHigh : null)
    ?? (elevationWeather.length > 0 ? elevationWeather[elevationWeather.length - 1]?.tempHigh : null);

  // Check for significant base-to-summit temperature difference
  const hasSignificantElevationDiff = weather.elevationRange &&
    (weather.tempHigh - weather.elevationRange.summitTemp) >= 10;

  return (
    <div className="weather-section">
      {/* Collapsed Summary */}
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="weather-compact-toggle"
      >
        <div className="weather-compact-summary">
          <span className="weather-compact-icon">
            {getWeatherIcon(weather.precipitation, 20)}
          </span>
          <span className="weather-compact-temps">
            <strong>{weather.tempHigh}°</strong>
            <span className="weather-compact-low">/{weather.tempLow}°</span>
          </span>
          <span className="weather-compact-desc">{weather.description}</span>
          {summitTemp !== null && (
            <span className={`weather-compact-summit ${hasSignificantElevationDiff ? 'weather-summit-warning' : ''}`}>
              {hasSignificantElevationDiff && <WarningIcon size={12} className="inline-block mr-1" />}
              Summit: {summitTemp}°
            </span>
          )}
        </div>
        <span className="weather-compact-expand">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="weather-expanded">
          {/* Type indicator */}
          <div className="weather-expanded-type">
            {weather.type === 'mountain' && 'Mountain Forecast'}
            {weather.type === 'forecast' && 'Forecast'}
            {weather.type === 'historical' && `Historical (${weather.distribution?.month})`}
            {weather.source === 'mountain-forecast' && (
              <span className="weather-source"> via Mountain-Forecast</span>
            )}
          </div>

          {/* Mountain-Forecast: show elevation bands with wind/snow */}
          {hasMountainData && weather.elevationBands && (
            <div className="weather-elevation weather-mountain">
              <div className="weather-elevation-header">By Elevation</div>
              <div className="weather-elevation-list">
                {weather.elevationBands.map((band) => (
                  <div key={band.elevation} className="weather-elevation-row weather-elevation-row-detailed">
                    <div className="weather-elevation-main">
                      <span className="weather-elevation-label">{band.label}</span>
                      <span className="weather-elevation-alt">{band.elevation.toLocaleString()}m</span>
                      <span className="weather-elevation-temps">
                        {band.tempHigh}°<span className="weather-elevation-low">/{band.tempLow}°</span>
                      </span>
                    </div>
                    <div className="weather-elevation-details">
                      {band.wind > 0 && (
                        <span className="weather-wind">
                          <WindIcon size={12} className="inline-block mr-1" />
                          {band.wind}km/h {band.windDirection}
                        </span>
                      )}
                      {band.snow > 0 && (
                        <span className="weather-snow">
                          <SnowIcon size={12} className="inline-block mr-1" />
                          {band.snow}cm
                        </span>
                      )}
                      <span className="weather-elevation-cond">{band.conditions}</span>
                    </div>
                  </div>
                ))}
              </div>
              {weather.elevationBands[0]?.freezingLevel > 0 && (
                <div className="weather-freezing-level">
                  Freezing level: {weather.elevationBands[0].freezingLevel.toLocaleString()}m
                </div>
              )}
            </div>
          )}

          {/* Show warnings (all weather types) */}
          {weather.warnings && weather.warnings.length > 0 && (
            <div className="weather-warnings">
              {weather.warnings.map((warning, idx) => (
                <div key={idx} className={`weather-warning weather-warning-${warning.severity}`}>
                  <div className="weather-warning-message">
                    <span className="weather-warning-severity">{warning.severity}</span>
                    {warning.message}
                  </div>
                  <div className="weather-warning-action">{warning.action}</div>
                </div>
              ))}
            </div>
          )}

          {/* Layering strategy */}
          {weather.layering && (
            <div className="weather-layering">
              <div className="weather-layering-header">Layering Strategy</div>
              <div className="weather-layering-row">
                <span className="weather-layering-label">Base:</span>
                <span>{weather.layering.base}</span>
              </div>
              <div className="weather-layering-row">
                <span className="weather-layering-label">Summit:</span>
                <span>{weather.layering.summit}</span>
              </div>
              <div className="weather-layering-strategy">{weather.layering.strategy}</div>
            </div>
          )}

          {/* Forecast: show daily breakdown */}
          {weather.type === 'forecast' && weather.days && (
            <div className="weather-forecast-days">
              {weather.days.map((day) => (
                <div key={day.date} className="weather-forecast-day">
                  <span className="weather-day-name">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                  </span>
                  <span className="weather-day-temps">
                    {day.tempHigh}°<span className="weather-day-low">/{day.tempLow}°</span>
                  </span>
                  {day.condition && (
                    <span className="weather-day-condition">{day.condition}</span>
                  )}
                  <span className="weather-day-precip">{day.precipitation}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Historical: show bell curve and stats */}
          {weather.type === 'historical' && weather.distribution && (
            <div className="weather-historical">
              <BellCurve
                tempMean={weather.distribution.tempMean}
                tempStdDev={weather.distribution.tempStdDev}
                tempMin={weather.distribution.tempMin}
                tempMax={weather.distribution.tempMax}
              />
              <div className="weather-historical-note">
                Typical range: {Math.round(weather.distribution.tempMean - weather.distribution.tempStdDev)}° – {Math.round(weather.distribution.tempMean + weather.distribution.tempStdDev)}°
              </div>

              {/* Enhanced stats */}
              <div className="weather-stats">
                {weather.distribution.sunnyDays !== undefined && (
                  <div className="weather-stat">
                    <span className="weather-stat-value">{weather.distribution.sunnyDays}</span>
                    <span className="weather-stat-label">sunny days</span>
                  </div>
                )}
                {weather.distribution.rainyDays !== undefined && (
                  <div className="weather-stat">
                    <span className="weather-stat-value">{weather.distribution.rainyDays}</span>
                    <span className="weather-stat-label">rainy days</span>
                  </div>
                )}
                {weather.distribution.snowDays !== undefined && weather.distribution.snowDays > 0 && (
                  <div className="weather-stat">
                    <span className="weather-stat-value">{weather.distribution.snowDays}</span>
                    <span className="weather-stat-label">snow days</span>
                  </div>
                )}
                {weather.distribution.avgSnowfall !== undefined && weather.distribution.avgSnowfall > 0 && (
                  <div className="weather-stat">
                    <span className="weather-stat-value">{weather.distribution.avgSnowfall}cm</span>
                    <span className="weather-stat-label">avg snow</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {weather.recommendations && weather.recommendations.length > 0 && (
            <div className="weather-recommendations">
              <div className="weather-recommendations-header">Recommendations</div>
              {weather.recommendations.map((rec, idx) => (
                <div key={idx} className="weather-recommendation">
                  {rec}
                </div>
              ))}
            </div>
          )}

          {/* Calculated elevation breakdown (fallback when no Mountain-Forecast data) */}
          {!hasMountainData && elevationWeather.length > 0 && (
            <div className="weather-elevation">
              <div className="weather-elevation-header">By Elevation (estimated)</div>
              <div className="weather-elevation-list">
                {elevationWeather.map((ew) => (
                  <div key={ew.elevation} className="weather-elevation-row">
                    <span className="weather-elevation-label">{ew.label}</span>
                    <span className="weather-elevation-alt">{ew.elevation.toLocaleString()}m</span>
                    <span className="weather-elevation-temps">
                      {ew.tempHigh}°<span className="weather-elevation-low">/{ew.tempLow}°</span>
                    </span>
                    <span className="weather-elevation-cond">{ew.conditions}</span>
                  </div>
                ))}
              </div>
              <div className="weather-elevation-note">
                Temperature drops ~6.5°C per 1,000m elevation gain
              </div>
            </div>
          )}

          {/* Precipitation */}
          <div className="weather-precip-detail">
            <span className="weather-precip-label">Precipitation</span>
            <span className="weather-precip-value">{weather.precipitation}% chance of rain</span>
          </div>
        </div>
      )}
    </div>
  );
}
