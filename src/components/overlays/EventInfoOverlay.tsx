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
} from "lucide-react";
import Link from "next/link";
import { Event, Artist, getSocialMediaURLs } from "@/lib/types";
import { formatEventDate, formatTime } from "@/lib/utils/date-utils";
import { getArtistById } from "@/lib/services/artist-service";
import { getVenueById } from "@/lib/services/venue-service";
import { getDirectionsUrl, VenueData } from "@/lib/utils/mapLinks";
import ProfilePictureFetcher from "@/lib/utils/ProfilePictureFetcher";

interface EventInfoOverlayProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  position?: "map" | "list";
  verticalOffset?: number;
}

export default function EventInfoOverlay({
  event,
  isOpen,
  onClose,
  position = "map",
  verticalOffset = 50,
}: EventInfoOverlayProps) {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [venue, setVenue] = useState<VenueData | null>(null);
  // Flag to avoid repeated fetch attempts in overlay.
  const [hasFetched, setHasFetched] = useState(false);

  // Fetch artist data from the first artist ID.
  useEffect(() => {
    if (event.artistIds && event.artistIds.length > 0) {
      getArtistById(event.artistIds[0])
        .then((artistData) => setArtist(artistData))
        .catch((err) => console.error("Error fetching artist:", err));
    }
  }, [event.artistIds]);

  // Fetch venue data using event.venueId.
  useEffect(() => {
    if (event.venueId) {
      getVenueById(event.venueId)
        .then((venueData) => setVenue(venueData))
        .catch((err) => console.error("Error fetching venue:", err));
    }
  }, [event.venueId]);

  // Extract artist social URLs to possibly fetch a profile picture.
  const socialMediaURLs = artist ? getSocialMediaURLs(artist) : [];
  const fbURL = socialMediaURLs.find((s) => s.platform === "facebook")?.url;
  const igURL = socialMediaURLs.find((s) => s.platform === "instagram")?.url;

  // Format date/time.
  const eventDate = new Date(event.date);
  const formattedDate = formatEventDate(eventDate);
  const formattedTime = event.startTime ? formatTime(event.startTime) : "Time TBA";
  const endTime = event.endTime ? formatTime(event.endTime) : undefined;

  // Ticket price.
  const ticketPrice =
    event.ticketPrice &&
    event.ticketPrice.trim() !== "" &&
    parseFloat(event.ticketPrice) !== 0
      ? `£${event.ticketPrice}`
      : "£ree Entry";

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
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: `Check out this event: ${event.name} on ${formattedDate} at ${formattedTime} at ${event.venueName}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      console.log("Web Share API not supported.");
    }
  };

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
              {event.artistIds && event.artistIds.length > 0 && artist && (
                <Link
                  href={`/artists/${event.artistIds[0]}`}
                  className="group flex items-center gap-3 mb-3 transition-shadow duration-200 hover:shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                >
                  <div className="w-[3.125rem] h-[3.125rem] rounded-full overflow-hidden flex-shrink-0">
                    {artist.profileImageUrl ? (
                      <img
                        src={artist.profileImageUrl}
                        alt=""
                        className="object-cover w-full h-full"
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
                    {formattedTime}{endTime && ` - ${endTime}`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[var(--secondary)]/70" />
                  <Link
                    href={`/venues/${event.venueId}`}
                    className="group text-[var(--secondary)] font-medium transition-shadow duration-200 hover:shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                  >
                    {venue ? venue.name : event.venueName || "Unknown Venue"}
                  </Link>
                  {directionsUrl && (
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-[var(--foreground)]/70 text-xs hover:text-[var(--secondary)]"
                    >
                      Directions
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-yellow-500" />
                  <span className="text-[var(--foreground)]">{ticketPrice}</span>
                  {event.ticketUrl && (
                    <a
                      href={event.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-[var(--primary)] text-xs hover:underline"
                    >
                      Buy Tickets
                    </a>
                  )}
                </div>

                {event.eventUrl && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-[var(--foreground)]/70" />
                    <a
                      href={event.eventUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--primary)] text-xs hover:underline"
                    >
                      Event Details
                    </a>
                  </div>
                )}

                {event.description && (
                  <p className="mt-2 text-[var(--foreground)]/80 text-sm leading-snug">
                    {event.description}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="absolute bottom-2 right-2 p-2 rounded-full hover:shadow-[0_0_8px_rgba(0,0,0,0.3)] transition-shadow"
              aria-label="Share Event"
            >
              <Share2 className="w-5 h-5 text-[var(--foreground)]" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
