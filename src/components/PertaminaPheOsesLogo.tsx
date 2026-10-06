import React from 'react';

interface PertaminaPheOsesLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'badge';
  size?: 'sm' | 'md' | 'lg';
}

export const PertaminaPheOsesLogo: React.FC<PertaminaPheOsesLogoProps> = ({
  className = '',
  variant = 'badge',
  size = 'md',
}) => {
  // Height sizing
  const heightClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
  }[size];

  // Colors based on variant
  const pertaminaTextColor = variant === 'dark' ? '#FFFFFF' : '#1A1A1A';
  const pheOsesTextColor = '#0072CE';

  const logoSvg = (
    <svg 
      viewBox="0 0 460 145" 
      className={`${heightClasses} w-auto transition-transform`} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(10, 5)">
        {/* 1. RED PETAL (Top Right Slanted Rhombus) */}
        <path 
          d="M 68 18 
             C 71 11, 77 7, 85 7 
             L 126 7 
             C 131 7, 134 9, 136 13 
             C 138 18, 136 23, 131 29 
             L 97 74 
             C 94 78, 89 81, 84 81 
             L 48 81 
             C 43 81, 40 78, 41 74 
             C 42 70, 45 65, 49 59 
             Z" 
          fill="#ED1C24" 
        />

        {/* 2. BLUE PETAL (Bottom Left Slanted Rhombus) */}
        <path 
          d="M 46 80 
             C 48 74, 53 71, 60 71 
             L 94 71 
             C 99 71, 102 74, 101 78 
             L 69 123 
             C 66 127, 61 130, 55 130 
             L 18 130 
             C 13 130, 11 127, 12 123 
             C 13 119, 16 114, 20 108 
             Z" 
          fill="#005BAC" 
        />

        {/* 3. GREEN / YELLOW-GREEN PETAL (Bottom Right Slanted Rhombus) */}
        <path 
          d="M 96 76 
             C 98 71, 103 68, 109 68 
             L 137 68 
             C 142 68, 144 71, 143 75 
             L 125 102 
             C 123 105, 120 107, 116 107 
             L 88 107 
             C 84 107, 82 104, 83 100 
             Z" 
          fill="#B5BD00" 
        />

        {/* PERTAMINA Text */}
        <text 
          x="165" 
          y="62" 
          fontFamily="'Montserrat', 'Arial Black', Impact, sans-serif" 
          fontWeight="900" 
          fontSize="48" 
          fill={pertaminaTextColor} 
          letterSpacing="1"
        >
          PERTAMINA
        </text>

        {/* PHE OSES Text */}
        <text 
          x="166" 
          y="110" 
          fontFamily="'Montserrat', 'Arial Black', Impact, sans-serif" 
          fontWeight="900" 
          fontSize="38" 
          fill={pheOsesTextColor} 
          letterSpacing="2"
        >
          PHE OSES
        </text>
      </g>
    </svg>
  );

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center bg-white px-2.5 py-1 rounded-xl shadow-md border border-slate-200/90 ${className}`}>
        {logoSvg}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      {logoSvg}
    </div>
  );
};
