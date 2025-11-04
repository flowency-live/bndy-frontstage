import { NextRequest, NextResponse } from "next/server";
import { Event } from "@/lib/types";

/**
 * GET /api/artists/[artistId]/events - Get events for a specific artist
 * Proxies to API Gateway following serverless architecture
 * One Lambda = One Job: getArtistEvents Lambda for artist-specific events
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ artistId: string }> }
) {
  try {
    const { artistId } = await params;
    
    // Validate input parameters
    if (!artistId || artistId.trim() === '') {
      console.warn(`🎵 API Route: Invalid artist ID provided for events: "${artistId}"`);
      return NextResponse.json(
        { error: "Artist ID is required and cannot be empty" },
        { status: 400 }
      );
    }

    console.log(`🎵 API Route: Fetching events for artist: ${artistId}`);

    // Forward credentials from the original request
    const forwardHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Forward authentication headers if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      forwardHeaders['authorization'] = authHeader;
    }

    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      forwardHeaders['cookie'] = cookieHeader;
    }

    // For now, fetch all public events and filter by artistId
    // This follows the current backend architecture until a dedicated artist events endpoint is available
    const response = await fetch('https://api.bndy.co.uk/api/events/public', {
      headers: forwardHeaders,
      next: { revalidate: 180 } // Cache for 3 minutes as per design (events change more frequently)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`🎵 API Route: Failed to fetch events for artist ${artistId}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return NextResponse.json(
        { error: "Failed to fetch artist events", details: response.status >= 500 ? "Server error" : "Client error" },
        { status: response.status >= 500 ? 500 : 400 }
      );
    }

    const allEvents = await response.json() as Event[];
    
    // Validate that we received an array
    if (!Array.isArray(allEvents)) {
      console.error(`🎵 API Route: Invalid events response format for artist ${artistId}:`, allEvents);
      return NextResponse.json(
        { error: "Invalid events response format" },
        { status: 500 }
      );
    }

    // Filter events for this artist
    const artistEvents = allEvents.filter(event => {
      // Validate event structure
      if (!event.id || !event.name || !event.date) {
        console.warn(`🎵 API Route: Filtering out invalid event data:`, event);
        return false;
      }
      
      // Check if artist is associated with this event
      return event.artistIds && Array.isArray(event.artistIds) && event.artistIds.includes(artistId);
    });
    
    // Filter for upcoming events only
    const now = new Date();
    const upcomingEvents = artistEvents.filter(event => {
      try {
        const eventDate = new Date(event.date);
        return eventDate >= now;
      } catch (error) {
        console.warn(`🎵 API Route: Invalid date format for event ${event.id}: ${event.date}`);
        return false;
      }
    });
    
    // Sort by date (earliest first)
    upcomingEvents.sort((a, b) => {
      try {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } catch (error) {
        console.warn(`🎵 API Route: Error sorting events by date:`, error);
        return 0;
      }
    });

    console.log(`🎵 API Route: Found ${upcomingEvents.length} upcoming events for artist: ${artistId} (filtered from ${allEvents.length} total events)`);
    
    // Set appropriate cache headers
    const response_headers = new Headers();
    response_headers.set('Cache-Control', 'public, max-age=180, stale-while-revalidate=360');
    
    return NextResponse.json(upcomingEvents, { headers: response_headers });
  } catch (error) {
    console.error("🎵 API Route: Error in artist events API route:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      artistId: (await params).artistId
    });
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}