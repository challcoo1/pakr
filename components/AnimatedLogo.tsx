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
  const [visibleBars, setVisibleBars] = useState(0);
  const [showShadow, setShowShadow] = useState(false);

  const sizeConfig = {
    small: { height: 18, barWidth: 2, gap: 2, textSize: 'text-lg' },
    medium: { height: 28, barWidth: 3, gap: 3, textSize: 'text-2xl' },
    large: { height: 40, barWidth: 4, gap: 4, textSize: 'text-3xl' }
  };

  const config = sizeConfig[size];
  const totalBars = MOUNTAIN_PROFILE.length;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let loopTimeout: NodeJS.Timeout;

    const runAnimation = () => {
      setVisibleBars(0);
      setShowShadow(false);

      interval = setInterval(() => {
        setVisibleBars(prev => {
          if (prev >= totalBars) {
            clearInterval(interval);
            // Stage 2: After bars complete, show shadow
            setTimeout(() => setShowShadow(true), 200);
            // Loop after a long pause (8 seconds)
            loopTimeout = setTimeout(runAnimation, 8000);
            return prev;
          }
          return prev + 1;
        });
      }, 80);
    };

    runAnimation();

    return () => {
      clearInterval(interval);
      clearTimeout(loopTimeout);
    };
  }, [totalBars]);

  const logo = (
    <div className="inline-flex items-center gap-3">
      {/* Mountain bars with shadow */}
      <div className="flex items-end relative" style={{ height: config.height, gap: config.gap }}>
        {MOUNTAIN_PROFILE.map((heightPercent, index) => {
          const barHeight = (heightPercent / 100) * config.height;
          return (
            <div
              key={index}
              className="relative"
              style={{ width: config.barWidth, height: config.height }}
            >
              {/* Main bar - white, appears left to right */}
              <div
                className={variant === 'light' ? 'bg-white' : 'bg-charcoal'}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: config.barWidth,
                  height: index < visibleBars ? barHeight : 0,
                  transition: 'height 0.15s ease-out'
                }}
              />
            </div>
          );
        })}
        {/* Charcoal shadow overlay - no gaps, solid block */}
        <div
          className="absolute flex items-end"
          style={{
            left: config.barWidth / 2,
            bottom: 0,
            height: config.height
          }}
        >
          {MOUNTAIN_PROFILE.map((heightPercent, index) => {
            const shadowHeight = (heightPercent / 100) * config.height * 0.45;
            return (
              <div
                key={index}
                className="bg-charcoal/80"
                style={{
                  width: config.barWidth + config.gap,
                  height: showShadow ? shadowHeight : 0,
                  transition: 'height 0.8s ease-out'
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Text */}
      {showText && (
        <span
          className={`font-bold tracking-tight ${
            variant === 'light' ? 'text-white' : 'text-charcoal'
          } ${config.textSize}`}
        >
          pakr88
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
