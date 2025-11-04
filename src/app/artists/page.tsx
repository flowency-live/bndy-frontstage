import { Suspense } from 'react';
import ArtistBrowseClient from './ArtistBrowseClient';

export default function ArtistsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Artists</h1>
          <p className="text-muted-foreground">Discover talented musicians and bands</p>
        </div>
        
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <ArtistBrowseClient />
        </Suspense>
      </div>
    </div>
  );
}