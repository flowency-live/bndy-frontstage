export default function ArtistsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style jsx global>{`
        /* Hide header and remove top margin for artist pages */
        body:has([data-artist-profile]) header {
          display: none;
        }
        body:has([data-artist-profile]) main {
          margin-top: 0 !important;
        }
      `}</style>
      <div data-artist-profile>
        {children}
      </div>
    </>
  );
}
