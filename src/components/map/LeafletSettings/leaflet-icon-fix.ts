/**
 * Leaflet Icon Fix Utility (TypeScript)
 * 
 * This utility addresses the common issue in Leaflet.js where marker icons fail to display
 * correctly due to relative path problems, particularly when using the default marker icons.
 * 
 * Usage:
 * 1. Import this utility after importing Leaflet
 * 2. Call fixLeafletIcon() before creating any markers
 */

import L from 'leaflet';

// Define types for Leaflet internals that we need to access
interface IconDefaultPrototype {
  _initIcon: () => void;
  _getIconUrl?: () => string;
  options?: {
    iconUrl?: string;
    iconRetinaUrl?: string;
    shadowUrl?: string;
    iconSize?: number[];
    iconAnchor?: number[];
    popupAnchor?: number[];
    shadowSize?: number[];
  };
  _icon?: HTMLElement;
  _shadow?: HTMLElement;
}

// interface IconInitOptions {
//   iconUrl: string;
//   iconRetinaUrl: string;
//   shadowUrl: string;
//   iconSize: number[];
//   iconAnchor: number[];
//   popupAnchor: number[];
//   shadowSize: number[];
// }

/**
 * Fix Leaflet's default icon path issues
 */
export function fixLeafletIcon(): void {
  // Type assertion to access internal properties
  const DefaultIcon = L.Icon.Default as unknown as { prototype: IconDefaultPrototype };
  const prototype = DefaultIcon.prototype;
  
  // Store the original initialization function if it exists
  const originalInitialize = prototype._initIcon;
  
  if (originalInitialize) {
    // Create a patched version of the initialization function
    const patchedInitialize = function(this: IconDefaultPrototype) {
      // Call the original initialization
      originalInitialize.call(this);
      
      // Fix the image path issues by updating the src attributes
      if (this._icon) {
        this._icon.style.backgroundImage = this._icon.style.backgroundImage.replace(
          'marker-icon.png', 
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png'
        );
      }
      if (this._shadow) {
        this._shadow.style.backgroundImage = this._shadow.style.backgroundImage.replace(
          'marker-shadow.png', 
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
        );
      }
    };
    
    // Replace the original method with our patched version
    prototype._initIcon = patchedInitialize;
  }
  
  // For older Leaflet versions - fix the icon URL paths directly
  if (prototype.options) {
    const iconUrl = prototype.options.iconUrl;
    const shadowUrl = prototype.options.shadowUrl;
    
    if (iconUrl && !iconUrl.includes('http')) {
      prototype.options.iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
    }
    
    if (shadowUrl && !shadowUrl.includes('http')) {
      prototype.options.shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
    }
  }

}

/**
 * Alternative comprehensive approach to fix Leaflet icon issues
 * This approach redefines the default icon completely
 */
export function setLeafletDefaultIcon(): void {
  // Define the default icon with absolute URLs
  const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  
  // Set this as the new default icon
  (L.Marker.prototype.options as { icon: L.Icon }).icon = defaultIcon;
  
}

/**
 * Complete icon fix that handles all possible scenarios
 */
export function completeLeafletIconFix(): void {
  // Fix for webpack/bundler environments
  const DefaultIcon = L.Icon.Default as unknown as { prototype: IconDefaultPrototype };
  
  if (DefaultIcon.prototype) {
    delete (DefaultIcon.prototype as IconDefaultPrototype)._getIconUrl;
  }
  
  // Set icon paths explicitly - using mergeOptions if available
  if (typeof L.Icon.Default.mergeOptions === 'function') {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  } else {
    // Fallback for older versions
    const prototype = (L.Icon.Default.prototype as unknown) as IconDefaultPrototype;
    if (prototype && prototype.options) {
      prototype.options.iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
      prototype.options.iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
      prototype.options.shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
    }
  }
  
  // Also apply the initialization patch for good measure
  fixLeafletIcon();

}