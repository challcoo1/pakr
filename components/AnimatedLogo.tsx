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
    // Small delay then rise
    const timer = setTimeout(() => setRisen(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const logo = (
    <div className="inline-flex items-center gap-3">
      {/* Mountain bars */}
      <div className="flex items-end" style={{ height: config.height, gap: config.gap }}>
        {MOUNTAIN_PROFILE.map((heightPercent, index) => {
          const barHeight = (heightPercent / 100) * config.height * 0.66;
          return (
            <div
              key={index}
              className={variant === 'light' ? 'bg-white' : 'bg-charcoal'}
              style={{
                width: config.barWidth,
                height: risen ? barHeight : 0,
                transition: 'height 1.2s ease-out'
              }}
            />
          );
        })}
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
