"use client";

/**
 * LinksTab - Displays artist's YouTube and other media links
 *
 * Status: Placeholder (links added via backstage only)
 * Future: Display YouTube embeds, Spotify links, etc.
 */
export default function LinksTab() {
  return (
    <div
      role="tabpanel"
      id="links-panel"
      aria-labelledby="links-tab"
      className="container mx-auto px-4 py-12"
      data-testid="links-tab-content"
    >
      <div className="text-center space-y-4">
        <div className="text-6xl">🔗</div>
        <h3 className="text-xl font-semibold text-foreground">
          No links yet
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Artists can add YouTube videos and other media links via the Backstage portal.
        </p>
      </div>
    </div>
  );
}
