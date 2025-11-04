"use client";

import { useState } from "react";

interface ArtistBioProps {
  description?: string;
  className?: string;
}

const ArtistBio: React.FC<ArtistBioProps> = ({ description, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle empty bio states gracefully
  if (!description || description.trim().length === 0) {
    return null;
  }

  // Determine if bio is long enough to need collapsing
  const isLongBio = description.length > 200;
  const shouldShowToggle = isLongBio;
  
  // Get preview text for collapsed state
  const previewText = isLongBio ? description.substring(0, 200).trim() + "..." : description;
  const displayText = isExpanded ? description : previewText;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <section className={`space-y-3 sm:space-y-4 ${className}`}>
      <h2 className="text-lg sm:text-xl font-semibold text-[var(--foreground)]">
        About
      </h2>
      
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4 sm:p-6">
        <div className="space-y-4">
          {/* Bio text with proper formatting and line height for readability */}
          <div 
            className={`
              bio-content
              text-[var(--foreground)]/80 
              leading-relaxed 
              text-sm sm:text-base
              ${isExpanded ? 'bio-expanded opacity-100' : 'bio-collapsed opacity-90'}
            `}
          >
            <p className="whitespace-pre-line">
              {displayText}
            </p>
          </div>

          {/* Smooth expand/collapse toggle button */}
          {shouldShowToggle && (
            <button
              onClick={toggleExpanded}
              className="
                button-micro focus-enhanced touch-feedback
                inline-flex items-center space-x-2 
                text-[var(--primary)] hover:text-[var(--primary)]/80 
                text-sm font-medium 
                transition-all duration-200 
                hover:underline
                focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:rounded
                active:scale-95
              "
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Show less" : "Show more"}
            >
              <span>{isExpanded ? "Show less" : "Show more"}</span>
              <svg
                className={`
                  w-4 h-4 
                  transition-transform duration-300 ease-in-out
                  ${isExpanded ? 'rotate-180' : 'rotate-0'}
                `}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default ArtistBio;