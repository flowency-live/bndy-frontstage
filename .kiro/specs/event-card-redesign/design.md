# Design Document

## Overview

This design transforms the current basic event cards in the EventsList component to match the polished aesthetic of the event overlay shown in the map interface. The new design emphasizes visual hierarchy, theme awareness, and modern card-based UI patterns while maintaining all existing functionality.

## Architecture

### Design System Integration
The redesigned event cards will fully integrate with the existing theme system using CSS custom properties. The design will automatically adapt between light and dark modes without requiring separate component logic.

### Visual Design Principles
- **Elevated Cards**: Use subtle shadows and borders to create depth
- **Color Hierarchy**: Primary orange for accents, secondary cyan for venue links, muted colors for secondary information
- **Typography Scale**: Clear size differentiation between primary, secondary, and tertiary information
- **Spacing System**: Consistent padding and margins using a 4px grid system

## Components and Interfaces

### EventCard Component Structure
The existing EventCard component will be redesigned with the following visual structure:

```
┌─────────────────────────────────────┐
│ ▌ [Accent Border]                   │
│                                     │
│  Event Name               [Badge]   │
│                                     │
│  📅 Date        🕐 Time            │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📍 Venue Name        2 mi   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ────────────────────────────────   │
│                                     │
│  🎫 Ticket Info    [Get Tickets]   │
│                                     │
│  🔗 More Details                    │
│                                     │
│  Description text...                │
│                                     │
└─────────────────────────────────────┘
```

### Theme-Aware Color Mapping

#### Light Mode
- Card Background: `var(--card-bg)` (white)
- Text: `var(--card-foreground)` (dark)
- Accent Border: `var(--primary)` (orange)
- Venue Highlight: `var(--secondary)` (cyan)
- Muted Text: `var(--muted-foreground)` (gray)

#### Dark Mode
- Card Background: `var(--card-bg)` (dark blue-gray)
- Text: `var(--card-foreground)` (light)
- Accent Border: `var(--primary)` (orange)
- Venue Highlight: `var(--secondary)` (cyan)
- Muted Text: `var(--muted-foreground)` (light gray)

## Data Models

### EventCard Props Interface
```typescript
interface EventCardProps {
  event: Event;
  userLocation?: Location | null;
}

interface Event {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime?: string;
  venueName: string;
  venueId: string;
  location?: Location;
  ticketed: boolean;
  ticketinformation?: string;
  ticketUrl?: string;
  eventUrl?: string;
  description?: string;
}
```

No changes to the data model are required - the redesign is purely visual.

## Visual Design Specifications

### Card Layout
- **Border Radius**: 12px for modern rounded corners
- **Accent Border**: 4px left border using primary color
- **Padding**: 20px internal padding
- **Margin**: 16px bottom margin between cards
- **Shadow**: Subtle elevation shadow that adapts to theme

### Typography Hierarchy
1. **Event Name**: 18px, font-weight: 600, primary text color
2. **Date/Time**: 14px, font-weight: 500, primary text color
3. **Venue Name**: 14px, font-weight: 600, secondary color (cyan)
4. **Ticket Info**: 14px, font-weight: 500, primary text color
5. **Description**: 12px, font-weight: 400, muted text color

### Interactive Elements
- **Hover State**: Subtle scale transform (1.02) and enhanced shadow
- **Focus State**: 2px outline using primary color
- **Active State**: Slight scale down (0.98) for touch feedback
- **Transitions**: 200ms ease for all interactive states

### Icon System
- **Size**: 16px for all icons
- **Color**: Muted foreground color
- **Spacing**: 8px gap between icon and text
- **Icons Used**:
  - Calendar: Date information
  - Clock: Time information  
  - Location: Venue information
  - Ticket: Pricing information
  - External Link: More details link

### Responsive Behavior
- **Mobile (< 640px)**: Full width cards, 16px padding
- **Tablet (640px - 1024px)**: Maintain card design, 20px padding
- **Desktop (> 1024px)**: Maximum width constraints, enhanced hover effects

## Error Handling

### Missing Data Scenarios
- **No End Time**: Display only start time
- **No Ticket URL**: Hide "Get Tickets" button
- **No Event URL**: Hide "More Details" link
- **No Description**: Hide description section
- **No User Location**: Hide distance indicator

### Theme Transition Handling
- Use CSS transitions on theme-dependent properties
- Ensure no flash of unstyled content during theme changes
- Maintain visual consistency during theme transitions

## Testing Strategy

### Visual Regression Testing
- Screenshot comparisons in both light and dark themes
- Cross-browser compatibility testing
- Mobile device testing on various screen sizes

### Accessibility Testing
- Color contrast validation in both themes
- Keyboard navigation testing
- Screen reader compatibility
- Focus indicator visibility

### Performance Considerations
- CSS-only animations for smooth performance
- Minimal re-renders during theme changes
- Efficient hover state implementations

## Implementation Notes

### CSS Strategy
- Use CSS custom properties for all theme-dependent values
- Implement hover effects with CSS transforms for performance
- Use CSS Grid/Flexbox for responsive layout
- Minimize JavaScript for styling logic

### Existing Code Preservation
- Maintain all existing functionality and props
- Preserve distance calculation and filtering logic
- Keep existing accessibility attributes
- Maintain current event data structure

### Migration Approach
- Replace existing card styling while preserving component structure
- Update CSS classes to use theme system variables
- Add new visual elements (accent border, enhanced typography)
- Test thoroughly in both theme modes