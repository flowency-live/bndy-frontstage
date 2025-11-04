# Artist Profile Integration Documentation

## Overview
This document outlines the integration between the existing map/event systems and the new artist public profile pages. The integration ensures seamless navigation from event listings to artist profiles across all components.

## Integration Points

### 1. Event Info Overlay (`src/components/overlays/EventInfoOverlay.tsx`)
**Status: ✅ Already Integrated**

- **Regular Events**: Entire artist header section is a clickable link to `/artists/${currentEvent.artistIds[0]}`
- **Open Mic Events**: Separate "View host artist" link to `/artists/${artist.id}` when host is available
- **Features**:
  - Artist profile image display with fallback
  - Hover effects with orange glow
  - Profile picture fetching from social media
  - Proper event propagation handling

### 2. List View Components

#### EventCard (`src/components/listview/EventCard.tsx`)
**Status: ✅ Updated**

- **New Features**:
  - Artist profile link with User icon when `event.artistIds` exists
  - Links to `/artists/${event.artistIds[0]}` (first artist)
  - Venue name converted to clickable link to `/venues/${event.venueId}`
  - Proper click event propagation prevention
  - Responsive design maintained

#### EventRow (`src/components/listview/EventRow.tsx`)
**Status: ✅ Updated**

- **New Features**:
  - Artist profile link in both desktop and mobile views
  - Links to `/artists/${event.artistIds[0]}` (first artist)
  - Venue name converted to clickable link to `/venues/${event.venueId}`
  - Maintains table structure and responsive behavior
  - Proper accessibility with User icon

### 3. Shared Components

#### TodayEventHighlight (`src/components/shared/TodayEventHighlight.tsx`)
**Status: ✅ Already Integrated**

- **Context-aware linking**:
  - When `contextType === 'venue'`: Shows artist link if `event.artistIds` exists
  - When `contextType === 'artist'`: Shows venue link
  - Links to `/artists/${event.artistIds[0]}` and `/venues/${event.venueId}`

#### VAEventsList (`src/components/shared/VAEventsList.tsx`)
**Status: ✅ Already Integrated**

- **EventRow component**:
  - Context-aware artist/venue linking
  - Links to `/artists/${event.artistIds[0]}` when in venue context
  - Links to `/venues/${event.venueId}` when in artist context

### 4. Map Integration (`src/components/map/Map.tsx`)
**Status: ✅ Already Integrated**

- **Event marker clicks**: Open EventInfoOverlay with artist profile integration
- **Navigation flow**: Map → Event Overlay → Artist Profile
- **Search integration**: Supports artist name filtering

## Navigation Flow

### Primary User Journeys

1. **Map View → Artist Profile**
   ```
   Map → Click Event Marker → EventInfoOverlay → Click Artist → Artist Profile
   ```

2. **List View → Artist Profile**
   ```
   ListView → Click Event Card/Row → EventInfoOverlay → Click Artist → Artist Profile
   OR
   ListView → Click "View Artist Profile" link → Artist Profile
   ```

3. **Artist/Venue Pages → Artist Profile**
   ```
   Artist/Venue Page → Event List → Click Artist Link → Artist Profile
   ```

## Technical Implementation

### Link Structure
- **Artist Profiles**: `/artists/{artistId}`
- **Venue Profiles**: `/venues/{venueId}`
- **Event Handling**: First artist in `event.artistIds` array is used for primary link

### Event Propagation
All navigation links use `onClick={(e) => e.stopPropagation()}` to prevent:
- Triggering parent event handlers
- Opening multiple overlays
- Interfering with card/row click events

### Accessibility Features
- **ARIA Labels**: All links have proper labels
- **Keyboard Navigation**: All links are keyboard accessible
- **Screen Reader Support**: Semantic HTML with proper roles
- **Visual Indicators**: Icons (User, Map) provide visual context

### Responsive Design
- **Mobile Optimization**: Links work on touch devices
- **Responsive Layout**: Artist links adapt to screen size
- **Touch Targets**: Adequate size for mobile interaction

## Testing

### Integration Tests
Location: `src/components/__tests__/integration-navigation.test.tsx`

**Test Coverage**:
- Artist profile link rendering when artist exists
- No artist link when no artist data
- Venue link functionality
- Event propagation prevention
- Multiple artist handling (uses first artist)
- Accessibility compliance
- Responsive behavior

### Manual Testing Checklist
- [ ] Map event markers link to artist profiles
- [ ] List view event cards show artist links
- [ ] List view event rows show artist links
- [ ] EventInfoOverlay artist links work
- [ ] Venue context shows artist links appropriately
- [ ] Artist context shows venue links appropriately
- [ ] Mobile touch interactions work
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility

## Error Handling

### Missing Artist Data
- **Graceful Degradation**: No artist link shown when `artistIds` is empty/undefined
- **Fallback Behavior**: Event still displays normally without artist information
- **User Experience**: Clear indication when artist information is unavailable

### Network Issues
- **Profile Loading**: Artist profile pages handle loading states
- **Image Fallbacks**: Profile images have proper fallback handling
- **Error Boundaries**: Components wrapped in error boundaries

## Performance Considerations

### Link Prefetching
- Next.js Link components automatically prefetch on hover
- Improves perceived performance for navigation
- Reduces load times for artist profiles

### Image Optimization
- Profile images use Next.js Image component
- Lazy loading for better performance
- Proper sizing and optimization

## Future Enhancements

### Potential Improvements
1. **Multiple Artist Support**: Show all artists for events with multiple performers
2. **Artist Preview**: Hover cards with basic artist info
3. **Deep Linking**: Direct links to specific events from artist profiles
4. **Social Sharing**: Share specific artist-event combinations
5. **Favorites**: Save favorite artists from event listings

### Analytics Integration
- Track artist profile visits from different sources
- Monitor conversion from events to artist profiles
- Measure engagement with artist links

## Maintenance Notes

### Code Locations
- **Event Components**: `src/components/listview/`
- **Overlay Components**: `src/components/overlays/`
- **Shared Components**: `src/components/shared/`
- **Map Components**: `src/components/map/`
- **Tests**: `src/components/__tests__/`

### Dependencies
- Next.js Link component for navigation
- Lucide React icons for visual indicators
- Event type definitions in `@/lib/types`
- Utility functions in `@/lib/utils/`

### Breaking Changes to Avoid
- Don't modify `event.artistIds` array structure
- Maintain backward compatibility for events without artists
- Preserve existing click handlers and event propagation
- Keep responsive design patterns consistent