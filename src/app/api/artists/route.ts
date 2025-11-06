import { NextRequest, NextResponse } from "next/server";
import { Artist } from "@/lib/types";

/**
 * GET /api/artists - Get all artists for browse page
 * Proxies to API Gateway following serverless architecture
 * One Lambda = One Job: getAllArtists Lambda for artist browse functionality
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🎵 API Route: Fetching all artists for browse page');

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

    // Fetch from the DynamoDB API via API Gateway
    const response = await fetch('https://api.bndy.co.uk/api/artists', {
      headers: forwardHeaders,
      next: { revalidate: 60 } // Cache for 1 minute - artists data changes frequently
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`🎵 API Route: Failed to fetch artists:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return NextResponse.json(
        { error: "Failed to fetch artists data", details: response.status >= 500 ? "Server error" : "Client error" },
        { status: response.status >= 500 ? 500 : 400 }
      );
    }

    const artists = await response.json() as Artist[];
    
    // Validate that we received an array
    if (!Array.isArray(artists)) {
      console.error(`🎵 API Route: Invalid artists response format:`, artists);
      return NextResponse.json(
        { error: "Invalid artists response format" },
        { status: 500 }
      );
    }

    // Validate artist data structure for each result
    const validArtists = artists.filter(artist => {
      if (!artist.id || !artist.name) {
        console.warn(`🎵 API Route: Filtering out invalid artist data:`, artist);
        return false;
      }
      return true;
    });

    console.log(`🎵 API Route: Successfully fetched ${validArtists.length} valid artists (filtered from ${artists.length} total)`);

    // Set appropriate cache headers - short cache for frequently changing artist data
    const response_headers = new Headers();
    response_headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');

    return NextResponse.json(validArtists, { headers: response_headers });
  } catch (error) {
    console.error("🎵 API Route: Error in artists API route:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}