// Configure the tile layer - Google Maps style blue appearance
// Uses Stadia Maps Alidade Smooth for clean blue aesthetic
// Theme toggle does NOT affect map tiles (only UI overlays)

export const tileLayer = {
  url: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
  className: "map-tiles-blue",
  // attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};