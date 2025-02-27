// src/components/ui/BndyIconLogo.tsx
import React from "react";

interface BndyIconLogoProps {
  className?: string;
  color?: string; // Allow custom color to be passed
}

const BndyIconLogo: React.FC<BndyIconLogoProps> = ({ className, color }) => {
  // Use the passed color or default to var(--primary)
  const fillColor = color || "var(--primary)";
  
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className || ""}
    >
      {/* Circle background */}
      <circle cx="20" cy="20" r="19" stroke={fillColor} strokeWidth="2" fill="none" />
      
      {/* Simplified 'b' letter from the original logo */}
      <path
        d="M25.940535 11.202417C25.531314 11.202417 25.178308 11.569058 25.178308 12.006502L25.178308 17.665072 25.178308 17.693494 25.178308 17.763774C25.178308 19.612327 26.688207 21.122225 28.536759 21.122225C29.239802 21.122225 29.890309 20.907053 30.428117 20.539832C30.535475 20.855291 30.818437 21.084501 31.161922 21.084501C31.571144 21.084501 31.90968 20.717343 31.90968 20.279899L31.90968 17.838704 31.90968 17.782377 31.90968 17.740002C31.90968 15.905561 30.399781 14.381551 28.551229 14.381551C27.866445 14.381551 27.231762 14.587998 26.702246 14.939657L26.702246 12.006502C26.702246 11.569058 26.363868 11.202417 25.940535 11.202417Z"
        fill={fillColor}
        transform="scale(0.7) translate(0, 8)"
      />
      
      {/* Transparent 'hole' for the letter to show background */}
      <circle cx="20" cy="19" r="1.5" fill="var(--background)" />
    </svg>
  );
};

export default BndyIconLogo;