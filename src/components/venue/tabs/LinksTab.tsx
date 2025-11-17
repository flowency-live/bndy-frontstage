"use client";

/**
 * LinksTab - Displays venue's social and media links
 *
 * Status: Placeholder (links added via Centrestage only)
 * Future: Display venue website, booking links, etc.
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
          Venues can add links and media via the Centrestage portal.
        </p>
      </div>
    </div>
  );
}
