import { NextRequest, NextResponse } from "next/server";
import { Artist } from "@/lib/types";

/**
 * GET /api/artists/search - Search artists by name and location
 * Proxies to API Gateway following serverless architecture
 * One Lambda = One Job: searchArtists Lambda for artist search functionality
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const location = searchParams.get('location');
    const artistType = searchParams.get('artist_type');

    // Validate input parameters
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required and must be at least 2 characters" },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();
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

    // Build API URL with parameters
    const apiParams = new URLSearchParams({ name: trimmedQuery });
    if (location && location.trim()) {
      apiParams.append('location', location.trim());
    }
    if (artistType && artistType.trim()) {
      apiParams.append('artist_type', artistType.trim());
    }

    // Fetch from the DynamoDB API via API Gateway
    const response = await fetch(`https://api.bndy.co.uk/api/artists/search?${apiParams}`, {
      headers: forwardHeaders,
      next: { revalidate: 180 } // Cache for 3 minutes as per design (search results change more frequently)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(` API Route: Failed to search artists:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        query: trimmedQuery,
        location,
        artistType
      });
      
      return NextResponse.json(
        { error: "Failed to search artists", details: response.status >= 500 ? "Server error" : "Client error" },
        { status: response.status >= 500 ? 500 : 400 }
      );
    }

    const data = await response.json();
    
    // Transform matches to Artist format if needed
    const artists = (data.matches || data) as Artist[];
    
    // Validate that we received an array
    if (!Array.isArray(artists)) {
      console.error(` API Route: Invalid search response format:`, data);
      return NextResponse.json(
        { error: "Invalid search response format" },
        { status: 500 }
      );
    }

    // Validate artist data structure for each result
    const validArtists = artists.filter(artist => {
      if (!artist.id || !artist.name) {
        return false;
      }
      return true;
    });
    // Set appropriate cache headers
    const response_headers = new Headers();
    response_headers.set('Cache-Control', 'public, max-age=180, stale-while-revalidate=360');
    
    return NextResponse.json(validArtists, { headers: response_headers });
  } catch (error) {
    console.error(" API Route: Error in artist search API route:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      query: request.url
    });
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}