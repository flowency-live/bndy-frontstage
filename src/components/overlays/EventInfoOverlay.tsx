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
  Map
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
  verticalOffset = 50,
}: EventInfoOverlayProps) {
  // Track which event in the list is being shown.
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentEvent = events[currentIndex];

  const [artist, setArtist] = useState<Artist | null>(null);
  const [venue, setVenue] = useState<VenueData | null>(null);
  // Flag to avoid repeated fetch attempts in overlay.
  const [hasFetched, setHasFetched] = useState(false);

  const isOpenMic = currentEvent?.isOpenMic || false;

  // When the current event changes, fetch associated artist data.
  useEffect(() => {
    if (!currentEvent) return;

    // For open mic events without a host, skip artist fetching
    if (isOpenMic && (!currentEvent.artistIds || currentEvent.artistIds.length === 0)) {
      setArtist(null);
      return;
    }

    if (currentEvent.artistIds && currentEvent.artistIds.length > 0) {
      getArtistById(currentEvent.artistIds[0])
        .then((artistData) => setArtist(artistData))
        .catch((err) => console.error("Error fetching artist:", err));
    } else {
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
      console.log("Web Share API not supported.");
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
                            console.log("Overlay: Host artist image failed; reverting to Open Mic icon.");
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
                          console.log("Overlay: Fetched profile picture URL:", url);
                          setArtist({ ...artist, profileImageUrl: url });
                          setHasFetched(true);
                        }}
                      />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-[var(--foreground)] font-semibold text-sm leading-tight">
                      Open Mic{artist ? ` with ${artist.name}` : ''}
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
                // Regular Artist Header
                currentEvent.artistIds && currentEvent.artistIds.length > 0 && artist && (
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
                            console.log("Overlay: Profile image failed; reverting to icon.");
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
                            console.log("Overlay: Fetched profile picture URL:", url);
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
