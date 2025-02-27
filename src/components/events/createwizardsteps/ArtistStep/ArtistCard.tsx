// src/components/events/createwizardsteps/ArtistStep/ArtistCard.tsx
import { Card, CardContent } from "@/components/ui/Card";
import { Globe, Facebook, Music } from 'lucide-react';
import { FaInstagram, FaSpotify } from 'react-icons/fa';
import type { Artist, SocialMediaURL } from '@/lib/types';
import { getSocialMediaURLs } from '@/lib/types';

interface ArtistCardProps {
    artist: Artist;
    onSelect: (artist: Artist) => void;
}

export function ArtistCard({ artist, onSelect }: ArtistCardProps) {
    // Get social media URLs using the helper function from types
    const socialMediaURLs = getSocialMediaURLs(artist);

    // Find specific URLs
    const websiteUrl = socialMediaURLs.find(social => social.platform === 'website')?.url;
    const facebookUrl = socialMediaURLs.find(social => social.platform === 'facebook')?.url;
    const instagramUrl = socialMediaURLs.find(social => social.platform === 'instagram')?.url;
    const spotifyUrl = socialMediaURLs.find(social => social.platform === 'spotify')?.url;

    return (
        <Card
            className="mb-2 cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onSelect(artist)}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{artist.name}</h3>
                            <Music className="w-4 h-4 text-[var(--primary)]" />
                        </div>
                        {websiteUrl && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {websiteUrl}
                            </p>
                        )}
                        <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                            {socialMediaURLs.length > 0 && (
                                <div className="flex items-center gap-2">
                                    {facebookUrl && <Facebook className="w-3 h-3 text-[#1877F2]" />}
                                    {instagramUrl && <FaInstagram className="w-3 h-3 text-[#E4405F]" />}
                                    {spotifyUrl && <FaSpotify className="w-3 h-3 text-[#1DB954]" />}
                                    {websiteUrl && <Globe className="w-3 h-3 text-[#4F46E5]" />}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}