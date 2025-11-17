import "./artists-layout.css";

export default function ArtistsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="artist-profile-page">
      {children}
    </div>
  );
}
