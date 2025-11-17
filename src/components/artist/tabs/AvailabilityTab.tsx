"use client";

/**
 * AvailabilityTab - Placeholder for booking availability calendar
 *
 * Status: Not implemented yet (no publishAvailability field)
 * Visibility: Only shown if artist.publishAvailability === true
 * Future: Display calendar with available/booked dates
 */
export default function AvailabilityTab() {
  return (
    <div
      role="tabpanel"
      id="availability-panel"
      aria-labelledby="availability-tab"
      className="container mx-auto px-4 py-12"
      data-testid="availability-tab-content"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="text-6xl">📅</div>
          <h3 className="text-xl font-semibold text-foreground">
            Booking Availability
          </h3>
          <p className="text-muted-foreground">
            Green dates are available for booking, red dates are already booked.
          </p>
        </div>

        {/* Calendar Placeholder */}
        <div className="border border-border rounded-lg p-6 bg-card-bg">
          <div className="text-center text-muted-foreground">
            <p className="mb-4">Calendar coming soon...</p>
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Button Placeholder */}
        <div className="text-center">
          <button
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium
                       hover:bg-primary/90 transition-colors"
            disabled
          >
            Contact Artist
          </button>
        </div>
      </div>
    </div>
  );
}
