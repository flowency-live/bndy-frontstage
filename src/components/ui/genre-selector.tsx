import { X } from 'lucide-react';
import { GENRES, type Genre } from '@/lib/constants/genres';

interface GenreSelectorProps {
  selectedGenres: string[];
  onChange: (genres: string[]) => void;
  className?: string;
}

export function GenreSelector({ selectedGenres, onChange, className = '' }: GenreSelectorProps) {
  const toggleGenre = (genre: Genre) => {
    const newGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter(g => g !== genre)
      : [...selectedGenres, genre];
    onChange(newGenres);
  };

  const removeGenre = (genre: string) => {
    onChange(selectedGenres.filter(g => g !== genre));
  };

  return (
    <div className={className}>
      {/* Selected Genres Display */}
      {selectedGenres.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
            Selected Genres ({selectedGenres.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {selectedGenres.map((genre) => (
              <span
                key={genre}
                onClick={() => removeGenre(genre)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '0.375rem',
                  border: '1px solid transparent',
                  padding: '0.25rem 0.625rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                {genre}
                <X style={{ width: '0.75rem', height: '0.75rem', marginLeft: '0.25rem' }} />
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Genre Grid */}
      <div style={{
        border: '1px solid var(--border)',
        borderRadius: '0.375rem',
        maxHeight: '16rem',
        overflowY: 'auto',
        padding: '0.75rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '0.5rem'
        }}>
          {GENRES.map((genre) => {
            const isSelected = selectedGenres.includes(genre);
            return (
              <span
                key={genre}
                onClick={() => toggleGenre(genre)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '0.375rem',
                  border: isSelected ? '1px solid transparent' : '1px solid var(--border)',
                  padding: '0.375rem 0.625rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: isSelected ? 'var(--primary)' : 'var(--background)',
                  color: isSelected ? 'white' : 'var(--foreground)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center'
                }}
                onMouseOver={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--accent)';
                  }
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--background)';
                  }
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {isSelected && <span style={{ marginRight: '0.25rem' }}>✓</span>}
                {genre}
              </span>
            );
          })}
        </div>
      </div>

      {/* Clear All Button */}
      {selectedGenres.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
          <button
            type="button"
            onClick={() => onChange([])}
            style={{
              padding: '0.375rem 0.75rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--foreground)',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
