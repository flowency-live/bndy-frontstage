// Artist Type Selector Component
// Single-select radio button group for artist type
// Created: 2025-11-07

import { ARTIST_TYPES, type ArtistType } from '@/lib/constants/artist';

interface ArtistTypeSelectorProps {
  selectedType?: ArtistType;
  onChange: (type: ArtistType) => void;
  className?: string;
  required?: boolean;
  error?: string;
}

export function ArtistTypeSelector({
  selectedType,
  onChange,
  className = '',
  required = false,
  error
}: ArtistTypeSelectorProps) {
  return (
    <div className={className}>
      <div style={{
        fontSize: '0.875rem',
        fontWeight: 500,
        marginBottom: '0.5rem',
        color: 'var(--foreground)'
      }}>
        Artist Type {required && <span style={{ color: 'var(--destructive)' }}>*</span>}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '0.5rem'
      }}>
        {ARTIST_TYPES.map((type) => {
          const isSelected = selectedType === type.value;
          return (
            <label
              key={type.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                border: isSelected
                  ? '2px solid var(--primary)'
                  : '1px solid var(--border)',
                backgroundColor: isSelected
                  ? 'var(--primary-foreground)'
                  : 'var(--background)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
              }}
              onMouseOver={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }
              }}
              onMouseOut={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'var(--background)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }
              }}
            >
              <input
                type="radio"
                name="artist-type"
                value={type.value}
                checked={isSelected}
                onChange={() => onChange(type.value as ArtistType)}
                style={{
                  marginRight: '0.5rem',
                  cursor: 'pointer',
                  width: '1rem',
                  height: '1rem',
                  accentColor: 'var(--primary)'
                }}
              />
              <span style={{
                fontSize: '0.875rem',
                fontWeight: isSelected ? 600 : 500,
                color: 'var(--foreground)'
              }}>
                {type.label}
              </span>
            </label>
          );
        })}
      </div>

      {error && (
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.75rem',
          color: 'var(--destructive)'
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
