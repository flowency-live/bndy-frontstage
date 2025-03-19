// /components/admin/edit/VenueEdit.tsx
"use client";

// TypeScript declaration to extend Window interface
declare global {
  interface Window {
    initGoogleMaps?: () => void;
  }
}

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@radix-ui/react-checkbox";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Venue, SocialMediaURL, SocialPlatform } from "@/lib/types";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider';
import {
  getVenueById,
  createVenue,
  updateVenue,
  getAllVenues,
  searchGooglePlaces
} from "@/lib/services/venue-service";

// Social media platforms supported
const SOCIAL_MEDIA_PLATFORMS = [
  { id: "facebook", name: "Facebook" },
  { id: "instagram", name: "Instagram" },
  { id: "youtube", name: "YouTube" },
  { id: "x", name: "X (Twitter)" },
  { id: "website", name: "Website" },
  { id: "spotify", name: "Spotify" },
];

type VenueEditProps = {
  venueId?: string; // If not provided, we're creating a new venue
};

export function VenueEdit({ venueId }: VenueEditProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Venue[]>([]);
  const [allVenues, setAllVenues] = useState<Venue[]>([]);

  // Use Google Maps hook at top-level
  const { isLoaded: googleMapsLoaded, loadGoogleMaps } = useGoogleMaps();

  const [venue, setVenue] = useState<Partial<Venue>>({
    name: "",
    address: "",
    standardStartTime: "",
    standardEndTime: "",
    standardTicketed: false,
    standardTicketUrl: "",
    standardTicketInformation: "",
    socialMediaURLs: [],
    location: { lat: 0, lng: 0 }
  });

  // Initialize Google Maps API - only if creating a new venue
  useEffect(() => {
    if (!venueId && !googleMapsLoaded) {
      loadGoogleMaps().catch(error => {
        console.error("Error loading Google Maps:", error);
      });
    }
  }, [venueId, googleMapsLoaded, loadGoogleMaps]);

  // Fetch venue data if editing an existing venue
  useEffect(() => {
    if (!venueId) {
      // If not editing, fetch all venues to check for duplicates
      getAllVenues().then(setAllVenues).catch(console.error);
      return;
    }

    // Prevent refetching if we already have data
    let venueDataLoaded = false;
    if (venueDataLoaded) {
      return;
    }

    const fetchVenue = async () => {
      setIsLoading(true);
      try {
        const venueData = await getVenueById(venueId);
        if (venueData) {
          setVenue(venueData);
          venueDataLoaded = true;
        } else {
          toast({
            title: "Venue not found",
            description: "The requested venue does not exist.",
            variant: "destructive",
          });
          router.push("/admin");
        }
      } catch (error) {
        console.error("Error fetching venue:", error);
        toast({
          title: "Error",
          description: "Failed to fetch venue data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchVenue();
  }, [venueId, router, toast]);

  // Effect to handle search as you type with Google Places
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2 || !googleMapsLoaded) {
      setSearchResults([]);
      return;
    }

    const search = async () => {
      try {
        // Use the searchGooglePlaces function
        const results = await searchGooglePlaces(searchTerm);
        setSearchResults(results);
      } catch (error) {
        console.error("Error searching venues:", error);
      }
    };

    // Use debounce to avoid excessive API calls
    const timeoutId = setTimeout(() => {
      search();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, googleMapsLoaded]);

  // Handle venue selection
  const handleVenueSelect = (selectedVenue: Venue) => {
    // Check if this venue already exists in the database
    const existingVenue = allVenues.find(v =>
      (v.googlePlaceId && v.googlePlaceId === selectedVenue.googlePlaceId) ||
      (v.location && selectedVenue.location &&
        Math.abs(v.location.lat - selectedVenue.location.lat) < 0.0001 &&
        Math.abs(v.location.lng - selectedVenue.location.lng) < 0.0001)
    );

    if (existingVenue) {
      toast({
        title: "Venue already exists",
        description: "This venue is already registered. Would you like to edit it instead?",
        action: (
          <Button
            onClick={() => router.push(`/admin/venues/${existingVenue.id}`)}
            variant="outline"
            size="sm"
          >
            Edit Existing
          </Button>
        )
      });
      return;
    }

    // Update venue state with selected venue data
    setVenue({
      ...venue,
      name: selectedVenue.name,
      address: selectedVenue.address,
      googlePlaceId: selectedVenue.googlePlaceId,
      location: selectedVenue.location,
      validated: false
    });

    // Clear search
    setSearchTerm("");
    setSearchResults([]);
  };

  // Handle form field changes
  const handleInputChange = (field: keyof Venue, value: string | number | boolean | object) => {
    setVenue(prev => ({ ...prev, [field]: value }));
  };

  // Handle social media URL changes
  const handleSocialMediaChange = (index: number, field: keyof SocialMediaURL, value: string) => {
    const updatedSocialMedia = [...(venue.socialMediaURLs || [])];
    updatedSocialMedia[index] = { ...updatedSocialMedia[index], [field]: value };
    setVenue(prev => ({ ...prev, socialMediaURLs: updatedSocialMedia }));
  };

  // Add a new social media URL
  const addSocialMedia = () => {
    const updatedSocialMedia = [...(venue.socialMediaURLs || [])];
    updatedSocialMedia.push({ platform: "facebook", url: "" });
    setVenue(prev => ({ ...prev, socialMediaURLs: updatedSocialMedia }));
  };

  // Remove a social media URL
  const removeSocialMedia = (index: number) => {
    const updatedSocialMedia = [...(venue.socialMediaURLs || [])];
    updatedSocialMedia.splice(index, 1);
    setVenue(prev => ({ ...prev, socialMediaURLs: updatedSocialMedia }));
  };

  // Save venue data
  const handleSave = async () => {
    if (!venue.name?.trim()) {
      toast({
        title: "Missing information",
        description: "Venue name is required.",
        variant: "destructive",
      });
      return;
    }

    // When creating a new venue, Google Place ID and location are required
    if (!venueId && (!venue.googlePlaceId || !venue.location)) {
      toast({
        title: "Missing information",
        description: "Please select a venue from the search results.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (venueId) {
        // Update existing venue
        await updateVenue({
          ...venue as Venue,
          id: venueId
        });

        toast({
          title: "Success",
          description: "Venue updated successfully.",
        });
      } else {
        // Create new venue - OMIT the ID field completely
        const { id, ...venueWithoutId } = venue;
        void id; // Mark 'id' as used to avoid an unused variable warning
        await createVenue(venueWithoutId as Omit<Venue, "id" | "createdAt" | "updatedAt">);

        toast({
          title: "Success",
          description: "Venue created successfully.",
        });
      }
      router.push("/admin");
    } catch (error) {
      console.error("Error saving venue:", error);
      toast({
        title: "Error",
        description: "Failed to save venue data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to check if a platform is already selected
  const isPlatformSelected = (platform: SocialPlatform) => {
    return venue.socialMediaURLs?.some(sm => sm.platform === platform);
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
          {venueId ? "Edit Venue" : "Create Venue"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Venue Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="py-10 text-center">Loading venue data...</div>
          ) : (
            <>
              {/* Venue Search - Only show for new venues */}
              {!venueId && (
                <div className="space-y-2">
                  <Label>Search for a venue</Label>
                  <div className="relative">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search for venue..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 pl-12 bg-transparent border rounded-full text-base focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    {searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border max-h-60 overflow-auto">
                        {searchResults.map((result, index) => (
                          <div
                            key={result.id || `new-${index}`}
                            className="p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                            onClick={() => handleVenueSelect(result)}
                          >
                            <div className="font-medium">{result.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{result.address}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {venue.googlePlaceId && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-md">
                      <p className="font-medium">Selected Venue:</p>
                      <p>{venue.name}</p>
                      <p>{venue.address}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Venue Name *</Label>
                    <Input
                      id="name"
                      value={venue.name || ""}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter venue name"
                      readOnly={!venueId && !venue.googlePlaceId}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={venue.address || ""}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="Enter venue address"
                      readOnly={!venueId && !venue.googlePlaceId}
                    />
                  </div>
                </div>

                {/* Timing and Price */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="standardStartTime">Usual Start Time</Label>
                      <Input
                        id="standardStartTime"
                        type="time"
                        value={venue.standardStartTime || ""}
                        onChange={(e) => handleInputChange("standardStartTime", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="standardEndTime">Usual End Time</Label>
                      <Input
                        id="standardEndTime"
                        type="time"
                        value={venue.standardEndTime || ""}
                        onChange={(e) => handleInputChange("standardEndTime", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="standardTicketed"
                        checked={venue.standardTicketed || false}
                        onCheckedChange={(checked) => handleInputChange("standardTicketed", checked)}
                      />
                      <Label htmlFor="standardTicketed">This is a ticketed venue</Label>
                    </div>

                    {venue.standardTicketed && (
                      <>
                        <div className="mt-4">
                          <Label htmlFor="standardTicketInformation">Standard Ticket Details</Label>
                          <Input
                            id="standardTicketInformation"
                            value={venue.standardTicketInformation || ""}
                            onChange={(e) => handleInputChange("standardTicketInformation", e.target.value)}
                            placeholder="e.g. £10 advance, £12 on the door"
                          />
                        </div>

                        <div className="mt-4">
                          <Label htmlFor="standardTicketUrl">Standard Ticket Website</Label>
                          <Input
                            id="standardTicketUrl"
                            type="url"
                            value={venue.standardTicketUrl || ""}
                            onChange={(e) => handleInputChange("standardTicketUrl", e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </>
                    )}
                  </div>
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
                    disabled={SOCIAL_MEDIA_PLATFORMS.length === venue.socialMediaURLs?.length}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Link
                  </Button>
                </div>

                {!venue.socialMediaURLs || venue.socialMediaURLs.length === 0 ? (
                  <div className="text-center p-4 border rounded-md bg-muted">
                    <p>No social media links added.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {venue.socialMediaURLs.map((socialMedia, index) => (
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
                {venue.socialMediaURLs?.some(sm => sm.platform === "facebook") && (
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
            disabled={
              isLoading ||
              !venue.name ||
              (!venueId && (!venue.googlePlaceId || !venue.location))
            }
          >
            {venueId ? "Update Venue" : "Create Venue"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
