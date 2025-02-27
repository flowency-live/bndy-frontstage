// src/components/shared/TodayEventHighlight.tsx
import { useState } from 'react';
import { Event } from "@/lib/types";
import { Ticket, Map, Calendar, Clock, Sparkles } from "lucide-react";
import { formatTime } from "@/lib/utils/date-utils";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

interface TodayEventHighlightProps {
  event: Event;
  contextType: 'artist' | 'venue';
  onSelectEvent: (event: Event) => void;
}

export default function TodayEventHighlight({ 
  event, 
  contextType, 
  onSelectEvent 
}: TodayEventHighlightProps) {
  // Create Google Maps URL with just venue name
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    event.venueName
  )}`;

  return (
    <Card 
      className="relative p-0 overflow-hidden cursor-pointer border-l-4 hover:shadow-lg transition-all duration-300"
      style={{ 
        borderLeftColor: 'var(--primary)',
        boxShadow: '0 0 15px var(--primary-translucent)'
      }}
      onClick={() => onSelectEvent(event)}
    >
      {/* Sparkle badge */}
      <div className="absolute top-0 right-0 bg-[var(--primary)] text-white px-3 py-1 flex items-center gap-1 rounded-bl-md">
        <Sparkles className="w-4 h-4 animate-pulse" />
        <span className="text-sm font-medium">Event Today!</span>
      </div>

      <div className="p-4 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          {/* Time/date column */}
          <div className="sm:col-span-2 flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-1">
            <div className="flex items-center text-[var(--foreground)]/70">
              <Clock className="w-4 h-4 mr-1" />
              <span className="text-base font-medium">{formatTime(event.startTime)}</span>
            </div>
            <div className="flex items-center text-[var(--foreground)]/70">
              <Calendar className="w-4 h-4 mr-1" />
              <span className="text-sm">Today</span>
            </div>
          </div>

          {/* Event details column */}
          <div className="sm:col-span-8">
            <h3 className="text-xl font-bold text-[var(--primary)]">{event.name}</h3>
            
            {/* Show either venue or artist info depending on the context */}
            {contextType === 'artist' && (
              <div className="flex items-center mt-1 text-[var(--foreground)]/70">
                <Link 
                  href={`/venues/${event.venueId}`}
                  className="flex items-center hover:text-[var(--secondary)]" 
                  onClick={(e) => e.stopPropagation()}
                >
                  <Map className="w-4 h-4 mr-1 text-[var(--secondary)]" />
                  <span>{event.venueName}</span>
                </Link>
              </div>
            )}
            
            {contextType === 'venue' && event.artistIds && event.artistIds.length > 0 && (
              <div className="flex items-center mt-1">
                <Link 
                  href={`/artists/${event.artistIds[0]}`}
                  className="flex items-center hover:text-[var(--primary)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[var(--foreground)]/70">
                    {/* Note: We need to replace "Artist Name" with real data */}
                    Featured Artist
                  </span>
                </Link>
              </div>
            )}
            
            {event.description && (
              <p className="mt-2 text-sm text-[var(--foreground)]/70 line-clamp-2">
                {event.description}
              </p>
            )}
          </div>

          {/* Price column */}
          <div className="sm:col-span-2 flex justify-start sm:justify-end items-center">
            {event.ticketPrice ? (
              <div className="flex items-center text-[var(--foreground)]">
                <Ticket className="w-5 h-5 mr-1 text-[var(--primary)]" />
                <span className="font-medium">{event.ticketPrice}</span>
              </div>
            ) : (
              <div className="px-3 py-1 rounded-full bg-[var(--secondary)]/10 text-[var(--secondary)] font-medium text-sm">
                Free Entry
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}