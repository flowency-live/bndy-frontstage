export function extractFacebookUsername(url: string): string {

    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      // Handle URLs like /profile.php?id=...
      if (pathParts[0].toLowerCase() === 'profile.php') {
        return parsedUrl.searchParams.get('id') || '';
      }
      // Handle group URLs like /groups/1385857841508219/
      if (pathParts[0].toLowerCase() === 'groups' && pathParts[1]) {
        return pathParts[1];
      }
      // Handle people URLs like /people/Branded-Rhythm-Blues-band/100051215437847/
      if (pathParts[0].toLowerCase() === 'people') {
        // Return the last segment if it is numeric
        const lastSegment = pathParts[pathParts.length - 1];
        if (/^\d+$/.test(lastSegment)) {
          return lastSegment;
        }
        // Fallback: return the second segment if available
        if (pathParts.length >= 2) {
          return pathParts[1];
        }
      }
      // Otherwise, assume the first part is the username
      return pathParts[0];
    }

    return '';
  }


  
  export function getFacebookProfilePicUrl(username: string): string {
    return `https://graph.facebook.com/${username}/picture?type=large`;
  }
  
  // Helper to check if image exists (returns a promise)
  export function checkImageExists(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }