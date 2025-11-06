// src/components/events/steps/ArtistStep/NewArtistForm.tsx
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GenreSelector } from "@/components/ui/genre-selector";
import { AlertCircle } from 'lucide-react';
import { createArtist } from '@/lib/services/artist-service';
import type { Artist } from '@/lib/types';
import { stringSimilarity } from '@/lib/utils/string-similarity';

interface NewArtistFormProps {
    initialName: string;
    onCancel: () => void;
    onArtistCreated: (artist: Artist) => void;
    existingArtists: Artist[];
}

interface NewArtistData {
    name: string;
    location: string;  // Required field to prevent duplicates
    genres?: string[];
    facebookUrl?: string;
    instagramUrl?: string;
    websiteUrl?: string;
}

export function NewArtistForm({
    initialName,
    onCancel,
    onArtistCreated,
    existingArtists
}: NewArtistFormProps) {
    const [formData, setFormData] = useState<NewArtistData>({
        name: initialName,
        location: '',
        genres: []
    });
    const [loading, setLoading] = useState(false);

    const similarArtists = existingArtists.filter(artist =>
        stringSimilarity(artist.name.toLowerCase(), formData.name.toLowerCase()) > 0.8
    );

    const handleSubmit = async () => {
        if (!formData.name || !formData.location) {
            alert('Artist name and location are required');
            return;
        }

        const exactMatch = existingArtists.find(
            artist => artist.name.toLowerCase() === formData.name.toLowerCase()
        );
        
        if (exactMatch) {
            alert('An artist with this exact name already exists');
            return;
        }

        setLoading(true);
        try {
            const artist = await createArtist(formData);
            onArtistCreated(artist);
        } catch (error) {
            console.error('Error creating artist:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <Input
                placeholder="Artist Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mb-2"
                autoFocus
            />

            <Input
                placeholder="Location (e.g., Manchester, UK) *"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="mb-2"
            />

            <p className="text-xs text-muted-foreground mb-2">
                Location is required to prevent duplicate artists
            </p>

            {similarArtists.length > 0 && (
                <div className="p-3 bg-yellow-500/10 rounded-md border border-yellow-500/50">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm text-yellow-500 font-medium">Similar artists found:</p>
                            <ul className="mt-1 text-sm text-muted-foreground">
                                {similarArtists.map(artist => (
                                    <li key={artist.id}>{artist.name}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <Input
                placeholder="Facebook URL"
                value={formData.facebookUrl || ''}
                onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                className="mb-2"
            />
            <Input
                placeholder="Instagram URL"
                value={formData.instagramUrl || ''}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                className="mb-2"
            />
            <Input
                placeholder="Website URL"
                value={formData.websiteUrl || ''}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                className="mb-2"
            />

            <div className="mt-4">
                <label className="text-sm font-medium mb-2 block">Genres (Optional)</label>
                <GenreSelector
                    selectedGenres={formData.genres || []}
                    onChange={(genres) => setFormData({ ...formData, genres })}
                />
            </div>

            <div className="flex gap-2 pt-4">
                <Button
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={!formData.name || !formData.location || loading}
                    className="flex-1 bg-[var(--primary)] text-white"
                >
                    {loading ? 'Creating...' : 'Save New Artist'}
                </Button>
            </div>
        </div>
    );
}