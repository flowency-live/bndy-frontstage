// Act Type Selector Component
// Multi-select checkbox group for act type (originals, covers, tribute)
// Created: 2025-11-07

import { ACT_TYPES, type ActType } from '@/lib/constants/artist';

interface ActTypeSelectorProps {
  selectedTypes: ActType[];
  onChange: (types: ActType[]) => void;
  className?: string;
  required?: boolean;
  error?: string;
}

export function ActTypeSelector({
  selectedTypes = [],
  onChange,
  className = '',
  required = false,
  error
}: ActTypeSelectorProps) {
  const toggleActType = (actType: ActType) => {
    const isSelected = selectedTypes.includes(actType);

    if (isSelected) {
      // Don't allow deselection if this is the last selected item and required
      if (required && selectedTypes.length === 1) {
        return;
      }
      onChange(selectedTypes.filter(t => t !== actType));
    } else {
      onChange([...selectedTypes, actType]);
    }
  };

  return (
    <div className={className}>
      <div style={{
        fontSize: '0.875rem',
        fontWeight: 500,
        marginBottom: '0.5rem',
        color: 'var(--foreground)'
      }}>
        Act Type {required && <span style={{ color: 'var(--destructive)' }}>*</span>}
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.75rem' }}>
        Select all that apply
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '0.5rem'
      }}>
        {ACT_TYPES.map((type) => {
          const isSelected = selectedTypes.includes(type.value as ActType);
          const isOnlySelected = isSelected && selectedTypes.length === 1 && required;

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
                cursor: isOnlySelected ? 'not-allowed' : 'pointer',
                opacity: isOnlySelected ? 0.6 : 1,
                transition: 'all 0.2s',
                position: 'relative'
              }}
              onMouseOver={(e) => {
                if (!isSelected && !isOnlySelected) {
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
                type="checkbox"
                value={type.value}
                checked={isSelected}
                onChange={() => toggleActType(type.value as ActType)}
                disabled={isOnlySelected}
                style={{
                  marginRight: '0.5rem',
                  cursor: isOnlySelected ? 'not-allowed' : 'pointer',
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

      {required && selectedTypes.length === 0 && (
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.75rem',
          color: 'var(--muted-foreground)'
        }}>
          Please select at least one act type
        </div>
      )}
    </div>
  );
}
