import { NextRequest, NextResponse } from "next/server";
import { Artist } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ artistId: string }> }
) {
  try {
    const { artistId } = await params;
    
    if (!artistId) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 }
      );
    }

    // Fetch from the DynamoDB API
    const response = await fetch(`https://api.bndy.co.uk/api/artists/${artistId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Artist not found" },
          { status: 404 }
        );
      }
      
      console.error(`Failed to fetch artist ${artistId}:`, response.status, await response.text());
      return NextResponse.json(
        { error: "Failed to fetch artist data" },
        { status: 500 }
      );
    }

    const artistData = await response.json() as Artist;
    
    return NextResponse.json(artistData);
  } catch (error) {
    console.error("Error in artist API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}