import { useEffect } from "react";

interface ProfilePictureFetcherProps {
  facebookUrl?: string;
  instagramUrl?: string;
  onPictureFetched: (url: string) => void;
}

const ProfilePictureFetcher: React.FC<ProfilePictureFetcherProps> = ({
  facebookUrl,
  instagramUrl,
  onPictureFetched,
}) => {
  useEffect(() => {
    const fetchProfilePicture = async () => {
      let profilePicUrl: string = "";

      if (facebookUrl) {
        // Log the Facebook URL for debugging
        console.log("Processing Facebook URL:", facebookUrl);
        
        // 1) Try to match a numeric ID in URLs like:
        //    https://www.facebook.com/people/Danny-Brab-Music/61551738096172/
        //    capturing "61551738096172" as the ID.
        let match = facebookUrl.match(/facebook\.com\/people\/[^/]+\/(\d+)/);
        if (match && match[1]) {
          const numericId = match[1];
          profilePicUrl = `https://graph.facebook.com/${numericId}/picture?type=large`;
          console.log("Extracted numeric ID:", numericId);
        } else {
          // 2) Try to match page name - be more specific with the regex
          // Look for patterns like facebook.com/pagename
          // Avoid matching single letters like 't'
          match = facebookUrl.match(/facebook\.com\/([a-zA-Z0-9.]{2,}[^/?]*)/);
          if (match && match[1]) {
            const username = match[1];
            console.log("Extracted username:", username);
            profilePicUrl = `https://graph.facebook.com/${username}/picture?type=large`;
          } else {
            console.log("Could not extract Facebook ID or username from URL:", facebookUrl);
          }
        }
      }

      if (profilePicUrl) {
        console.log("Fetched profile picture URL:", profilePicUrl);
        onPictureFetched(profilePicUrl);
      } else {
        console.log("No profile picture URL could be determined.");
      }
    };

    fetchProfilePicture();
  }, [facebookUrl, instagramUrl, onPictureFetched]);

  return null;
};

export default ProfilePictureFetcher;
