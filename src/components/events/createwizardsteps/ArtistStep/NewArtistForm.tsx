// src/components/events/steps/ArtistStep/NewArtistForm.tsx
import { useState } from 'react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { AlertCircle, X } from 'lucide-react';
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
        name: initialName
    });
    const [loading, setLoading] = useState(false);

    const similarArtists = existingArtists.filter(artist =>
        stringSimilarity(artist.name.toLowerCase(), formData.name.toLowerCase()) > 0.8
    );

    const handleSubmit = async () => {
        if (!formData.name) return;

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
        <Card className="border-primary">
            <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Add New Artist</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                
                <Input
                    placeholder="Artist Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mb-2"
                    autoFocus
                />

                {similarArtists.length > 0 && (
                    <div className="p-2 bg-yellow-500/10 rounded-md border border-yellow-500/50">
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
                
                <Button
                    onClick={handleSubmit}
                    disabled={!formData.name || loading}
                    className="w-full"
                >
                    {loading ? 'Creating...' : 'Save New Artist'}
                </Button>
            </CardContent>
        </Card>
    );
}