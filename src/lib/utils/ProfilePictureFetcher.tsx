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
        // 1) Try to match a numeric ID in URLs like:
        //    https://www.facebook.com/people/Danny-Brab-Music/61551738096172/
        //    capturing "61551738096172" as the ID.
        let match = facebookUrl.match(/facebook\.com\/people\/[^/]+\/(\d+)/);
        if (match && match[1]) {
          const numericId = match[1];
          profilePicUrl = `https://graph.facebook.com/${numericId}/picture?type=large`;
        } else {
          // 2) Fallback to capturing the segment after facebook.com/ if there's no numeric ID
          //    e.g. "https://www.facebook.com/username"
          match = facebookUrl.match(/facebook\.com\/([^/?]+)/);
          if (match && match[1]) {
            const username = match[1];
            profilePicUrl = `https://graph.facebook.com/${username}/picture?type=large`;
          }
        }
      } else if (instagramUrl) {
        // Extract the username from the Instagram URL (e.g. "https://www.instagram.com/username")
        const match = instagramUrl.match(/instagram\.com\/([^/?]+)/);
        if (match && match[1]) {
          const username = match[1];
          try {
            // Note: Instagram's public endpoint may require adjustments or access tokens.
            const res = await fetch(`https://www.instagram.com/${username}/?__a=1`);
            const data = await res.json();
            profilePicUrl = data?.graphql?.user?.profile_pic_url_hd;
          } catch (error) {
            console.error("Error fetching Instagram profile picture", error);
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
