// Refined update to ArtistCard component
import { Music } from 'lucide-react';
import type { Artist } from '@/lib/types';

interface ArtistCardProps {
    artist: Artist;
    onSelect: (artist: Artist) => void;
}

export function ArtistCard({ artist, onSelect }: ArtistCardProps) {
    return (
        <div
            className="p-4 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--accent)] transition-colors"
            onClick={() => onSelect(artist)}
        >
            <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--primary-translucent)] flex items-center justify-center mr-3">
                    <Music className="w-5 h-5 text-[var(--primary)]" />
                </div>
                
                <div className="flex-1 min-w-0 text-left">
                    <h3 className="text-base font-semibold text-[var(--foreground)]">{artist.name}</h3>
                    
                    {artist.genres && artist.genres.length > 0 && (
                        <p className="text-sm text-[var(--foreground-muted)] mt-1">
                            {artist.genres.slice(0, 2).join(', ')}
                            {artist.genres.length > 2 && "..."}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}