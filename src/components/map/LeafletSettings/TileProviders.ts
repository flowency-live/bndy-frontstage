// Configure the tile layers for light and dark modes
// Using CARTO Positron (clean, minimal) with CSS filters for blue washed-out aesthetic
// Mimics the Google Maps blue hue style from previous implementation (#242a38)

export const lightTileLayer = {
  url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", // SWAPPED FOR TESTING
  className: "map-tiles-light" // CSS class for blue hue filter
  // attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
};

export const darkTileLayer = {
  url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", // SWAPPED FOR TESTING
  className: "map-tiles-dark" // CSS class for softer dark mode
  // attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
};