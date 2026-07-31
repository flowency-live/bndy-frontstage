"use client";

// bndy Map v2 — React wrapper around the imperative MapLibre controller.
// Drop-in replacement for the old MapboxMap: same props, same overlays,
// reads the same ViewToggle/Events contexts and data hooks.

import "maplibre-gl/dist/maplibre-gl.css";
import "./bndy-map.css";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useViewToggle } from "@/context/ViewToggleContext";
import { useEvents } from "@/context/EventsContext";
import { useVenues } from "@/hooks/useVenues";
import { useAllPublicEvents } from "@/hooks/useAllPublicEvents";
import { isDateInRangeUniversal, getFormattedDateRangeUniversal } from "@/lib/utils/date-filter-utils";
import { fuzzyMatch } from "@/lib/utils/fuzzy-search";
import type { Event, Venue } from "@/lib/types";
import EventInfoOverlay from "../overlays/EventInfoOverlay";
import VenueInfoOverlay from "../overlays/VenueInfoOverlay";
import { MapController } from "./MapController";
import { gigsToGeoJSON, venuesToGeoJSON } from "./geojson";
import { MapDateBar } from "./MapDateBar";
import { SKIN_ORDER, SKINS, DEFAULT_SKIN } from "./skins";
import type { SkinId } from "./types";

type FilterType = "artist" | "venue" | "nomatch" | null;

interface BndyMapProps {
  filterType?: FilterType;
  filterId?: string | null;
  entityExists?: boolean;
  onClearSearch?: () => void;
}

const SKIN_KEY = "bndy-skin-preference";

export default function BndyMap({ filterType, filterId }: BndyMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<MapController | null>(null);

  const { isDarkMode, mapMode, toggleTheme } = useViewToggle();
  const { dateRange } = useEvents();

  const [skin, setSkin] = useState<SkinId>(DEFAULT_SKIN);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SKIN_KEY) as SkinId | null;
      if (saved && SKINS[saved]) setSkin(saved);
    } catch { /* ignore */ }
  }, []);

  const { startDate, endDate } = useMemo(() => getFormattedDateRangeUniversal(dateRange), [dateRange]);
  const todayStr = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate()).toISOString().split("T")[0];
  }, []);

  const { data: rangeEventsRaw = [], isLoading: eventsLoading } = useAllPublicEvents({ startDate, endDate, enabled: true });
  const { data: allFutureEvents = [] } = useAllPublicEvents({ startDate: todayStr, endDate: undefined, enabled: true });
  const { data: venues = [], isLoading: venuesLoading } = useVenues();

  const venueIdsWithEvents = useMemo(() => {
    const s = new Set<string>();
    allFutureEvents.forEach((e) => { if (e.venueId) s.add(e.venueId); });
    return s;
  }, [allFutureEvents]);

  // events for the current range + active search filter
  const rangeEvents = useMemo(() => {
    let evs = rangeEventsRaw.filter((e) => isDateInRangeUniversal(new Date(e.date), dateRange));
    if (filterType && filterId && filterId.trim() !== "" && filterType !== "nomatch") {
      if (filterType === "artist") {
        evs = evs.filter((e) => fuzzyMatch(filterId, e.name) || (!!e.artistName && fuzzyMatch(filterId, e.artistName)));
      } else if (filterType === "venue") {
        evs = evs.filter((e) => fuzzyMatch(filterId, e.venueName));
      }
    }
    return evs;
  }, [rangeEventsRaw, dateRange, filterType, filterId]);

  const filteredVenues = useMemo(() => {
    if (filterType && filterId && filterId.trim() !== "" && filterType === "venue") {
      return venues.filter((v) => fuzzyMatch(filterId, v.name));
    }
    return venues;
  }, [venues, filterType, filterId]);

  const gigGeo = useMemo(() => gigsToGeoJSON(rangeEvents, todayStr), [rangeEvents, todayStr]);
  const venGeo = useMemo(() => venuesToGeoJSON(filteredVenues, venueIdsWithEvents), [filteredVenues, venueIdsWithEvents]);

  // overlay state
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showEvent, setShowEvent] = useState(false);
  const [showVenue, setShowVenue] = useState(false);

  const venueUpcoming = useMemo(
    () => (selectedVenue ? allFutureEvents.filter((e) => e.venueId === selectedVenue.id) : []),
    [selectedVenue, allFutureEvents],
  );

  // stable refs so controller callbacks always see fresh data
  const rangeEventsRef = useRef(rangeEvents); rangeEventsRef.current = rangeEvents;
  const venuesRef = useRef(venues); venuesRef.current = venues;
  const venueIdsRef = useRef(venueIdsWithEvents); venueIdsRef.current = venueIdsWithEvents;

  const openGig = useCallback((venueId: string, lngLat: [number, number]) => {
    const sibs = rangeEventsRef.current
      .filter((e) => e.venueId === venueId)
      .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
    if (!sibs.length) return;
    setSelectedEvents(sibs);
    setShowVenue(false);
    setShowEvent(true);
    controllerRef.current?.focus(lngLat, "gig");
  }, []);

  const openVenue = useCallback((venueId: string, lngLat: [number, number]) => {
    const v = venuesRef.current.find((x) => x.id === venueId);
    if (!v) return;
    setSelectedVenue(v);
    setShowEvent(false);
    setShowVenue(true);
    controllerRef.current?.focusZoom(lngLat, venueIdsRef.current.has(v.id) ? "live" : "idle", 13);
  }, []);

  // create the map once
  useEffect(() => {
    if (!containerRef.current || controllerRef.current) return;
    controllerRef.current = new MapController({
      container: containerRef.current,
      skin,
      isDark: isDarkMode,
      mode: mapMode,
      callbacks: { onGigClick: openGig, onVenueClick: openVenue },
    });
    controllerRef.current.setData(gigGeo, venGeo, false);
    return () => { controllerRef.current?.destroy(); controllerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // push updates
  useEffect(() => { controllerRef.current?.setData(gigGeo, venGeo, !!(filterId && filterId.trim())); }, [gigGeo, venGeo, filterId]);
  useEffect(() => { controllerRef.current?.setMode(mapMode); }, [mapMode]);
  useEffect(() => { controllerRef.current?.setTheme(isDarkMode); }, [isDarkMode]);
  useEffect(() => {
    controllerRef.current?.setSkin(skin);
    try { localStorage.setItem(SKIN_KEY, skin); } catch { /* ignore */ }
  }, [skin]);

  const onEventFromVenue = useCallback((event: Event) => {
    setSelectedEvents([event]);
    setShowVenue(false);
    setShowEvent(true);
  }, []);

  return (
    <div className="bndy-map-root">
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      {mapMode === "events" && <MapDateBar events={allFutureEvents} />}

      <button onClick={toggleTheme} title="Toggle light / dark" aria-label="Toggle light or dark map"
        style={{ position: "absolute", left: 12, bottom: 64, zIndex: 40, width: 40, height: 40, borderRadius: 12,
          border: "1px solid rgba(255,255,255,.1)", background: "rgba(12,16,26,.66)", backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)", color: "#f3f6fc", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center", boxShadow: "0 8px 30px rgba(0,0,0,.45)" }}>
        {isDarkMode ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
        )}
      </button>

      {/* live skin picker (Phase-1 preview; promotes to a user setting in Phase 2) */}
      <div style={{ position: "absolute", left: 12, bottom: 14, zIndex: 40, display: "flex", gap: 4, padding: 4, borderRadius: 14, background: "rgba(12,16,26,.66)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,.1)", boxShadow: "0 8px 30px rgba(0,0,0,.45)" }}>
        {SKIN_ORDER.map((id) => (
          <button key={id} onClick={() => setSkin(id)} title={SKINS[id].description}
            style={{ border: 0, cursor: "pointer", padding: "7px 11px", borderRadius: 11, fontWeight: 800, fontSize: 12, letterSpacing: 0.2,
              color: skin === id ? "#fff" : "#8b93a9",
              background: skin === id ? "linear-gradient(180deg,rgba(255,122,26,.30),rgba(255,122,26,.08))" : "transparent" }}>
            {SKINS[id].label}
          </button>
        ))}
      </div>

      {(eventsLoading && mapMode === "events") || (venuesLoading && mapMode === "venues") ? (
        <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 40, padding: "8px 14px", borderRadius: 12, background: "rgba(12,16,26,.72)", color: "#f3f6fc", font: "700 12px Inter, system-ui, sans-serif", border: "1px solid rgba(255,255,255,.1)" }}>
          loading {mapMode === "events" ? "gigs" : "venues"}…
        </div>
      ) : null}

      <EventInfoOverlay events={selectedEvents} isOpen={showEvent} onClose={() => { setShowEvent(false); controllerRef.current?.clearHero(); }} position="map" />
      {selectedVenue && (
        <VenueInfoOverlay
          venue={selectedVenue}
          isOpen={showVenue}
          onClose={() => { setShowVenue(false); controllerRef.current?.clearHero(); }}
          position="map"
          upcomingEvents={venueUpcoming}
          onEventSelect={onEventFromVenue}
        />
      )}
    </div>
  );
}
