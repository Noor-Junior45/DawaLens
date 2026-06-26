import React from 'react';

export function DoctorLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Green Silhouette (Head) */}
      <circle cx="32" cy="19" r="8" fill="currentColor" />
      
      {/* Green Silhouette (Shoulders) */}
      <path d="M16 43C16 35.8203 21.8203 30 29 30H35C42.1797 30 48 35.8203 48 43V49H16V43Z" fill="currentColor" />
      
      {/* White Stethoscope draped on shoulders */}
      {/* U-shape around neck */}
      <path 
        d="M26 31C26 35.5 28.5 38.5 32 38.5C35.5 38.5 38 35.5 38 31" 
        stroke="white" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />
      {/* Tube coming down */}
      <path 
        d="M32 38.5V43" 
        stroke="white" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />
      {/* Diaphragm / Chestpiece */}
      <circle cx="32" cy="44" r="2.5" fill="currentColor" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}
