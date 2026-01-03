'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AnimatedLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  clickable?: boolean;
  variant?: 'dark' | 'light';
}

// Mountain peaks - irregular heights for organic feel
const PEAKS = [
  { height: 45, width: 12, offset: 0 },
  { height: 72, width: 14, offset: 10 },
  { height: 58, width: 13, offset: 22 },
  { height: 100, width: 16, offset: 33 },
  { height: 68, width: 14, offset: 47 },
  { height: 85, width: 15, offset: 59 },
  { height: 52, width: 12, offset: 72 },
];

export default function AnimatedLogo({
  size = 'small',
  showText = true,
  clickable = true,
  variant = 'dark'
}: AnimatedLogoProps) {
  const [animated, setAnimated] = useState(false);

  const sizeConfig = {
    small: { height: 22, width: 50, textSize: 'text-lg' },
    medium: { height: 32, width: 72, textSize: 'text-2xl' },
    large: { height: 44, width: 100, textSize: 'text-3xl' }
  };

  const config = sizeConfig[size];

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Generate triangle path for a peak
  const getTrianglePath = (peak: typeof PEAKS[0], index: number) => {
    const baseY = 100;
    const peakY = 100 - peak.height;
    const leftX = peak.offset;
    const rightX = peak.offset + peak.width;
    const tipX = peak.offset + peak.width / 2 + (index % 2 === 0 ? -1 : 1); // Slight irregularity

    return `M ${leftX} ${baseY} L ${tipX} ${peakY} L ${rightX} ${baseY} Z`;
  };

  const logo = (
    <div className="inline-flex items-center gap-2">
      {/* Mountain peaks SVG */}
      <svg
        viewBox="0 0 85 100"
        style={{ height: config.height, width: config.width }}
        className="overflow-visible"
      >
        <defs>
          {/* Gradient from burnt orange to forest green */}
          <linearGradient id={`mountain-gradient-${variant}`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={variant === 'light' ? '#ffffff' : '#CC5500'} stopOpacity={variant === 'light' ? '0.7' : '0.9'} />
            <stop offset="100%" stopColor={variant === 'light' ? '#ffffff' : '#2C5530'} stopOpacity="1" />
          </linearGradient>
        </defs>

        {PEAKS.map((peak, index) => (
          <path
            key={index}
            d={getTrianglePath(peak, index)}
            fill={`url(#mountain-gradient-${variant})`}
            style={{
              transform: animated ? 'scaleY(1)' : 'scaleY(0)',
              transformOrigin: 'bottom',
              transition: `transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.12}s`,
              opacity: animated ? 1 : 0,
            }}
          />
        ))}
      </svg>

      {/* Text */}
      {showText && (
        <span
          className={`font-bold tracking-tight ${
            variant === 'light' ? 'text-white' : 'text-charcoal'
          } ${config.textSize}`}
          style={{
            opacity: animated ? 1 : 0,
            transition: 'opacity 0.5s ease-out 0.9s'
          }}
        >
          pakr
        </span>
      )}
    </div>
  );

  if (clickable) {
    return (
      <Link href="/" className="hover:opacity-80 transition-opacity">
        {logo}
      </Link>
    );
  }

  return logo;
}
