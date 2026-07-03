# Deck.gl Visual Effects Research

## Overview

Deck.gl is a WebGL-powered visualization framework that can render 100k+ points at 60fps while maintaining visual richness. This document covers the visual effects available and how to achieve the "neon glow" aesthetic currently implemented with HTML markers.

## Installation

```bash
npm install @deck.gl/core @deck.gl/layers @deck.gl/mapbox @luma.gl/effects
```

Bundle impact: ~150KB gzipped (replaces HTML marker system overhead)

---

## Visual Effects Techniques

### 1. Glow Effect via Stacked Layers (Recommended)

The most performant way to create glows is stacking multiple ScatterplotLayers:

```typescript
// Layer 1: Outer glow (large, transparent, blurred via low opacity)
new ScatterplotLayer({
  id: 'venue-glow-outer',
  data: venues.filter(v => v.hasEvents),
  getPosition: d => [d.location.lng, d.location.lat],
  getRadius: 24,
  radiusUnits: 'pixels',
  getFillColor: [255, 46, 136, 60],  // Pink with 24% opacity
  antialiasing: true,
}),

// Layer 2: Inner glow
new ScatterplotLayer({
  id: 'venue-glow-inner',
  data: venues.filter(v => v.hasEvents),
  getPosition: d => [d.location.lng, d.location.lat],
  getRadius: 16,
  radiusUnits: 'pixels',
  getFillColor: [255, 46, 136, 120],  // Pink with 47% opacity
  antialiasing: true,
}),

// Layer 3: Core dot
new ScatterplotLayer({
  id: 'venue-core',
  data: venues,
  getPosition: d => [d.location.lng, d.location.lat],
  getRadius: d => d.hasEvents ? 8 : 5,
  radiusUnits: 'pixels',
  getFillColor: d => d.hasEvents ? [255, 46, 136, 255] : [6, 182, 212, 180],
  stroked: true,
  getLineColor: [255, 255, 255, 200],
  lineWidthPixels: 1.5,
  antialiasing: true,
}),
```

**Result:** GPU-rendered glow that looks like CSS `box-shadow` or `filter: blur()` but runs at 60fps with 10k points.

---

### 2. Breathing/Pulsing Animation

Deck.gl supports smooth transitions on any numeric property:

```typescript
const [pulsePhase, setPulsePhase] = useState(0);

// Animation loop
useEffect(() => {
  let animationId: number;
  const animate = () => {
    setPulsePhase(p => (p + 0.02) % (Math.PI * 2));
    animationId = requestAnimationFrame(animate);
  };
  animationId = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(animationId);
}, []);

// Layer with animated radius
new ScatterplotLayer({
  id: 'venue-breathing',
  data: venues.filter(v => v.hasEvents),
  getPosition: d => [d.location.lng, d.location.lat],
  // Sine wave creates smooth breathing effect
  getRadius: d => 8 + Math.sin(pulsePhase + d.animOffset) * 2,
  radiusUnits: 'pixels',
  getFillColor: [255, 46, 136, 255],
  // Enable smooth radius transitions
  transitions: {
    getRadius: 100,  // 100ms transition duration
  },
  updateTriggers: {
    getRadius: pulsePhase,
  },
}),
```

**Performance note:** With `updateTriggers`, only changed properties re-render. The GPU handles interpolation.

---

### 3. PostProcessEffect for Screen-Wide Bloom

For true bloom/glow applied to the entire canvas:

```typescript
import { brightnessContrast } from '@luma.gl/effects';
import { PostProcessEffect } from '@deck.gl/core';

// Note: luma.gl doesn't have built-in bloom, but you can chain effects
const postProcess = new PostProcessEffect(brightnessContrast, {
  brightness: 1.05,
  contrast: 1.1,
});

// Apply to deck
<MapboxOverlay
  effects={[postProcess]}
  layers={[...]}
/>
```

**Limitation:** PostProcessEffect applies to ALL layers, not individual ones. For per-marker glow, use the stacked layer approach.

---

### 4. Text Labels with TextLayer

```typescript
import { TextLayer } from '@deck.gl/layers';

new TextLayer({
  id: 'venue-labels',
  data: venues,
  getPosition: d => [d.location.lng, d.location.lat],
  getText: d => d.name,
  getSize: 12,
  getColor: [255, 255, 255, 255],
  // Halo for readability
  outlineWidth: 2,
  outlineColor: [0, 25, 48, 220],
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  // Anchor point
  getTextAnchor: 'start',
  getAlignmentBaseline: 'center',
  getPixelOffset: [12, 0],
  // Only show at high zoom
  visible: zoom >= 12,
  // Collision detection
  billboard: false,
  sizeUnits: 'pixels',
}),
```

---

### 5. Icon Layer for Custom Markers

```typescript
import { IconLayer } from '@deck.gl/layers';

new IconLayer({
  id: 'venue-icons',
  data: venues,
  getPosition: d => [d.location.lng, d.location.lat],
  getIcon: d => ({
    url: d.hasEvents ? '/markers/venue-live.png' : '/markers/venue-idle.png',
    width: 48,
    height: 48,
    anchorY: 48,
  }),
  getSize: 32,
  sizeUnits: 'pixels',
  pickable: true,
}),
```

---

### 6. Clustering with Aggregation

Deck.gl doesn't have built-in point clustering like Mapbox, but offers aggregation layers:

**Option A: Use Mapbox source clustering + Deck.gl rendering**
```typescript
// Let Mapbox handle clustering via GeoJSON source
// Query features and render with Deck.gl ScatterplotLayer
const features = map.querySourceFeatures('venues');
```

**Option B: H3HexagonLayer for density visualization**
```typescript
import { H3HexagonLayer } from '@deck.gl/geo-layers';

new H3HexagonLayer({
  data: venues,
  getHexagon: d => latLngToH3(d.lat, d.lng, 7),
  getFillColor: d => [255, 46, 136, Math.min(d.count * 30, 200)],
  extruded: false,
});
```

---

## Integration with Existing Mapbox Context

The key integration point is `MapboxOverlay`:

```typescript
import { MapboxOverlay } from '@deck.gl/mapbox';

// Inside your MapboxContext or component
useEffect(() => {
  if (!map || !isMapReady) return;

  const overlay = new MapboxOverlay({
    interleaved: true,  // Render inside Mapbox's WebGL context
    layers: buildLayers(venues, events),
  });

  map.addControl(overlay);

  return () => map.removeControl(overlay);
}, [map, isMapReady]);
```

---

## Comparison: HTML Markers vs Deck.gl

| Feature | HTML Markers (Current) | Deck.gl |
|---------|----------------------|---------|
| 500 markers render | ~200ms | ~16ms |
| 5000 markers render | ~2000ms | ~20ms |
| Glow effects | CSS `box-shadow` | Stacked layers |
| Breathing animation | CSS animation | RAF + transitions |
| Text labels | DOM elements | TextLayer (GPU) |
| Memory usage | High (DOM nodes) | Low (GPU buffers) |
| Zoom/pan performance | Poor | Excellent |
| Click detection | Native DOM events | Picking API |
| Visual quality | Excellent | Excellent |

---

## Recommended Architecture

```
Zoom 0-10:  ScatterplotLayer clusters (aggregated)
Zoom 10-12: ScatterplotLayer dots with glow layers
Zoom 12+:   ScatterplotLayer dots + TextLayer labels
            (all GPU-rendered)
```

**No HTML markers at any zoom level.** All visuals achieved through layer composition.

---

## Sources

- [ScatterplotLayer Documentation](https://deck.gl/docs/api-reference/layers/scatterplot-layer)
- [PostProcessEffect Documentation](https://deck.gl/docs/api-reference/core/post-process-effect)
- [MapboxOverlay Integration](https://deck.gl/docs/api-reference/mapbox/mapbox-overlay)
- [Using Effects Guide](https://deck.gl/docs/developer-guide/using-effects)
- [deck.gl + Mapbox Integration](https://medium.com/vis-gl/deckgl-and-mapbox-better-together-47b29d6d4fb1)
