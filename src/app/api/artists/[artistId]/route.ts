import { NextRequest, NextResponse } from "next/server";
import { Artist } from "@/lib/types";

/**
 * GET /api/artists/[artistId] - Get individual artist data
 * Proxies to API Gateway following serverless architecture
 * One Lambda = One Job: getArtist Lambda for individual artist data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ artistId: string }> }
) {
  try {
    const { artistId } = await params;
    
    // Validate input parameters
    if (!artistId || artistId.trim() === '') {
      console.warn(`🎵 API Route: Invalid artist ID provided: "${artistId}"`);
      return NextResponse.json(
        { error: "Artist ID is required and cannot be empty" },
        { status: 400 }
      );
    }

    console.log(`🎵 API Route: Fetching artist data for ID: ${artistId}`);

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
    const response = await fetch(`https://api.bndy.co.uk/api/artists/${encodeURIComponent(artistId)}`, {
      headers: forwardHeaders,
      next: { revalidate: 300 } // Cache for 5 minutes as per design
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`🎵 API Route: Artist not found: ${artistId}`);
        return NextResponse.json(
          { error: "Artist not found" },
          { status: 404 }
        );
      }
      
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`🎵 API Route: Failed to fetch artist ${artistId}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return NextResponse.json(
        { error: "Failed to fetch artist data", details: response.status >= 500 ? "Server error" : "Client error" },
        { status: response.status >= 500 ? 500 : 400 }
      );
    }

    const artistData = await response.json() as Artist;
    
    // Validate artist data structure
    if (!artistData.id || !artistData.name) {
      console.error(`🎵 API Route: Invalid artist data structure for ${artistId}:`, artistData);
      return NextResponse.json(
        { error: "Invalid artist data received" },
        { status: 500 }
      );
    }

    console.log(`🎵 API Route: Successfully fetched artist: ${artistData.name} (${artistId})`);
    
    // Set appropriate cache headers
    const response_headers = new Headers();
    response_headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    
    return NextResponse.json(artistData, { headers: response_headers });
  } catch (error) {
    console.error("🎵 API Route: Error in artist API route:", {
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