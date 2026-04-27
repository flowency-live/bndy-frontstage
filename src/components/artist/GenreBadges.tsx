"use client";

interface GenreBadgesProps {
  genres: string[];
}

/**
 * GenreBadges - Displays genre badges for artist profile
 *
 * Now uses normal document flow (not absolute positioned)
 * Positioned between blurb and tabs in ArtistProfileClient
 *
 * Uses CSS classes from globals.css (.profile-genres, .profile-genre)
 */
export default function GenreBadges({ genres }: GenreBadgesProps) {
  if (!genres || genres.length === 0) {
    return null;
  }

  return (
    <div className="profile-genres">
      {genres.map((genre, index) => (
        <span key={index} className="profile-genre">
          {genre}
        </span>
      ))}
    </div>
  );
}
