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
  const eventsResponse = await fetch(`https://api.bndy.co.uk/api/venues/${venueId}/events`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store'
  });

  let events: Event[] = [];
  if (eventsResponse.ok) {
    const data = await eventsResponse.json();
    events = data.events || [];
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
