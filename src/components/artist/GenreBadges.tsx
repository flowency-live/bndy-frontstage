"use client";

interface GenreBadgesProps {
  genres: string[];
}

/**
 * GenreBadges - Displays genre badges below banner, right-aligned
 *
 * Right-aligned with social icons, wraps on mobile to avoid avatar
 */
export default function GenreBadges({ genres }: GenreBadgesProps) {
  if (!genres || genres.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 pt-2 pb-1">
      <div className="flex flex-wrap gap-1.5 justify-end max-w-[200px] ml-auto sm:max-w-none">
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
  );
}
