// src/components/overlays/VenueInfoOverlay.tsx
"use client";

/**
 * VenueInfoOverlay — neon glass venue details
 *
 * Design source of truth: Projects/bndy/design-kit/venue-modal-kit.html
 * Styles: src/styles/venue-overlay.css (imported in app/layout.tsx)
 *
 * Desktop (md+): floating card docked right, map stays alive (no backdrop dim).
 * Mobile: bottom sheet — collapsed peek (NEXT GIG strip) → drag/tap to expand.
 * Accent follows the marker: pink = venue has upcoming gigs, cyan = idle.
 */

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  X,
  Navigation,
  Globe,
  Facebook,
  Instagram,
  Plus,
  ChevronRight,
  Music,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetHeader,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import SocialShareButton from "@/components/shared/SocialShareButton";
import { Venue, Event, SocialMediaURL } from "@/lib/types";
import { getDirectionsUrl } from "@/lib/utils/mapLinks";
import { formatTime } from "@/lib/utils/date-utils";
import { useAllPublicEvents } from "@/hooks/useAllPublicEvents";
import { useArtistImages, getArtistImage } from "@/hooks/useArtistImages";
import { BaseEventWizard } from "@/components/events/BaseEventWizard";
import { useIsMobile } from "@/hooks/useIsMobile";

interface VenueInfoOverlayProps {
  venue: Venue;
  isOpen: boolean;
  onClose: () => void;
  position?: "map" | "list";
  /** Upcoming events for this venue. Fetched internally when omitted. */
  upcomingEvents?: Event[];
  /** Called when a gig row is clicked (e.g. open EventInfoOverlay). */
  onEventSelect?: (event: Event) => void;
}

const MAX_VISIBLE_GIGS = 4;
const SHEET_COLLAPSED_PX = 188;

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

export default function VenueInfoOverlay({
  venue,
  isOpen,
  onClose,
  position = "map",
  upcomingEvents,
  onEventSelect,
}: VenueInfoOverlayProps) {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Reset sheet state when a different venue opens
  useEffect(() => {
    setExpanded(false);
    setWizardOpen(false);
  }, [venue?.id, isOpen]);

  // Esc closes (desktop convenience)
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

  const today = todayLocalISO();

  // Fallback fetch when the parent doesn't supply events (e.g. list view)
  const { data: fetchedEvents = [] } = useAllPublicEvents({
    startDate: today,
    enabled: isOpen && !upcomingEvents,
  });

  const gigs = useMemo(() => {
    const source = upcomingEvents ?? fetchedEvents;
    return source
      .filter((e) => e.venueId === venue?.id && e.date >= today)
      .sort((a, b) =>
        a.date === b.date
          ? (a.startTime || "").localeCompare(b.startTime || "")
          : a.date.localeCompare(b.date),
      );
  }, [upcomingEvents, fetchedEvents, venue?.id, today]);

  const visibleGigs = gigs.slice(0, MAX_VISIBLE_GIGS);
  const isLive = gigs.length > 0;

  // Artist avatars for visible gig rows
  const { artistImages } = useArtistImages(
    visibleGigs.flatMap((g) => g.artistIds || []),
  );

  const directionsUrl = getDirectionsUrl(venue);
  const heroImage = venue?.profileImageUrl || venue?.imageUrl || null;
  const monogram = (venue?.name || "?").charAt(0).toUpperCase();

  const getSocialLink = (platform: string): string | undefined =>
    venue?.socialMediaUrls?.find(
      (social: SocialMediaURL) => social.platform === platform,
    )?.url;

  const websiteUrl = venue?.website || getSocialLink("website");
  const facebookUrl = getSocialLink("facebook");
  const instagramUrl = getSocialLink("instagram");

  const shareData = {
    title: `${venue?.name} | bndy`,
    text: `Check out ${venue?.name} on bndy.live`,
    url: `${typeof window !== "undefined" ? window.location.origin : ""}/venues/${venue?.id}`,
  };

  const accentClass = isLive ? "" : "vol-idle";

  /* ---------- shared fragments ---------- */

  const renderGigRow = (event: Event) => {
    const { dow, day, mon } = dateParts(event.date);
    const isTonight = event.date.slice(0, 10) === today;
    const artistLabel =
      event.artistName || (event.name !== "Unnamed Event" ? event.name : "TBA");
    const artistId = event.artistIds?.[0];
    const img = getArtistImage(artistImages, artistId);

    const row = (
      <>
        <span className="vol-gig-date">
          <span className="vol-dow">{dow}</span>
          <span className="vol-day">{day}</span>
          <span className="vol-mon">{mon}</span>
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
            artistLabel.charAt(0).toUpperCase()
          )}
        </span>
        <span className="vol-gig-info">
          <span className="vol-gig-artist">
            {artistLabel}
            {isTonight && <span className="vol-tonight">TONIGHT</span>}
          </span>
          <span className="vol-gig-meta">
            <b>{event.startTime ? formatTime(event.startTime) : "TBA"}</b>
            {event.isOpenMic ? " · Open mic" : ""}
            {event.ticketed ? " · Ticketed" : ""}
          </span>
        </span>
        <ChevronRight size={16} className="vol-gig-chev" />
      </>
    );

    if (!onEventSelect) {
      return (
        <div key={event.id} className="vol-gig-row" style={{ cursor: "default" }}>
          {row}
        </div>
      );
    }
    return (
      <button
        key={event.id}
        type="button"
        className="vol-gig-row"
        onClick={(e) => {
          e.stopPropagation();
          onEventSelect(event);
        }}
      >
        {row}
      </button>
    );
  };

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
      <Link
        href={`/venues/${venue?.id}`}
        className="vol-btn vol-btn-secondary"
        onClick={(e) => e.stopPropagation()}
      >
        <CalendarDays size={14} /> View gigs
      </Link>
      <span className="vol-share-wrap" onClick={(e) => e.stopPropagation()}>
        <SocialShareButton {...shareData} variant="icon" size="sm" />
      </span>
    </div>
  );

  const gigsSection = isLive ? (
    <>
      <div className="vol-gigs-head">
        <span className="vol-gigs-title">Upcoming gigs</span>
        <Link
          href={`/venues/${venue?.id}`}
          className="vol-gigs-all"
          onClick={(e) => e.stopPropagation()}
        >
          View all ↗
        </Link>
      </div>
      <div>{visibleGigs.map((event) => renderGigRow(event))}</div>
    </>
  ) : (
    <div className="vol-empty">
      <div className="vol-glyph">
        <Music size={24} />
      </div>
      <div className="vol-t1">No gigs listed yet</div>
      <div className="vol-t2">Know what&apos;s on here? Help keep live music alive.</div>
      <button
        type="button"
        className="vol-add-btn"
        onClick={(e) => {
          e.stopPropagation();
          setWizardOpen(true);
        }}
      >
        <Plus size={14} /> Add a gig
      </button>
    </div>
  );

  const socialsStrip = (websiteUrl || facebookUrl || instagramUrl) && (
    <div className="vol-contact" onClick={(e) => e.stopPropagation()}>
      {websiteUrl && (
        <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
          <Globe size={13} /> Website
        </a>
      )}
      {facebookUrl && (
        <a href={facebookUrl} target="_blank" rel="noopener noreferrer">
          <Facebook size={13} /> Facebook
        </a>
      )}
      {instagramUrl && (
        <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
          <Instagram size={13} /> Instagram
        </a>
      )}
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
      ? Math.min(Math.round(window.innerHeight * 0.72), 580)
      : 480;

  /* ---------- render ---------- */

  return (
    <>
      <AnimatePresence>
        {isOpen && !isMobile && (
          <div
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-end pr-[4vw]"
            data-position={position}
          >
            <motion.div
              className={`vol-card ${accentClass}`}
              initial={{ opacity: 0, scale: 0.92, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 14 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="vol-hero">
                {heroImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={heroImage} alt="" className="vol-hero-img" />
                )}
                <span className="vol-chip">{isLive ? "Live music venue" : "Venue"}</span>
                <button type="button" className="vol-close" onClick={onClose} aria-label="Close">
                  <X size={15} />
                </button>
                <div className="vol-monogram">{monogram}</div>
              </div>
              <div className="vol-body">
                <div className="vol-name-row">
                  <Link href={`/venues/${venue?.id}`} className="vol-name">
                    {venue?.name}
                  </Link>
                  {isLive && <span className="vol-live-dot" />}
                </div>
                <div className="vol-addr">
                  {venue?.address}
                  <br />
                  {venue?.city && <span className="vol-city">{venue.city}</span>}
                  {venue?.postcode && <> · {venue.postcode}</>}
                </div>
                {actions}
                {gigsSection}
                {socialsStrip}
              </div>
            </motion.div>
          </div>
        )}

        {isOpen && isMobile && (
          <motion.div
            className={`vol-sheet ${accentClass}`}
            initial={{ y: "100%" }}
            animate={{ y: 0, height: expanded ? expandedHeight : SHEET_COLLAPSED_PX }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.06, bottom: 0.25 }}
            onDragEnd={handleDragEnd}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="vol-sheet-handle"
              onClick={() => setExpanded((v) => !v)}
            >
              <span />
            </div>
            <div className="vol-sheet-head">
              <div className="vol-sheet-mono">
                {heroImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={heroImage} alt="" />
                ) : (
                  monogram
                )}
              </div>
              <div className="vol-sheet-names">
                <div className="vol-sheet-name">{venue?.name}</div>
                <div className="vol-sheet-addr">
                  {venue?.address}
                  {venue?.city ? ` · ${venue.city}` : ""}
                </div>
              </div>
              <button type="button" className="vol-sheet-close" onClick={onClose} aria-label="Close">
                <X size={13} />
              </button>
            </div>

            {isLive ? (
              <div className="vol-next-gig">
                <div className="vol-ng-tag">NEXT GIG</div>
                {renderGigRow(gigs[0])}
              </div>
            ) : (
              <div style={{ padding: "0 14px" }}>{gigsSection}</div>
            )}

            <div className="vol-sheet-body">
              {actions}
              {isLive && gigs.length > 1 && (
                <>
                  <div className="vol-gigs-head">
                    <span className="vol-gigs-title">Upcoming gigs</span>
                    <Link
                      href={`/venues/${venue?.id}`}
                      className="vol-gigs-all"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View all ↗
                    </Link>
                  </div>
                  <div
                    className="vol-sheet-gigs"
                    style={{ maxHeight: Math.max(expandedHeight - 330, 120) }}
                  >
                    {visibleGigs.slice(1).map((event) => renderGigRow(event))}
                  </div>
                </>
              )}
              {socialsStrip}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Community "Add a gig" wizard (idle venues) */}
      <Sheet open={wizardOpen} onOpenChange={setWizardOpen}>
        <SheetContent
          side="left"
          className="w-[400px] sm:w-[540px] bg-background border-r border-border safari-modal"
        >
          <VisuallyHidden>
            <SheetHeader>
              <SheetTitle>Add a gig at {venue?.name}</SheetTitle>
              <SheetDescription>
                Create a new event for this venue
              </SheetDescription>
            </SheetHeader>
          </VisuallyHidden>
          <BaseEventWizard
            initialVenue={venue}
            skipVenueStep
            onSuccess={() => setWizardOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
