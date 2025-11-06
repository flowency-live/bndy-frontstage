# Notification System Design

## Overview

The notification system provides real-time alerts through a clean, mobile-first interface. The design prioritizes simplicity with edge-to-edge layouts, minimal vertical padding, and direct user interactions without unnecessary UI complexity.

## Architecture

### Core Components

- **NotificationProvider**: React context for global notification state management
- **NotificationBell**: Header icon with badge counter
- **NotificationPanel**: Slide-out panel for notification list
- **NotificationItem**: Individual notification display component
- **NotificationService**: API service for CRUD operations
- **WebSocketManager**: Real-time notification delivery
- **NotificationStore**: Client-side state management

### Data Flow

```
Event Occurs → Backend Service → WebSocket → NotificationStore → UI Update
```

## Components and Interfaces

### NotificationProvider Context

```typescript
interface NotificationContext {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  dismissNotification: (id: string) => void
}
```

### Notification Data Model

```typescript
interface Notification {
  id: string
  type: 'event' | 'song_added' | 'song_voted' | 'setlist_created' | 'event_added' | 'playbook_added'
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
}
```

### NotificationBell Component

**Design Principles:**
- Fixed position in header, right side
- Simple bell icon with red dot badge for unread count
- No card wrapper, direct icon styling
- Touch-friendly 44px minimum tap target

**Layout:**
```
[Bell Icon][Badge: 3]
```

### NotificationPanel Component

**Design Principles:**
- Slide-in from right edge (mobile) or dropdown (desktop)
- Full-width on mobile, 320px width on desktop
- Edge-to-edge content, no container cards
- Minimal 8px vertical spacing between items

**Mobile Layout:**
```
┌─────────────────────┐
│ Notifications    [×]│ ← Header with close
├─────────────────────┤
│ Song Added          │ ← Direct content, no cards
│ "New Horizons" by...│
│ 2 min ago          │
├─────────────────────┤
│ Event Today         │
│ Open Mic Night at...│
│ 1 hour ago         │
└─────────────────────┘
```

### NotificationItem Component

**Design Principles:**
- No card containers or borders
- Simple horizontal layout with icon, content, timestamp
- Touch-friendly with full-width tap area
- Subtle background change for unread items

**Layout Structure:**
```
[Icon] Title                    [Time]
       Message text
       [Action Button] (if applicable)
```

## Data Models

### Database Schema

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url VARCHAR(500),
  action_label VARCHAR(100),
  metadata JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_created (user_id, created_at DESC),
  INDEX idx_user_unread (user_id, is_read)
);

CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY,
  event_reminders BOOLEAN DEFAULT TRUE,
  song_voting BOOLEAN DEFAULT TRUE,
  setlist_updates BOOLEAN DEFAULT TRUE,
  event_updates BOOLEAN DEFAULT TRUE,
  playbook_updates BOOLEAN DEFAULT TRUE,
  quiet_hours_start TIME,
  quiet_hours_end TIME
);
```

### API Endpoints

```typescript
// GET /api/notifications - Fetch user notifications
// POST /api/notifications/mark-read - Mark notifications as read
// PUT /api/notifications/preferences - Update user preferences
// WebSocket: /ws/notifications - Real-time updates
```

## Error Handling

### Connection Management
- WebSocket reconnection with exponential backoff
- Fallback to HTTP polling if WebSocket fails
- Graceful degradation for offline scenarios
- Error boundaries for notification UI components

### User Experience
- Silent failures for non-critical operations
- Retry mechanisms for failed API calls
- Loading states only for user-initiated actions
- No error modals, use inline error messages

## Testing Strategy

### Unit Tests
- NotificationProvider context state management
- NotificationService API interactions
- WebSocket connection handling
- Notification grouping logic

### Integration Tests
- End-to-end notification delivery flow
- Real-time updates across multiple browser tabs
- PWA badge functionality
- Accessibility compliance testing

### Performance Tests
- Large notification list rendering
- WebSocket connection stability
- Memory usage with long-running sessions
- Mobile device performance optimization

## Implementation Notes

### Mobile-First Design
- Touch gestures for swipe-to-dismiss
- Optimized for thumb navigation
- Edge-to-edge layouts without margins
- Minimal vertical spacing (8px between items)

### Performance Optimization
- Virtual scrolling for large notification lists
- Debounced API calls for mark-as-read operations
- Efficient WebSocket message handling
- Lazy loading of notification history

### Accessibility
- Keyboard navigation support
- Screen reader announcements for new notifications
- High contrast mode compatibility
- Focus management for panel interactions