'use client';

import { Artist } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface ArtistCardProps {
  artist: Artist;
}

export default function ArtistCard({ artist }: ArtistCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Generate initials for fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate a consistent color based on artist name
  const getBackgroundColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500',
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  // Generate blur placeholder for better loading experience
  const generateBlurDataURL = () => {
    const svg = `
      <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#f1f5f9;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  return (
    <Link
      href={`/artists/${artist.id}`}
      className="group block"
      onClick={() => {
        console.log("=== ARTIST CARD CLICKED ===");
        console.log("Artist ID:", artist.id);
        console.log("Artist Name:", artist.name);
        console.log("Target URL:", `/artists/${artist.id}`);
      }}
    >
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted shadow-md hover:shadow-lg transition-all duration-200 group-hover:scale-105">
        {/* Loading skeleton */}
        {artist.profileImageUrl && !imageError && !imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-background/40 to-transparent" />
          </div>
        )}

        {/* Artist Image or Fallback */}
        {artist.profileImageUrl && !imageError ? (
          <Image
            src={artist.profileImageUrl}
            alt={`${artist.name} profile picture`}
            fill
            className={`object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            quality={85}
            placeholder="blur"
            blurDataURL={generateBlurDataURL()}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${getBackgroundColor(artist.name)}`}>
            <span className="text-white text-2xl font-bold">
              {getInitials(artist.name)}
            </span>
          </div>
        )}

        {/* Overlay with artist info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-semibold text-lg leading-tight mb-1">
              {artist.name}
            </h3>
            {artist.location && (
              <p className="text-white/80 text-sm">
                {artist.location}
              </p>
            )}
            {artist.artist_type && (
              <p className="text-white/70 text-xs capitalize mt-1">
                {artist.artist_type}
              </p>
            )}
          </div>
        </div>

        {/* Always visible artist name at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-3 group-hover:bg-transparent transition-colors duration-200">
          <h3 className="text-white font-medium text-sm leading-tight group-hover:opacity-0 transition-opacity duration-200">
            {artist.name}
          </h3>
        </div>
      </div>
    </Link>
  );
}