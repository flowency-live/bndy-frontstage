"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getVenueById, updateVenue } from "@/lib/services/venue-service";
import { getEventsForVenue } from "@/lib/services/event-service";
import { Venue, Event, SocialMediaURL } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { MapIcon, ExternalLink, Globe, Facebook, Phone, Mail, XCircle, Plus, Ticket } from "lucide-react";
import VADetailHeader from "@/components/shared/VADetailHeader";
import VAEventsList from "@/components/shared/VAEventsList";
import EventInfoOverlay from "@/components/overlays/EventInfoOverlay";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EditModeToggle from "@/components/shared/EditModeToggle";
import ClaimPageButton from "@/components/shared/ClaimPageButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VenueAddEventButton } from "@/components/events/VenueAddEventButton";

function VenueProfileContent() {
  const params = useParams();
  const venueId = params.venueId as string;

  // State for viewing mode
  const [venue, setVenue] = useState<Venue | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventOverlay, setShowEventOverlay] = useState(false);
  const [activeTab, setActiveTab] = useState("events");

  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Venue>>({});
  const [socialLinks, setSocialLinks] = useState<{
    website: string;
    facebook: string;
  }>({
    website: "",
    facebook: ""
  });
  const [facilities, setFacilities] = useState<string[]>([]);
  const [newFacility, setNewFacility] = useState("");

  useEffect(() => {
    if (!venueId) {
      setError("No venue ID provided");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const venueData = await getVenueById(venueId);
        if (!venueData) {
          setError(`Venue not found with ID: ${venueId}`);
          setLoading(false);
          return;
        }
        setVenue(venueData);

        // Initialize edit form data
        setEditFormData({
          name: venueData.name,
          description: venueData.description || "",
          address: venueData.address || "",
          postcode: venueData.postcode || "",
          phone: venueData.phone || "",
          email: venueData.email || "",
          standardTicketed: venueData.standardTicketed || false,
          standardTicketInformation: venueData.standardTicketInformation || "",
          standardTicketUrl: venueData.standardTicketUrl || ""
        });

        // Initialize facilities
        setFacilities(venueData.facilities || []);

        // Initialize social links with existing values
        const links = {
          website: "",
          facebook: ""
        };

        if (venueData.socialMediaURLs && venueData.socialMediaURLs.length > 0) {
          venueData.socialMediaURLs.forEach(social => {
            if (social.platform === 'website' || social.platform === 'facebook') {
              links[social.platform] = social.url;
            }
          });
        }

        setSocialLinks(links);

        const venueEvents = await getEventsForVenue(venueId);
        setEvents(venueEvents || []);

        setError(null);
      } catch (error) {
        console.error("Error fetching venue data:", error);
        setError(`Failed to load venue: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [venueId]);

  const getGoogleMapsUrl = () => {
    if (!venue) return "#";
    const query = `${venue.name}, ${venue.address || ''} ${venue.postcode || ''}`.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setEditFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  const handleAddFacility = () => {
    if (!newFacility.trim()) return;

    if (!facilities.includes(newFacility.trim())) {
      setFacilities(prev => [...prev, newFacility.trim()]);
    }

    setNewFacility("");
  };

  const handleRemoveFacility = (facilityToRemove: string) => {
    setFacilities(prev => prev.filter(facility => facility !== facilityToRemove));
  };

  const handleHeaderChange = (field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileImageUpdate = (url: string) => {
    if (venue) {
      const updatedVenue = { ...venue, profileImageUrl: url };
      setVenue(updatedVenue);
    }
  };

  const handleSaveChanges = async () => {
    if (!venue) return;

    // Convert social links to the required format
    const socialMediaURLs: SocialMediaURL[] = Object.entries(socialLinks)
      .filter(([, url]) => url.trim() !== "")
      .map(([platform, url]) => ({
        platform: platform as "website" | "facebook",
        url: url.trim()
      }));

    // Prepare the updated venue data
    const updatedVenue: Venue = {
      ...venue,
      ...editFormData,
      facilities,
      socialMediaURLs,
      updatedAt: new Date().toISOString()
    };

    // Save to the database
    await updateVenue(updatedVenue);

    // Update the local state
    setVenue(updatedVenue);
    
    // Exit edit mode
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="animate-pulse text-center">Loading venue profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center text-red-500">
          <h1 className="text-2xl font-bold">Error</h1>
          <p className="mt-4">{error}</p>
          <Link href="/" className="text-[var(--secondary)] hover:underline mt-4 inline-block">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Venue Not Found</h1>
          <p className="mt-4">The venue you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/" className="text-[var(--secondary)] hover:underline mt-4 inline-block">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // Create social media URLs array for the header
  const headerSocialMediaURLs = Object.entries(socialLinks)
    .filter(([, url]) => url.trim() !== "")
    .map(([platform, url]) => ({
      platform: platform as "website" | "facebook",
      url
    }));

  return (
    <>
      {/* Profile Header */}
      <VADetailHeader
        item={venue}
        type="venue"
        isEditing={isEditing}
        onChange={handleHeaderChange}
        overrideSocialMediaURLs={isEditing ? headerSocialMediaURLs : undefined}
        onProfileImageUpdate={handleProfileImageUpdate}
      />

      <div className="container mx-auto pt-48 pb-32 px-4 overflow-visible">
        {/* Display "Ticketed Venue" if applicable, when not in edit mode */}
        {!isEditing && venue.standardTicketed && (
          <div className="mb-6 inline-flex items-center px-3 py-2 bg-[var(--secondary)]/10 text-[var(--secondary)] rounded-md">
            <Ticket className="w-4 h-4 mr-2" />
            <span className="font-medium">Ticketed Venue</span>
            {venue.standardTicketInformation && (
              <span className="ml-2 text-sm opacity-80">
                ({venue.standardTicketInformation})
              </span>
            )}
          </div>
        )}

        {/* Venue Info */}
        {venue.description && !isEditing && (
          <div className="mb-6">
            <p className="text-[var(--foreground)]/80">
              {venue.description}
            </p>
          </div>
        )}

        {/* Edit Form */}
        {isEditing && (
          <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto pr-1 pb-8">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                value={editFormData.description || ""}
                onChange={handleInputChange}
                rows={3}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Address
              </label>
              <Input
                id="address"
                name="address"
                value={editFormData.address || ""}
                onChange={handleInputChange}
                className="w-full"
                placeholder="Street address"
              />
            </div>

            <div>
              <label htmlFor="postcode" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Postcode
              </label>
              <Input
                id="postcode"
                name="postcode"
                value={editFormData.postcode || ""}
                onChange={handleInputChange}
                className="w-full"
                placeholder="Postcode"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Phone
                </label>
                <Input
                  id="phone"
                  name="phone"
                  value={editFormData.phone || ""}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  value={editFormData.email || ""}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>
            </div>

            {/* Ticketing Section - New addition */}
            <div className="border p-4 rounded-md border-[var(--secondary)]/30 bg-[var(--secondary)]/5">
              <h3 className="text-md font-medium mb-3 flex items-center">
                <Ticket className="w-4 h-4 mr-2 text-[var(--secondary)]" />
                Ticketing Information
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="standardTicketed" 
                    checked={editFormData.standardTicketed || false}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange("standardTicketed", checked as boolean)
                    }
                  />
                  <label 
                    htmlFor="standardTicketed" 
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    This is a ticketed venue
                  </label>
                </div>
                
                {editFormData.standardTicketed && (
                  <>
                    <div>
                      <label htmlFor="standardTicketInformation" className="block text-sm font-medium mb-1">
                        Ticket Details
                      </label>
                      <Input
                        id="standardTicketInformation"
                        name="standardTicketInformation"
                        value={editFormData.standardTicketInformation || ""}
                        onChange={handleInputChange}
                        className="w-full"
                        placeholder="e.g. £10 advance, £12 on the door"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="standardTicketUrl" className="block text-sm font-medium mb-1">
                        Ticket Website
                      </label>
                      <Input
                        id="standardTicketUrl"
                        name="standardTicketUrl"
                        type="url"
                        value={editFormData.standardTicketUrl || ""}
                        onChange={handleInputChange}
                        className="w-full"
                        placeholder="https://..."
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Social Media
              </label>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-[var(--foreground)]/70" />
                  <Input
                    placeholder="Website URL"
                    value={socialLinks.website}
                    onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center">
                  <Facebook className="w-5 h-5 mr-2 text-[var(--foreground)]/70" />
                  <Input
                    placeholder="Facebook URL"
                    value={socialLinks.facebook}
                    onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Facilities
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {facilities.map((facility, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 bg-[var(--secondary)]/10 text-[var(--secondary)] rounded-full flex items-center gap-1"
                  >
                    <span>{facility}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFacility(facility)}
                      className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[var(--secondary)]/20"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a facility (e.g., Parking, Food, Sound System)"
                  value={newFacility}
                  onChange={(e) => setNewFacility(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFacility();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddFacility}
                  className="px-4 py-2 bg-[var(--secondary)]/10 text-[var(--secondary)] rounded-md hover:bg-[var(--secondary)]/20"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contact Information (Only when not editing) */}
        {!isEditing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {(venue.phone || venue.email) && (
              <div>
                <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">Contact</h3>
                {venue.phone && (
                  <div className="flex items-center text-sm text-[var(--foreground)]/70 mb-1">
                    <Phone className="w-4 h-4 mr-2 text-[var(--secondary)]" />
                    <span>{venue.phone}</span>
                  </div>
                )}
                {venue.email && (
                  <div className="flex items-center text-sm text-[var(--foreground)]/70">
                    <Mail className="w-4 h-4 mr-2 text-[var(--secondary)]" />
                    <span>{venue.email}</span>
                  </div>
                )}
              </div>
            )}

            {/* Facilities */}
            {venue.facilities && venue.facilities.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">Facilities</h3>
                <div className="flex flex-wrap gap-2">
                  {venue.facilities.map((facility, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[var(--secondary)]/10 text-[var(--secondary)] rounded-full text-sm"
                    >
                      {facility}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs for Events and Map - Only visible when not editing */}
        {!isEditing && (
          <Tabs defaultValue="events" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="map">Map</TabsTrigger>
              </TabsList>

              {/* Create Event Button */}
              {venue && (
                <VenueAddEventButton
                  venue={venue}
                  className="px-4 py-2 rounded-md text-sm bg-[var(--secondary)] text-white hover:bg-[var(--secondary)]/90"
                />
              )}
            </div>

            {/* Events Tab */}
            <TabsContent value="events" className="max-h-[60vh] overflow-y-auto pr-1">
              {events.length > 0 ? (
                <VAEventsList
                  events={events}
                  contextType="venue"
                  onSelectEvent={(event) => {
                    setSelectedEvent(event);
                    setShowEventOverlay(true);
                  }}
                />
              ) : (
                <div className="py-6 text-center text-[var(--foreground)]/60">
                  <p>No upcoming events scheduled at this venue.</p>
                </div>
              )}
            </TabsContent>

            {/* Map Tab */}
            <TabsContent value="map" className="max-h-[60vh] overflow-y-auto pr-1">
              <Card className="p-4">
                <div className="aspect-video relative rounded-md overflow-hidden">
                  {venue.location ? (
                    <iframe
                      title={`Map of ${venue.name}`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(
                        `${venue.name}, ${venue.address || ''} ${venue.postcode || ''}`.trim()
                      )}`}
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
                      <p className="text-[var(--foreground)]/70">No location data available</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <a
                    href={getGoogleMapsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-[var(--secondary)] hover:underline"
                  >
                    <MapIcon className="w-4 h-4 mr-1" />
                    Open in Google Maps
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* When in edit mode and there are events, show a simple list */}
        {isEditing && events.length > 0 && (
          <div className="mt-4 mb-6">
            <h3 className="text-lg font-medium mb-2">Upcoming Events</h3>
            <p className="text-sm text-[var(--foreground)]/70 mb-4">
              This venue has {events.length} upcoming events. Exit edit mode to view and manage events.
            </p>
          </div>
        )}

        {/* Bottom Controls - always visible */}
        <div className="mt-6 sticky bottom-4 bg-[var(--background)] bg-opacity-95 p-4 rounded-lg border border-[var(--border)] shadow-md z-10">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
            <ClaimPageButton type="venue" id={venueId as string} />
            <EditModeToggle
              type="venue"
              id={venueId as string}
              isEditing={isEditing}
              onEditModeChange={setIsEditing}
              onSave={handleSaveChanges}
            />
          </div>
        </div>

        {/* Event Info Overlay */}
        {selectedEvent && (
          <EventInfoOverlay
            events={[selectedEvent]}
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

// The Page component
export default function VenueProfilePage() {
  return (
    <React.Suspense fallback={
      <div className="container mx-auto py-12 px-4">
        <div className="animate-pulse text-center">Loading venue profile...</div>
      </div>
    }>
      <VenueProfileContent />
    </React.Suspense>
  );
}
