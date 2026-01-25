'use client';

import WeatherWidget from '@/components/WeatherWidget';
import { TripAnalysis, WeatherData } from '@/types';

interface TripSummaryBoxProps {
  trip: TripAnalysis;
  weather: WeatherData | null;
  weatherLoading: boolean;
}

export default function TripSummaryBox({
  trip,
  weather,
  weatherLoading,
}: TripSummaryBoxProps) {
  return (
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
  );
}
