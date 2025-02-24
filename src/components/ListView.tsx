// src/components/ListView.tsx
"use client";

// src/components/ListView.tsx
export default function ListView() {
  return (
    <div className="container mx-auto px-4 py-6 text-center">
      <h2 className="text-2xl font-bold mb-4 text-[var(--foreground)]">
        Upcoming Events
      </h2>
      <p className="text-[var(--foreground)]">
        [List of events will go here. Group by date, filter, etc.]
      </p>
    </div>
  );
}