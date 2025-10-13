import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Artist } from "@/lib/types";

/**
 * Hook for fetching a single artist by ID
 * Used by EventInfoOverlay when displaying event details
 */
export function useArtist(artistId: string | undefined) {
  return useQuery({
    queryKey: ['/api/artists', artistId],
    queryFn: async () => {
      if (!artistId) return null;

      const response = await apiRequest('GET', `/api/artists/${artistId}`);
      return await response.json() as Artist;
    },
    staleTime: 10 * 60 * 1000,  // 10 min (artist data rarely changes)
    gcTime: 30 * 60 * 1000,
    enabled: !!artistId,
  });
}
