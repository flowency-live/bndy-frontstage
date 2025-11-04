import { Suspense } from 'react';
import ArtistBrowseClient from './ArtistBrowseClient';

export default function ArtistsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Artists</h1>
          <p className="text-gray-600">Discover talented musicians and bands</p>
        </div>
        
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }>
          <ArtistBrowseClient />
        </Suspense>
      </div>
    </div>
  );
}