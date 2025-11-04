// Service Worker registration utility for mobile performance

export const registerServiceWorker = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered successfully:', registration);

    // Update service worker when new version is available
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is available
            console.log('New service worker available');
            
            // Optionally show update notification to user
            if (window.confirm('A new version is available. Refresh to update?')) {
              window.location.reload();
            }
          }
        });
      }
    });

  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
};

export const unregisterServiceWorker = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));
    console.log('Service Worker unregistered successfully');
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
  }
};

// Check if app is running in standalone mode (PWA)
export const isStandalone = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
     (window.navigator as any).standalone === true)
  );
};

// Detect if device is mobile
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Get connection information for adaptive loading
export const getConnectionInfo = () => {
  if (typeof window === 'undefined') return null;
  
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;
  
  if (!connection) return null;
  
  return {
    effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
    downlink: connection.downlink, // Mbps
    rtt: connection.rtt, // ms
    saveData: connection.saveData // boolean
  };
};