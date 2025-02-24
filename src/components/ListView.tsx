// src/components/ListView.tsx
"use client";

export default function ListView() {
  return (
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-2xl font-bold mb-4 text-[var(--foreground)]">
        Upcoming Events
      </h2>
      <p className="text-[var(--foreground)]">
        [List of events will go here. Group by date, filter, etc.]
      </p>
    </div>
  );
}
