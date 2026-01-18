'use client';

// Minimal, organic SVG icons with hand-drawn aesthetic
// Thin strokes, no fills - matching Mother Earth magazine style

interface NavIconProps {
  isActive?: boolean;
}

export function BackpackIcon({ isActive = false }: NavIconProps) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="nav-icon"
      aria-hidden="true"
    >
      {/* Main pack body - rounded organic shape */}
      <path
        d="M7 9C7 7.5 8 6 10 6H14C16 6 17 7.5 17 9V19C17 20 16.5 21 15 21H9C7.5 21 7 20 7 19V9Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top flap/lid */}
      <path
        d="M8 9C8 8 9 7 10.5 7H13.5C15 7 16 8 16 9"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      {/* Top loop/handle */}
      <path
        d="M10 6V4.5C10 3.5 10.5 3 12 3C13.5 3 14 3.5 14 4.5V6"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      {/* Front pocket */}
      <path
        d="M9 14H15V17C15 17.5 14.5 18 14 18H10C9.5 18 9 17.5 9 17V14Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left strap hint */}
      <path
        d="M7 11L5.5 12"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Right strap hint */}
      <path
        d="M17 11L18.5 12"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MountainIcon({ isActive = false }: NavIconProps) {
  return (
    <svg
      width="24"
      height="22"
      viewBox="0 0 26 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="nav-icon"
      aria-hidden="true"
    >
      {/* Main mountain peak - organic hand-drawn feel */}
      <path
        d="M13 3L20 18H6L13 3Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Snow cap / ridge line */}
      <path
        d="M10.5 10L13 6L15.5 10"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Secondary smaller peak */}
      <path
        d="M4 18L8 11L11 16"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Trail marker / path hint */}
      <path
        d="M13 18V14"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="1.5 1.5"
      />
      {/* Ground line */}
      <path
        d="M2 18H24"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
