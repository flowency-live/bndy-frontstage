// src/app/artists/[artistId]/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import { getArtistById, updateArtist } from "@/lib/services/artist-service";
import { getEventsForArtist } from "@/lib/services/event-service";
import { Artist, Event, SocialMediaURL } from "@/lib/types";
import DetailHeader from "@/components/shared/VADetailHeader";
import VAEventsList from "@/components/shared/VAEventsList";
import EventInfoOverlay from "@/components/overlays/EventInfoOverlay";
import Link from "next/link";
import EditModeToggle from "@/components/shared/EditModeToggle";
import ClaimPageButton from "@/components/shared/ClaimPageButton";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Globe } from "lucide-react";
import { FaFacebook, FaInstagram, FaSpotify, FaYoutube } from "react-icons/fa";
import { XIcon } from "@/components/ui/icons/XIcon";
import { ArtistAddEventButton } from "@/components/events/ArtistAddEventButton";

function ArtistProfileContent() {
  const params = useParams();
  const artistId = params.artistId as string;
  
  // State for viewing mode
  const [artist, setArtist] = useState<Artist | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventOverlay, setShowEventOverlay] = useState(false);
  
  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Artist>>({});
  const [socialLinks, setSocialLinks] = useState<{
    website: string;
    facebook: string;
    instagram: string;
    spotify: string;
    youtube: string;
    x: string;
  }>({
    website: "",
    facebook: "",
    instagram: "",
    spotify: "",
    youtube: "",
    x: ""
  });
  const [genres, setGenres] = useState<string[]>([]);
  const [newGenre, setNewGenre] = useState("");

  useEffect(() => {
    if (!artistId) {
      setError("No artist ID provided");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const artistData = await getArtistById(artistId);
        if (!artistData) {
          setError(`Artist not found with ID: ${artistId}`);
          setLoading(false);
          return;
        }
        setArtist(artistData);
        
        // Initialize edit form data
        setEditFormData({
          name: artistData.name,
          description: artistData.description || "",
        });
        
        // Initialize genres
        setGenres(artistData.genres || []);
        
        // Initialize social links
        const links = {
          website: "",
          facebook: "",
          instagram: "",
          spotify: "",
          youtube: "",
          x: ""
        };
        
        if (artistData.socialMediaURLs && artistData.socialMediaURLs.length > 0) {
          artistData.socialMediaURLs.forEach(social => {
            links[social.platform] = social.url;
          });
        }
        
        setSocialLinks(links);

        const artistEvents = await getEventsForArtist(artistId);
        setEvents(artistEvents || []);
        setError(null);
      } catch (error) {
        console.error("Error fetching artist data:", error);
        setError(`Failed to load artist: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [artistId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  const handleAddGenre = () => {
    if (!newGenre.trim()) return;
    
    if (!genres.includes(newGenre.trim())) {
      setGenres(prev => [...prev, newGenre.trim()]);
    }
    
    setNewGenre("");
  };

  const handleRemoveGenre = (genreToRemove: string) => {
    setGenres(prev => prev.filter(genre => genre !== genreToRemove));
  };

  const handleSaveChanges = async () => {
    if (!artist) return;
    
    // Convert social links to the required format
    const socialMediaURLs: SocialMediaURL[] = Object.entries(socialLinks)
      .filter(([_, url]) => url.trim() !== "")
      .map(([platform, url]) => ({
        platform: platform as any,
        url: url.trim()
      }));
    
    // Prepare the updated artist data
    const updatedArtist: Artist = {
      ...artist,
      ...editFormData,
      genres,
      socialMediaURLs,
      updatedAt: new Date().toISOString()
    };
    
    // Save to the database
    await updateArtist(updatedArtist);
    
    // Update the local state
    setArtist(updatedArtist);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="animate-pulse text-center">Loading artist profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center text-red-500">
          <h1 className="text-2xl font-bold">Error</h1>
          <p className="mt-4">{error}</p>
          <Link href="/" className="text-[var(--primary)] hover:underline mt-4 inline-block">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Artist Not Found</h1>
          <p className="mt-4">The artist you're looking for doesn't exist or has been removed.</p>
          <Link href="/" className="text-[var(--primary)] hover:underline mt-4 inline-block">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

// Complete return part of the ArtistProfileContent component
return (
  <>
    <DetailHeader item={artist} type="artist" />
    <div className="container mx-auto pt-28 pb-20 px-4 overflow-y-auto max-h-screen">
      {/* Artist Bio/Description */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Artist Profile</h2>
          {/* Add ArtistAddEventButton here */}
          <ArtistAddEventButton 
            artist={artist} 
            className="px-4 py-2 rounded-md text-sm" 
          />
        </div>
             
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Artist Name
              </label>
              <Input
                id="name"
                name="name"
                value={editFormData.name || ""}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                value={editFormData.description || ""}
                onChange={handleInputChange}
                rows={5}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Genres
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {genres.map((genre, index) => (
                  <div 
                    key={index} 
                    className="px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full flex items-center gap-1"
                  >
                    <span>{genre}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGenre(genre)}
                      className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[var(--primary)]/20"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a genre (e.g., Rock, Jazz, Folk)"
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGenre();
                    }
                  }}
                />
                <button 
                  type="button" 
                  onClick={handleAddGenre}
                  className="px-4 py-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-md hover:bg-[var(--primary)]/20"
                >
                  Add
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Social Media
              </label>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="w-8 text-[#4F46E5]"><Globe className="w-5 h-5" /></span>
                  <Input
                    placeholder="Website URL"
                    value={socialLinks.website}
                    onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center">
                  <span className="w-8 text-[#1DB954]"><FaSpotify className="w-5 h-5" /></span>
                  <Input
                    placeholder="Spotify URL"
                    value={socialLinks.spotify}
                    onChange={(e) => handleSocialLinkChange('spotify', e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center">
                  <span className="w-8 text-[#1877F2]"><FaFacebook className="w-5 h-5" /></span>
                  <Input
                    placeholder="Facebook URL"
                    value={socialLinks.facebook}
                    onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center">
                  <span className="w-8 text-[#E4405F]"><FaInstagram className="w-5 h-5" /></span>
                  <Input
                    placeholder="Instagram URL"
                    value={socialLinks.instagram}
                    onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center">
                  <span className="w-8 text-[#FF0000]"><FaYoutube className="w-5 h-5" /></span>
                  <Input
                    placeholder="YouTube URL"
                    value={socialLinks.youtube}
                    onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center">
                  <span className="w-8 text-[#000000] dark:text-[#FFFFFF]"><XIcon className="w-5 h-5" /></span>
                  <Input
                    placeholder="X (Twitter) URL"
                    value={socialLinks.x}
                    onChange={(e) => handleSocialLinkChange('x', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[var(--foreground)]/80">
              {artist.description || "No description available for this artist."}
            </p>
            
            {artist.genres && artist.genres.length > 0 && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {artist.genres.map((genre, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full text-sm"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Events List */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
        {events.length > 0 ? (
          <VAEventsList
            events={events}
            contextType="artist"
            onSelectEvent={(event) => {
              setSelectedEvent(event);
              setShowEventOverlay(true);
            }}
          />
        ) : (
          <div className="py-6 text-center text-[var(--foreground)]/60 border-t border-[var(--foreground)]/10">
            <p>No upcoming events scheduled for this artist.</p>
          </div>
        )}
      </div>

      {/* Claim this page button */}
      <ClaimPageButton type="artist" id={artistId as string} />

      {/* Edit Mode Toggle */}
      <EditModeToggle
        type="artist"
        id={artistId as string}
        isEditing={isEditing}
        onEditModeChange={setIsEditing}
        onSave={handleSaveChanges}
      />

      {/* Event Info Overlay */}
      {selectedEvent && (
        <EventInfoOverlay
          event={selectedEvent}
          isOpen={showEventOverlay}
          onClose={() => {
            setShowEventOverlay(false);
            setSelectedEvent(null);
          }}
          position="list"
        />
      )}
    </div>
  </>
);
}

// Main component with Suspense
export default function ArtistProfilePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-12 px-4">
        <div className="animate-pulse text-center">Loading artist profile...</div>
      </div>
    }>
      <ArtistProfileContent />
    </Suspense>
  );
}
