// src/components/map/CustomInfoOverlay.ts
export class CustomInfoOverlay {
  private position: google.maps.LatLng;
  private content: string;
  private div: HTMLDivElement | null = null;
  private isOpen: boolean = false;
  private map: google.maps.Map;
  private overlay: google.maps.OverlayView;

  constructor(position: google.maps.LatLngLiteral, content: string, map: google.maps.Map) {
    this.position = new google.maps.LatLng(position);
    this.content = content;
    this.map = map;

    // Create an OverlayView and implement its methods
    this.overlay = new google.maps.OverlayView();

    // Implement required OverlayView methods
    this.overlay.onAdd = this.onAdd.bind(this);
    this.overlay.draw = this.draw.bind(this);
    this.overlay.onRemove = this.onRemove.bind(this);

    // Add the overlay to the map
    this.overlay.setMap(map);
  }

  onAdd() {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.visibility = 'hidden'; // Start hidden
    div.innerHTML = this.content;
    div.className = 'custom-info-overlay';

    // Add click event to the map to close overlay when clicking elsewhere
    this.map.addListener('click', () => {
      this.hide();
    });

    this.div = div;
    const panes = this.overlay.getPanes();
    panes?.overlayMouseTarget.appendChild(div);
  }

  // Override the draw method to stop automatic repositioning
  draw() {
    if (this.div && this.isOpen) {
      // If overlay is open, reposition it
      this.positionOverMarker();
    }
  }

  onRemove() {
    if (this.div) {
      this.div.parentNode?.removeChild(this.div);
      this.div = null;
    }
  }

  show() {
    if (this.div) {
      // Make it visible
      this.div.style.visibility = 'visible';
      this.isOpen = true;
      
      // Calculate a point slightly below where we want to center
      // This will shift the view to show more space above the marker
      const projection = this.overlay.getProjection();
      if (projection) {
        // Get the current center point
        const centerPoint = projection.fromLatLngToDivPixel(this.position);
        
        // Offset it downward to move the viewport up
        if (centerPoint) {
          centerPoint.y += 150; // Adjust this value as needed
        }
        
        // Convert back to LatLng
        const adjustedCenter = projection.fromDivPixelToLatLng(centerPoint);
        
        // Pan to this adjusted center
        if (adjustedCenter) {
          this.map.panTo(adjustedCenter);
        }
      } else {
        // Fallback if projection isn't ready
        this.map.panTo(this.position);
      }
      
      // Position the overlay after panning
      setTimeout(() => {
        this.positionOverMarker();
      }, 50);
    }
  }
  
  private positionOverMarker() {
    if (!this.div) return;
    
    const projection = this.overlay.getProjection();
    if (!projection) return;
    
    // Get pixel coordinates of the marker
    const point = projection.fromLatLngToDivPixel(this.position);
    
    if (point) {
      // Center horizontally over the marker
      const offsetX = this.div.offsetWidth / 2;
      // Position above the marker
      const offsetY = this.div.offsetHeight + 40;
      
      // Set the position
      this.div.style.left = `${point.x - offsetX}px`;
      this.div.style.top = `${point.y - offsetY}px`;
    }
  }

  hide() {
    if (this.div) {
      this.div.style.visibility = 'hidden';
      this.isOpen = false;
    }
  }

  setContent(newContent: string) {
    this.content = newContent;
    if (this.div) {
      this.div.innerHTML = newContent;
    }
  }

  // Add a new method for fixed positioning
  private positionBelowHeader() {
    if (!this.div) return;

    // Get the map container dimensions
    const mapDiv = this.map.getDiv();
    const mapRect = mapDiv.getBoundingClientRect();

    // Position at the top center of the map, just below the header
    const headerHeight = 100; // Adjust this value based on your header height + some padding

    // Center horizontally
    this.div.style.left = `${mapRect.width / 2 - this.div.offsetWidth / 2}px`;

    // Position below header
    this.div.style.top = `${headerHeight}px`;

    // Change position to fixed relative to the map container
    this.div.style.position = 'absolute';
    this.div.style.zIndex = '1000';
  }

  private panMapIfNeeded() {
    if (!this.div || !this.map) return;

    const projection = this.overlay.getProjection();
    const position = projection.fromLatLngToDivPixel(this.position);

    if (!position) return;

    const divRect = this.div.getBoundingClientRect();
    const mapDiv = this.map.getDiv();
    const mapRect = mapDiv.getBoundingClientRect();

    // Get header height (assuming you have a fixed header)
    const headerHeight = 88; // Your header height

    // Check if the overlay extends beyond the map's visible area
    let panX = 0;
    let panY = 0;

    // Check left edge
    if (position.x - divRect.width / 2 < 0) {
      panX = position.x - divRect.width / 2;
    }

    // Check right edge
    if (position.x + divRect.width / 2 > mapRect.width) {
      panX = position.x + divRect.width / 2 - mapRect.width;
    }

    // Check top edge - account for header
    if (position.y - divRect.height - 10 < headerHeight) {
      panY = position.y - divRect.height - 10 - headerHeight;
    }

    // Check bottom edge
    if (position.y + 10 > mapRect.height) {
      panY = position.y + 10 - mapRect.height;
    }

    if (panX !== 0 || panY !== 0) {
      // Pan the map to make the overlay fully visible
      this.map.panBy(-panX, -panY);
    }
  }

  toggle() {
    if (this.isOpen) {
      this.hide();
    } else {
      this.show();
    }
  }


  setMap(map: google.maps.Map | null) {
    this.overlay.setMap(map);
  }
}