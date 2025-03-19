// src/components/Map/LeafletConfig.ts
"use client";

import L from "leaflet";

// Define a type for the L.Icon.Default prototype
interface IconDefaultPrototype {
  _getIconUrl?: unknown;
}

if (typeof window !== "undefined") {
  // Import marker assets using import statements instead of require()
  import("leaflet/dist/images/marker-icon-2x.png").then(markerIcon2x => {
    import("leaflet/dist/images/marker-icon.png").then(markerIcon => {
      import("leaflet/dist/images/marker-shadow.png").then(markerShadow => {
        // Delete the property with a proper type assertion
        delete (L.Icon.Default.prototype as IconDefaultPrototype)._getIconUrl;

        // Set the icon URLs
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: markerIcon2x.default,
          iconUrl: markerIcon.default,
          shadowUrl: markerShadow.default,
        });
      });
    });
  });
}