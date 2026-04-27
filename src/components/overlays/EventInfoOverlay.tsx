"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Event, Venue, getSocialMediaURLs } from "@/lib/types";
import { formatEventDate, formatTime } from "@/lib/utils/date-utils";
import { getVenueById } from "@/lib/services/venue-service";
import { useArtist } from "@/hooks/useArtist";
import { getDirectionsUrl } from "@/lib/utils/mapLinks";
import ProfilePictureFetcher from "@/lib/utils/ProfilePictureFetcher";
import Image from "next/image";
import SocialShareButton from "@/components/shared/SocialShareButton";

// Theme type definitions
type ThemeName = "backstagePass" | "setlist" | "letterboard" | "gigPoster" | "chalkboard";

const THEME_ORDER: ThemeName[] = ["backstagePass", "setlist", "letterboard", "gigPoster", "chalkboard"];

function getRandomTheme(): ThemeName {
  const randomIndex = Math.floor(Math.random() * THEME_ORDER.length);
  return THEME_ORDER[randomIndex];
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentEvent = events[currentIndex];

  // Theme state with refresh capability
  const [theme, setTheme] = useState<ThemeName>(() => getRandomTheme());

  const cycleTheme = useCallback(() => {
    setTheme((prev) => {
      const currentIdx = THEME_ORDER.indexOf(prev);
      return THEME_ORDER[(currentIdx + 1) % THEME_ORDER.length];
    });
  }, []);

  const [venue, setVenue] = useState<Venue | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [fetchedProfilePicture, setFetchedProfilePicture] = useState<string | null>(null);

  const artistId = currentEvent?.artistIds?.[0];
  const { data: artist } = useArtist(artistId);

  const isOpenMic = currentEvent?.isOpenMic || false;

  useEffect(() => {
    if (!currentEvent) return;
    setHasFetched(false);
    setFetchedProfilePicture(null);
  }, [currentIndex, currentEvent]);

  useEffect(() => {
    if (currentEvent?.venueId) {
      getVenueById(currentEvent.venueId)
        .then((venueData) => setVenue(venueData))
        .catch((err) => console.error("Error fetching venue:", err));
    }
  }, [currentEvent?.venueId]);

  const socialMediaUrls = artist ? getSocialMediaURLs(artist) : [];
  const fbURL = socialMediaUrls.find((s) => s.platform === "facebook")?.url;
  const igURL = socialMediaUrls.find((s) => s.platform === "instagram")?.url;
  const displayProfileImageUrl = fetchedProfilePicture || artist?.profileImageUrl;

  const eventDate = currentEvent ? new Date(currentEvent.date) : new Date();
  const formattedDate = formatEventDate(eventDate);
  const formattedTime = currentEvent?.startTime ? formatTime(currentEvent.startTime) : "Time TBA";
  const endTime = currentEvent?.endTime
    ? formatTime(currentEvent.endTime) === "12:00am"
      ? "LATE!"
      : formatTime(currentEvent.endTime)
    : undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = eventDate.getTime() === today.getTime();

  const directionsUrl = venue ? getDirectionsUrl(venue) : "";

  const overlayStyles =
    position === "map"
      ? "fixed top-0 left-0 w-full h-full z-50 flex items-center justify-center backdrop-blur-sm"
      : "fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm";

  const getShareData = () => {
    if (!currentEvent) return { title: "", text: "" };
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

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % events.length);
  };

  if (!currentEvent) return null;

  // Get display name for artist
  const artistName = isOpenMic && artist
    ? `Open Mic with ${artist.name}`
    : isOpenMic
      ? "Open Mic"
      : artist?.name || currentEvent.name;

  const venueName = venue?.name || currentEvent.venueName || "Unknown Venue";
  const venueCity = venue?.city || "";
  const isFree = !currentEvent.ticketed;
  const ticketPrice = currentEvent.ticketinformation || (isFree ? "FREE" : "Ticketed");

  // Render the appropriate theme
  const renderTheme = () => {
    switch (theme) {
      case "backstagePass":
        return renderBackstagePass();
      case "setlist":
        return renderSetlist();
      case "letterboard":
        return renderLetterboard();
      case "gigPoster":
        return renderGigPoster();
      case "chalkboard":
        return renderChalkboard();
      default:
        return renderBackstagePass();
    }
  };

  // ============================================
  // THEME 1: BACKSTAGE PASS
  // ============================================
  const renderBackstagePass = () => (
    <motion.div
      onClick={(e) => e.stopPropagation()}
      initial={{ opacity: 0, y: -50, rotateX: 15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      exit={{ opacity: 0, y: 50, rotateX: -15 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="relative"
      style={{ perspective: "1000px" }}
    >
      {/* Lanyard */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-24 w-6 h-28 z-0">
        <div
          className="w-full h-full"
          style={{
            background: "linear-gradient(90deg, #1a1a2e 0%, #2d2d44 50%, #1a1a2e 100%)",
            boxShadow: "inset 2px 0 4px rgba(0,0,0,0.3), inset -2px 0 4px rgba(0,0,0,0.3)",
          }}
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full"
          style={{
            background: "linear-gradient(135deg, #c0c0c0, #888)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
          }}
        />
      </div>

      {/* Pass Container */}
      <div
        className="relative w-[320px] rounded-xl overflow-hidden z-10"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset",
        }}
      >
        {/* Holographic strip */}
        <div
          className="h-2"
          style={{
            background: "linear-gradient(90deg, #ff0080, #ff8c00, #40e0d0, #ff0080)",
            backgroundSize: "200% 100%",
            animation: "holographic 3s linear infinite",
          }}
        />

        {/* Inner content */}
        <div
          className="m-3 rounded-lg p-5"
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="font-[family-name:var(--font-typewriter)] text-xs text-gray-500 tracking-wider">
                ACCESS ALL AREAS
              </div>
              <div className="font-[family-name:var(--font-bebas)] text-3xl text-gray-900 tracking-wide">
                BACKSTAGE
              </div>
            </div>
            {isToday && (
              <div className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                TONIGHT
              </div>
            )}
          </div>

          {/* Artist Photo + Info */}
          <div className="flex gap-4 mb-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 border-gray-200">
              {displayProfileImageUrl ? (
                <Image
                  src={displayProfileImageUrl}
                  alt=""
                  className="object-cover w-full h-full"
                  width={80}
                  height={80}
                  onError={() => setHasFetched(true)}
                />
              ) : isOpenMic ? (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-pink-500">
                  <Mic className="w-8 h-8 text-white" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-500">
                  <Music className="w-8 h-8 text-white" />
                </div>
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
              {artistId ? (
                <Link
                  href={`/artists/${artistId}`}
                  className="font-[family-name:var(--font-bebas)] text-2xl text-purple-700 hover:text-purple-500 transition-colors flex items-center gap-1 group"
                  onClick={(e) => e.stopPropagation()}
                >
                  {artistName}
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ) : (
                <div className="font-[family-name:var(--font-bebas)] text-2xl text-purple-700">
                  {artistName}
                </div>
              )}
              <Link
                href={`/venues/${currentEvent.venueId}`}
                className="text-sm text-gray-600 hover:text-purple-500 transition-colors flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <MapPin className="w-3 h-3" />
                {venueName}
              </Link>
            </div>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">DATE</div>
              <div className="font-[family-name:var(--font-typewriter)] font-bold text-gray-900">
                {formattedDate}
              </div>
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">TIME</div>
              <div className="font-[family-name:var(--font-typewriter)] font-bold text-gray-900">
                {formattedTime}
                {endTime && ` - ${endTime}`}
              </div>
            </div>
          </div>

          {/* Ticket Info */}
          <div
            className={`text-center py-2 rounded-lg font-bold ${
              isFree ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
            }`}
          >
            {isFree ? "FREE ENTRY" : ticketPrice}
            {currentEvent.ticketUrl && !isFree && (
              <a
                href={currentEvent.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 underline text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                Buy Tickets
              </a>
            )}
          </div>

          {/* Barcode */}
          <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
            <div className="flex justify-center gap-[2px]">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-900"
                  style={{
                    width: Math.random() > 0.5 ? "2px" : "1px",
                    height: "32px",
                  }}
                />
              ))}
            </div>
            <div className="text-center font-[family-name:var(--font-mono)] text-xs text-gray-400 mt-2">
              BNDY-{currentEvent.id.substring(0, 8).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Bottom holographic */}
        <div
          className="h-2"
          style={{
            background: "linear-gradient(90deg, #40e0d0, #ff8c00, #ff0080, #40e0d0)",
            backgroundSize: "200% 100%",
            animation: "holographic 3s linear infinite reverse",
          }}
        />
      </div>

      {/* Action buttons */}
      {renderActionButtons("bg-purple-600 text-white hover:bg-purple-700")}
    </motion.div>
  );

  // ============================================
  // THEME 2: SETLIST
  // ============================================
  const renderSetlist = () => (
    <motion.div
      onClick={(e) => e.stopPropagation()}
      initial={{ opacity: 0, rotate: -5, scale: 0.9 }}
      animate={{ opacity: 1, rotate: 1, scale: 1 }}
      exit={{ opacity: 0, rotate: 5, scale: 0.9 }}
      transition={{ type: "spring", damping: 20, stiffness: 150 }}
      className="relative"
    >
      {/* Tape strips */}
      <div
        className="absolute -top-3 left-8 w-16 h-6 z-20"
        style={{
          background: "linear-gradient(135deg, rgba(255,220,180,0.9), rgba(255,200,150,0.7))",
          transform: "rotate(-12deg)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
      />
      <div
        className="absolute -top-2 right-10 w-14 h-5 z-20"
        style={{
          background: "linear-gradient(135deg, rgba(255,220,180,0.9), rgba(255,200,150,0.7))",
          transform: "rotate(8deg)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
      />

      {/* Paper */}
      <div
        className="relative w-[300px] z-10"
        style={{
          background: "#fff9f0",
          boxShadow: "0 10px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)",
          transform: "rotate(1deg)",
        }}
      >
        {/* Torn top edge */}
        <div
          className="h-3 w-full"
          style={{
            background: "#fff9f0",
            clipPath: "polygon(0% 100%, 3% 60%, 7% 100%, 12% 50%, 18% 100%, 23% 70%, 28% 100%, 33% 55%, 38% 100%, 44% 65%, 50% 100%, 55% 45%, 60% 100%, 66% 70%, 72% 100%, 78% 55%, 83% 100%, 88% 60%, 93% 100%, 97% 50%, 100% 100%)",
          }}
        />

        <div className="px-6 pb-6 pt-2">
          {/* Header with scribble */}
          <div className="text-center mb-4">
            <div className="font-[family-name:var(--font-caveat)] text-4xl text-gray-800 font-bold">
              SET LIST
            </div>
            <div className="font-[family-name:var(--font-caveat)] text-lg text-gray-500 -mt-1">
              {formattedDate}
            </div>
          </div>

          {/* Lined paper content */}
          <div
            className="space-y-0"
            style={{
              backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, #e0d8d0 28px)",
              backgroundSize: "100% 28px",
            }}
          >
            {/* Artist */}
            <div className="flex items-baseline gap-3 py-1" style={{ lineHeight: "28px" }}>
              <span className="font-[family-name:var(--font-caveat)] text-red-400 text-xl">1.</span>
              {artistId ? (
                <Link
                  href={`/artists/${artistId}`}
                  className="font-[family-name:var(--font-caveat)] text-2xl text-gray-800 hover:text-red-500 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {artistName}
                </Link>
              ) : (
                <span className="font-[family-name:var(--font-caveat)] text-2xl text-gray-800">
                  {artistName}
                </span>
              )}
            </div>

            {/* Venue */}
            <div className="flex items-baseline gap-3 py-1" style={{ lineHeight: "28px" }}>
              <span className="font-[family-name:var(--font-caveat)] text-red-400 text-xl">2.</span>
              <Link
                href={`/venues/${currentEvent.venueId}`}
                className="font-[family-name:var(--font-caveat)] text-xl text-gray-600 hover:text-red-500 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                @ {venueName}
              </Link>
            </div>

            {/* Time */}
            <div className="flex items-baseline gap-3 py-1" style={{ lineHeight: "28px" }}>
              <span className="font-[family-name:var(--font-caveat)] text-red-400 text-xl">3.</span>
              <span className="font-[family-name:var(--font-caveat)] text-xl text-gray-600">
                {formattedTime}
                {endTime && ` til ${endTime}`}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 py-1" style={{ lineHeight: "28px" }}>
              <span className="font-[family-name:var(--font-caveat)] text-red-400 text-xl">4.</span>
              <span
                className={`font-[family-name:var(--font-caveat)] text-xl ${
                  isFree ? "text-green-600" : "text-gray-600"
                }`}
              >
                {isFree ? "FREE!" : ticketPrice}
              </span>
              {!isFree && currentEvent.ticketUrl && (
                <span className="font-[family-name:var(--font-caveat)] text-sm text-blue-500 underline">
                  (tix online)
                </span>
              )}
            </div>

            {/* Today badge */}
            {isToday && (
              <div className="flex items-baseline gap-3 py-1" style={{ lineHeight: "28px" }}>
                <span className="font-[family-name:var(--font-caveat)] text-red-400 text-xl">*</span>
                <span className="font-[family-name:var(--font-caveat)] text-2xl text-red-500 font-bold animate-pulse">
                  TONIGHT!!!
                </span>
              </div>
            )}
          </div>

          {/* Scribbled notes at bottom */}
          <div className="mt-4 pt-3 border-t border-dashed border-gray-300">
            <div className="font-[family-name:var(--font-caveat)] text-gray-400 text-sm italic">
              dont forget guitar pick!!
            </div>
          </div>
        </div>

        {/* Coffee stain */}
        <div
          className="absolute bottom-8 right-4 w-12 h-12 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #8b4513 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Action buttons */}
      {renderActionButtons("bg-gray-800 text-white hover:bg-gray-700")}
    </motion.div>
  );

  // ============================================
  // THEME 3: LETTERBOARD
  // ============================================
  const renderLetterboard = () => (
    <motion.div
      onClick={(e) => e.stopPropagation()}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", damping: 20, stiffness: 200 }}
      className="relative"
    >
      {/* Marquee frame */}
      <div
        className="relative w-[340px] rounded-lg overflow-hidden"
        style={{
          background: "#1a1a1a",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.1)",
          border: "8px solid #2a2a2a",
        }}
      >
        {/* Brass corner screws */}
        {["-top-1 -left-1", "-top-1 -right-1", "-bottom-1 -left-1", "-bottom-1 -right-1"].map(
          (pos, i) => (
            <div
              key={i}
              className={`absolute ${pos} w-4 h-4 rounded-full z-10`}
              style={{
                background: "linear-gradient(135deg, #d4af37, #b8860b, #d4af37)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
              }}
            >
              <div
                className="absolute inset-1 rounded-full"
                style={{
                  background: "linear-gradient(135deg, #f5d77a, #c9a227)",
                }}
              />
            </div>
          )
        )}

        <div className="p-6">
          {/* Letter slots background */}
          <div
            className="rounded p-4"
            style={{
              background: "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)",
              boxShadow: "inset 0 2px 10px rgba(0,0,0,0.8)",
            }}
          >
            {/* Artist name */}
            <div className="mb-3">
              {artistId ? (
                <Link
                  href={`/artists/${artistId}`}
                  className="block text-center font-[family-name:var(--font-bebas)] text-3xl tracking-[0.15em] hover:opacity-80 transition-opacity"
                  style={{
                    color: "#ffffff",
                    textShadow: "0 0 10px rgba(255,255,255,0.3)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {artistName.toUpperCase()}
                </Link>
              ) : (
                <div
                  className="text-center font-[family-name:var(--font-bebas)] text-3xl tracking-[0.15em]"
                  style={{
                    color: "#ffffff",
                    textShadow: "0 0 10px rgba(255,255,255,0.3)",
                  }}
                >
                  {artistName.toUpperCase()}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex justify-center gap-2 my-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: "#ff6b35" }}
                />
              ))}
            </div>

            {/* Venue */}
            <div className="mb-2">
              <Link
                href={`/venues/${currentEvent.venueId}`}
                className="block text-center font-[family-name:var(--font-bebas)] text-xl tracking-[0.1em] hover:opacity-80 transition-opacity"
                style={{ color: "#ff6b35" }}
                onClick={(e) => e.stopPropagation()}
              >
                {venueName.toUpperCase()}
              </Link>
              {venueCity && (
                <div
                  className="text-center font-[family-name:var(--font-bebas)] text-sm tracking-[0.2em]"
                  style={{ color: "#888" }}
                >
                  {venueCity.toUpperCase()}
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <div
                  className="font-[family-name:var(--font-bebas)] text-2xl tracking-wider"
                  style={{ color: "#40e0d0" }}
                >
                  {formattedDate.toUpperCase()}
                </div>
                {isToday && (
                  <div
                    className="font-[family-name:var(--font-bebas)] text-sm tracking-widest animate-pulse"
                    style={{ color: "#ff0080" }}
                  >
                    TONIGHT
                  </div>
                )}
              </div>
              <div className="text-center">
                <div
                  className="font-[family-name:var(--font-bebas)] text-2xl tracking-wider"
                  style={{ color: "#40e0d0" }}
                >
                  {formattedTime.toUpperCase()}
                </div>
                {endTime && (
                  <div
                    className="font-[family-name:var(--font-bebas)] text-sm tracking-wider"
                    style={{ color: "#888" }}
                  >
                    TIL {endTime.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="mt-4 text-center">
              <span
                className={`font-[family-name:var(--font-bebas)] text-2xl tracking-widest ${
                  isFree ? "" : ""
                }`}
                style={{ color: isFree ? "#00ff88" : "#ffcc00" }}
              >
                {isFree ? "FREE ENTRY" : ticketPrice.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {renderActionButtons("bg-[#ff6b35] text-white hover:bg-[#ff8555]")}
    </motion.div>
  );

  // ============================================
  // THEME 4: GIG POSTER
  // ============================================
  const renderGigPoster = () => (
    <motion.div
      onClick={(e) => e.stopPropagation()}
      initial={{ opacity: 0, y: 30, rotate: -3 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      exit={{ opacity: 0, y: -30, rotate: 3 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="relative"
    >
      {/* Poster */}
      <div
        className="relative w-[320px] overflow-hidden"
        style={{
          background: "#f5f0e1",
          boxShadow: "0 15px 40px rgba(0,0,0,0.4)",
          border: "3px solid #1a1a1a",
        }}
      >
        {/* Woodblock texture overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="p-5 relative">
          {/* Top banner */}
          <div
            className="text-center py-2 mb-4 -mx-5 px-5"
            style={{
              background: "#1a1a1a",
              borderTop: "4px solid #ff4444",
              borderBottom: "4px solid #ff4444",
            }}
          >
            <div className="font-[family-name:var(--font-bungee)] text-xs text-white tracking-[0.3em]">
              LIVE ON STAGE
            </div>
          </div>

          {/* Artist name - main headline */}
          <div className="mb-4">
            {artistId ? (
              <Link
                href={`/artists/${artistId}`}
                className="block text-center font-[family-name:var(--font-bungee)] text-4xl leading-tight hover:text-red-600 transition-colors"
                style={{
                  color: "#1a1a1a",
                  textShadow: "3px 3px 0 #ff4444, 6px 6px 0 rgba(0,0,0,0.1)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {artistName.toUpperCase()}
              </Link>
            ) : (
              <div
                className="text-center font-[family-name:var(--font-bungee)] text-4xl leading-tight"
                style={{
                  color: "#1a1a1a",
                  textShadow: "3px 3px 0 #ff4444, 6px 6px 0 rgba(0,0,0,0.1)",
                }}
              >
                {artistName.toUpperCase()}
              </div>
            )}
          </div>

          {/* Decorative zigzag */}
          <div
            className="h-4 -mx-5 mb-4"
            style={{
              background: "#1a1a1a",
              clipPath: "polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%, 100% 100%, 0% 100%)",
            }}
          />

          {/* Venue block */}
          <div
            className="text-center py-3 mb-4"
            style={{
              background: "#ff4444",
              transform: "rotate(-1deg)",
            }}
          >
            <Link
              href={`/venues/${currentEvent.venueId}`}
              className="block font-[family-name:var(--font-bungee)] text-xl text-white hover:opacity-80 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              {venueName.toUpperCase()}
            </Link>
            {venueCity && (
              <div className="font-[family-name:var(--font-bungee)] text-sm text-white/80">
                {venueCity.toUpperCase()}
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div
              className="text-center py-3"
              style={{
                background: "#1a1a1a",
                transform: "rotate(0.5deg)",
              }}
            >
              <div className="font-[family-name:var(--font-bungee)] text-lg text-white">
                {formattedDate.toUpperCase()}
              </div>
              {isToday && (
                <div className="font-[family-name:var(--font-bungee)] text-xs text-[#ff4444] animate-pulse">
                  TONIGHT!
                </div>
              )}
            </div>
            <div
              className="text-center py-3"
              style={{
                background: "#1a1a1a",
                transform: "rotate(-0.5deg)",
              }}
            >
              <div className="font-[family-name:var(--font-bungee)] text-lg text-white">
                {formattedTime.toUpperCase()}
              </div>
              {endTime && (
                <div className="font-[family-name:var(--font-bungee)] text-xs text-white/60">
                  TIL {endTime.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Price starburst */}
          <div className="flex justify-center mb-4">
            <div
              className="relative px-8 py-3"
              style={{
                background: isFree ? "#00aa55" : "#ffcc00",
                transform: "rotate(-2deg)",
                clipPath: "polygon(10% 0%, 20% 50%, 0% 50%, 20% 100%, 50% 70%, 80% 100%, 100% 50%, 80% 50%, 90% 0%, 50% 30%)",
              }}
            >
              <div
                className="font-[family-name:var(--font-bungee)] text-xl"
                style={{ color: isFree ? "#fff" : "#1a1a1a" }}
              >
                {isFree ? "FREE!" : ticketPrice.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Bottom banner */}
          <div
            className="text-center py-2 -mx-5 -mb-5 px-5"
            style={{
              background: "#1a1a1a",
              borderTop: "4px solid #ff4444",
            }}
          >
            <div className="font-[family-name:var(--font-bungee)] text-[10px] text-white/60 tracking-[0.2em]">
              BNDY.LIVE PRESENTS
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {renderActionButtons("bg-[#ff4444] text-white hover:bg-[#ff6666]")}
    </motion.div>
  );

  // ============================================
  // THEME 5: CHALKBOARD
  // ============================================
  const renderChalkboard = () => (
    <motion.div
      onClick={(e) => e.stopPropagation()}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="relative"
    >
      {/* Wooden frame */}
      <div
        className="relative w-[340px] p-3 rounded"
        style={{
          background: "linear-gradient(135deg, #8b5a2b, #654321, #8b5a2b)",
          boxShadow: "0 15px 40px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.1)",
        }}
      >
        {/* Chalkboard */}
        <div
          className="relative rounded overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #2d4739 0%, #1e3a2c 50%, #2d4739 100%)",
            boxShadow: "inset 0 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          {/* Chalk dust texture */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
            }}
          />

          <div className="p-5 relative">
            {/* Header scribble */}
            <div className="text-center mb-3">
              <div
                className="font-[family-name:var(--font-marker)] text-sm tracking-wider"
                style={{
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                TONIGHTS GIG
              </div>
            </div>

            {/* Artist */}
            <div className="mb-4">
              {artistId ? (
                <Link
                  href={`/artists/${artistId}`}
                  className="block text-center font-[family-name:var(--font-marker)] text-3xl hover:opacity-80 transition-opacity"
                  style={{
                    color: "#ffffff",
                    textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {artistName}
                </Link>
              ) : (
                <div
                  className="text-center font-[family-name:var(--font-marker)] text-3xl"
                  style={{
                    color: "#ffffff",
                    textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  {artistName}
                </div>
              )}
            </div>

            {/* Chalk divider */}
            <div
              className="h-1 mx-auto mb-4 rounded-full"
              style={{
                width: "60%",
                background: "rgba(255,255,255,0.3)",
              }}
            />

            {/* Venue */}
            <div className="mb-4">
              <Link
                href={`/venues/${currentEvent.venueId}`}
                className="block text-center font-[family-name:var(--font-marker)] text-xl hover:opacity-80 transition-opacity"
                style={{
                  color: "#ffd700",
                  textShadow: "1px 1px 3px rgba(0,0,0,0.3)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                @ {venueName}
              </Link>
              {venueCity && (
                <div
                  className="text-center font-[family-name:var(--font-marker)] text-sm"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  {venueCity}
                </div>
              )}
            </div>

            {/* Date & Time in chalk boxes */}
            <div className="flex justify-center gap-4 mb-4">
              <div
                className="px-4 py-2 rounded"
                style={{
                  border: "2px solid rgba(255,255,255,0.4)",
                }}
              >
                <div
                  className="font-[family-name:var(--font-marker)] text-lg"
                  style={{ color: "#7fdbff" }}
                >
                  {formattedDate}
                </div>
                {isToday && (
                  <div
                    className="font-[family-name:var(--font-marker)] text-xs text-center animate-pulse"
                    style={{ color: "#ff6b6b" }}
                  >
                    TONIGHT!
                  </div>
                )}
              </div>
              <div
                className="px-4 py-2 rounded"
                style={{
                  border: "2px solid rgba(255,255,255,0.4)",
                }}
              >
                <div
                  className="font-[family-name:var(--font-marker)] text-lg"
                  style={{ color: "#7fdbff" }}
                >
                  {formattedTime}
                </div>
                {endTime && (
                  <div
                    className="font-[family-name:var(--font-marker)] text-xs text-center"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    til {endTime}
                  </div>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="text-center">
              <span
                className="font-[family-name:var(--font-marker)] text-2xl px-4 py-1 rounded"
                style={{
                  color: isFree ? "#98fb98" : "#ffa500",
                  background: "rgba(0,0,0,0.2)",
                }}
              >
                {isFree ? "FREE!" : ticketPrice}
              </span>
            </div>
          </div>

          {/* Chalk dust at bottom */}
          <div
            className="h-2"
            style={{
              background: "linear-gradient(to top, rgba(255,255,255,0.1), transparent)",
            }}
          />
        </div>

        {/* Chalk ledge */}
        <div
          className="h-3 mt-2 rounded-b flex items-center justify-center gap-2"
          style={{
            background: "linear-gradient(to bottom, #654321, #4a3219)",
          }}
        >
          {/* Chalk pieces */}
          <div className="w-8 h-2 rounded bg-white/80" />
          <div className="w-6 h-2 rounded bg-yellow-200/80" />
          <div className="w-5 h-2 rounded bg-pink-200/80" />
        </div>
      </div>

      {/* Action buttons */}
      {renderActionButtons("bg-amber-700 text-white hover:bg-amber-600")}
    </motion.div>
  );

  // ============================================
  // SHARED: Action Buttons
  // ============================================
  const renderActionButtons = (buttonClass: string) => (
    <div className="flex justify-center gap-3 mt-4">
      {/* Directions button */}
      {directionsUrl && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all transform hover:scale-105 ${buttonClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Map className="w-4 h-4" />
          Directions
        </a>
      )}

      {/* Ticket button (if ticketed) */}
      {currentEvent.ticketUrl && !isFree && (
        <a
          href={currentEvent.ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all transform hover:scale-105 ${buttonClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Ticket className="w-4 h-4" />
          Tickets
        </a>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={overlayStyles} onClick={onClose}>
          <div className="relative">
            {renderTheme()}

            {/* Share button */}
            <div className="absolute top-2 right-2 z-30">
              <SocialShareButton
                {...getShareData()}
                variant="icon"
                size="sm"
                className="bg-white/90 hover:bg-white shadow-lg"
              />
            </div>

            {/* Refresh theme button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                cycleTheme();
              }}
              className="absolute top-2 left-2 z-30 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
              title="Switch theme"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>

            {/* Navigation controls if there is more than one event */}
            {events.length > 1 && (
              <div className="flex justify-center items-center gap-4 mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="px-4 py-2 text-sm font-bold bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg transition-all hover:scale-105"
                >
                  ← Prev
                </button>
                <span className="text-white/80 text-sm font-mono">
                  {currentIndex + 1} / {events.length}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="px-4 py-2 text-sm font-bold bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg transition-all hover:scale-105"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
