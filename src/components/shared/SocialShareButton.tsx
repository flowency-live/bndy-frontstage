'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';

interface SocialShareButtonProps {
  title: string;
  text: string;
  url?: string; // Defaults to current page URL
  className?: string;
  variant?: 'button' | 'icon'; // Button with text or icon-only
  size?: 'sm' | 'md' | 'lg';
}

export default function SocialShareButton({
  title,
  text,
  url,
  className = '',
  variant = 'button',
  size = 'md'
}: SocialShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Get the URL to share (default to current page)
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // Size classes
  const sizeClasses = {
    sm: 'p-2 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  // Icon sizes
  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20
  };

  // Native Web Share API
  const handleNativeShare = async () => {
    setIsSharing(true);
    
    // Check if Web Share API is supported
    if ('share' in navigator) {
      const shareData = {
        title,
        text,
        url: shareUrl,
      };

      try {
        await navigator.share(shareData);
        setIsSharing(false);
        return;
      } catch (error) {
        // User cancelled or sharing failed
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }
    
    // Fallback to copy to clipboard
    await handleCopyLink();
    setIsSharing(false);
  };

  // Copy to clipboard
  const handleCopyLink = async () => {
    try {
      // Modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        
        // Provide haptic feedback on mobile devices
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch (error) {
      console.error('Clipboard API failed:', error);
    }

    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError);
    }
  };

  // Button content based on variant
  const renderButtonContent = () => {
    if (copied) {
      return (
        <>
          <Check size={iconSizes[size]} className="text-green-500" />
          {variant === 'button' && <span className="text-green-500">Copied!</span>}
        </>
      );
    }

    if (isSharing) {
      return (
        <>
          <Share2 size={iconSizes[size]} className="animate-pulse" />
          {variant === 'button' && <span>Sharing...</span>}
        </>
      );
    }

    // Check if native sharing is available
    if ('share' in navigator) {
      return (
        <>
          <Share2 size={iconSizes[size]} />
          {variant === 'button' && <span>Share</span>}
        </>
      );
    }

    // Fallback to copy
    return (
      <>
        <Copy size={iconSizes[size]} />
        {variant === 'button' && <span>Copy Link</span>}
      </>
    );
  };

  const baseClasses = `
    inline-flex items-center justify-center gap-2 
    rounded-lg transition-colors font-medium
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
    disabled:opacity-50 disabled:cursor-not-allowed
    ${sizeClasses[size]}
  `;

  const variantClasses = variant === 'icon' 
    ? 'bg-muted hover:bg-muted/80 text-foreground' 
    : 'bg-primary text-primary-foreground hover:bg-primary/90';

  return (
    <button
      onClick={handleNativeShare}
      disabled={isSharing}
      className={`${baseClasses} ${variantClasses} ${className}`}
      title={copied ? 'Link copied!' : ('share' in navigator ? 'Share' : 'Copy link')}
      aria-label={copied ? 'Link copied to clipboard' : ('share' in navigator ? `Share ${title}` : `Copy link for ${title}`)}
    >
      {renderButtonContent()}
    </button>
  );
}