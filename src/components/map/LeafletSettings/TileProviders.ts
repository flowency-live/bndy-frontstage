

// Configure the tile layers for light and dark modes
export const lightTileLayer = {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
   // attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  };
  
  export const darkTileLayer = {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
   // attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  };