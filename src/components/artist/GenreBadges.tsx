"use client";

interface GenreBadgesProps {
  genres: string[];
}

/**
 * GenreBadges - Displays genre badges below the banner
 *
 * Positioned in the white space below social icons and banner
 */
export default function GenreBadges({ genres }: GenreBadgesProps) {
  if (!genres || genres.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-2 sm:px-4">
      <div className="flex flex-wrap gap-2 justify-end mb-2">
        {genres.map((genre, index) => (
          <span
            key={index}
            className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full text-white"
            style={{ backgroundColor: '#FF6B35' }}
          >
            {genre}
          </span>
        ))}
      </div>
    </div>
  );
}
