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
  Mic,
  Map,
} from "lucide-react";
import Link from "next/link";
import { Event, getSocialMediaURLs } from "@/lib/types";
import { formatEventDate, formatTime } from "@/lib/utils/date-utils";
import { getVenueById } from "@/lib/services/venue-service";
import { useArtist } from "@/hooks/useArtist";
import { getDirectionsUrl, VenueData } from "@/lib/utils/mapLinks";
import ProfilePictureFetcher from "@/lib/utils/ProfilePictureFetcher";
import Image from "next/image";
import SocialShareButton from "@/components/shared/SocialShareButton";
import { Architects_Daughter } from "next/font/google";

const architectsDaughter = Architects_Daughter({
  weight: "400",
  subsets: ["latin"],
});

// Theme configurations for 5 different overlay designs
interface OverlayTheme {
  name: string;
  background: string;
  borderClass: string;
  borderStyle?: React.CSSProperties;
  artistColorClass: string;
  venueColorClass: string;
  textColorClass: string;
  freeColorClass: string;
  todayBadgeClass: string;
  separatorClass: string;
  iconColorClass: string;
  navButtonClass: string;
  useFont: boolean;
  dateColorClass?: string;
  timeColorClass?: string;
}

const overlayThemes: OverlayTheme[] = [
  // 1. Chalkboard
  {
    name: "chalkboard",
    background: "linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%)",
    borderClass: "border-4 border-amber-600",
    artistColorClass: "text-orange-400 hover:text-orange-300",
    venueColorClass: "text-cyan-400 hover:text-cyan-300",
    textColorClass: "text-white",
    freeColorClass: "text-green-400",
    todayBadgeClass: "bg-yellow-400 text-slate-900",
    separatorClass: "bg-white/20",
    iconColorClass: "text-white/80",
    navButtonClass: "bg-white/20 text-white hover:bg-white/30",
    useFont: true,
  },
  // 2. Neon Sign
  {
    name: "neon",
    background: "linear-gradient(135deg, #000000 0%, #0a0a0a 100%)",
    borderClass: "border-4 border-orange-500",
    borderStyle: { boxShadow: "0 0 20px rgba(249, 115, 22, 0.8), inset 0 0 20px rgba(249, 115, 22, 0.2)" },
    artistColorClass: "text-orange-500 hover:text-orange-400",
    venueColorClass: "text-cyan-400 hover:text-cyan-300",
    textColorClass: "text-white",
    freeColorClass: "text-lime-400",
    todayBadgeClass: "bg-[#ff0080] text-white",
    separatorClass: "bg-orange-500/30",
    iconColorClass: "text-white",
    navButtonClass: "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/50",
    useFont: false,
    // Neon-specific colors for date/time
    dateColorClass: "text-[#ff0080]",
    timeColorClass: "text-[#ffff00]",
  },
  // 3. Vintage Gig Poster
  {
    name: "poster",
    background: "linear-gradient(135deg, #4a1a1a 0%, #6b2020 50%, #4a1a1a 100%)",
    borderClass: "border-8 border-orange-600",
    artistColorClass: "text-orange-400 hover:text-orange-300",
    venueColorClass: "text-cyan-400 hover:text-cyan-300",
    textColorClass: "text-white",
    freeColorClass: "text-green-400",
    todayBadgeClass: "bg-red-600 text-white",
    separatorClass: "bg-orange-500/50",
    iconColorClass: "text-orange-300",
    navButtonClass: "bg-orange-600 text-white hover:bg-orange-700",
    useFont: true,
  },
  // 4. Concert Ticket
  {
    name: "ticket",
    background: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)",
    borderClass: "border-2 border-white/30",
    borderStyle: {
      borderStyle: "dashed",
      boxShadow: "0 4px 15px rgba(0,0,0,0.5)"
    },
    artistColorClass: "text-orange-400 hover:text-orange-300",
    venueColorClass: "text-cyan-400 hover:text-cyan-300",
    textColorClass: "text-white/90",
    freeColorClass: "text-green-400",
    todayBadgeClass: "bg-yellow-400 text-black",
    separatorClass: "bg-white/20",
    iconColorClass: "text-white/70",
    navButtonClass: "bg-white/10 text-white hover:bg-white/20 border border-white/30",
    useFont: false,
  },
  // 5. Minimal Swiss
  {
    name: "minimal",
    background: "linear-gradient(135deg, #0a0a0a 0%, #0f0f0f 100%)",
    borderClass: "border border-white/40",
    artistColorClass: "text-white hover:text-white/80",
    venueColorClass: "text-cyan-400 hover:text-cyan-300 underline",
    textColorClass: "text-white/80",
    freeColorClass: "text-white",
    todayBadgeClass: "bg-white text-black",
    separatorClass: "bg-white/10",
    iconColorClass: "text-white/50",
    navButtonClass: "bg-transparent text-white hover:bg-white/5 border border-white/20",
    useFont: false,
  },
];

// Get a random theme from the available themes
function getRandomTheme(): OverlayTheme {
  const randomIndex = Math.floor(Math.random() * overlayThemes.length);
  return overlayThemes[randomIndex];
}

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

  // Select a random theme when overlay opens
  const [theme] = useState<OverlayTheme>(() => getRandomTheme());

  const [venue, setVenue] = useState<VenueData | null>(null);
  // Flag to avoid repeated fetch attempts in overlay.
  const [hasFetched, setHasFetched] = useState(false);
  // State to store fetched profile picture URL
  const [fetchedProfilePicture, setFetchedProfilePicture] = useState<string | null>(null);
  
  // Get artist ID from current event
  const artistId = currentEvent?.artistIds?.[0];
  
  // Use the DynamoDB-based artist hook
  const { data: artist, isLoading: artistLoading, error: artistError } = useArtist(artistId);
  
  // Debug logging to understand loading issues
  useEffect(() => {
    if (artistId) {

    }
  }, [artistId, artistLoading, artistError, artist]);

  const isOpenMic = currentEvent?.isOpenMic || false;

  // Reset hasFetched state when currentIndex or currentEvent changes
  useEffect(() => {
    if (!currentEvent) return;
    setHasFetched(false);
    setFetchedProfilePicture(null);
  }, [currentIndex, currentEvent]);

  // Artist data is now fetched via useArtist hook

  // When the current event changes, fetch venue data.
  useEffect(() => {
    if (currentEvent?.venueId) {
      getVenueById(currentEvent.venueId)
        .then((venueData) => setVenue(venueData))
        .catch((err) => console.error("Error fetching venue:", err));
    }
  }, [currentEvent?.venueId]);

  // Extract artist social URLs to possibly fetch a profile picture.
  const socialMediaUrls = artist ? getSocialMediaURLs(artist) : [];
  const fbURL = socialMediaUrls.find((s) => s.platform === "facebook")?.url;
  const igURL = socialMediaUrls.find((s) => s.platform === "instagram")?.url;
  
  // Use fetched profile picture if available, otherwise use artist's profileImageUrl
  const displayProfileImageUrl = fetchedProfilePicture || artist?.profileImageUrl;

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

  // Generate share data for the event
  const getShareData = () => {
    if (!currentEvent) return { title: '', text: '' };

    const eventTitle = isOpenMic && artist
      ? `Open Mic with ${artist.name}`
      : isOpenMic
        ? "Open Mic"
        : currentEvent.name;

    return {
      title: `${eventTitle} | bndy`,
      text: `Check out this event: ${eventTitle} on ${formattedDate} at ${formattedTime} at ${currentEvent.venueName}`,
    };
  };

  // Handlers for cycling events.
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % events.length);
  };

  if (!currentEvent) return null;

  // Apply neon glow effect for neon theme
  const getNeonStyle = (color: string) => {
    if (theme.name === "neon") {
      return {
        textShadow: `0 0 10px ${color}, 0 0 20px ${color}, 0 0 30px ${color}`,
      };
    }
    return {};
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={overlayStyles} onClick={onClose}>
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotate: 2 }}
            className={`relative w-[340px] rounded-lg shadow-2xl ${theme.borderClass} ${theme.useFont ? architectsDaughter.className : ''}`}
            style={{
              background: theme.background,
              boxShadow: theme.borderStyle?.boxShadow || "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
              ...(theme.borderStyle?.borderStyle && { borderStyle: theme.borderStyle.borderStyle }),
            }}
          >

            <div className="p-5">

              {/* Artist Profile Picture and Name */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/30 shadow-lg">
                  {isOpenMic ? (
                    artist && displayProfileImageUrl ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={displayProfileImageUrl}
                          alt=""
                          className="object-cover"
                          fill
                          onError={() => setHasFetched(true)}
                        />
                        <div className="absolute bottom-0 right-0 bg-orange-500 rounded-full p-1">
                          <Mic className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center bg-slate-600">
                        <Image
                          src="/openmic.png"
                          alt="Open Mic"
                          width={50}
                          height={50}
                          className="object-contain p-1"
                        />
                      </div>
                    )
                  ) : (
                    displayProfileImageUrl ? (
                      <Image
                        src={displayProfileImageUrl}
                        alt=""
                        className="object-cover w-full h-full"
                        width={64}
                        height={64}
                        onError={() => setHasFetched(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-600">
                        <Music className="w-6 h-6 text-orange-400" />
                      </div>
                    )
                  )}
                  {!displayProfileImageUrl && artist && !hasFetched && (
                    <ProfilePictureFetcher
                      facebookUrl={fbURL}
                      instagramUrl={igURL}
                      onPictureFetched={(url) => {
                        setFetchedProfilePicture(url);
                        setHasFetched(true);
                      }}
                    />
                  )}
                </div>

                <div className="flex-1">
                  {isOpenMic ? (
                    <div>
                      <h2 className={`${theme.textColorClass} text-xl mb-1`}>
                        Open Mic
                      </h2>
                      {artist && currentEvent.artistIds?.[0] && (
                        <Link
                          href={`/artists/${currentEvent.artistIds[0]}`}
                          className={`${theme.artistColorClass} text-lg inline-block transform hover:scale-105 transition-transform`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ transform: "rotate(-1deg)", ...getNeonStyle("rgba(249, 115, 22, 0.8)") }}
                        >
                          with {artist.name}
                        </Link>
                      )}
                    </div>
                  ) : (
                    artist && (
                      (currentEvent.artistIds && currentEvent.artistIds.length > 0) ? (
                        <Link
                          href={`/artists/${currentEvent.artistIds[0]}`}
                          className={`${theme.artistColorClass} text-2xl font-bold inline-block transform hover:scale-105 transition-transform`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ transform: "rotate(-1deg)", ...getNeonStyle("rgba(249, 115, 22, 0.8)") }}
                        >
                          {artist.name}
                        </Link>
                      ) : (
                        <h2 className={`${theme.artistColorClass} text-2xl font-bold`} style={{ transform: "rotate(-1deg)", ...getNeonStyle("rgba(249, 115, 22, 0.8)") }}>
                          {artist.name}
                        </h2>
                      )
                    )
                  )}
                </div>
              </div>

              <div className={`h-px ${theme.separatorClass} mb-4`} style={{
                backgroundImage: theme.name === "chalkboard" ? "repeating-linear-gradient(90deg, white 0, white 4px, transparent 4px, transparent 8px)" : undefined
              }} />

              <div className="space-y-3 text-base">
                {/* Date */}
                <div className="flex items-center gap-3">
                  <CalendarDays className={`w-5 h-5 ${theme.dateColorClass || theme.iconColorClass}`} />
                  <span className={`${theme.dateColorClass || theme.textColorClass} text-lg font-bold`} style={theme.name === "neon" ? getNeonStyle("rgba(255, 0, 128, 0.8)") : {}}>
                    {formattedDate}
                  </span>
                  {isToday && (
                    <div className={`ml-auto inline-block px-2 py-1 ${theme.todayBadgeClass} text-sm font-bold rounded transform -rotate-2`}>
                      Today!
                    </div>
                  )}
                </div>

                {/* Time */}
                <div className="flex items-center gap-3">
                  <Clock className={`w-5 h-5 ${theme.timeColorClass || theme.iconColorClass}`} />
                  <span className={`${theme.timeColorClass || theme.textColorClass} text-lg font-bold`} style={theme.name === "neon" ? getNeonStyle("rgba(255, 255, 0, 0.8)") : {}}>
                    {formattedTime}
                    {endTime && ` - ${endTime}`}
                  </span>
                </div>

                {/* Venue */}
                <div className="flex items-center gap-3">
                  <MapPin className={`w-5 h-5 ${theme.venueColorClass}`} />
                  <div className="flex-1 flex items-center gap-2">
                    <Link
                      href={`/venues/${currentEvent.venueId}`}
                      className={`${theme.venueColorClass} text-lg font-medium inline-block transform hover:scale-105 transition-transform`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ transform: "rotate(0.5deg)", ...getNeonStyle("rgba(34, 211, 238, 0.8)") }}
                    >
                      {venue ? venue.name : currentEvent.venueName || "Unknown Venue"}
                    </Link>
                    {directionsUrl && (
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={theme.venueColorClass}
                        aria-label="Open in Maps"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Map className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Ticket Information */}
                <div className="flex items-center gap-3">
                  <Ticket className={`w-5 h-5 ${theme.freeColorClass}`} />
                  {currentEvent.ticketed ? (
                    <div className="flex-1 flex items-center justify-between">
                      <span className={`${theme.textColorClass} text-lg`}>
                        {currentEvent.ticketinformation || "Ticketed"}
                      </span>
                      {currentEvent.ticketUrl && (
                        <a
                          href={currentEvent.ticketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${theme.freeColorClass} text-sm hover:opacity-80 underline`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Buy Tickets
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className={`${theme.freeColorClass} text-lg font-bold transform -rotate-1 inline-block`} style={theme.name === "neon" ? getNeonStyle("rgba(190, 242, 100, 0.8)") : {}}>Free</span>
                  )}
                </div>

                {/* Event URL */}
                {currentEvent.eventUrl && (
                  <div className="flex items-center gap-3">
                    <ExternalLink className={`w-5 h-5 ${theme.iconColorClass}`} />
                    <a
                      href={currentEvent.eventUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${theme.textColorClass} text-sm hover:opacity-80 underline`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Event Details
                    </a>
                  </div>
                )}

                {/* Description */}
                {currentEvent.description && (
                  <p className={`mt-3 ${theme.textColorClass} opacity-90 text-sm leading-relaxed pt-3 border-t ${theme.separatorClass}`}>
                    {currentEvent.description}
                  </p>
                )}
              </div>
            </div>

            {/* Share button using reusable component */}
            <div className="absolute top-2 right-2">
              <SocialShareButton
                {...getShareData()}
                variant="icon"
                size="sm"
                className="hover:shadow-[0_0_8px_rgba(0,0,0,0.3)] transition-shadow"
              />
            </div>

            {/* Kilroy character for chalkboard theme */}
            {theme.name === "chalkboard" && (
              <div className="absolute bottom-2 right-2 opacity-40">
                <svg width="60" height="50" viewBox="0 0 60 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Wall */}
                  <line x1="0" y1="28" x2="60" y2="28" stroke="white" strokeWidth="2" />
                  <line x1="0" y1="32" x2="60" y2="32" stroke="white" strokeWidth="2" />

                  {/* Fingers on left */}
                  <line x1="8" y1="28" x2="8" y2="18" stroke="white" strokeWidth="1.5" />
                  <line x1="12" y1="28" x2="12" y2="16" stroke="white" strokeWidth="1.5" />
                  <line x1="16" y1="28" x2="16" y2="18" stroke="white" strokeWidth="1.5" />

                  {/* Fingers on right */}
                  <line x1="44" y1="28" x2="44" y2="18" stroke="white" strokeWidth="1.5" />
                  <line x1="48" y1="28" x2="48" y2="16" stroke="white" strokeWidth="1.5" />
                  <line x1="52" y1="28" x2="52" y2="18" stroke="white" strokeWidth="1.5" />

                  {/* Head */}
                  <circle cx="30" cy="10" r="8" stroke="white" strokeWidth="2" fill="none" />

                  {/* Eyes */}
                  <circle cx="27" cy="9" r="1.5" fill="white" />
                  <circle cx="33" cy="9" r="1.5" fill="white" />

                  {/* Nose */}
                  <ellipse cx="30" cy="14" rx="2" ry="3" stroke="white" strokeWidth="1.5" fill="none" />

                  {/* Curl on top of head */}
                  <path d="M 30 2 Q 32 0 34 2" stroke="white" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
            )}

            {/* Navigation controls if there is more than one event */}
            {events.length > 1 && (
              <div className={`flex justify-between items-center p-4 border-t ${theme.separatorClass}`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className={`px-4 py-2 text-sm font-bold ${theme.navButtonClass} rounded transform hover:scale-105 transition-all`}
                >
                  ← Prev
                </button>
                <span className={`${theme.textColorClass} opacity-60 text-sm`}>
                  {currentIndex + 1} of {events.length}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className={`px-4 py-2 text-sm font-bold ${theme.navButtonClass} rounded transform hover:scale-105 transition-all`}
                >
                  Next →
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
