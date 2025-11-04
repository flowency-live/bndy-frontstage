"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  Ticket,
  ExternalLink,
  Music,
  CalendarDays,
  Share2,
  Mic,
  Map,
} from "lucide-react";
import Link from "next/link";
import { Event, Artist, getSocialMediaURLs } from "@/lib/types";
import { formatEventDate, formatTime } from "@/lib/utils/date-utils";
import { getArtistById } from "@/lib/services/artist-service";
import { getVenueById } from "@/lib/services/venue-service";
import { getDirectionsUrl, VenueData } from "@/lib/utils/mapLinks";
import ProfilePictureFetcher from "@/lib/utils/ProfilePictureFetcher";
import Image from "next/image";

interface EventInfoOverlayProps {
  events: Event[];
  isOpen: boolean;
  onClose: () => void;
  position?: "map" | "list";
  verticalOffset?: number;
}

export default function EventInfoOverlay({
  events,
  isOpen,
  onClose,
  position = "map",
}: EventInfoOverlayProps) {
  // Track which event in the list is being shown.
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentEvent = events[currentIndex];

  const [artist, setArtist] = useState<Artist | null>(null);
  const [venue, setVenue] = useState<VenueData | null>(null);
  // Flag to avoid repeated fetch attempts in overlay.
  const [hasFetched, setHasFetched] = useState(false);

  const isOpenMic = currentEvent?.isOpenMic || false;

  // Reset artist and hasFetched state when currentIndex or currentEvent changes
  useEffect(() => {
    if (!currentEvent) return;
    // Reset artist data and fetch state when navigating to a different event
    setArtist(null);
    setHasFetched(false);
  }, [currentIndex, currentEvent]);

  // When the current event changes, fetch associated artist data.
  useEffect(() => {
    console.log("🎵 EventInfoOverlay: Artist fetch effect triggered");
    console.log("🎵 Current event:", currentEvent);
    console.log("🎵 Is open mic:", isOpenMic);
    
    if (!currentEvent) {
      console.log("🎵 No current event, returning");
      return;
    }

    // Log all event properties to see what's available
    console.log("🎵 Event properties:", Object.keys(currentEvent));
    console.log("🎵 Event artistIds:", currentEvent.artistIds);
    console.log("🎵 Event band field:", (currentEvent as any).band);
    console.log("🎵 Event name:", currentEvent.name);
    console.log("🎵 Event venueName:", currentEvent.venueName);

    // For open mic events without a host, skip artist fetching
    if (isOpenMic && (!currentEvent.artistIds || currentEvent.artistIds.length === 0)) {
      console.log("🎵 Open mic without host, setting artist to null");
      setArtist(null);
      return;
    }

    // Check for artistIds first (new format)
    if (currentEvent.artistIds && currentEvent.artistIds.length > 0) {
      console.log("🎵 Found artistIds, fetching artist:", currentEvent.artistIds[0]);
      getArtistById(currentEvent.artistIds[0])
        .then((artistData) => {
          console.log("🎵 Artist data fetched:", artistData);
          setArtist(artistData);
        })
        .catch((err) => {
          console.error("🎵 Error fetching artist:", err);
          setArtist(null);
        });
    } 
    // Check for legacy 'band' field or other potential artist fields
    else if ((currentEvent as any).band) {
      const bandName = (currentEvent as any).band;
      console.log("🎵 Found legacy band field:", bandName);
      // Handle legacy 'band' field - try to fetch by name or create a mock artist
      const mockArtist = {
        id: `legacy-${bandName.toLowerCase().replace(/\s+/g, '-')}`,
        name: bandName,
        createdAt: '',
        updatedAt: ''
      };
      console.log("🎵 Created mock artist from band:", mockArtist);
      setArtist(mockArtist);
    }
    // Check if the event name itself might be the artist name (for legacy events)
    else if (currentEvent.name && currentEvent.name !== currentEvent.venueName) {
      console.log("🎵 Using event name as artist name:", currentEvent.name);
      // Create a mock artist from the event name
      const mockArtist = {
        id: `event-artist-${currentEvent.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: currentEvent.name,
        createdAt: '',
        updatedAt: ''
      };
      console.log("🎵 Created mock artist from event name:", mockArtist);
      setArtist(mockArtist);
    }
    else {
      console.log("🎵 No artist data found, setting to null");
      setArtist(null);
    }
  }, [currentEvent, isOpenMic]);

  // When the current event changes, fetch venue data.
  useEffect(() => {
    if (currentEvent?.venueId) {
      getVenueById(currentEvent.venueId)
        .then((venueData) => setVenue(venueData))
        .catch((err) => console.error("Error fetching venue:", err));
    }
  }, [currentEvent?.venueId]);

  // Extract artist social URLs to possibly fetch a profile picture.
  const socialMediaURLs = artist ? getSocialMediaURLs(artist) : [];
  const fbURL = socialMediaURLs.find((s) => s.platform === "facebook")?.url;
  const igURL = socialMediaURLs.find((s) => s.platform === "instagram")?.url;

  // Format date/time.
  const eventDate = currentEvent ? new Date(currentEvent.date) : new Date();
  const formattedDate = formatEventDate(eventDate);
  const formattedTime = currentEvent?.startTime ? formatTime(currentEvent.startTime) : "Time TBA";
  const endTime = currentEvent?.endTime ? formatTime(currentEvent.endTime) : undefined;

  // Check if event is today.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = eventDate.getTime() === today.getTime();

  // Generate directions URL.
  const directionsUrl = venue ? getDirectionsUrl(venue) : "";

  // Define the outer overlay container styles.
  const overlayStyles =
    position === "map"
      ? "fixed top-0 left-0 w-full h-full z-50 flex items-center justify-center backdrop-blur-sm"
      : "fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm";

  // Placeholder share function.
  const handleShare = async () => {
    if (!currentEvent) return;

    if (navigator.share) {
      try {
        const eventTitle = isOpenMic && artist
          ? `Open Mic with ${artist.name}`
          : isOpenMic
            ? "Open Mic"
            : currentEvent.name;

        await navigator.share({
          title: eventTitle,
          text: `Check out this event: ${eventTitle} on ${formattedDate} at ${formattedTime} at ${currentEvent.venueName}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {

    }
  };

  // Handlers for cycling events.
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % events.length);
  };

  if (!currentEvent) return null;

  // Debug logging for render
  console.log("🎵 EventInfoOverlay rendering:");
  console.log("🎵 Current event:", currentEvent?.name);
  console.log("🎵 Artist state:", artist);
  console.log("🎵 Is open mic:", isOpenMic);
  console.log("🎵 Has artistIds:", currentEvent?.artistIds);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={overlayStyles} onClick={onClose}>
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-[320px] bg-[var(--background)] rounded-lg shadow-lg border border-[var(--border)]"
            style={{ boxShadow: "0 4px 10px rgba(0,0,0,0.15)" }}
          >
            <div className="absolute top-0 left-0 h-full w-1 bg-[var(--primary)] rounded-tl-lg rounded-bl-lg" />

            <div className="p-4 pl-6">
              {/* DEBUG: Visible debug info */}
              <div className="mb-2 p-2 bg-red-100 text-red-800 text-xs rounded">
                <div>DEBUG - Event: {currentEvent?.name}</div>
                <div>Artist IDs: {JSON.stringify(currentEvent?.artistIds)}</div>
                <div>Band field: {JSON.stringify((currentEvent as any)?.band)}</div>
                <div>Artist state: {artist ? artist.name : 'null'}</div>
                <div>Is Open Mic: {isOpenMic ? 'yes' : 'no'}</div>
              </div>
              
              {isOpenMic ? (
                // Open Mic Header
                <div className="group flex items-center gap-3 mb-3">
                  <div className="w-[3.125rem] h-[3.125rem] rounded-full overflow-hidden flex-shrink-0">
                    {artist && artist.profileImageUrl ? (
                      // Show host artist image if available
                      <div className="relative w-full h-full">
                        <Image
                          src={artist.profileImageUrl}
                          alt=""
                          className="object-cover"
                          fill
                          onError={() => {
                            setArtist({ ...artist, profileImageUrl: "" });
                            setHasFetched(true);
                          }}
                        />
                        <div className="absolute bottom-0 right-0 bg-[var(--primary)] rounded-full p-1">
                          <Mic className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    ) : (
                      // Use generic Open Mic image
                      <div className="relative w-full h-full flex items-center justify-center bg-[var(--primary-translucent)]">
                        <Image
                          src="/openmic.png"
                          alt="Open Mic"
                          width={50}
                          height={50}
                          className="object-contain p-1"
                        />
                      </div>
                    )}
                    {!artist?.profileImageUrl && artist && !hasFetched && (
                      <ProfilePictureFetcher
                        facebookUrl={fbURL}
                        instagramUrl={igURL}
                        onPictureFetched={(url) => {
                          setArtist({ ...artist, profileImageUrl: url });
                          setHasFetched(true);
                        }}
                      />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-[var(--foreground)] font-semibold text-sm leading-tight">
                      Open Mic{artist ? ` with ${artist.name}` : ""}
                    </h2>
                    {artist && (
                      <Link
                        href={`/artists/${artist.id}`}
                        className="text-xs text-[var(--primary)] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View host artist
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                // Regular Artist Header - show if we have artist data (including legacy/mock artists)
                artist && (
                  // Only make it a link if we have a real artistId, otherwise just show as text
                  (currentEvent.artistIds && currentEvent.artistIds.length > 0) ? (
                    <Link
                      href={`/artists/${currentEvent.artistIds[0]}`}
                      className="group flex items-center gap-3 mb-3 transition-shadow duration-200 hover:shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                    >
                    <div className="w-[3.125rem] h-[3.125rem] rounded-full overflow-hidden flex-shrink-0">
                      {artist.profileImageUrl ? (
                        <Image
                          src={artist.profileImageUrl}
                          alt=""
                          className="object-cover w-full h-full"
                          width={50}
                          height={50}
                          onError={() => {
                            setArtist({ ...artist, profileImageUrl: "" });
                            setHasFetched(true);
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[var(--primary-translucent)]">
                          <Music className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                      )}
                      {!artist.profileImageUrl && !hasFetched && (
                        <ProfilePictureFetcher
                          facebookUrl={fbURL}
                          instagramUrl={igURL}
                          onPictureFetched={(url) => {
                            setArtist({ ...artist, profileImageUrl: url });
                            setHasFetched(true);
                          }}
                        />
                      )}
                    </div>
                      <div className="flex flex-col">
                        {artist.name && (
                          <h2 className="text-[var(--foreground)] font-semibold text-sm leading-tight">
                            {artist.name}
                          </h2>
                        )}
                        <span className="text-xs text-[var(--primary)]">(view artist)</span>
                      </div>
                    </Link>
                  ) : (
                    // Non-clickable artist display for legacy events without artistIds
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-[3.125rem] h-[3.125rem] rounded-full overflow-hidden flex-shrink-0">
                        {artist.profileImageUrl ? (
                          <Image
                            src={artist.profileImageUrl}
                            alt=""
                            className="object-cover w-full h-full"
                            width={50}
                            height={50}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[var(--primary-translucent)]">
                            <Music className="w-5 h-5 text-[var(--primary)]" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        {artist.name && (
                          <h2 className="text-[var(--foreground)] font-semibold text-sm leading-tight">
                            {artist.name}
                          </h2>
                        )}
                        <span className="text-xs text-[var(--foreground)]/60">(artist)</span>
                      </div>
                    </div>
                  )
                )
              )}

              <div className="h-px bg-[var(--border)] mb-3" />

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[var(--foreground)]/70" />
                  <span className="text-[var(--foreground)]">{formattedDate}</span>
                  {isToday && (
                    <div className="ml-auto inline-block px-2 py-1 bg-yellow-300 text-yellow-800 text-xs font-bold rounded-full animate-pulse">
                      Today
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--foreground)]/70" />
                  <span className="text-[var(--foreground)]">
                    {formattedTime}
                    {endTime && ` - ${endTime}`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[var(--secondary)]/70" />
                  <Link
                    href={`/venues/${currentEvent.venueId}`}
                    className="group text-[var(--secondary)] font-medium transition-shadow duration-200 hover:shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                  >
                    {venue ? venue.name : currentEvent.venueName || "Unknown Venue"}
                  </Link>
                  {directionsUrl && (
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-[var(--secondary)] hover:opacity-80"
                      aria-label="Open in Maps"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Map className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Ticket Information - Only show if event is ticketed */}
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-yellow-500" />
                  {currentEvent.ticketed ? (
                    <>
                      <span className="text-[var(--foreground)]">
                        {currentEvent.ticketinformation || "Ticketed"}
                      </span>
                      {currentEvent.ticketUrl && (
                        <a
                          href={currentEvent.ticketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-[var(--primary)] text-xs hover:underline"
                        >
                          Buy Tickets
                        </a>
                      )}
                    </>
                  ) : (
                    <span className="text-[var(--foreground)]">£ree entry</span>
                  )}
                </div>

                {currentEvent.eventUrl && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-[var(--foreground)]/70" />
                    <a
                      href={currentEvent.eventUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--primary)] text-xs hover:underline"
                    >
                      Event Details
                    </a>
                  </div>
                )}

                {currentEvent.description && (
                  <p className="mt-2 text-[var(--foreground)]/80 text-sm leading-snug">
                    {currentEvent.description}
                  </p>
                )}
              </div>
            </div>

            {/* Move the share icon to the top-right to avoid interfering with navigation buttons. */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="absolute top-2 right-2 p-2 rounded-full hover:shadow-[0_0_8px_rgba(0,0,0,0.3)] transition-shadow"
              aria-label="Share Event"
            >
              <Share2 className="w-5 h-5 text-[var(--foreground)]" />
            </button>

            {/* Navigation controls if there is more than one event */}
            {events.length > 1 && (
              <div className="flex justify-between p-4 border-t border-[var(--border)]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="px-3 py-1 text-sm font-medium bg-[var(--primary)] text-white rounded"
                >
                  Previous
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="px-3 py-1 text-sm font-medium bg-[var(--primary)] text-white rounded"
                >
                  Next
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
