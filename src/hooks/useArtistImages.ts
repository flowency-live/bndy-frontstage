import { useQueries, useQueryClient } from "@tanstack/react-query";
import type { Artist } from "@/lib/types";

interface ArtistImageData {
  id: string;
  profileImageUrl: string | null;
  displayColour: string | null;
}

/**
 * Hook for fetching artist profile images for multiple artists
 * Uses React Query's parallel queries with deduplication and caching
 *
 * @param artistIds - Array of artist IDs to fetch images for
 * @returns Map of artistId -> { profileImageUrl, displayColour }
 */
export function useArtistImages(artistIds: string[]) {
  const queryClient = useQueryClient();

  // Deduplicate and filter valid IDs
  const uniqueIds = [...new Set(artistIds.filter(Boolean))];

  // Check cache first to avoid unnecessary fetches
  const cachedImages = new Map<string, ArtistImageData>();
  const idsToFetch: string[] = [];

  uniqueIds.forEach(id => {
    const cached = queryClient.getQueryData<Artist>(['artist', id]);
    if (cached) {
      cachedImages.set(id, {
        id,
        profileImageUrl: cached.profileImageUrl || null,
        displayColour: cached.displayColour || null,
      });
    } else {
      idsToFetch.push(id);
    }
  });

  // Fetch uncached artists
  const queries = useQueries({
    queries: idsToFetch.map(artistId => ({
      queryKey: ['artist', artistId],
      queryFn: async () => {
        const response = await fetch(`/api/artists/${artistId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error(`Failed to fetch artist: ${response.status}`);
        }

        return await response.json() as Artist;
      },
      staleTime: 10 * 60 * 1000, // 10 min
      gcTime: 30 * 60 * 1000,
      retry: false, // Don't retry for batch fetches
    })),
  });

  // Build result map
  const artistImages = new Map<string, ArtistImageData>(cachedImages);

  queries.forEach((query, index) => {
    if (query.data) {
      artistImages.set(idsToFetch[index], {
        id: idsToFetch[index],
        profileImageUrl: query.data.profileImageUrl || null,
        displayColour: query.data.displayColour || null,
      });
    }
  });

  const isLoading = queries.some(q => q.isLoading);

  return {
    artistImages,
    isLoading,
  };
}

/**
 * Get a single artist's image data from the map
 * Returns null if not found
 */
export function getArtistImage(
  artistImages: Map<string, ArtistImageData>,
  artistId: string | undefined
): ArtistImageData | null {
  if (!artistId) return null;
  return artistImages.get(artistId) || null;
}
