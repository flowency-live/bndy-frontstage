// Refined update to ArtistStep component
import { useState, useEffect, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/Button";
import { Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchArtists } from '@/lib/services/artist-service';
import type { Artist, EventFormData } from '@/lib/types';
import { ArtistCard } from './ArtistCard';
import { NewArtistForm } from './NewArtistForm';

interface ArtistStepProps {
    form: UseFormReturn<EventFormData>;
    multipleMode: boolean;
    onToggleMultipleMode?: (value: boolean) => void;
    onArtistSelect?: (artist: Artist) => void;
    onNext?: () => void;
    onBack?: () => void;
}

export function ArtistStep({
    form,
    multipleMode,
    onToggleMultipleMode,
    onArtistSelect,
    onNext,
    onBack
}: ArtistStepProps) {
    const [searchResults, setSearchResults] = useState<Artist[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewArtistForm, setShowNewArtistForm] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const isOpenMic = form.watch('isOpenMic');

    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    const handleSearch = async (searchTerm: string) => {
        setSearchTerm(searchTerm);
        if (searchTerm.length < 2) {
            setSearchResults([]);
            setHasSearched(false);
            return;
        }

        setLoading(true);
        try {
            const results = await searchArtists(searchTerm);
            setSearchResults(results);
            setHasSearched(true);
        } catch (error) {
            console.error('Error searching artists:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleArtistSelect = (artist: Artist) => {
        if (!multipleMode) {
            form.setValue('artists', [artist]);
            onArtistSelect?.(artist);
        } else {
            const currentArtists = form.getValues('artists') || [];
            if (!currentArtists.some(a => a.id === artist.id)) {
                form.setValue('artists', [...currentArtists, artist]);
            }
        }
    };

    const handleRemoveArtist = (artistId: string) => {
        const currentArtists = form.getValues('artists') || [];
        form.setValue('artists', currentArtists.filter(artist => artist.id !== artistId));
    };

    return (
        <div className="px-6 py-6">
            {/* Event Type Options */}
            <div className="bg-[var(--background-dark)] mb-6 rounded-lg p-4 border border-[var(--border)]">
                <label className="flex items-center space-x-3 py-2 cursor-pointer">
                    <div className="relative">
                        <input
                            type="radio"
                            name="eventType"
                            className="opacity-0 absolute h-0 w-0"
                            checked={isOpenMic}
                            onChange={() => {
                                form.setValue('isOpenMic', true);
                                if (form.getValues('isOpenMic') && onNext) {
                                    onNext();
                                }
                            }}
                        />
                        <div className={cn(
                            "w-5 h-5 rounded-full border border-[var(--primary)]",
                            isOpenMic ? "flex items-center justify-center" : ""
                        )}>
                            {isOpenMic && <div className="w-3 h-3 rounded-full bg-[var(--primary)]"></div>}
                        </div>
                    </div>
                    <span className="text-[var(--foreground)]">This is an Open Mic event</span>
                </label>
                
                <label className="flex items-center space-x-3 py-2 cursor-pointer">
                    <div className="relative">
                        <input
                            type="radio"
                            name="eventType"
                            className="opacity-0 absolute h-0 w-0"
                            checked={!isOpenMic && multipleMode}
                            onChange={() => {
                                form.setValue('isOpenMic', false);
                                if (onToggleMultipleMode) onToggleMultipleMode(true);
                            }}
                        />
                        <div className={cn(
                            "w-5 h-5 rounded-full border border-[var(--primary)]",
                            !isOpenMic && multipleMode ? "flex items-center justify-center" : ""
                        )}>
                            {!isOpenMic && multipleMode && <div className="w-3 h-3 rounded-full bg-[var(--primary)]"></div>}
                        </div>
                    </div>
                    <span className="text-[var(--foreground)]">List Multiple Artists?</span>
                </label>
            </div>
    
            {/* Artist Selection - Only show if not Open Mic */}
            {!isOpenMic && (
                <>
                    {!showNewArtistForm ? (
                        <>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Music className="w-5 h-5 text-[var(--primary)]" />
                                </div>
                                <input
                                    ref={searchInputRef}
                                    placeholder="Search for artists..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full px-4 py-3 pl-12 bg-transparent border rounded-full text-base focus:outline-none focus:ring-2 focus:ring-[var(--primary-translucent)]"
                                    style={{ borderColor: 'var(--primary)' }}
                                />
                            </div>
    
                            {loading ? (
                                <div className="text-center py-8 text-[var(--foreground-muted)]">
                                    Searching artists...
                                </div>
                            ) : searchResults.length > 0 ? (
                                <ScrollArea className="mt-4 max-h-[300px] border border-[var(--border)] rounded-lg overflow-hidden">
                                    {searchResults.map((artist) => (
                                        <ArtistCard
                                            key={artist.id}
                                            artist={artist}
                                            onSelect={handleArtistSelect}
                                        />
                                    ))}
                                </ScrollArea>
                            ) : hasSearched && searchTerm.length >= 2 ? (
                                <div className="text-center py-8 text-[var(--foreground-muted)]">
                                    <p className="mb-4">No artists found</p>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowNewArtistForm(true)}
                                    >
                                        Add New Artist
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-[var(--foreground-muted)]">
                                    Start typing to search for artists
                                </div>
                            )}
                        </>
                    ) : (
                        <NewArtistForm
                            initialName={searchTerm}
                            onCancel={() => setShowNewArtistForm(false)}
                            onArtistCreated={(artist) => {
                                handleArtistSelect(artist);
                                setShowNewArtistForm(false);
                            }}
                            existingArtists={searchResults}
                        />
                    )}
    
                    {multipleMode && form.watch('artists')?.length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-medium mb-2">Selected Artists</h4>
                            {form.watch('artists').map((artist: Artist) => (
                                <div key={artist.id} className="flex items-center justify-between p-2 bg-[var(--accent)] rounded mb-2">
                                    <span>{artist.name}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveArtist(artist.id)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
    
                    <div className="flex gap-4 mt-6">
                        {onBack && (
                            <Button variant="outline" className="flex-1" onClick={onBack}>
                                Back
                            </Button>
                        )}
                        
                        {multipleMode && (
                            <Button
                                className="flex-1 bg-[var(--primary)] text-white"
                                disabled={form.watch('artists')?.length === 0}
                                onClick={onNext}
                            >
                                Next
                            </Button>
                        )}
                    </div>
                </>
            )}
            
            {isOpenMic && onNext && (
                <div className="flex gap-4 mt-6">
                    {onBack && (
                        <Button variant="outline" className="flex-1" onClick={onBack}>
                            Back
                        </Button>
                    )}
                    <Button className="flex-1 bg-[var(--primary)] text-white" onClick={onNext}>
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}