// Configure the tile layer - single consistent blue-gray style
// Uses CARTO Positron with CSS filter for subtle blue aesthetic
// Theme toggle does NOT affect map tiles (only UI overlays)

export const tileLayer = {
  url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  className: "map-tiles-blue", // CSS class for blue-gray filter
  // attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
};