'use client';

// Minimal, organic SVG weather icons with hand-drawn aesthetic
// Thin strokes, no fills - matching Mother Earth magazine style

interface WeatherIconProps {
  className?: string;
  size?: number;
}

export function SunIcon({ className = '', size = 20 }: WeatherIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Sun circle */}
      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      {/* Rays - organic slightly irregular lengths */}
      <path
        d="M12 3V5.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M12 18.5V21"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M21 12H18.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M5.5 12H3"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      {/* Diagonal rays */}
      <path
        d="M18.4 5.6L16.5 7.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M7.5 16.5L5.6 18.4"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M18.4 18.4L16.5 16.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M7.5 7.5L5.6 5.6"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloudSunIcon({ className = '', size = 20 }: WeatherIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Partial sun behind cloud */}
      <circle
        cx="8"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      {/* Sun rays peeking out */}
      <path
        d="M8 3V4"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M3 8H4"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M4.5 4.5L5.2 5.2"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Main cloud - organic curved shape */}
      <path
        d="M8 18C5.5 18 4 16.5 4 14.5C4 12.5 5.5 11 8 11C8 9 9.5 7 12.5 7C16 7 18 9.5 18 12C20 12 21 13.5 21 15C21 17 19.5 18 17 18H8Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RainIcon({ className = '', size = 20 }: WeatherIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Cloud - organic curved shape */}
      <path
        d="M6 14C4 14 3 12.5 3 11C3 9 4.5 7.5 7 7.5C7 5.5 8.5 4 11 4C14 4 16 6 16 8.5C18 8.5 19 10 19 11.5C19 13.5 17.5 14 15.5 14H6Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Rain drops - organic varied lengths */}
      <path
        d="M7 16.5V19"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M11 17V20.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M15 16.5V18.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SnowIcon({ className = '', size = 20 }: WeatherIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Cloud */}
      <path
        d="M6 13C4 13 3 11.5 3 10C3 8 4.5 6.5 7 6.5C7 4.5 8.5 3 11 3C14 3 16 5 16 7.5C18 7.5 19 9 19 10.5C19 12.5 17.5 13 15.5 13H6Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Snowflakes - simple organic dots/asterisks */}
      <circle cx="7" cy="16" r="0.75" fill="currentColor" />
      <circle cx="11" cy="18" r="0.75" fill="currentColor" />
      <circle cx="15" cy="16.5" r="0.75" fill="currentColor" />
      <circle cx="9" cy="20" r="0.75" fill="currentColor" />
      <circle cx="13" cy="21" r="0.75" fill="currentColor" />
    </svg>
  );
}

export function WindIcon({ className = '', size = 16 }: WeatherIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Wind lines - organic flowing curves */}
      <path
        d="M3 8H15C16.5 8 18 7 18 5.5C18 4 16.5 3 15 3"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M3 12H19C20.5 12 22 13 22 14.5C22 16 20.5 17 19 17"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M3 16H12C13.5 16 15 17 15 18.5C15 20 13.5 21 12 21"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function WarningIcon({ className = '', size = 14 }: WeatherIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Triangle outline */}
      <path
        d="M12 4L21 20H3L12 4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Exclamation */}
      <path
        d="M12 10V14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17" r="0.75" fill="currentColor" />
    </svg>
  );
}

// Helper to get the right icon based on conditions
export function getWeatherIcon(precipitation: number, size?: number) {
  if (precipitation >= 50) {
    return <RainIcon size={size} />;
  } else if (precipitation >= 25) {
    return <CloudSunIcon size={size} />;
  }
  return <SunIcon size={size} />;
}
