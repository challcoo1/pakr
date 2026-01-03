'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AnimatedLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  clickable?: boolean;
  variant?: 'dark' | 'light';
}

// Mountain range profile - heights as percentages (0-100)
const MOUNTAIN_PROFILE = [
  15, 25, 40, 55, 45,
  30, 20, 35, 55, 75, 95, 100, 90,
  65, 45, 35,
  50, 70, 80, 65,
  45, 30, 20, 15
];

export default function AnimatedLogo({
  size = 'small',
  showText = true,
  clickable = true,
  variant = 'dark'
}: AnimatedLogoProps) {
  const [risen, setRisen] = useState(false);

  const sizeConfig = {
    small: { height: 18, barWidth: 2, gap: 2, textSize: 'text-lg' },
    medium: { height: 28, barWidth: 3, gap: 3, textSize: 'text-2xl' },
    large: { height: 40, barWidth: 4, gap: 4, textSize: 'text-3xl' }
  };

  const config = sizeConfig[size];

  useEffect(() => {
    // Animate all bars rising together
    const timer = setTimeout(() => setRisen(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const logo = (
    <div className="inline-flex items-center gap-2">
      {/* Mountain bars with shadow */}
      <div
        className="flex items-end relative"
        style={{
          height: config.height,
          gap: config.gap
        }}
      >
        {MOUNTAIN_PROFILE.map((heightPercent, index) => (
          <div key={index} className="relative" style={{ width: config.barWidth }}>
            {/* Shadow bar - offset right */}
            <div
              className="absolute bg-charcoal/40"
              style={{
                width: config.barWidth,
                height: `${heightPercent * 0.66}%`,
                bottom: 0,
                left: config.barWidth / 2,
                transform: risen ? 'scaleY(1)' : 'scaleY(0)',
                transformOrigin: 'bottom',
                transition: 'transform 1.2s ease-out'
              }}
            />
            {/* Main bar */}
            <div
              className={variant === 'light' ? 'bg-white' : 'bg-charcoal'}
              style={{
                width: config.barWidth,
                height: `${heightPercent * 0.66}%`,
                transform: risen ? 'scaleY(1)' : 'scaleY(0)',
                transformOrigin: 'bottom',
                transition: 'transform 1.2s ease-out'
              }}
            />
          </div>
        ))}
      </div>

      {/* Text */}
      {showText && (
        <span
          className={`font-bold tracking-tight ${
            variant === 'light' ? 'text-white' : 'text-charcoal'
          } ${config.textSize}`}
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
