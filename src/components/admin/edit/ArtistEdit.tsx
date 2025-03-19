// /components/admin/edit/ArtistEdit.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Artist, SocialMediaURL, SocialPlatform } from "@/lib/types";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, MapPin, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getArtistById, createArtist, updateArtist } from "@/lib/services/artist-service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GENRES } from "@/lib/constants";
import { GoogleMapsProvider, useGoogleMaps } from "@/components/providers/GoogleMapsProvider";

// Fallback genres if GENRES is not defined in constants
const FALLBACK_GENRES = [
  "Rock", "Pop", "Hip Hop", "Electronic", "Jazz", "Blues",
  "Country", "Folk", "R&B", "Classical", "Reggae", "Metal",
  "Punk", "Indie", "Alternative", "Dance", "World", "Other"
];

// Use GENRES from constants or fallback
const genreOptions = GENRES || FALLBACK_GENRES;

// Social media platforms supported
const SOCIAL_MEDIA_PLATFORMS = [
  { id: "facebook", name: "Facebook" },
  { id: "instagram", name: "Instagram" },
  { id: "youtube", name: "YouTube" },
  { id: "x", name: "X (Twitter)" },
  { id: "website", name: "Website" },
  { id: "spotify", name: "Spotify" },
];

type ArtistEditProps = {
  artistId?: string; // If not provided, we're creating a new artist
};

// Define UK cities for fallback if Google Maps API fails
const UK_CITIES = [
  "London", "Birmingham", "Manchester", "Glasgow", "Liverpool",
  "Edinburgh", "Bristol", "Leeds", "Sheffield", "Newcastle",
  "Belfast", "Cardiff", "Brighton", "Oxford", "Cambridge",
  "Southampton", "Portsmouth", "Nottingham", "Leicester", "Coventry", 
  "Stoke-on-Trent", "Stockport", "Bath", "York", "Aberdeen"
];

function ArtistEditContent({ artistId }: ArtistEditProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const [locationPredictions, setLocationPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  
  // Use the GoogleMapsProvider hook
  const { isLoaded: googleMapsLoaded, isError: googleMapsError, loadGoogleMaps } = useGoogleMaps();
  
  const locationRef = useRef<HTMLDivElement>(null);
  const placesServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const fetchingRef = useRef(false);
  
  const [artist, setArtist] = useState<Partial<Artist>>({
    id: "",
    name: "",
    description: "",
    genres: [],
    location: "",
    socialMediaURLs: [],
  });

  // Fetch artist data if editing an existing artist
  const fetchArtist = useCallback(async () => {
    if (!artistId || fetchingRef.current || dataFetched) return;
    
    fetchingRef.current = true;
    setIsLoading(true);
    
    try {
  
      const artistData = await getArtistById(artistId);
      
      if (artistData) {

        setArtist(artistData);
        if (artistData.location) {
          setLocationQuery(artistData.location);
        }
        setDataFetched(true);
      } else {
        console.error("Artist not found");
        toast({
          title: "Artist not found",
          description: "The requested artist does not exist.",
          variant: "destructive",
        });
        router.push("/admin");
      }
    } catch (error) {
      console.error("Error fetching artist:", error);
      toast({
        title: "Error",
        description: "Failed to fetch artist data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [artistId, toast, router, dataFetched]);

  useEffect(() => {
    fetchArtist();
  }, [fetchArtist]);

  // Initialize Google Places Service when Google Maps is loaded
  useEffect(() => {
    if (googleMapsLoaded && !placesServiceRef.current) {
      try {
  
        placesServiceRef.current = new google.maps.places.AutocompleteService();
      } catch (error) {
        console.error("Error initializing Google Maps Places service:", error);
      }
    }
  }, [googleMapsLoaded]);
  
  // Load Google Maps if needed for location search
  useEffect(() => {
    if (locationQuery.trim().length >= 2 && !googleMapsLoaded && !googleMapsError) {
      loadGoogleMaps().catch(error => {
        console.error("Error loading Google Maps:", error);
      });
    }
  }, [locationQuery, googleMapsLoaded, googleMapsError, loadGoogleMaps]);
  
  // Filter locations based on input (fallback if Google Maps fails)
  useEffect(() => {
    if ((googleMapsError || !googleMapsLoaded) && locationQuery.trim() !== "") {
      const query = locationQuery.toLowerCase();
      const filtered = UK_CITIES.filter(city => 
        city.toLowerCase().includes(query)
      );
    
      setFilteredLocations(filtered);
      setShowLocationDropdown(filtered.length > 0);
    }
  }, [locationQuery, googleMapsError, googleMapsLoaded]);

  // Google Places Autocomplete for location
  useEffect(() => {
    if (!googleMapsLoaded || googleMapsError || !locationQuery || locationQuery.length < 2) {
      if (!googleMapsError) {
        setLocationPredictions([]);
        setShowLocationDropdown(false);
      }
      
      // If there's a query but Google Maps isn't working, use the fallback UK cities filter
      if (locationQuery.length >= 2 && (googleMapsError || !googleMapsLoaded)) {
        const query = locationQuery.toLowerCase();
        const filtered = UK_CITIES.filter(city => 
          city.toLowerCase().includes(query)
        );
        setFilteredLocations(filtered);
        setShowLocationDropdown(filtered.length > 0);
      }
      
      return;
    }
    
    const autocompletePlaces = () => {
      if (!placesServiceRef.current) {
        try {
          if (window.google && window.google.maps && window.google.maps.places) {
       
            placesServiceRef.current = new window.google.maps.places.AutocompleteService();
          } else {
            console.warn("Google Maps Places library not available in query effect");
            return;
          }
        } catch (error) {
          console.error("Error creating AutocompleteService:", error);
          return;
        }
      }
      
      
      placesServiceRef.current.getPlacePredictions({
        input: locationQuery,
        types: ['(cities)'],
        componentRestrictions: { country: 'gb' }
      }, (results, status) => {

        
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          setLocationPredictions(results);
          setShowLocationDropdown(true);
        } else {
          setLocationPredictions([]);
          if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setShowLocationDropdown(false);
          } else {
            console.warn("Google Places API issue:", status);
            // If there's an issue with Places API, fall back to local filtering
            
            // Apply fallback filter
            const query = locationQuery.toLowerCase();
            const filtered = UK_CITIES.filter(city => 
              city.toLowerCase().includes(query)
            );
            setFilteredLocations(filtered);
            setShowLocationDropdown(filtered.length > 0);
          }
        }
      });
    };

    // Debounce to avoid making too many requests
    const timeoutId = setTimeout(() => {
      autocompletePlaces();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [locationQuery, googleMapsLoaded, googleMapsError]);

  // Click outside location dropdown handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle form field changes
  const handleInputChange = (field: keyof Artist, value: string | string[] | object) => {
    setArtist(prev => ({ ...prev, [field]: value }));
  };

  // Handle location input
  const handleLocationChange = (value: string) => {
    setLocationQuery(value);
    setShowLocationDropdown(true);
    setArtist(prev => ({ ...prev, location: value }));
  };

  // Select a location from dropdown (Google Places prediction)
  const selectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    setLocationQuery(prediction.description);
    setArtist(prev => ({ ...prev, location: prediction.description }));
    setShowLocationDropdown(false);
  };

  // Select a location from dropdown (fallback list)
  const selectLocation = (location: string) => {
    setLocationQuery(location);
    setArtist(prev => ({ ...prev, location }));
    setShowLocationDropdown(false);
  };

  // Handle social media URL changes
  const handleSocialMediaChange = (index: number, field: keyof SocialMediaURL, value: string) => {
    const updatedSocialMedia = [...(artist.socialMediaURLs || [])];
    updatedSocialMedia[index] = { ...updatedSocialMedia[index], [field]: value };
    setArtist(prev => ({ ...prev, socialMediaURLs: updatedSocialMedia }));
  };

  // Handle genre selection checkbox
  const handleGenreToggle = (genre: string) => {
    const currentGenres = [...(artist.genres || [])];
    
    if (currentGenres.includes(genre)) {
      // Remove genre if already selected
      const updatedGenres = currentGenres.filter(g => g !== genre);
      handleInputChange("genres", updatedGenres);
    } else {
      // Add genre if not already selected
      const updatedGenres = [...currentGenres, genre];
      handleInputChange("genres", updatedGenres);
    }
  };

  // Add a new social media URL
  const addSocialMedia = () => {
    const updatedSocialMedia = [...(artist.socialMediaURLs || [])];
    updatedSocialMedia.push({ platform: "facebook", url: "" });
    setArtist(prev => ({ ...prev, socialMediaURLs: updatedSocialMedia }));
  };

  // Remove a social media URL
  const removeSocialMedia = (index: number) => {
    const updatedSocialMedia = [...(artist.socialMediaURLs || [])];
    updatedSocialMedia.splice(index, 1);
    setArtist(prev => ({ ...prev, socialMediaURLs: updatedSocialMedia }));
  };

  // Save artist data
  const handleSave = async () => {
    if (!artist.name?.trim()) {
      toast({
        title: "Missing information",
        description: "Artist name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const artistData = {
        name: artist.name,
        description: artist.description || "",
        genres: artist.genres || [],
        location: artist.location || "",
        socialMediaURLs: artist.socialMediaURLs || [],
      };

      if (artistId) {
        // Update existing artist
        await updateArtist({
          ...artistData,
          id: artistId,
          updatedAt: new Date().toISOString(),
          createdAt: artist.createdAt || new Date().toISOString(),
        } as Artist);
        
        toast({
          title: "Success",
          description: "Artist updated successfully.",
        });
      } else {
        // Create new artist
        await createArtist(artistData as Omit<Artist, "id" | "createdAt" | "updatedAt">);
        
        toast({
          title: "Success",
          description: "Artist created successfully.",
        });
      }
      router.push("/admin");
    } catch (error) {
      console.error("Error saving artist:", error);
      toast({
        title: "Error",
        description: "Failed to save artist data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to check if a platform is already selected
  const isPlatformSelected = (platform: SocialPlatform) => {
    return artist.socialMediaURLs?.some(sm => sm.platform === platform);
  };

  // Filter available platforms for dropdowns
  const getAvailablePlatforms = (currentPlatform: SocialPlatform) => {
    return SOCIAL_MEDIA_PLATFORMS.filter(
      platform => platform.id === currentPlatform || !isPlatformSelected(platform.id as SocialPlatform)
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Link href="/admin">
          <Button variant="outline" size="sm" className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {artistId ? "Edit Artist" : "Create Artist"}
        </h1>
      </div>

      <Card>
      <ScrollArea className="h-[calc(100vh-15rem)] px-6">
        <CardHeader>
          <CardTitle>Artist Details</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 pr-6">
          {isLoading ? (
            <div className="py-10 text-center flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Loading artist data...</p>
            </div>
          ) : (
            <>
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Artist Name *</Label>
                    <Input
                      id="name"
                      value={artist.name || ""}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter artist name"
                      required
                    />
                  </div>

                  <div ref={locationRef} className="relative">
                    <Label htmlFor="location">Location (UK City/Town)</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <Input
                        id="location"
                        value={locationQuery}
                        onChange={(e) => handleLocationChange(e.target.value)}
                        placeholder="Start typing a UK city or town"
                        className="pl-10"
                        onFocus={() => {
                          if (locationQuery.trim().length >= 2) {
                            setShowLocationDropdown(true);
                          }
                        }}
                      />
                    </div>
                    
                    {/* Location dropdown */}
                    {showLocationDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-background rounded-md shadow-lg border border-border">
                        {/* Show fallback UK cities if Google Maps failed or if there are filtered locations */}
                        {(googleMapsError || !googleMapsLoaded) && filteredLocations.length > 0 && (
                          <ScrollArea className="max-h-60">
                            {filteredLocations.map((location, index) => (
                              <div
                                key={index}
                                className="p-3 border-b border-border hover:bg-accent cursor-pointer"
                                onClick={() => selectLocation(location)}
                              >
                                {location}
                              </div>
                            ))}
                          </ScrollArea>
                        )}
                        
                        {/* Show Google Places predictions if available */}
                        {googleMapsLoaded && !googleMapsError && (
                          <>
                            {locationPredictions.length > 0 ? (
                              <ScrollArea className="max-h-60">
                                {locationPredictions.map((prediction) => (
                                  <div
                                    key={prediction.place_id}
                                    className="p-3 border-b border-border hover:bg-accent cursor-pointer"
                                    onClick={() => selectPrediction(prediction)}
                                  >
                                    {prediction.description}
                                  </div>
                                ))}
                              </ScrollArea>
                            ) : (
                              <div className="p-3 text-center text-muted-foreground">
                                {locationQuery.length < 2 
                                  ? "Type at least 2 characters" 
                                  : "No locations found"}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={artist.description || ""}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Enter artist description"
                    className="h-32"
                  />
                </div>
              </div>

              {/* Genres - Multi-select */}
              <div className="space-y-2">
                <Label>Genres (select multiple)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {genreOptions.map((genre) => (
                    <div key={genre} className="flex items-center space-x-2">
                      <Checkbox
                        id={`genre-${genre}`}
                        checked={(artist.genres || []).includes(genre)}
                        onCheckedChange={() => handleGenreToggle(genre)}
                      />
                      <label
                        htmlFor={`genre-${genre}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {genre}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Media URLs */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Social Media Links</Label>
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSocialMedia}
                    disabled={SOCIAL_MEDIA_PLATFORMS.length === artist.socialMediaURLs?.length}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Link
                  </Button>
                </div>

                {!artist.socialMediaURLs || artist.socialMediaURLs.length === 0 ? (
                  <div className="text-center p-4 border rounded-md bg-muted">
                    <p>No social media links added.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {artist.socialMediaURLs.map((socialMedia, index) => (
                      <div key={index} className="flex space-x-3">
                        <div className="w-1/3">
                          <Select
                            value={socialMedia.platform}
                            onValueChange={(value) => handleSocialMediaChange(index, "platform", value as SocialPlatform)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailablePlatforms(socialMedia.platform).map((platform) => (
                                <SelectItem key={platform.id} value={platform.id}>
                                  {platform.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1 flex space-x-2">
                          <Input
                            value={socialMedia.url || ""}
                            onChange={(e) => handleSocialMediaChange(index, "url", e.target.value)}
                            placeholder={`${socialMedia.platform} URL`}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeSocialMedia(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {artist.socialMediaURLs?.some(sm => sm.platform === "facebook") && (
                  <p className="text-sm text-muted-foreground">
                    The Facebook URL is important for event imports.
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !artist.name}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              artistId ? "Update Artist" : "Create Artist"
            )}
          </Button>
        </CardFooter>
        </ScrollArea>
      </Card>
    </div>
  );
}

// Main export that wraps the content with the GoogleMapsProvider
export function ArtistEdit(props: ArtistEditProps) {
  return (
    <GoogleMapsProvider>
      <ArtistEditContent {...props} />
    </GoogleMapsProvider>
  );
}