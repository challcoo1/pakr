'use client';

// Minimal, organic SVG icons for gear categories
// Thin strokes, no fills - matching Mother Earth magazine style

interface CategoryIconProps {
  className?: string;
  size?: number;
}

export function FootwearIcon({ className = '', size = 16 }: CategoryIconProps) {
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
      {/* Boot outline - organic hiking boot shape */}
      <path
        d="M4 19H18C19.5 19 20 18 20 17V14C20 13 19 12 18 12H14L13 8C13 7 12.5 6 11 6H8C7 6 6 7 6 8V12H5C4 12 3 13 3 14V17C3 18 3.5 19 4 19Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Lace holes */}
      <circle cx="9" cy="9" r="0.5" fill="currentColor" />
      <circle cx="11" cy="9" r="0.5" fill="currentColor" />
      <circle cx="10" cy="11" r="0.5" fill="currentColor" />
      {/* Sole tread hint */}
      <path
        d="M6 19V20"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M10 19V20"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M14 19V20"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BaseLayerIcon({ className = '', size = 16 }: CategoryIconProps) {
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
      {/* Simple fitted shirt - base layer */}
      <path
        d="M8 4L6 6L4 8V12L6 11V20H18V11L20 12V8L18 6L16 4H8Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Collar */}
      <path
        d="M10 4C10 5 11 6 12 6C13 6 14 5 14 4"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Thread/weave hint */}
      <path
        d="M9 10H15"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeDasharray="1 2"
      />
    </svg>
  );
}

export function MidLayerIcon({ className = '', size = 16 }: CategoryIconProps) {
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
      {/* Fleece/softshell jacket */}
      <path
        d="M8 4L5 7L3 10V13L5 12V20H19V12L21 13V10L19 7L16 4H8Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Collar */}
      <path
        d="M10 4C10 5.5 11 6.5 12 6.5C13 6.5 14 5.5 14 4"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Front zip */}
      <path
        d="M12 7V18"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Zip pull */}
      <path
        d="M11.5 10L12.5 10"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function OuterLayerIcon({ className = '', size = 16 }: CategoryIconProps) {
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
      {/* Hardshell jacket with hood */}
      <path
        d="M8 5L5 8L2 11V14L5 13V21H19V13L22 14V11L19 8L16 5H8Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Hood */}
      <path
        d="M8 5C8 3 9.5 2 12 2C14.5 2 16 3 16 5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      {/* Front closure */}
      <path
        d="M12 5V19"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Pocket */}
      <path
        d="M6 14H10"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AccessoriesIcon({ className = '', size = 16 }: CategoryIconProps) {
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
      {/* Glove shape */}
      <path
        d="M7 20V12L6 8C6 7 6.5 6 7.5 6H8V4C8 3 8.5 2.5 9 2.5C9.5 2.5 10 3 10 4V6V3.5C10 2.5 10.5 2 11 2C11.5 2 12 2.5 12 3.5V6V3C12 2 12.5 1.5 13 1.5C13.5 1.5 14 2 14 3V6V4C14 3 14.5 2.5 15 2.5C15.5 2.5 16 3 16 4V10L17 12V20H7Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Wrist cuff */}
      <path
        d="M7 17H17"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BackpackIcon({ className = '', size = 16 }: CategoryIconProps) {
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
      {/* Main pack body */}
      <path
        d="M6 9C6 7.5 7 6 9 6H15C17 6 18 7.5 18 9V20C18 21 17.5 22 16 22H8C6.5 22 6 21 6 20V9Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top lid */}
      <path
        d="M7 9C7 8 8 7 9.5 7H14.5C16 7 17 8 17 9"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Top loop */}
      <path
        d="M10 6V4C10 3 10.5 2 12 2C13.5 2 14 3 14 4V6"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      {/* Front pocket */}
      <path
        d="M8 14H16V18C16 18.5 15.5 19 15 19H9C8.5 19 8 18.5 8 18V14Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShelterIcon({ className = '', size = 16 }: CategoryIconProps) {
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
      {/* Tent shape - A-frame style */}
      <path
        d="M12 3L3 19H21L12 3Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Tent door */}
      <path
        d="M9 19L12 12L15 19"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Guy line hints */}
      <path
        d="M6 14L2 18"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeDasharray="2 2"
      />
      <path
        d="M18 14L22 18"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeDasharray="2 2"
      />
    </svg>
  );
}

export function SleepIcon({ className = '', size = 16 }: CategoryIconProps) {
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
      {/* Sleeping bag - mummy style */}
      <path
        d="M8 5C6 5 4 7 4 10V18C4 20 6 21 8 21H16C18 21 20 20 20 18V10C20 7 18 5 16 5C16 3 14 2 12 2C10 2 8 3 8 5Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Hood opening */}
      <ellipse
        cx="12"
        cy="6"
        rx="3"
        ry="2"
        stroke="currentColor"
        strokeWidth="1"
      />
      {/* Baffle lines */}
      <path
        d="M5 10H19"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
      />
      <path
        d="M5 14H19"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
      />
      <path
        d="M5 18H19"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ClimbingIcon({ className = '', size = 16 }: CategoryIconProps) {
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
      {/* Carabiner shape */}
      <path
        d="M8 4C5 4 3 6 3 9V15C3 18 5 20 8 20H14C17 20 19 18 19 15V13"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Gate */}
      <path
        d="M19 13V9C19 6 17 4 14 4H8"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeDasharray="3 0"
      />
      {/* Gate hinge */}
      <circle cx="19" cy="11" r="1" stroke="currentColor" strokeWidth="1" />
      {/* Rope through */}
      <path
        d="M10 10C10 10 11 12 12 12C13 12 14 10 14 10"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SafetyIcon({ className = '', size = 16 }: CategoryIconProps) {
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
      {/* Compass body */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      {/* Compass needle */}
      <path
        d="M12 5L14 12L12 19"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 5L10 12L12 19"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="3 2"
      />
      {/* Cardinal points */}
      <circle cx="12" cy="4" r="0.75" fill="currentColor" />
      <circle cx="12" cy="20" r="0.75" fill="currentColor" />
      <circle cx="4" cy="12" r="0.75" fill="currentColor" />
      <circle cx="20" cy="12" r="0.75" fill="currentColor" />
    </svg>
  );
}

export function CookingIcon({ className = '', size = 16 }: CategoryIconProps) {
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
      {/* Pot body */}
      <path
        d="M5 10V18C5 19.5 6.5 21 9 21H15C17.5 21 19 19.5 19 18V10"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Pot rim */}
      <path
        d="M4 10H20"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      {/* Handles */}
      <path
        d="M5 10L3 8"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M19 10L21 8"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      {/* Steam */}
      <path
        d="M9 6C9 5 10 4 10 3"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M12 7C12 6 13 5 13 4"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M15 6C15 5 16 4 16 3"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function OtherIcon({ className = '', size = 16 }: CategoryIconProps) {
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
      {/* Box/container */}
      <path
        d="M4 8L12 4L20 8V16L12 20L4 16V8Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Center line */}
      <path
        d="M12 12V20"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Top edges */}
      <path
        d="M4 8L12 12L20 8"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Map category keys to icon components
export const CATEGORY_ICONS: Record<string, React.ComponentType<CategoryIconProps>> = {
  footwear: FootwearIcon,
  clothing_base: BaseLayerIcon,
  clothing_mid: MidLayerIcon,
  clothing_outer: OuterLayerIcon,
  clothing_accessories: AccessoriesIcon,
  backpacks: BackpackIcon,
  shelter: ShelterIcon,
  sleep: SleepIcon,
  climbing: ClimbingIcon,
  safety: SafetyIcon,
  cooking: CookingIcon,
  other: OtherIcon,
};

// Helper to get icon component by category
export function getCategoryIcon(category: string, props?: CategoryIconProps) {
  const IconComponent = CATEGORY_ICONS[category] || OtherIcon;
  return <IconComponent {...props} />;
}
