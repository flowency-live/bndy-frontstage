// src/components/overlays/EventInfoOverlay.tsx
"use client";

/**
 * EventInfoOverlay — neon glass event details
 *
 * Replaces the five random novelty themes (gigPoster/chalkboard/letterboard/
 * backstagePass/setlist — recoverable in git history) with ONE coherent card
 * in the same family as VenueInfoOverlay. Orange accent ties the card to the
 * gig-map markers, the way the venue card matches pink/cyan venue markers.
 *
 * Styles: src/styles/venue-overlay.css (vol-* primitives + eo-* additions).
 * Desktop (md+): floating card docked right, map stays alive.
 * Mobile: bottom sheet — collapsed peek → drag/tap to expand.
 * Multiple events at one location render as tappable sibling rows
 * (replaces the old Prev/Next pager).
 */

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, Navigation, Ticket, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import SocialShareButton from "@/components/shared/SocialShareButton";
import EventDisclaimer from "@/components/shared/EventDisclaimer";
import { Event, Venue } from "@/lib/types";
import { getDirectionsUrl } from "@/lib/utils/mapLinks";
import { formatTime } from "@/lib/utils/date-utils";
import { formatArtistDisplay } from "@/lib/utils/artist-display";
import { getVenueById } from "@/lib/services/venue-service";
import { useArtist } from "@/hooks/useArtist";
import { useArtistImages, getArtistImage } from "@/hooks/useArtistImages";
import { useIsMobile } from "@/hooks/useIsMobile";

interface EventInfoOverlayProps {
  events: Event[];
  isOpen: boolean;
  onClose: () => void;
  position?: "map" | "list";
}

const SHEET_COLLAPSED_PX = 196;

function todayLocalISO(): string {
  return new Date().toLocaleDateString("en-CA");
}

function dateParts(dateStr: string): { dow: string; day: string; mon: string } {
  const d = new Date(`${dateStr.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return { dow: "—", day: "?", mon: "—" };
  return {
    dow: d.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase(),
    day: String(d.getDate()),
    mon: d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase(),
  };
}

export default function EventInfoOverlay({
  events,
  isOpen,
  onClose,
  position = "map",
}: EventInfoOverlayProps) {
  const isMobile = useIsMobile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [venue, setVenue] = useState<Venue | null>(null);

  const currentEvent = events[currentIndex] ?? events[0];

  // Reset when a new event group opens
  useEffect(() => {
    setCurrentIndex(0);
    setExpanded(false);
  }, [events, isOpen]);

  // Esc closes
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Mobile: clear the floating map buttons out of the way while open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("bndy-overlay-open", isOpen && isMobile);
    return () => {
      document.body.classList.remove("bndy-overlay-open");
    };
  }, [isOpen, isMobile]);

  // Venue record (for precise directions / googlePlaceId)
  useEffect(() => {
    if (currentEvent?.venueId) {
      getVenueById(currentEvent.venueId)
        .then((v) => setVenue(v))
        .catch(() => {});
    }
  }, [currentEvent?.venueId]);

  const artistId = currentEvent?.artistIds?.[0];
  const { data: artist } = useArtist(artistId);

  // Avatars for sibling rows
  const { artistImages } = useArtistImages(
    events.flatMap((e) => e.artistIds || []),
  );

  const today = todayLocalISO();

  const derived = useMemo(() => {
    if (!currentEvent) return null;
    const isOpenMic = currentEvent.isOpenMic || false;
    const hasMultipleArtists =
      currentEvent.artistIds && currentEvent.artistIds.length > 1;

    const artistName = isOpenMic && artist
      ? `Open Mic with ${artist.name}`
      : isOpenMic
        ? "Open Mic"
        : hasMultipleArtists
          ? formatArtistDisplay(currentEvent)
          : artist?.name || currentEvent.name || "Live Music";

    const dateOnly = currentEvent.date.slice(0, 10);
    const isToday = dateOnly === today;
    const tomorrow = new Date(`${today}T12:00:00`);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = dateOnly === tomorrow.toLocaleDateString("en-CA");

    const rawPrice = currentEvent.price || currentEvent.ticketinformation;
    const priceValue = rawPrice?.replace(/^from\s+/i, "");
    const hasTicketInfo = !!(
      currentEvent.ticketUrl ||
      (priceValue && priceValue !== "Free" && priceValue !== "0")
    );
    const priceDisplay = hasTicketInfo
      ? (priceValue || "Tickets")
      : null;

    const distanceMiles = (currentEvent as Event & { distanceMiles?: number })
      .distanceMiles;

    return {
      isOpenMic,
      artistName,
      isToday,
      isTomorrow,
      hasTicketInfo,
      priceDisplay,
      venueName: venue?.name || currentEvent.venueName || "Venue",
      venueCity: currentEvent.venueCity || venue?.city || "",
      distanceDisplay: distanceMiles ? `${Math.round(distanceMiles)} mi` : "",
      dateChip: isToday
        ? "TONIGHT"
        : isTomorrow
          ? "TOMORROW"
          : `${dateParts(currentEvent.date).dow} ${dateParts(currentEvent.date).day} ${dateParts(currentEvent.date).mon}`,
    };
  }, [currentEvent, artist, venue, today]);

  if (!currentEvent || !derived) return null;

  const { dow, day, mon } = dateParts(currentEvent.date);
  const formattedTime = currentEvent.startTime
    ? formatTime(currentEvent.startTime)
    : "TBA";

  const heroImage = artist?.profileImageUrl || null;
  const directionsUrl = venue
    ? getDirectionsUrl(venue)
    : currentEvent.location
      ? getDirectionsUrl({
          location: currentEvent.location,
          name: derived.venueName,
        })
      : "";

  const shareData = {
    title: `${derived.artistName} | bndy`,
    text: `${derived.artistName} at ${derived.venueName} — ${dow} ${day} ${mon}`,
  };

  const siblings = events.filter((_, i) => i !== currentIndex);

  /* ---------- shared fragments ---------- */

  const chips = (
    <div className="eo-chips">
      <span
        className={`eo-chip ${derived.isToday ? "eo-chip-tonight" : ""}`}
      >
        {derived.dateChip}
      </span>
      {derived.isOpenMic && <span className="eo-chip">Open mic</span>}
    </div>
  );

  const titleBlock = (
    <>
      {artistId ? (
        <Link
          href={`/artists/${artistId}`}
          className="eo-artist"
          onClick={(e) => e.stopPropagation()}
        >
          {derived.artistName}
        </Link>
      ) : (
        <span className="eo-artist">{derived.artistName}</span>
      )}
      <div className="eo-venue-line">
        at{" "}
        <Link
          href={`/venues/${currentEvent.venueId}`}
          onClick={(e) => e.stopPropagation()}
        >
          {derived.venueName}
        </Link>
        {derived.venueCity && <> · {derived.venueCity}</>}
        {derived.distanceDisplay && <> · {derived.distanceDisplay}</>}
      </div>
    </>
  );

  const tiles = (
    <div className="eo-tiles">
      <div className="eo-tile">
        <span className="eo-l">{dow}</span>
        <span className="eo-v">
          {day} {mon}
        </span>
      </div>
      <div className="eo-tile">
        <span className="eo-l">From</span>
        <span className="eo-v">{formattedTime}</span>
      </div>
      {derived.hasTicketInfo && (
        <div className="eo-tile">
          <span className="eo-l">Entry</span>
          <span className="eo-v">{derived.priceDisplay}</span>
        </div>
      )}
    </div>
  );

  const actions = (
    <div className="vol-actions">
      {directionsUrl && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="vol-btn vol-btn-primary"
          onClick={(e) => e.stopPropagation()}
        >
          <Navigation size={14} /> Directions
        </a>
      )}
      {currentEvent.ticketUrl ? (
        <a
          href={currentEvent.ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="vol-btn vol-btn-secondary"
          onClick={(e) => e.stopPropagation()}
        >
          <Ticket size={14} /> Tickets
        </a>
      ) : (
        artistId && (
          <Link
            href={`/artists/${artistId}`}
            className="vol-btn vol-btn-secondary"
            onClick={(e) => e.stopPropagation()}
          >
            <User size={14} /> Artist
          </Link>
        )
      )}
      <span className="vol-share-wrap" onClick={(e) => e.stopPropagation()}>
        <SocialShareButton {...shareData} variant="icon" size="sm" />
      </span>
    </div>
  );

  const renderSiblingRow = (event: Event) => {
    const parts = dateParts(event.date);
    const isTonight = event.date.slice(0, 10) === today;
    const label =
      event.artistName ||
      (event.name !== "Unnamed Event" ? event.name : "Live Music");
    const img = getArtistImage(artistImages, event.artistIds?.[0]);
    const idx = events.indexOf(event);

    return (
      <button
        key={event.id}
        type="button"
        className="vol-gig-row"
        onClick={(e) => {
          e.stopPropagation();
          setCurrentIndex(idx >= 0 ? idx : 0);
        }}
      >
        <span className="vol-gig-date">
          <span className="vol-dow">{parts.dow}</span>
          <span className="vol-day">{parts.day}</span>
          <span className="vol-mon">{parts.mon}</span>
        </span>
        <span
          className="vol-avatar"
          style={
            !img?.profileImageUrl && img?.displayColour
              ? { background: img.displayColour }
              : undefined
          }
        >
          {img?.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img.profileImageUrl} alt="" loading="lazy" />
          ) : (
            label.charAt(0).toUpperCase()
          )}
        </span>
        <span className="vol-gig-info">
          <span className="vol-gig-artist">
            {label}
            {isTonight && <span className="vol-tonight">TONIGHT</span>}
          </span>
          <span className="vol-gig-meta">
            <b>{event.startTime ? formatTime(event.startTime) : "TBA"}</b>
            {event.isOpenMic ? " · Open mic" : ""}
          </span>
        </span>
        <ChevronRight size={16} className="vol-gig-chev" />
      </button>
    );
  };

  const siblingsSection = siblings.length > 0 && (
    <>
      <div className="vol-gigs-head">
        <span className="vol-gigs-title">Also on here</span>
      </div>
      <div>{siblings.map(renderSiblingRow)}</div>
    </>
  );

  const description = currentEvent.description && (
    <p className="eo-desc">{currentEvent.description}</p>
  );

  const disclaimer = (
    <div className="eo-disclaimer" onClick={(e) => e.stopPropagation()}>
      <EventDisclaimer variant="compact" />
    </div>
  );

  /* ---------- mobile sheet drag ---------- */

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -60) {
      setExpanded(true);
    } else if (info.offset.y > 60) {
      if (expanded) setExpanded(false);
      else onClose();
    }
  };

  const expandedHeight =
    typeof window !== "undefined"
      ? Math.min(Math.round(window.innerHeight * 0.72), 600)
      : 500;

  /* ---------- render ---------- */

  return (
    <AnimatePresence>
      {isOpen && !isMobile && (
        <div
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-end pr-[4vw]"
          data-position={position}
        >
          <motion.div
            key={currentEvent.id}
            className="vol-card vol-gig"
            initial={{ opacity: 0, scale: 0.92, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 14 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="eo-hero">
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroImage} alt="" className="eo-hero-img" />
              ) : (
                <div className="eo-hero-mono">
                  {derived.artistName.charAt(0).toUpperCase()}
                </div>
              )}
              {chips}
              <button
                type="button"
                className="vol-close"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
            <div className="vol-body">
              {titleBlock}
              {tiles}
              {actions}
              {description}
              {siblingsSection}
              {disclaimer}
            </div>
          </motion.div>
        </div>
      )}

      {isOpen && isMobile && (
        <motion.div
          className="vol-sheet vol-gig"
          initial={{ y: "100%" }}
          animate={{
            y: 0,
            height: expanded ? expandedHeight : SHEET_COLLAPSED_PX,
          }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.06, bottom: 0.25 }}
          onDragEnd={handleDragEnd}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="vol-sheet-handle" onClick={() => setExpanded((v) => !v)}>
            <span />
          </div>
          <div className="vol-sheet-head">
            <div className="vol-sheet-mono">
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroImage} alt="" />
              ) : (
                derived.artistName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="vol-sheet-names">
              <div className="vol-sheet-name">
                {derived.artistName}
                {derived.isToday && <span className="vol-tonight">TONIGHT</span>}
              </div>
              <div className="vol-sheet-addr">
                {derived.venueName}
                {derived.venueCity ? ` · ${derived.venueCity}` : ""}
              </div>
            </div>
            <button
              type="button"
              className="vol-sheet-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={13} />
            </button>
          </div>

          <div className="vol-sheet-body">
            {tiles}
            {actions}
            {description}
            {siblings.length > 0 && (
              <>
                <div className="vol-gigs-head">
                  <span className="vol-gigs-title">Also on here</span>
                </div>
                <div
                  className="vol-sheet-gigs"
                  style={{ maxHeight: Math.max(expandedHeight - 380, 110) }}
                >
                  {siblings.map(renderSiblingRow)}
                </div>
              </>
            )}
            {disclaimer}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
