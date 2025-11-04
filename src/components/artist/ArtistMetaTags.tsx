import { SocialMediaURL } from "@/lib/types";

interface Event {
  id: string;
  name: string;
  date: string;
  venue?: {
    name: string;
    address?: string;
  };
}

interface ArtistMetaTagsProps {
  artistName: string;
  artistId: string;
  description?: string;
  profileImageUrl?: string;
  genres?: string[];
  socialMediaURLs?: SocialMediaURL[];
  upcomingEvents?: Event[];
}

export default function ArtistMetaTags({
  artistName,
  artistId,
  description,
  profileImageUrl,
  genres,
  socialMediaURLs,
  upcomingEvents
}: ArtistMetaTagsProps) {
  // Generate social media URLs for sameAs property
  const sameAsUrls = socialMediaURLs?.map(social => social.url) || [];

  // Generate structured data for artist
  const artistStructuredData = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "name": artistName,
    "url": `https://bndy.app/artists/${artistId}`,
    ...(description && { "description": description }),
    ...(profileImageUrl && { 
      "image": {
        "@type": "ImageObject",
        "url": profileImageUrl,
        "caption": `${artistName} profile image`
      }
    }),
    ...(genres && genres.length > 0 && { "genre": genres }),
    ...(sameAsUrls.length > 0 && { "sameAs": sameAsUrls }),
    "@id": `https://bndy.app/artists/${artistId}#artist`
  };

  // Generate structured data for upcoming events
  const eventsStructuredData = upcomingEvents && upcomingEvents.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${artistName} Upcoming Events`,
    "description": `Upcoming concerts and performances by ${artistName}`,
    "itemListElement": upcomingEvents.map((event, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "MusicEvent",
        "@id": `https://bndy.app/events/${event.id}`,
        "name": event.name,
        "startDate": event.date,
        "performer": {
          "@type": "MusicGroup",
          "name": artistName,
          "@id": `https://bndy.app/artists/${artistId}#artist`
        },
        ...(event.venue && {
          "location": {
            "@type": "Place",
            "name": event.venue.name,
            ...(event.venue.address && { "address": event.venue.address })
          }
        }),
        "url": `https://bndy.app/events/${event.id}`
      }
    }))
  } : null;

  // Breadcrumb structured data
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://bndy.app"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Artists",
        "item": "https://bndy.app/artists"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": artistName,
        "item": `https://bndy.app/artists/${artistId}`
      }
    ]
  };

  return (
    <>
      {/* Artist structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(artistStructuredData)
        }}
      />
      
      {/* Events structured data */}
      {eventsStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(eventsStructuredData)
          }}
        />
      )}
      
      {/* Breadcrumb structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData)
        }}
      />
    </>
  );
}