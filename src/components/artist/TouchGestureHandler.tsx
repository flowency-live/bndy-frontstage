"use client";

import { useRef, useEffect, ReactNode } from "react";

interface TouchGestureHandlerProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPinch?: (scale: number) => void;
  className?: string;
  threshold?: number;
  velocityThreshold?: number;
  longPressDelay?: number;
  enableHapticFeedback?: boolean;
}

export default function TouchGestureHandler({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onDoubleTap,
  onLongPress,
  onPinch,
  className = "",
  threshold = 50,
  velocityThreshold = 0.3,
  longPressDelay = 500,
  enableHapticFeedback = true
}: TouchGestureHandlerProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialPinchDistanceRef = useRef<number>(0);
  const isPinchingRef = useRef<boolean>(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
      if (!enableHapticFeedback || typeof window === 'undefined') return;
      
      // Use Vibration API for haptic feedback on supported devices
      if ('vibrate' in navigator) {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [30]
        };
        navigator.vibrate(patterns[type]);
      }
    };

    const getDistance = (touch1: Touch, touch2: Touch): number => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
      
      touchStartRef.current = {
        x: touchStartX,
        y: touchStartY,
        time: touchStartTime
      };

      // Handle multi-touch for pinch gestures
      if (e.touches.length === 2 && onPinch) {
        isPinchingRef.current = true;
        initialPinchDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
        return;
      }

      // Add enhanced touch feedback
      element.style.transform = 'scale(0.98)';
      element.style.transition = 'transform 0.1s ease-out';
      element.style.filter = 'brightness(0.95)';

      // Start long press timer
      if (onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          triggerHapticFeedback('medium');
          onLongPress();
          longPressTimerRef.current = null;
        }, longPressDelay);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Handle pinch gestures
      if (e.touches.length === 2 && isPinchingRef.current && onPinch) {
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialPinchDistanceRef.current;
        onPinch(scale);
        return;
      }

      // Cancel long press if finger moves too much
      if (longPressTimerRef.current && touchStartRef.current) {
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
        
        if (deltaX > 10 || deltaY > 10) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      // Reset pinch state
      if (isPinchingRef.current) {
        isPinchingRef.current = false;
        initialPinchDistanceRef.current = 0;
      }

      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const touchEndX = touch.clientX;
      const touchEndY = touch.clientY;
      const touchEndTime = Date.now();

      const deltaX = touchEndX - touchStartRef.current.x;
      const deltaY = touchEndY - touchStartRef.current.y;
      const deltaTime = touchEndTime - touchStartRef.current.time;
      const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;

      // Remove enhanced touch feedback
      element.style.transform = '';
      element.style.transition = 'transform 0.2s ease-out';
      element.style.filter = '';

      // Check for swipe gestures
      if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
        if (velocity > velocityThreshold) {
          triggerHapticFeedback('light');
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > 0) {
              onSwipeRight?.();
            } else {
              onSwipeLeft?.();
            }
          } else {
            // Vertical swipe
            if (deltaY > 0) {
              onSwipeDown?.();
            } else {
              onSwipeUp?.();
            }
          }
        }
      } else if (deltaTime < 300) {
        // Check for tap gestures
        const now = Date.now();
        const timeSinceLastTap = now - lastTapRef.current;

        if (timeSinceLastTap < 300 && onDoubleTap) {
          // Double tap
          triggerHapticFeedback('medium');
          onDoubleTap();
          lastTapRef.current = 0;
        } else {
          // Single tap
          triggerHapticFeedback('light');
          onTap?.();
          lastTapRef.current = now;
        }
      }

      touchStartRef.current = null;
    };

    const handleTouchCancel = () => {
      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      // Reset pinch state
      isPinchingRef.current = false;
      initialPinchDistanceRef.current = 0;

      // Remove enhanced touch feedback on cancel
      element.style.transform = '';
      element.style.transition = 'transform 0.2s ease-out';
      element.style.filter = '';
      touchStartRef.current = null;
    };

    // Add passive listeners for better performance
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      // Clear any pending timers
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }

      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onDoubleTap, onLongPress, onPinch, threshold, velocityThreshold, longPressDelay, enableHapticFeedback]);

  return (
    <div 
      ref={elementRef} 
      className={`touch-none select-none gesture-area ${className}`}
      style={{ 
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        touchAction: onPinch ? 'none' : 'manipulation',
        WebkitUserDrag: 'none',
        userDrag: 'none'
      }}
    >
      {children}
    </div>
  );
}