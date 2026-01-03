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
// Sharp peaks like a real mountain range silhouette
const MOUNTAIN_PROFILE = [
  // Base to first peak
  15, 25, 40, 55, 45,
  // Valley then sharp rise to main peak
  30, 20, 35, 55, 75, 95, 100, 90,
  // Drop to valley
  65, 45, 35,
  // Second peak
  50, 70, 80, 65,
  // Final descent
  45, 30, 20, 15
];

export default function AnimatedLogo({
  size = 'small',
  showText = true,
  clickable = true,
  variant = 'dark'
}: AnimatedLogoProps) {
  const [visibleBars, setVisibleBars] = useState(0);

  const sizeConfig = {
    small: { height: 18, barWidth: 2, gap: 2, textSize: 'text-lg' },
    medium: { height: 28, barWidth: 3, gap: 3, textSize: 'text-2xl' },
    large: { height: 40, barWidth: 4, gap: 4, textSize: 'text-3xl' }
  };

  const config = sizeConfig[size];
  const totalBars = MOUNTAIN_PROFILE.length;

  useEffect(() => {
    // Animate bars appearing left to right, then loop
    const interval = setInterval(() => {
      setVisibleBars(prev => {
        if (prev >= totalBars + 15) {
          // Reset after a pause
          return 0;
        }
        return prev + 1;
      });
    }, 120); // 120ms per bar for slow build

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
            className={`${variant === 'light' ? 'bg-white' : 'bg-charcoal'} transition-all duration-200 ${
              index < visibleBars ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              width: config.barWidth,
              height: `${heightPercent}%`,
              transform: index < visibleBars ? 'scaleY(1)' : 'scaleY(0)',
              transformOrigin: 'bottom'
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
