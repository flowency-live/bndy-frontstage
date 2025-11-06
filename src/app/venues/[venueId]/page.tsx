import { Metadata } from "next";
import { Venue, Event } from "@/lib/types";
import VenueProfileClient from "./VenueProfileClient";

export default async function VenueProfilePage({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;

  // Fetch venue data from API
  const venueResponse = await fetch(`https://api.bndy.co.uk/api/venues/${venueId}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store'
  });

  if (!venueResponse.ok) {
    console.error("Failed to fetch venue:", venueResponse.status);
    return <VenueProfileClient initialData={null} events={[]} error={`Failed to load venue: ${venueResponse.status}`} venueId={venueId} />;
  }

  const venueData = await venueResponse.json() as Venue;

  // Fetch events for this venue
  // Lambda requires startDate and endDate parameters
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const eventsResponse = await fetch(
    `https://api.bndy.co.uk/api/venues/${venueId}/events?startDate=${today}&endDate=${futureDate}`,
    {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    }
  );

  let events: Event[] = [];
  if (eventsResponse.ok) {
    const data = await eventsResponse.json();
    // Transform from DynamoDB format to frontend Event format
    events = (data.events || []).map((event: any) => ({
      id: event.id,
      name: event.title || event.name || 'Unnamed Event',
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      venueId: event.venueId,
      venueName: venueData.name,
      artistIds: event.artistId ? [event.artistId] : [],
      artistName: event.artist?.name || 'Unknown Artist',
      location: {
        lat: event.geoLat || venueData.latitude,
        lng: event.geoLng || venueData.longitude
      },
      description: event.description,
      ticketed: event.ticketed,
      ticketUrl: event.ticketUrl,
      eventUrl: event.eventUrl,
      source: event.source || 'bndy.live',
      status: event.status || 'approved',
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    } as Event));
  }

  return <VenueProfileClient initialData={venueData} events={events} venueId={venueId} />;
}

// Simplified metadata generation
export async function generateMetadata({ params }: { params: Promise<{ venueId: string }> }): Promise<Metadata> {
  const { venueId } = await params;

  try {
    const response = await fetch(`https://api.bndy.co.uk/api/venues/${venueId}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (!response.ok) {
      return {
        title: "Venue Not Found | bndy",
        description: "The venue you're looking for doesn't exist or has been removed.",
      };
    }

    const venue = await response.json() as Venue;

    return {
      title: `${venue.name} | bndy`,
      description: venue.description || `Discover ${venue.name} on bndy`,
    };
  } catch (error) {
    return {
      title: "Venue Profile | bndy",
      description: "Discover venues and their upcoming events on bndy.",
    };
  }
}
