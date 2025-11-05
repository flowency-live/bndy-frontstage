// Configure the tile layer - Google Maps style blue appearance
// Uses CARTO Voyager - has natural blue water colors built-in
// Theme toggle does NOT affect map tiles (only UI overlays)

export const tileLayer = {
  url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  className: "map-tiles-blue",
  // attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
};