"use client";

import { Event } from "@/lib/types";
import Link from "next/link";
import LazyContentImage from "./LazyContentImage";

interface UpcomingEventsProps {
  events: Event[];
}

interface EventCardProps {
  event: Event;
}

function EventCard({ event }: EventCardProps) {
  // Format date with clear visual hierarchy
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    return { month, day, weekday };
  };

  // Format time for better readability
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    
    // Handle both HH:MM and HH:MM:SS formats
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    
    return `${hour12}:${minutes} ${ampm}`;
  };

  const { month, day, weekday } = formatEventDate(event.date);
  const formattedTime = formatTime(event.startTime);

  // Handle card click for navigation to event details
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or links
    if ((e.target as HTMLElement).closest('a, button')) {
      return;
    }
    
    // Navigate to event details with smooth transition
    // Priority: ticketUrl > eventUrl > fallback to external search
    if (event.ticketUrl) {
      // Smooth transition to ticket page
      const link = document.createElement('a');
      link.href = event.ticketUrl;
      link.target = '_blank';
      link.rel = 'noopener,noreferrer';
      link.style.transition = 'all 0.3s ease';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (event.eventUrl) {
      // Smooth transition to event details
      const link = document.createElement('a');
      link.href = event.eventUrl;
      link.target = '_blank';
      link.rel = 'noopener,noreferrer';
      link.style.transition = 'all 0.3s ease';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Fallback: search for event online
      const searchQuery = encodeURIComponent(`${event.name} ${event.venueName} ${event.date}`);
      const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
      const link = document.createElement('a');
      link.href = searchUrl;
      link.target = '_blank';
      link.rel = 'noopener,noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Use same navigation logic as click
      handleCardClick(e as unknown as React.MouseEvent);
    }
  };

  return (
    <div 
      className="event-card-animated card-interactive focus-enhanced touch-feedback gpu-layer event-card-touch event-card-focus event-card-motion relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 hover:shadow-2xl hover:border-blue-400 dark:hover:border-blue-400 transition-all duration-300 ease-out group cursor-pointer transform hover:-translate-y-2 hover:scale-[1.03] active:scale-[0.97] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`View details for ${event.name} on ${new Date(event.date).toLocaleDateString()}`}
      onTouchStart={() => {}} // Enable touch interactions on mobile
    >
      <div className="flex gap-4">
        {/* Optional Event Image - Lazy loaded for performance */}
        {event.imageUrl && (
          <div className="flex-shrink-0 hidden sm:block">
            <LazyContentImage
              src={event.imageUrl}
              alt={`${event.name} event image`}
              width={80}
              height={80}
              className="w-20 h-20 rounded-lg object-cover"
              sizes="80px"
              quality={75}
              fallback={
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎵</span>
                </div>
              }
            />
          </div>
        )}
        {/* Date Section - Mobile-optimized with clear visual hierarchy */}
        <div className="flex-shrink-0">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 group-hover:from-blue-600 group-hover:to-blue-700 group-active:from-blue-700 group-active:to-blue-800 text-white rounded-lg p-3 text-center min-w-[60px] shadow-sm group-hover:shadow-lg group-active:shadow-md transition-all duration-300 ease-out transform group-hover:scale-105 group-active:scale-95">
            <div className="text-xs font-medium uppercase tracking-wide opacity-90 group-hover:opacity-100 transition-opacity duration-300">
              {month}
            </div>
            <div className="text-xl font-bold leading-none group-hover:scale-110 transition-transform duration-300">
              {day}
            </div>
            <div className="text-xs opacity-90 group-hover:opacity-100 mt-1 transition-opacity duration-300">
              {weekday}
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Event Name */}
          <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300 ease-out transform group-hover:translate-x-1">
            {event.name}
          </h3>

          {/* Event Info Grid - Mobile-optimized spacing */}
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            {/* Time */}
            {formattedTime && (
              <div className="flex items-center gap-2 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
                <span className="text-blue-500 text-base group-hover:scale-110 transition-transform duration-300">🕐</span>
                <span className="font-medium">{formattedTime}</span>
                {event.endTime && (
                  <span className="text-gray-400">
                    - {formatTime(event.endTime)}
                  </span>
                )}
              </div>
            )}

            {/* Venue - Clickable link with proper spacing */}
            <div className="flex items-center gap-2 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
              <span className="text-blue-500 text-base group-hover:scale-110 transition-transform duration-300">📍</span>
              <Link 
                href={`/venues/${event.venueId}`}
                className="font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline-offset-2 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {event.venueName}
              </Link>
            </div>

            {/* Price */}
            {event.price && (
              <div className="flex items-center gap-2 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
                <span className="text-green-500 text-base group-hover:scale-110 transition-transform duration-300">💰</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {event.price}
                </span>
              </div>
            )}

            {/* Ticket Information */}
            {event.ticketinformation && (
              <div className="flex items-start gap-2 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
                <span className="text-purple-500 text-base mt-0.5 group-hover:scale-110 transition-transform duration-300">🎫</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {event.ticketinformation}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons - Mobile-friendly with enhanced interactions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {event.ticketUrl && (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-medium text-sm transition-all duration-200 ease-out active:scale-95 shadow-sm hover:shadow-lg transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={() => {}} // Enable touch feedback
              >
                <span className="mr-2 transition-transform duration-200 group-hover:scale-110">🎫</span>
                Get Tickets
              </a>
            )}
            
            {event.eventUrl && (
              <a
                href={event.eventUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg font-medium text-sm transition-all duration-200 ease-out active:scale-95 shadow-sm hover:shadow-md transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={() => {}} // Enable touch feedback
              >
                <span className="mr-2 transition-transform duration-200 group-hover:scale-110">ℹ️</span>
                Event Details
              </a>
            )}
            
            {/* Show a "More Info" button if no specific URLs are available */}
            {!event.ticketUrl && !event.eventUrl && (
              <button
                className="inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 active:from-purple-700 active:to-blue-700 text-white rounded-lg font-medium text-sm transition-all duration-200 ease-out active:scale-95 shadow-sm hover:shadow-lg transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(e as unknown as React.MouseEvent);
                }}
                onTouchStart={() => {}} // Enable touch feedback
              >
                <span className="mr-2 transition-transform duration-200 group-hover:scale-110">🔍</span>
                Find More Info
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced click indicator with ripple effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />
      
      {/* Subtle border glow on hover */}
      <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-blue-400/20 dark:group-hover:border-blue-400/30 transition-all duration-300 pointer-events-none" />
      
      {/* Click ripple effect */}
      <div className="absolute inset-0 rounded-xl bg-blue-500/10 opacity-0 group-active:opacity-100 transition-opacity duration-150 pointer-events-none" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 px-4">
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 border-2 border-dashed border-blue-200 dark:border-gray-600 rounded-2xl p-12 max-w-lg mx-auto shadow-sm hover:shadow-lg transition-all duration-500 ease-out group transform hover:scale-[1.02] hover:-translate-y-1">
        <div className="space-y-6">
          {/* Animated Icon with enhanced interactions */}
          <div className="relative">
            <div className="text-7xl group-hover:scale-125 transition-transform duration-700 ease-out animate-pulse group-hover:animate-none">
              🎵
            </div>
            <div className="absolute -top-2 -right-2 text-2xl opacity-70 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-300">
              ✨
            </div>
            <div className="absolute -bottom-1 -left-1 text-xl opacity-50 group-hover:opacity-80 group-hover:animate-pulse transition-all duration-300">
              🎤
            </div>
          </div>
          
          {/* Main message with enhanced typography */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300 transform group-hover:scale-105">
              No upcoming events
            </h3>
            <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm mx-auto group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
              This artist doesn&apos;t have any scheduled performances yet, but great things are coming!
            </p>
          </div>
          
          {/* Encouraging message with enhanced animation */}
          <div className="pt-4 space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-500 font-medium group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors duration-300">
              Check back soon for new shows! 🎤
            </p>
            <div className="flex justify-center space-x-2 opacity-60 group-hover:opacity-80 transition-opacity duration-300">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse group-hover:animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse group-hover:animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse group-hover:animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>

          {/* Call to action hint with subtle hover effect */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 group-hover:border-blue-200 dark:group-hover:border-gray-600 transition-colors duration-300">
            <p className="text-xs text-gray-400 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-500 transition-colors duration-300">
              Follow this artist to get notified when they announce new shows
            </p>
          </div>

          {/* Subtle background animation */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

export default function UpcomingEvents({ events }: UpcomingEventsProps) {
  // Filter and sort upcoming events
  const upcomingEvents = events
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <section className="upcoming-events-container space-y-4 sm:space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Upcoming Events
        </h2>
        {upcomingEvents.length > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
            {upcomingEvents.length} event{upcomingEvents.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Events List or Empty State */}
      {upcomingEvents.length > 0 ? (
        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </section>
  );
}