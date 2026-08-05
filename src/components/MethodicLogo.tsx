import React from 'react';

interface MethodicLogoProps {
  className?: string;
  dotClassName?: string;
  fillClassName?: string;
}

export function MethodicLogo({ 
  className = "w-6 h-6", 
  dotClassName = "fill-orange-400", 
  fillClassName = "fill-white" 
}: MethodicLogoProps) {
  return (
    <svg 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left Wing / Bracket */}
      <path 
        d="M 10 7 C 7.5 7 6 8.5 6 11 L 6 25 C 6 25.5 6.5 26 7 26 L 12 26 C 12.5 26 13 25.5 13 25 L 13 17 L 17 13 L 17 8 C 17 7.5 16.5 7 16 7 Z" 
        className={fillClassName}
      />
      
      {/* Right Wing / Bracket (180deg Rotated Symmetry) */}
      <path 
        d="M 22 25 C 24.5 25 26 23.5 26 21 L 26 7 C 26 6.5 25.5 6 25 6 L 20 6 C 19.5 6 19 6.5 19 7 L 19 15 L 15 19 L 15 24 C 15 24.5 15.5 25 16 25 Z" 
        className={fillClassName}
      />

      {/* Central Core Dot */}
      <circle 
        cx="16" 
        cy="16" 
        r="2.2" 
        className={dotClassName}
      />
    </svg>
  );
}
