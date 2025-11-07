import { useState } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { GENRE_CATEGORIES, type Genre } from '@/lib/constants/genres';

interface GenreSelectorProps {
  selectedGenres: string[];
  onChange: (genres: string[]) => void;
  className?: string;
}

export function GenreSelector({ selectedGenres, onChange, className = '' }: GenreSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

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

      {/* Category Browser */}
      <div style={{
        border: '1px solid var(--border)',
        borderRadius: '0.375rem',
        maxHeight: '24rem',
        overflowY: 'auto'
      }}>
        {GENRE_CATEGORIES.map((category, categoryIndex) => {
          const isExpanded = expandedCategories.has(category.name);
          const categoryGenreCount = category.genres.filter(g => selectedGenres.includes(g)).length;

          return (
            <div key={category.name} style={{ borderTop: categoryIndex > 0 ? '1px solid var(--border)' : 'none' }}>
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(category.name)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.2s',
                  color: 'var(--foreground)'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isExpanded ? (
                    <ChevronDown style={{ width: '1rem', height: '1rem', color: 'var(--muted-foreground)' }} />
                  ) : (
                    <ChevronRight style={{ width: '1rem', height: '1rem', color: 'var(--muted-foreground)' }} />
                  )}
                  <span style={{ fontWeight: 500 }}>{category.name}</span>
                  {categoryGenreCount > 0 && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: '0.375rem',
                      padding: '0.125rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--secondary)',
                      color: 'var(--secondary-foreground)'
                    }}>
                      {categoryGenreCount}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                  {category.genres.length} {category.genres.length === 1 ? 'genre' : 'genres'}
                </span>
              </button>

              {/* Category Genres */}
              {isExpanded && (
                <div style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'rgba(var(--muted-rgb), 0.3)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  {category.genres.map((genre) => {
                    const isSelected = selectedGenres.includes(genre);
                    return (
                      <span
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: '0.375rem',
                          border: isSelected ? '1px solid transparent' : '1px solid var(--border)',
                          padding: '0.25rem 0.625rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: isSelected ? 'var(--primary)' : 'var(--background)',
                          color: isSelected ? 'white' : 'var(--foreground)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        {isSelected && <span style={{ marginRight: '0.25rem' }}>✓</span>}
                        {genre}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
        <button
          type="button"
          onClick={() => {
            if (expandedCategories.size === GENRE_CATEGORIES.length) {
              setExpandedCategories(new Set());
            } else {
              setExpandedCategories(new Set(GENRE_CATEGORIES.map(c => c.name)));
            }
          }}
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
          {expandedCategories.size === GENRE_CATEGORIES.length ? 'Collapse All' : 'Expand All'}
        </button>
        {selectedGenres.length > 0 && (
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
        )}
      </div>
    </div>
  );
}
