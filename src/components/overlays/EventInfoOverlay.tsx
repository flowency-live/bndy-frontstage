// src/components/overlays/EventInfoOverlay.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Clock, Ticket, ExternalLink, Music, Building, ChevronDown } from "lucide-react";
import { Event } from "@/lib/types";
import { formatEventDate, formatTime } from "@/lib/utils/date-utils";
import Link from "next/link";

interface EventInfoOverlayProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  position?: 'map' | 'list';
  verticalOffset?: number; // New prop for configurability
}

export default function EventInfoOverlay({ 
  event, 
  isOpen, 
  onClose,
  position = 'map',
  verticalOffset = 50 // CONFIG: Event Window Position
}: EventInfoOverlayProps) {
  const [showMore, setShowMore] = useState(false);

  // Format the date and time
  const formattedDate = formatEventDate(new Date(event.date));
  const formattedTime = formatTime(event.startTime);
  
  // Only get postcode if available (will be enhanced later)
  const venuePostcode = event.postcode || "";
  
  // Create Google Maps URL
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${event.venueName}, ${venuePostcode}`
  )}`;

  // Create dynamic styling based on position context
  const overlayStyles = position === 'map'
    ? 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50'
    : 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={overlayStyles}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-[300px] p-4 bg-[var(--background)] rounded-lg shadow-lg border-2 border-[var(--primary)]/20 relative"
          >
            {/* Close button */}
            <button 
              onClick={onClose}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-[var(--foreground)]" />
            </button>

            <div className="space-y-4 mt-2">
              {/* Header with event name */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 bg-[var(--primary)]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Music className="w-4 h-4 text-[var(--primary)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">
                      {event.name}
                    </h3>
                    <p className="text-xs text-[var(--foreground)]/70">
                      {formattedDate}
                    </p>
                  </div>
                </div>

                {/* Venue section */}
                <div 
                  className="block p-2 -mx-2 rounded-md hover:bg-[var(--secondary)]/5 transition-colors group cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(mapUrl, '_blank');
                  }}
                >
                  <div className="flex items-start gap-2">
                    <Building className="w-4 h-4 text-[var(--foreground)]/70 group-hover:text-[var(--secondary)] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium group-hover:text-[var(--secondary)] transition-colors">
                          {event.venueName}
                        </span>
                        <ExternalLink className="w-3 h-3 text-[var(--foreground)]/50" />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--foreground)]/70">
                        <MapPin className="w-3 h-3" />
                        <span>{venuePostcode || "View on map"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time information */}
              <div className="flex items-center gap-1.5 text-sm text-[var(--foreground)]/70">
                <Clock className="w-3.5 h-3.5" />
                <span>{formattedTime}</span>
                {event.endTime && <span>- {formatTime(event.endTime)}</span>}
              </div>

              {/* Ticket information */}
              <div className="flex items-center gap-1.5 text-sm text-[var(--foreground)]/70">
                <Ticket className="w-3.5 h-3.5" />
                <span>{event.ticketPrice || "£ree Entry"}</span>
                {event.ticketUrl && (
                  <a
                    href={event.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-[var(--primary)] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Buy Tickets
                  </a>
                )}
              </div>

              {/* Description - conditionally show if exists */}
              {event.description && (
                <p className="text-sm text-[var(--foreground)]/70">{event.description}</p>
              )}

              {/* Collapsible action buttons section */}
              <div>
                <button 
                  onClick={() => setShowMore(!showMore)}
                  className="flex items-center justify-center gap-2 pt-2 w-full text-sm text-[var(--foreground)]/70 hover:text-[var(--primary)] transition-colors"
                >
                  <span>More options</span>
                  <motion.div
                    animate={{ rotate: showMore ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    <ChevronDown className="w-4 h-4" />
                    <AnimatePresence>
                      {!showMore && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 blur-sm bg-[var(--primary)]/30 rounded-full animate-pulse"
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showMore && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-2 pt-4">
                        {/* Venue page link */}
                        <Link href={`/venues/${event.venueId}`} className="group">
                          <div 
                            className="text-center p-2 rounded-md border border-gray-200 dark:border-gray-700 hover:border-[var(--secondary)]/50 transition-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Building className="w-4 h-4 mx-auto text-[var(--foreground)]/70 group-hover:text-[var(--secondary)]" />
                            <span className="text-xs font-medium block mt-1 group-hover:text-[var(--secondary)]">
                              Venue Page
                            </span>
                          </div>
                        </Link>
                        
                        {/* Artist page link - assuming artistIds[0] is the main artist */}
                        {event.artistIds && event.artistIds.length > 0 && (
                          <Link href={`/artists/${event.artistIds[0]}`} className="group">
                            <div 
                              className="text-center p-2 rounded-md border border-gray-200 dark:border-gray-700 hover:border-[var(--primary)]/50 transition-all"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Music className="w-4 h-4 mx-auto text-[var(--foreground)]/70 group-hover:text-[var(--primary)]" />
                              <span className="text-xs font-medium block mt-1 group-hover:text-[var(--primary)]">
                                Artist Page
                              </span>
                            </div>
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}