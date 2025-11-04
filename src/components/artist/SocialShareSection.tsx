"use client";

import { useState } from "react";
import { Share2, Copy, Check, MessageCircle } from "lucide-react";

interface SocialShareSectionProps {
  artistName: string;
  artistId: string;
  description?: string;
}

export default function SocialShareSection({ 
  artistName, 
  artistId, 
  description 
}: SocialShareSectionProps) {
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showMobileActionSheet, setShowMobileActionSheet] = useState(false);

  // Generate the profile URL
  const profileUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/artists/${artistId}`
    : '';

  // Generate share text
  const shareText = `Check out ${artistName} on bndy!${description ? ` ${description.slice(0, 100)}...` : ''}`;

  // Native Web Share API with enhanced mobile support and analytics
  const handleNativeShare = async () => {
    setIsSharing(true);
    
    // Check if Web Share API is supported
    if ('share' in navigator) {
      const shareData = {
        title: `${artistName} | bndy`,
        text: shareText,
        url: profileUrl,
      };

      // Try to share the data
      try {
        await navigator.share(shareData);
        
        // Track successful native share (for analytics)
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'share', {
            method: 'native',
            content_type: 'artist_profile',
            content_id: artistId,
            custom_parameters: {
              artist_name: artistName
            }
          });
        }
        
        setIsSharing(false);
        return;
      } catch (error) {
        // User cancelled or sharing failed
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Share failed:', error);
          
          // Track share failure for debugging
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'exception', {
              description: `Native share failed: ${error.message}`,
              fatal: false
            });
          }
        }
      }
    }
    
    // Fallback to showing platform-specific share menu
    setShowShareMenu(!showShareMenu);
    setIsSharing(false);
  };

  // Copy to clipboard with enhanced fallback and haptic feedback
  const handleCopyLink = async () => {
    try {
      // Modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(profileUrl);
        
        // Provide haptic feedback on mobile devices
        if ('vibrate' in navigator) {
          navigator.vibrate(50); // Short vibration for success
        }
        
        // Track copy action for analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'share', {
            method: 'copy_link',
            content_type: 'artist_profile',
            content_id: artistId,
            custom_parameters: {
              artist_name: artistName
            }
          });
        }
        
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
        return;
      }
    } catch (error) {
      console.error('Clipboard API failed:', error);
    }

    // Fallback for older browsers or insecure contexts
    try {
      const textArea = document.createElement('textarea');
      textArea.value = profileUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // Use the newer approach if available
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        // Provide haptic feedback on mobile devices
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } else {
        throw new Error('Copy command failed');
      }
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError);
      
      // Enhanced error handling with mobile-friendly dialog
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]); // Error vibration pattern
      }
      
      // Show error feedback to user with better mobile UX
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      if (isMobile) {
        // On mobile, show a more user-friendly message
        const copyText = `Copy this link to share ${artistName}'s profile:\n\n${profileUrl}`;
        if (confirm(copyText + '\n\nTap OK to try copying again, or Cancel to dismiss.')) {
          // Retry copy operation
          handleCopyLink();
        }
      } else {
        alert('Unable to copy link. Please copy manually: ' + profileUrl);
      }
    }
  };

  // Platform-specific sharing with enhanced mobile support and analytics
  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Track share attempt
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: 'facebook',
        content_type: 'artist_profile',
        content_id: artistId,
        custom_parameters: {
          artist_name: artistName
        }
      });
    }
    
    if (isMobile) {
      // On mobile, try to open the Facebook app first
      const appUrl = `fb://share?href=${encodeURIComponent(profileUrl)}`;
      
      // Create a hidden iframe to test if the app opens
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = appUrl;
      document.body.appendChild(iframe);
      
      // Fallback to web version after a short delay
      setTimeout(() => {
        document.body.removeChild(iframe);
        window.open(url, '_blank');
      }, 1000);
    } else {
      window.open(url, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    }
  };

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Track share attempt
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: 'twitter',
        content_type: 'artist_profile',
        content_id: artistId,
        custom_parameters: {
          artist_name: artistName
        }
      });
    }
    
    if (isMobile) {
      // Try multiple Twitter app URL schemes for better compatibility
      const appUrls = [
        `twitter://post?message=${encodeURIComponent(`${shareText} ${profileUrl}`)}`,
        `tweetbot:///post?text=${encodeURIComponent(`${shareText} ${profileUrl}`)}`,
        `twitterrific:///post?message=${encodeURIComponent(`${shareText} ${profileUrl}`)}`
      ];
      
      let attempted = 0;
      const tryNextApp = () => {
        if (attempted < appUrls.length) {
          window.location.href = appUrls[attempted];
          attempted++;
          setTimeout(tryNextApp, 300);
        } else {
          // All app attempts failed, open web version
          window.open(url, '_blank');
        }
      };
      
      tryNextApp();
    } else {
      window.open(url, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    }
  };

  const shareOnWhatsApp = () => {
    const text = `${shareText} ${profileUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Track share attempt
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: 'whatsapp',
        content_type: 'artist_profile',
        content_id: artistId,
        custom_parameters: {
          artist_name: artistName
        }
      });
    }
    
    if (isMobile) {
      // On mobile, try to open WhatsApp app directly with better error handling
      const appUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
      
      // Use a more reliable method to detect if WhatsApp is available
      const startTime = Date.now();
      window.location.href = appUrl;
      
      // Check if we're still on the page after attempting to open WhatsApp
      setTimeout(() => {
        const timeElapsed = Date.now() - startTime;
        // If less than 1 second has passed, likely the app didn't open
        if (timeElapsed < 1000) {
          window.open(url, '_blank');
        }
      }, 1000);
    } else {
      window.open(url, '_blank');
    }
  };

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
    
    // Track share attempt
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: 'linkedin',
        content_type: 'artist_profile',
        content_id: artistId,
        custom_parameters: {
          artist_name: artistName
        }
      });
    }
    
    window.open(url, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
  };

  const shareOnReddit = () => {
    const url = `https://reddit.com/submit?url=${encodeURIComponent(profileUrl)}&title=${encodeURIComponent(`Check out ${artistName} on bndy!`)}`;
    
    // Track share attempt
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: 'reddit',
        content_type: 'artist_profile',
        content_id: artistId,
        custom_parameters: {
          artist_name: artistName
        }
      });
    }
    
    window.open(url, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
  };

  const shareViaSMS = () => {
    const text = `${shareText} ${profileUrl}`;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Track share attempt
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: 'sms',
        content_type: 'artist_profile',
        content_id: artistId,
        custom_parameters: {
          artist_name: artistName
        }
      });
    }
    
    if (isMobile) {
      // Enhanced SMS sharing with better mobile support
      const smsUrl = `sms:?body=${encodeURIComponent(text)}`;
      
      // Provide haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      window.location.href = smsUrl;
    } else {
      // On desktop, copy to clipboard as SMS isn't available
      handleCopyLink();
    }
  };

  const shareViaEmail = () => {
    const subject = `Check out ${artistName} on bndy!`;
    const body = `${shareText}\n\n${profileUrl}`;
    
    // Track share attempt
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: 'email',
        content_type: 'artist_profile',
        content_id: artistId,
        custom_parameters: {
          artist_name: artistName
        }
      });
    }
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Quick share action for mobile
  const handleQuickShare = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && 'share' in navigator) {
      handleNativeShare();
    } else if (isMobile) {
      setShowMobileActionSheet(true);
    } else {
      setShowShareMenu(true);
    }
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
        Share Artist
      </h3>
      
      <div className="space-y-3">
        {/* Native Share Button (Mobile-first) */}
        <button
          onClick={handleNativeShare}
          disabled={isSharing}
          className="share-button button-micro focus-enhanced touch-feedback w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium mobile-button touch-optimized mobile-focus gpu-accelerated"
        >
          <Share2 size={18} className={isSharing ? 'animate-pulse' : ''} />
          {isSharing ? 'Sharing...' : 'Share Artist'}
        </button>

        {/* Copy Link Button */}
        <button
          onClick={handleCopyLink}
          className="share-button button-micro focus-enhanced touch-feedback w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)] rounded-lg transition-colors font-medium mobile-button touch-optimized mobile-focus gpu-accelerated"
        >
          {copied ? (
            <>
              <Check size={18} className="text-green-500 success-feedback gpu-accelerated" />
              <span className="text-green-500 success-feedback">Link Copied!</span>
            </>
          ) : (
            <>
              <Copy size={18} />
              Copy Link
            </>
          )}
        </button>

        {/* Platform-specific sharing (shown when native share not available or as fallback) */}
        {(showShareMenu || !('share' in navigator)) && (
          <div className="pt-2 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--foreground)]/70 mb-3">
              Or share on:
            </p>
            
            {/* Primary social platforms */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                onClick={shareOnFacebook}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#1877F2]/90 transition-colors text-sm font-medium touch-optimized mobile-focus gpu-accelerated hover-enabled"
                title="Share on Facebook"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="hidden sm:inline">Facebook</span>
              </button>
              
              <button
                onClick={shareOnTwitter}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1DA1F2]/90 transition-colors text-sm font-medium touch-optimized mobile-focus gpu-accelerated hover-enabled"
                title="Share on Twitter"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                <span className="hidden sm:inline">Twitter</span>
              </button>
              
              <button
                onClick={shareOnWhatsApp}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#25D366]/90 transition-colors text-sm font-medium touch-optimized mobile-focus gpu-accelerated hover-enabled"
                title="Share on WhatsApp"
              >
                <MessageCircle size={16} />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            </div>

            {/* Additional sharing options */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={shareOnLinkedIn}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-[#0A66C2] text-white rounded-lg hover:bg-[#0A66C2]/90 transition-colors text-sm font-medium touch-optimized mobile-focus gpu-accelerated hover-enabled"
                title="Share on LinkedIn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="hidden sm:inline">LinkedIn</span>
              </button>
              
              <button
                onClick={shareOnReddit}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-[#FF4500] text-white rounded-lg hover:bg-[#FF4500]/90 transition-colors text-sm font-medium touch-optimized mobile-focus gpu-accelerated hover-enabled"
                title="Share on Reddit"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                </svg>
                <span className="hidden sm:inline">Reddit</span>
              </button>
              
              <button
                onClick={shareViaSMS}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-[var(--foreground)]/10 hover:bg-[var(--foreground)]/20 text-[var(--foreground)] rounded-lg transition-colors text-sm font-medium touch-optimized mobile-focus gpu-accelerated hover-enabled"
                title="Share via SMS"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z"/>
                </svg>
                <span className="hidden sm:inline">SMS</span>
              </button>
              
              <button
                onClick={shareViaEmail}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-[var(--foreground)]/10 hover:bg-[var(--foreground)]/20 text-[var(--foreground)] rounded-lg transition-colors text-sm font-medium touch-optimized mobile-focus gpu-accelerated hover-enabled"
                title="Share via Email"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span className="hidden sm:inline">Email</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Action Sheet */}
      {showMobileActionSheet && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:hidden"
          onClick={() => setShowMobileActionSheet(false)}
        >
          <div 
            className="bg-[var(--card)] rounded-t-2xl w-full p-6 safe-area-padding animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-[var(--foreground)]/20 rounded-full mx-auto mb-4"></div>
            <h4 className="text-lg font-semibold text-[var(--foreground)] mb-4 text-center">
              Share {artistName}
            </h4>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  handleCopyLink();
                  setShowMobileActionSheet(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)] rounded-lg transition-colors font-medium"
              >
                <Copy size={20} />
                Copy Link
              </button>
              
              <button
                onClick={() => {
                  shareOnWhatsApp();
                  setShowMobileActionSheet(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#25D366] text-white rounded-lg hover:bg-[#25D366]/90 transition-colors font-medium"
              >
                <MessageCircle size={20} />
                Share on WhatsApp
              </button>
              
              <button
                onClick={() => {
                  shareViaSMS();
                  setShowMobileActionSheet(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--foreground)]/10 hover:bg-[var(--foreground)]/20 text-[var(--foreground)] rounded-lg transition-colors font-medium"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z"/>
                </svg>
                Send via SMS
              </button>
              
              <button
                onClick={() => {
                  shareViaEmail();
                  setShowMobileActionSheet(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--foreground)]/10 hover:bg-[var(--foreground)]/20 text-[var(--foreground)] rounded-lg transition-colors font-medium"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                Send via Email
              </button>
              
              <button
                onClick={() => setShowMobileActionSheet(false)}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)] rounded-lg transition-colors font-medium mt-4"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}