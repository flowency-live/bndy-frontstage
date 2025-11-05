import ArtistProfileHeaderSkeleton from "@/components/artist/skeletons/ArtistProfileHeaderSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <ArtistProfileHeaderSkeleton />
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    </div>
  );
}