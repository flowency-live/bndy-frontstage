import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/artists/[artistId]/public-availability - Get public availability for an artist
 * Proxies to API Gateway following serverless architecture
 *
 * Query params:
 * - startDate: YYYY-MM-DD (optional, defaults to today)
 * - endDate: YYYY-MM-DD (optional, defaults to 3 months from today)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ artistId: string }> }
) {
  try {
    const { artistId } = await params;

    // Validate artistId
    if (!artistId || artistId.trim() === '') {
      return NextResponse.json(
        { error: "Artist ID is required and cannot be empty" },
        { status: 400 }
      );
    }

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query string for backend API
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    const queryString = queryParams.toString();

    // Construct backend URL
    const backendUrl = `https://api.bndy.co.uk/api/artists/${artistId}/public-availability${queryString ? `?${queryString}` : ''}`;

    // Fetch from backend
    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`API Route: Failed to fetch availability for artist ${artistId}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });

      // Return empty availability array for 404 (artist has no availability published)
      if (response.status === 404) {
        return NextResponse.json({ availability: [] });
      }

      return NextResponse.json(
        { error: "Failed to fetch artist availability", details: response.status >= 500 ? "Server error" : "Client error" },
        { status: response.status >= 500 ? 500 : 400 }
      );
    }

    const data = await response.json();

    // Validate response structure
    if (!data || typeof data !== 'object') {
      console.error(`API Route: Invalid availability response format for artist ${artistId}:`, data);
      return NextResponse.json({ availability: [] });
    }

    // Set cache headers
    const responseHeaders = new Headers();
    responseHeaders.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');

    return NextResponse.json(data, { headers: responseHeaders });
  } catch (error) {
    console.error("API Route: Error in artist availability API route:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      artistId: (await params).artistId
    });

    return NextResponse.json(
      { error: "Internal server error", availability: [] },
      { status: 500 }
    );
  }
}
