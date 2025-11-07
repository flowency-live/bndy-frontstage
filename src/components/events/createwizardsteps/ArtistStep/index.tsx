// src/components/events/createwizardsteps/ArtistStep/index.tsx
import { useState, useEffect, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Music, ChevronRight, Mic } from 'lucide-react';
import { cn } from "@/lib/utils";
import { searchArtists } from '@/lib/services/artist-service';
import type { Artist, EventFormData } from '@/lib/types';
import { ArtistCard } from './ArtistCard';
import { NewArtistForm } from './NewArtistForm';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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
    onNext
}: ArtistStepProps) {
    const [searchResults, setSearchResults] = useState<Artist[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [isNewArtistSheetOpen, setIsNewArtistSheetOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    // Initialize isOpenMic as false if it's undefined to prevent controlled/uncontrolled input error
    useEffect(() => {
        if (form.getValues('isOpenMic') === undefined) {
            form.setValue('isOpenMic', false);
        }
    }, [form]);
    
    const isOpenMic = form.watch('isOpenMic');

    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    // When Open Mic is toggled, clear selected artists if we're turning it on
    // But preserve the artists if we're turning it off
    useEffect(() => {
        if (isOpenMic && !multipleMode) {
            // Keep the first artist if there is one (as the host), but clear others
            const currentArtists = form.getValues('artists') || [];
            if (currentArtists.length > 1) {
                form.setValue('artists', [currentArtists[0]]);
            }
        }
    }, [isOpenMic, multipleMode, form]);

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
        if (isOpenMic) {
            // For Open Mic, the selected artist is the host
            form.setValue('artists', [artist]);
            form.setValue('isOpenMic', true);
            onArtistSelect?.(artist);
        } else if (!multipleMode) {
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

    // Function to handle progressing to next step for Open Mic events
    const handleOpenMicNext = () => {
        if (onNext) {
            onNext();
        }
    };

    // Function to handle multiple artists progression
    const handleMultipleArtistsNext = () => {
        if (onNext) {
            onNext();
        }
    };

    return (
        <div className="px-4 py-4 space-y-4">
            {/* Event Type Options - moved to top for better visibility */}
            <div className="bg-[var(--background-dark)] rounded-lg p-4 border border-[var(--border)]">
                <div className="space-y-3">
                    <label className="flex items-center space-x-3 py-2 cursor-pointer">
                        <div className="relative">
                            <input
                                type="radio"
                                name="eventType"
                                className="opacity-0 absolute h-0 w-0"
                                checked={!isOpenMic && !multipleMode}
                                onChange={() => {
                                    form.setValue('isOpenMic', false);
                                    if (onToggleMultipleMode) onToggleMultipleMode(false);
                                }}
                            />
                            <div className={cn(
                                "w-5 h-5 rounded-full border border-[var(--primary)]",
                                !isOpenMic && !multipleMode ? "flex items-center justify-center" : ""
                            )}>
                                {!isOpenMic && !multipleMode && <div className="w-3 h-3 rounded-full bg-[var(--primary)]"></div>}
                            </div>
                        </div>
                        <span className="text-[var(--foreground)] flex items-center">
                            <Music className="w-4 h-4 mr-2 text-[var(--primary)]" />
                            Single Artist Event
                        </span>
                    </label>
                    
                    <label className="flex items-center space-x-3 py-2 cursor-pointer">
                        <div className="relative">
                            <input
                                type="radio"
                                name="eventType"
                                className="opacity-0 absolute h-0 w-0"
                                checked={!!isOpenMic}
                                onChange={() => {
                                    form.setValue('isOpenMic', true);
                                    // Don't auto-progress here, let user decide if they want to add a host
                                }}
                            />
                            <div className={cn(
                                "w-5 h-5 rounded-full border border-[var(--primary)]",
                                isOpenMic ? "flex items-center justify-center" : ""
                            )}>
                                {isOpenMic && <div className="w-3 h-3 rounded-full bg-[var(--primary)]"></div>}
                            </div>
                        </div>
                        <span className="text-[var(--foreground)] flex items-center">
                            <Mic className="w-4 h-4 mr-2 text-[var(--primary)]" />
                            Open Mic Event
                        </span>
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
                        <span className="text-[var(--foreground)] flex items-center">
                            <Music className="w-4 h-4 mr-2 text-[var(--primary)]" />
                            <Music className="w-3 h-3 mr-2 text-[var(--primary)]" />
                            Multiple Artists Event
                        </span>
                    </label>
                </div>
            </div>

            {/* Open Mic Host Information - show when open mic is selected */}
            {isOpenMic && (
                <div className="bg-[var(--primary)]/10 rounded-lg p-4 border border-[var(--primary)]/30">
                    <p className="text-sm text-[var(--foreground)]">
                        {form.getValues('artists')?.length ? 
                            "Open Mic event with host artist selected. You can change or remove the host using the search below." :
                            "You can optionally select a host artist for this Open Mic event."
                        }
                    </p>
                </div>
            )}

            {/* Search input - always visible */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Music className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <input
                    ref={searchInputRef}
                    placeholder={isOpenMic ? "Search for a host artist (optional)..." : "Search for artists..."}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full px-4 py-3 pl-12 bg-transparent border rounded-full text-base focus:outline-none focus:ring-2 focus:ring-[var(--primary-translucent)]"
                    style={{ borderColor: 'var(--primary)' }}
                />
            </div>

            {/* Search results or placeholder */}
            {loading ? (
                <div className="text-center py-4 text-[var(--foreground-muted)]">
                    Searching artists...
                </div>
            ) : searchResults.length > 0 ? (
                <ScrollArea className="mt-2 max-h-[300px] border border-[var(--border)] rounded-lg overflow-hidden">
                    {searchResults.map((artist) => (
                        <ArtistCard
                            key={artist.id}
                            artist={artist}
                            onSelect={handleArtistSelect}
                        />
                    ))}
                </ScrollArea>
            ) : hasSearched && searchTerm.length >= 2 ? (
                <div className="text-center py-4 text-[var(--foreground-muted)]">
                    <p className="mb-4">No artists found</p>
                    <Sheet open={isNewArtistSheetOpen} onOpenChange={setIsNewArtistSheetOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                            >
                                Add New Artist
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-[425px] overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle>Add New Artist</SheetTitle>
                            </SheetHeader>
                            <div className="mt-4 pb-6">
                                <NewArtistForm
                                    initialName={searchTerm}
                                    onCancel={() => setIsNewArtistSheetOpen(false)}
                                    onArtistCreated={(artist) => {
                                        handleArtistSelect(artist);
                                        setIsNewArtistSheetOpen(false);
                                    }}
                                    existingArtists={searchResults}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            ) : (
                <div className="text-center py-4 text-[var(--foreground-muted)]">
                    {isOpenMic ? 
                        "Start typing to search for a host artist (optional)" :
                        "Start typing to search for artists"
                    }
                </div>
            )}

            {/* Selected artists list - only shown in multiple mode or when open mic has host */}
            {(multipleMode || (isOpenMic && form.watch('artists')?.length > 0)) && (
                <div className="mt-2">
                    <h4 className="font-medium mb-2">
                        {isOpenMic ? "Open Mic Host" : "Selected Artists"}
                    </h4>
                    <div className="space-y-2">
                        {form.watch('artists').map((artist: Artist) => (
                            <div key={artist.id} className="flex items-center justify-between p-2 bg-[var(--accent)] rounded">
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
                </div>
            )}

            {/* Next button for Open Mic events */}
            {isOpenMic && (
                <div className="mt-4">
                    <Button 
                        className="w-full bg-[var(--primary)] text-white"
                        onClick={handleOpenMicNext}
                    >
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Next button for multiple artists */}
            {!isOpenMic && multipleMode && form.watch('artists')?.length > 0 && (
                <div className="mt-4">
                    <Button
                        className="w-full bg-[var(--primary)] text-white"
                        onClick={handleMultipleArtistsNext}
                    >
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}