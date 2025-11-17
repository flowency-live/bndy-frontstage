"use client";

interface GenreBadgesProps {
  genres: string[];
}

/**
 * GenreBadges - Displays genre badges overlapping bottom of banner
 *
 * Positioned absolutely in the bottom-right area, below social icons
 */
export default function GenreBadges({ genres }: GenreBadgesProps) {
  if (!genres || genres.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-0 right-0 w-full pointer-events-none" style={{ marginTop: '-40px' }}>
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex flex-wrap gap-1.5 justify-end pointer-events-auto">
          {genres.map((genre, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full text-white"
              style={{ backgroundColor: '#FF6B35' }}
            >
              {genre}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
