"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Mic, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Event, Venue, getSocialMediaURLs } from "@/lib/types";
import { formatTime } from "@/lib/utils/date-utils";
import { getVenueById } from "@/lib/services/venue-service";
import { useArtist } from "@/hooks/useArtist";
import ProfilePictureFetcher from "@/lib/utils/ProfilePictureFetcher";
import Image from "next/image";
import SocialShareButton from "@/components/shared/SocialShareButton";
import { formatArtistDisplay } from "@/lib/utils/artist-display";

type ThemeName = "gigPoster" | "chalkboard" | "letterboard" | "backstagePass" | "setlist";

const THEME_ORDER: ThemeName[] = ["gigPoster", "chalkboard", "letterboard", "backstagePass", "setlist"];

function getRandomTheme(): ThemeName {
  return THEME_ORDER[Math.floor(Math.random() * THEME_ORDER.length)];
}

interface EventInfoOverlayProps {
  events: Event[];
  isOpen: boolean;
  onClose: () => void;
  position?: "map" | "list";
}

export default function EventInfoOverlay({
  events,
  isOpen,
  onClose,
  position = "map",
}: EventInfoOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentEvent = events[currentIndex];
  const [theme, setTheme] = useState<ThemeName>(() => getRandomTheme());
  const [venue, setVenue] = useState<Venue | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [fetchedProfilePicture, setFetchedProfilePicture] = useState<string | null>(null);

  const cycleTheme = useCallback(() => {
    setTheme((prev) => {
      const idx = THEME_ORDER.indexOf(prev);
      return THEME_ORDER[(idx + 1) % THEME_ORDER.length];
    });
  }, []);

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
        .then((v) => setVenue(v))
        .catch(() => {});
    }
  }, [currentEvent?.venueId]);

  const socialMediaUrls = artist ? getSocialMediaURLs(artist) : [];
  const fbURL = socialMediaUrls.find((s) => s.platform === "facebook")?.url;
  const igURL = socialMediaUrls.find((s) => s.platform === "instagram")?.url;
  const displayProfileImageUrl = fetchedProfilePicture || artist?.profileImageUrl;

  if (!currentEvent) return null;

  // Format data
  const eventDate = new Date(currentEvent.date);
  const dayName = eventDate.toLocaleDateString("en-GB", { weekday: "short" });
  const dayNum = eventDate.getDate();
  const monthName = eventDate.toLocaleDateString("en-GB", { month: "short" });
  const year = eventDate.getFullYear();
  const formattedDateFull = `${dayName} ${dayNum.toString().padStart(2, "0")} ${monthName} ${year}`;
  const formattedDateShort = `${dayName} ${dayNum}${getOrdinal(dayNum)} ${monthName}`;
  const formattedTime = currentEvent.startTime ? formatTime(currentEvent.startTime) : "TBA";
  const doorsTime = currentEvent.startTime || "21:00";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const eventDateOnly = new Date(eventDate);
  eventDateOnly.setHours(0, 0, 0, 0);

  const isToday = eventDateOnly.getTime() === today.getTime();
  const isTomorrow = eventDateOnly.getTime() === tomorrow.getTime();

  // For multi-artist events, show "Artist1 + N more" format
  // For single artist, use artist.name or fall back to event data
  const hasMultipleArtists = currentEvent.artistIds && currentEvent.artistIds.length > 1;
  const artistName = isOpenMic && artist
    ? `Open Mic with ${artist.name}`
    : isOpenMic
      ? "Open Mic"
      : hasMultipleArtists
        ? formatArtistDisplay(currentEvent)
        : artist?.name || currentEvent.name || "Live Music";

  const venueName = venue?.name || currentEvent.venueName || "Venue";
  const venueCity = currentEvent.venueCity || venue?.city || "";
  const priceValue = currentEvent.price;
  const isFree = !currentEvent.ticketed || priceValue === "Free" || priceValue === "0" || !priceValue;
  const priceDisplay = isFree ? "FREE" : (priceValue || currentEvent.ticketinformation || "Ticketed");

  // Get distance if available
  const distanceMiles = (currentEvent as Event & { distanceMiles?: number }).distanceMiles;
  const distanceDisplay = distanceMiles ? `${Math.round(distanceMiles)} mi` : "";

  const overlayStyles = position === "map"
    ? "fixed top-0 left-0 w-full h-full z-50 flex items-center justify-center backdrop-blur-sm"
    : "fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm";

  const getShareData = () => ({
    title: `${artistName} | bndy`,
    text: `Check out ${artistName} at ${venueName}`,
  });

  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % events.length);

  const renderTheme = () => {
    switch (theme) {
      case "gigPoster": return renderGigPoster();
      case "chalkboard": return renderChalkboard();
      case "letterboard": return renderLetterboard();
      case "backstagePass": return renderBackstagePass();
      case "setlist": return renderSetlist();
    }
  };

  // ════════════════════════════════════════════════════════
  // 1. GIG POSTER — wood-block print attitude
  // ════════════════════════════════════════════════════════
  const renderGigPoster = () => (
    <motion.div
      onClick={(e) => e.stopPropagation()}
      initial={{ opacity: 0, y: 20, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      exit={{ opacity: 0, y: -20, rotate: 2 }}
      className="relative w-[340px]"
      style={{
        background: "#ede4cc",
        color: "#15110d",
        boxShadow: "6px 6px 0 #15110d, 9px 9px 0 #ff3322, 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Paper texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85'/%3E%3CfeColorMatrix values='0 0 0 0 0.08, 0 0 0 0 0.07, 0 0 0 0 0.05, 0 0 0 0.28 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E")`,
          mixBlendMode: "multiply",
          opacity: 0.7,
        }}
      />
      {/* Inner border */}
      <div className="absolute top-[6px] left-[6px] right-[6px] bottom-[6px] border-2 border-[#15110d] pointer-events-none z-[2]" />

      {/* One Night Only stamp */}
      <div
        className="absolute top-[38px] right-[-18px] z-[4] px-[18px] py-1 font-[family-name:var(--font-anton)] text-xs tracking-[0.18em] uppercase"
        style={{
          background: "#ff3322",
          color: "#ede4cc",
          transform: "rotate(8deg)",
          boxShadow: "2px 2px 0 #15110d",
        }}
      >
        One Night Only
      </div>

      <div className="relative z-[3] px-6 pt-7 pb-5">
        {/* Top bar */}
        <div
          className="flex justify-between items-center font-[family-name:var(--font-mono)] text-[9.5px] tracking-[0.3em] uppercase font-semibold pb-2 mb-3.5"
          style={{ borderBottom: "4px double #15110d" }}
        >
          <span>{venueCity || "UK"}</span>
          <span style={{ color: "#ff3322" }}>★ ★ ★</span>
          <span>Live Music</span>
        </div>

        {/* Artist name */}
        <div className="text-center my-2">
          {artistId ? (
            <Link
              href={`/artists/${artistId}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:text-[#ff3322] transition-colors"
            >
              <h1
                className="font-[family-name:var(--font-anton)] text-[60px] sm:text-[78px] leading-[0.82] uppercase break-words"
                style={{
                  textShadow: "2px 2px 0 #ede4cc, 4px 4px 0 #ff3322",
                }}
              >
                {artistName}
              </h1>
            </Link>
          ) : (
            <h1
              className="font-[family-name:var(--font-anton)] text-[60px] sm:text-[78px] leading-[0.82] uppercase break-words"
              style={{
                textShadow: "2px 2px 0 #ede4cc, 4px 4px 0 #ff3322",
              }}
            >
              {artistName}
            </h1>
          )}
        </div>

        {/* Date bar */}
        <div
          className="text-center font-[family-name:var(--font-anton)] text-[26px] tracking-[0.05em] uppercase leading-none py-2.5 px-6 -mx-6 my-4"
          style={{
            background: "#15110d",
            color: "#ede4cc",
            borderTop: "1px solid #ede4cc",
            borderBottom: "1px solid #ede4cc",
            boxShadow: "inset 0 0 0 4px #15110d",
          }}
        >
          {formattedDateFull}
          <span className="block font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.25em] text-[#ff3322] mt-1.5 font-medium">
            From {doorsTime}
          </span>
        </div>

        {/* Venue */}
        <div className="text-center mb-3.5">
          <div className="font-[family-name:var(--font-typewriter)] text-xs text-[#6b5a47] tracking-[0.05em] italic mb-1">
            at the legendary
          </div>
          <Link
            href={`/venues/${currentEvent.venueId}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-block font-[family-name:var(--font-anton)] text-[32px] leading-[0.95] uppercase border-b-[3px] border-[#15110d] pb-0.5 hover:text-[#ff3322] hover:border-[#ff3322] transition-colors"
          >
            {venueName}
          </Link>
          <div className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.22em] uppercase text-[#6b5a47] mt-1.5 font-medium">
            {venueCity}{distanceDisplay && ` · ${distanceDisplay} Away`}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-4 pt-3.5" style={{ borderTop: "4px double #15110d" }}>
          <div className="font-[family-name:var(--font-typewriter)] text-[10px] text-[#6b5a47] tracking-[0.05em] leading-[1.3] max-w-[60%]">
            From {doorsTime}
          </div>
          <div className={`font-[family-name:var(--font-anton)] text-[38px] uppercase tracking-[0.04em] leading-[0.9] text-right ${isFree ? "text-[#2a8538]" : "text-[#15110d]"}`}>
            {isFree ? "£ree" : priceDisplay}
            <small className="block font-[family-name:var(--font-mono)] text-[9.5px] tracking-[0.22em] text-[#6b5a47] mt-1 font-medium">
              Entry
            </small>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // ════════════════════════════════════════════════════════
  // 2. CHALKBOARD — pub blackboard
  // ════════════════════════════════════════════════════════
  const renderChalkboard = () => (
    <motion.div
      onClick={(e) => e.stopPropagation()}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative w-[340px] p-3.5 rounded"
      style={{
        background: "linear-gradient(135deg, #6b4423 0%, #4a2f18 50%, #6b4423 100%)",
        backgroundImage: "repeating-linear-gradient(85deg, transparent 0px, transparent 4px, rgba(0,0,0,0.08) 4px, rgba(0,0,0,0.08) 5px), linear-gradient(135deg, #6b4423 0%, #4a2f18 50%, #6b4423 100%)",
        boxShadow: "0 1px 0 rgba(255,200,150,0.1) inset, 0 0 0 1px #2a1810, 0 24px 40px -10px rgba(0,0,0,0.6), 0 8px 16px -4px rgba(0,0,0,0.3)",
      }}
    >
      {/* Chalkboard surface */}
      <div
        className="relative overflow-hidden min-h-[380px] p-6"
        style={{
          background: "linear-gradient(135deg, #1f2a22 0%, #15201a 100%)",
          backgroundImage: "radial-gradient(ellipse at 25% 30%, rgba(255,255,255,0.04) 0%, transparent 50%), radial-gradient(ellipse at 75% 70%, rgba(255,255,255,0.03) 0%, transparent 50%), linear-gradient(135deg, #1f2a22 0%, #15201a 100%)",
          boxShadow: "inset 0 0 30px rgba(0,0,0,0.6), inset 0 0 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Chalk dust texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='c'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 1, 0 0 0 0 1, 0 0 0 0 1, 0 0 0 0.06 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23c)'/%3E%3C/svg%3E")`,
            mixBlendMode: "screen",
            opacity: 0.7,
          }}
        />
        {/* Light reflections */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 200px 80px at 30% 20%, rgba(255,255,255,0.05), transparent 70%), radial-gradient(ellipse 150px 60px at 80% 90%, rgba(255,255,255,0.04), transparent 70%)",
          }}
        />

        {/* Chalk piece */}
        <div
          className="absolute bottom-0 right-8 w-9 h-2 rounded-sm z-[4]"
          style={{
            background: "linear-gradient(180deg, #f4f0e8 0%, #d8d0c0 100%)",
            transform: "rotate(-3deg)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
          }}
        />

        {/* Music note doodle */}
        <div
          className="absolute bottom-3 right-3.5 font-[family-name:var(--font-caveat)] text-4xl text-[#ffe066] opacity-55 z-[3] leading-none"
          style={{ transform: "rotate(-15deg)" }}
        >
          ♪
        </div>

        {/* Content */}
        <div className="relative z-[2]">
          {/* Header */}
          <div
            className="font-[family-name:var(--font-caveat)] text-[32px] text-[#ffe066] text-center mb-1 leading-none"
            style={{
              transform: "rotate(-1.5deg)",
              textShadow: "0 0 1px rgba(255,224,102,0.2)",
              WebkitTextStroke: "0.5px rgba(255,224,102,0.3)",
            }}
          >
            {isToday ? "Tonight!" : isTomorrow ? "Tomorrow!" : formattedDateShort}
            <span className="block w-[60px] h-0 border-b-2 border-[#ffe066] mx-auto mt-1 opacity-70" style={{ transform: "rotate(0.8deg)" }} />
          </div>

          {/* Eyebrow */}
          <div
            className="text-center font-[family-name:var(--font-caveat)] text-lg text-[#ffb3b3] mb-2 font-medium tracking-wide"
            style={{ transform: "rotate(0.5deg)" }}
          >
            ~ Live Music ~
          </div>

          {/* Artist */}
          {artistId ? (
            <Link
              href={`/artists/${artistId}`}
              onClick={(e) => e.stopPropagation()}
              className="block text-center font-[family-name:var(--font-bungee)] text-[32px] sm:text-[38px] leading-[0.9] uppercase mb-1 text-[#ff8a6a] hover:text-[#ffe066] transition-colors"
              style={{
                textShadow: "0 0 1px rgba(255,138,106,0.4), 0 0 8px rgba(255,138,106,0.15)",
                WebkitTextStroke: "0.5px rgba(255,255,255,0.1)",
              }}
            >
              {artistName}
            </Link>
          ) : (
            <h1
              className="text-center font-[family-name:var(--font-bungee)] text-[32px] sm:text-[38px] leading-[0.9] uppercase mb-1 text-[#ff8a6a]"
              style={{
                textShadow: "0 0 1px rgba(255,138,106,0.4), 0 0 8px rgba(255,138,106,0.15)",
                WebkitTextStroke: "0.5px rgba(255,255,255,0.1)",
              }}
            >
              {artistName}
            </h1>
          )}

          {/* Arrow */}
          <div
            className="text-center font-[family-name:var(--font-caveat)] text-[22px] text-white my-2"
            style={{ transform: "rotate(-1deg)" }}
          >
            <span className="block text-[28px] leading-none opacity-70">↓</span>
            live at
          </div>

          {/* Venue */}
          <Link
            href={`/venues/${currentEvent.venueId}`}
            onClick={(e) => e.stopPropagation()}
            className="block text-center font-[family-name:var(--font-caveat)] text-[30px] sm:text-[36px] text-[#88e0ff] leading-none mb-1 hover:text-[#ffe066] transition-colors"
            style={{
              transform: "rotate(-0.5deg)",
              WebkitTextStroke: "0.4px rgba(136,224,255,0.3)",
            }}
          >
            <u className="border-b-2 border-[#88e0ff] pb-0.5" style={{ textDecoration: "none" }}>{venueName}</u>
          </Link>
          <div
            className="text-center font-[family-name:var(--font-caveat)] text-lg text-[#c9d4cc] mb-3.5"
            style={{ transform: "rotate(0.6deg)" }}
          >
            {venueCity}{distanceDisplay && ` — ${distanceDisplay}`}
          </div>

          {/* Divider */}
          <div className="text-center text-[#a0b0a5] font-[family-name:var(--font-caveat)] text-base tracking-[0.5em] my-3 opacity-70">
            — — —
          </div>

          {/* Details */}
          <div className="flex justify-around items-end text-center gap-3 mb-2">
            <div className="font-[family-name:var(--font-caveat)]">
              <div className="text-sm text-[#c9d4cc] mb-0.5" style={{ transform: "rotate(-1deg)" }}>from</div>
              <div className="text-[28px] text-white leading-none font-bold">{formattedTime}</div>
            </div>
            <div className="font-[family-name:var(--font-caveat)]">
              <div className="text-sm text-[#c9d4cc] mb-0.5" style={{ transform: "rotate(-1deg)" }}>entry</div>
              <div
                className={`text-[32px] leading-none font-bold ${isFree ? "text-[#88ff9c]" : "text-white"}`}
                style={isFree ? { transform: "rotate(-2deg)", textShadow: "0 0 6px rgba(136,255,156,0.25)" } : {}}
              >
                {isFree ? "FREE!" : priceDisplay}
              </div>
            </div>
            <div className="font-[family-name:var(--font-caveat)]">
              <div className="text-sm text-[#c9d4cc] mb-0.5" style={{ transform: "rotate(-1deg)" }}>date</div>
              <div className="text-[28px] text-white leading-none font-bold">{dayName} {dayNum}{getOrdinal(dayNum)}</div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="text-center font-[family-name:var(--font-caveat)] text-[22px] text-[#ffe066] mt-3.5 leading-[1.1]"
            style={{
              transform: "rotate(-1deg)",
              textShadow: "0 0 1px rgba(255,224,102,0.3)",
            }}
          >
            ↓ get down here ↓
          </div>
        </div>
      </div>
    </motion.div>
  );

  // ════════════════════════════════════════════════════════
  // 3. MARQUEE LETTERBOARD
  // ════════════════════════════════════════════════════════
  const renderLetterboard = () => (
    <motion.div
      onClick={(e) => e.stopPropagation()}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative w-[340px] rounded"
      style={{
        background: "#1a1a1a",
        border: "8px solid #c0a060",
        backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.4) 100%), repeating-linear-gradient(0deg, transparent 0px, transparent 38px, rgba(255,255,255,0.04) 38px, rgba(255,255,255,0.04) 39px)",
        boxShadow: "0 0 0 2px #15110d, 0 0 30px rgba(255, 200, 100, 0.15), 0 20px 40px rgba(0,0,0,0.5), inset 0 0 60px rgba(0,0,0,0.7)",
      }}
    >
      {/* Brass screws */}
      {[
        "top-1 left-1",
        "top-1 right-1",
        "bottom-1 left-1",
        "bottom-1 right-1",
      ].map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos} w-2.5 h-2.5 rounded-full`}
          style={{
            background: "radial-gradient(circle at 35% 35%, #e8c878 0%, #8a6b3a 70%, #4a3a1a 100%)",
            boxShadow: "inset 0 0 2px rgba(0,0,0,0.6)",
          }}
        />
      ))}

      <div className="relative z-[2] px-6 py-7 text-center text-[#f0eee6] font-[family-name:var(--font-bebas)]">
        {/* Tonight header */}
        <div
          className="text-sm tracking-[0.5em] text-[#ffd380] mb-1.5"
          style={{ textShadow: "0 0 8px rgba(255,200,100,0.4)" }}
        >
          {isToday ? "Tonight" : isTomorrow ? "Tomorrow Night" : formattedDateShort}
        </div>

        {/* Artist */}
        {artistId ? (
          <Link
            href={`/artists/${artistId}`}
            onClick={(e) => e.stopPropagation()}
            className="block text-[38px] sm:text-[46px] tracking-[0.04em] leading-none text-white mb-1 hover:text-[#ffd380] transition-colors"
            style={{ textShadow: "0 0 1px #fff, 0 1px 2px rgba(0,0,0,0.8)" }}
          >
            {artistName.toUpperCase()}
          </Link>
        ) : (
          <h1
            className="text-[38px] sm:text-[46px] tracking-[0.04em] leading-none text-white mb-1"
            style={{ textShadow: "0 0 1px #fff, 0 1px 2px rgba(0,0,0,0.8)" }}
          >
            {artistName.toUpperCase()}
          </h1>
        )}

        {/* Divider */}
        <div className="text-[13px] tracking-[0.4em] text-[#ffd380] my-2">
          — LIVE AT —
        </div>

        {/* Venue */}
        <Link
          href={`/venues/${currentEvent.venueId}`}
          onClick={(e) => e.stopPropagation()}
          className="block text-[26px] tracking-[0.05em] leading-none text-white mb-1 hover:text-[#ffd380] transition-colors"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
        >
          {venueName.toUpperCase()}
        </Link>
        <div className="text-[13px] tracking-[0.3em] text-[#ccc] mb-3.5">
          {venueCity.toUpperCase()}
        </div>

        {/* Rule */}
        <div
          className="h-px my-3.5"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,200,100,0.4), transparent)" }}
        />

        {/* Meta */}
        <div className="flex justify-between items-baseline text-lg tracking-[0.06em]">
          <span className="text-white">{dayName.toUpperCase()} {dayNum.toString().padStart(2, "0")} · {formattedTime.toUpperCase()}</span>
          <span
            className={`text-2xl ${isFree ? "text-[#86eb8e]" : "text-[#ffd380]"}`}
            style={{ textShadow: isFree ? "0 0 6px rgba(134,235,142,0.4)" : "0 0 6px rgba(255,211,128,0.4)" }}
          >
            {isFree ? "FREE" : priceDisplay.toUpperCase()}
          </span>
        </div>
      </div>
    </motion.div>
  );

  // ════════════════════════════════════════════════════════
  // 4. BACKSTAGE PASS
  // ════════════════════════════════════════════════════════
  const renderBackstagePass = () => (
    <motion.div
      onClick={(e) => e.stopPropagation()}
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="flex flex-col items-center"
    >
      {/* Lanyard */}
      <div
        className="relative w-3.5 h-[60px] z-[1]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(255,255,255,0.18) 3px, rgba(255,255,255,0.18) 4px, transparent 4px, transparent 7px), linear-gradient(90deg, rgba(0,0,0,0.4) 0%, #c41e3a 20%, #e63333 50%, #c41e3a 80%, rgba(0,0,0,0.4) 100%)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
        }}
      >
        {/* Clip */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-3.5 rounded-sm"
          style={{
            background: "linear-gradient(180deg, #aaa 0%, #555 100%)",
            borderRadius: "2px 2px 4px 4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
          }}
        />
      </div>

      {/* Pass */}
      <div
        className="relative w-[320px] rounded-md overflow-hidden px-5 pt-7 pb-5"
        style={{
          background: "linear-gradient(135deg, #ff7a3d 0%, #c41e3a 60%, #6b1024 100%)",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.4), 0 20px 40px -10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.3)",
        }}
      >
        {/* Gloss overlay */}
        <div
          className="absolute top-0 left-0 right-0 bottom-1/2 pointer-events-none"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)" }}
        />
        {/* Punch hole */}
        <div
          className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[38px] h-3 rounded-md z-[2]"
          style={{
            background: "var(--lv-bg, #0c1530)",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)",
          }}
        />

        <div className="relative z-[1] pt-3.5 text-white">
          {/* Header */}
          <div
            className="font-[family-name:var(--font-anton)] text-[13px] tracking-[0.4em] uppercase text-center text-white/80 pb-3 mb-0"
            style={{ borderBottom: "1px dashed rgba(255,255,255,0.3)" }}
          >
            ★ Backstage Pass ★
          </div>

          {/* Access */}
          <div className="font-[family-name:var(--font-anton)] text-[28px] text-center tracking-[0.06em] uppercase leading-none my-3" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.4)" }}>
            All <span className="text-[#fff200]">Access</span>
          </div>

          {/* Divider */}
          <div className="h-px my-4" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }} />

          {/* Artist */}
          {artistId ? (
            <Link
              href={`/artists/${artistId}`}
              onClick={(e) => e.stopPropagation()}
              className="block font-[family-name:var(--font-anton)] text-[32px] sm:text-[38px] text-center tracking-[0.005em] uppercase leading-[0.9] mb-2 hover:opacity-80 transition-opacity"
              style={{ textShadow: "0 2px 6px rgba(0,0,0,0.5)" }}
            >
              {artistName}
            </Link>
          ) : (
            <h1
              className="font-[family-name:var(--font-anton)] text-[32px] sm:text-[38px] text-center tracking-[0.005em] uppercase leading-[0.9] mb-2"
              style={{ textShadow: "0 2px 6px rgba(0,0,0,0.5)" }}
            >
              {artistName}
            </h1>
          )}

          {/* Venue */}
          <div className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.2em] uppercase text-center text-white/95 mb-4">
            Live at{" "}
            <Link
              href={`/venues/${currentEvent.venueId}`}
              onClick={(e) => e.stopPropagation()}
              className="border-b border-white/40 pb-0.5 hover:border-white transition-colors"
            >
              {venueName} · {venueCity}
            </Link>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-1.5 mt-3.5 pt-3.5" style={{ borderTop: "1px dashed rgba(255,255,255,0.3)" }}>
            {[
              { label: "Date", value: `${dayName} ${dayNum.toString().padStart(2, "0")} ${monthName}` },
              { label: "From", value: doorsTime },
              { label: "Distance", value: distanceDisplay || "—" },
              { label: "Entry", value: isFree ? "£ree" : priceDisplay },
            ].map((item, i) => (
              <div key={i} className="font-[family-name:var(--font-mono)]">
                <div className="text-[9px] tracking-[0.22em] uppercase text-white/70 mb-0.5">{item.label}</div>
                <div className="font-[family-name:var(--font-anton)] text-base tracking-[0.04em] uppercase leading-none">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Barcode */}
          <div className="mt-4 pt-3.5 text-center" style={{ borderTop: "1px dashed rgba(255,255,255,0.3)" }}>
            <div
              className="h-7 mb-1"
              style={{
                background: "repeating-linear-gradient(90deg, #fff 0, #fff 2px, transparent 2px, transparent 3px, #fff 3px, #fff 5px, transparent 5px, transparent 6px, #fff 6px, #fff 7px, transparent 7px, transparent 10px, #fff 10px, #fff 13px, transparent 13px, transparent 14px, #fff 14px, #fff 15px, transparent 15px, transparent 18px)",
              }}
            />
            <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] text-white/85">
              BNDY · {dayNum.toString().padStart(3, "0")} · {year}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // ════════════════════════════════════════════════════════
  // 5. SETLIST
  // ════════════════════════════════════════════════════════
  const renderSetlist = () => (
    <motion.div
      onClick={(e) => e.stopPropagation()}
      initial={{ opacity: 0, rotate: -3, scale: 0.95 }}
      animate={{ opacity: 1, rotate: -1.2, scale: 1 }}
      exit={{ opacity: 0, rotate: 3, scale: 0.95 }}
      className="relative pt-4"
    >
      {/* Tape strips */}
      <div
        className="absolute -top-2 left-3.5 w-[60px] h-[22px] z-10"
        style={{
          background: "rgba(255, 230, 100, 0.55)",
          border: "1px solid rgba(180, 140, 30, 0.2)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
          transform: "rotate(-8deg)",
        }}
      />
      <div
        className="absolute -top-2 right-3.5 w-[60px] h-[22px] z-10"
        style={{
          background: "rgba(255, 230, 100, 0.55)",
          border: "1px solid rgba(180, 140, 30, 0.2)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
          transform: "rotate(6deg)",
        }}
      />

      {/* Paper */}
      <div
        className="relative w-[320px] px-7 pt-6 pb-6"
        style={{
          background: "#fefcf3",
          color: "#1a1a1a",
          boxShadow: "0 1px 0 rgba(255,255,255,0.04), 2px 22px 36px -10px rgba(0,0,0,0.6), 0 8px 16px -4px rgba(0,0,0,0.3)",
          transformOrigin: "center top",
        }}
      >
        {/* Paper texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95'/%3E%3CfeColorMatrix values='0 0 0 0 0.1, 0 0 0 0 0.08, 0 0 0 0 0.05, 0 0 0 0.12 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E")`,
            mixBlendMode: "multiply",
            opacity: 0.6,
          }}
        />

        {/* Tonight stamp */}
        <div
          className="absolute top-[18px] right-5 font-[family-name:var(--font-typewriter)] text-[10px] tracking-[0.2em] uppercase text-[#c41e3a] border-[1.5px] border-[#c41e3a] px-2 py-1 opacity-80 z-[5]"
          style={{ transform: "rotate(7deg)" }}
        >
          ★ {isToday ? "Tonight" : isTomorrow ? "Tomorrow" : formattedDateShort} ★
        </div>

        {/* Artist */}
        {artistId ? (
          <Link
            href={`/artists/${artistId}`}
            onClick={(e) => e.stopPropagation()}
            className="block font-[family-name:var(--font-marker)] text-[28px] sm:text-[36px] tracking-[0.005em] leading-[0.95] uppercase mb-1 hover:text-[#c41e3a] transition-colors"
            style={{ transform: "rotate(0.5deg)" }}
          >
            {artistName}
          </Link>
        ) : (
          <h1
            className="font-[family-name:var(--font-marker)] text-[28px] sm:text-[36px] tracking-[0.005em] leading-[0.95] uppercase mb-1"
            style={{ transform: "rotate(0.5deg)" }}
          >
            {artistName}
          </h1>
        )}

        {/* Venue */}
        <div
          className="font-[family-name:var(--font-marker)] text-lg text-[#1a4a8a] leading-none mb-4"
          style={{ transform: "rotate(-0.4deg)" }}
        >
          @{" "}
          <Link
            href={`/venues/${currentEvent.venueId}`}
            onClick={(e) => e.stopPropagation()}
            className="border-b-[1.5px] border-[#1a4a8a] hover:text-[#c41e3a] hover:border-[#c41e3a] transition-colors"
          >
            {venueName}
          </Link>
          , {venueCity}
        </div>

        {/* Rule */}
        <hr className="border-0 border-t-2 border-[#1a1a1a] mb-3" style={{ transform: "rotate(0.3deg)" }} />

        {/* List */}
        <ol className="list-none p-0 space-y-0">
          {[
            { label: formattedDateShort, value: null, highlight: true },
            { label: `From ${formattedTime}`, value: null },
            { label: distanceDisplay ? `${distanceDisplay} away` : "Local gig", value: null },
            { label: "Entry —", value: isFree ? "FREE!" : priceDisplay, isFree },
          ].map((item, i) => (
            <li
              key={i}
              className="font-[family-name:var(--font-marker)] text-lg leading-[1.6] grid grid-cols-[28px_1fr_auto] gap-2 items-baseline border-b border-[rgba(26,26,26,0.15)] py-1"
            >
              <span className="text-[#c41e3a] text-base">{i + 1}.</span>
              <span className={item.highlight ? "text-[#c41e3a]" : "text-[#1a1a1a]"}>{item.label}</span>
              {item.value && (
                <span
                  className={`text-[22px] ${item.isFree ? "text-[#2a8538]" : "text-[#c41e3a]"}`}
                  style={item.isFree ? { transform: "rotate(-2deg)", display: "inline-block" } : {}}
                >
                  {item.value}
                </span>
              )}
            </li>
          ))}
        </ol>

        {/* Encore */}
        <div
          className="mt-3.5 font-[family-name:var(--font-marker)] text-sm text-[#1a4a8a] uppercase tracking-[0.05em] text-center border-2 border-[#1a4a8a] py-1.5"
          style={{ transform: "rotate(-1deg)" }}
        >
          ★ Don't be late ★
        </div>
      </div>
    </motion.div>
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
              className="absolute top-2 left-2 z-30 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:rotate-180 duration-300"
              title="Switch theme"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>

            {/* Navigation */}
            {events.length > 1 && (
              <div className="flex justify-center items-center gap-4 mt-4">
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  className="px-4 py-2 text-sm font-bold bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg"
                >
                  ← Prev
                </button>
                <span className="text-white/80 text-sm font-mono">
                  {currentIndex + 1} / {events.length}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="px-4 py-2 text-sm font-bold bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg"
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

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
