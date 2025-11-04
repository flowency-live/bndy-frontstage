import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Artist } from "@/lib/types";

/**
 * Hook for fetching a single artist by ID
 * Used by EventInfoOverlay when displaying event details
 * Optimized to call DynamoDB API directly for faster loading
 */
export function useArtist(artistId: string | undefined) {
  return useQuery({
    queryKey: ['artist', artistId],
    queryFn: async () => {
      if (!artistId) return null;

      // Call DynamoDB API directly for faster response
      const response = await fetch(`https://api.bndy.co.uk/api/artists/${artistId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch artist: ${response.status}`);
      }

      return await response.json() as Artist;
    },
    staleTime: 10 * 60 * 1000,  // 10 min (artist data rarely changes)
    gcTime: 30 * 60 * 1000,
    enabled: !!artistId,
    // Add retry logic for better reliability
    retry: (failureCount, error) => {
      // Don't retry 404s
      if (error.message.includes('404')) return false;
      return failureCount < 2;
    },
    retryDelay: 1000,
  });
}
