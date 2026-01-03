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
// Creates multiple peaks like a real mountain range
const MOUNTAIN_PROFILE = [
  // Rising to first small peak
  10, 15, 22, 30, 38, 45, 52, 48, 42,
  // Valley then rising to main peak
  35, 30, 35, 45, 55, 68, 78, 88, 95, 100, 95, 85,
  // Descent with minor peak
  72, 60, 55, 62, 68, 60, 50,
  // Final descent
  42, 35, 28, 22, 15, 10
];

export default function AnimatedLogo({
  size = 'small',
  showText = true,
  clickable = true,
  variant = 'dark'
}: AnimatedLogoProps) {
  const [visibleBars, setVisibleBars] = useState(0);

  const sizeConfig = {
    small: { height: 20, barWidth: 2, gap: 0.5, textSize: 'text-lg' },
    medium: { height: 32, barWidth: 3, gap: 1, textSize: 'text-2xl' },
    large: { height: 44, barWidth: 4, gap: 1.5, textSize: 'text-3xl' }
  };

  const config = sizeConfig[size];
  const totalBars = MOUNTAIN_PROFILE.length;

  useEffect(() => {
    // Animate bars appearing left to right
    const interval = setInterval(() => {
      setVisibleBars(prev => {
        if (prev >= totalBars) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 30); // 30ms per bar = ~1s total animation

    return () => clearInterval(interval);
  }, [totalBars]);

  const logo = (
    <div className="inline-flex items-center gap-2">
      {/* Mountain bars */}
      <div
        className="flex items-end"
        style={{
          height: config.height,
          gap: config.gap
        }}
      >
        {MOUNTAIN_PROFILE.map((heightPercent, index) => (
          <div
            key={index}
            className={`${variant === 'light' ? 'bg-white' : 'bg-charcoal'} transition-all duration-150 ${
              index < visibleBars ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              width: config.barWidth,
              height: `${heightPercent}%`,
              transform: index < visibleBars ? 'scaleY(1)' : 'scaleY(0)',
              transformOrigin: 'bottom',
              borderRadius: config.barWidth / 2
            }}
          />
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
