"use client";

/**
 * VideosTab - Placeholder for videos and links
 *
 * Status: Not implemented yet (no data in schema)
 * Future: Display YouTube embeds, Bandcamp links, etc.
 */
export default function VideosTab() {
  return (
    <div
      role="tabpanel"
      id="videos-panel"
      aria-labelledby="videos-tab"
      className="container mx-auto px-4 py-12"
      data-testid="videos-tab-content"
    >
      <div className="text-center space-y-4">
        <div className="text-6xl">🎬</div>
        <h3 className="text-xl font-semibold text-foreground">
          No videos or links yet
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          This section will display videos, music links, and other media when available.
        </p>
      </div>
    </div>
  );
}
