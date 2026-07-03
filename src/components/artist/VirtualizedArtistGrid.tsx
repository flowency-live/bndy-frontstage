'use client';

/**
 * VirtualizedArtistGrid - Renders artist cards with windowed virtualization
 *
 * Only renders ~20-30 cards visible in viewport at any time.
 * Handles grouped layouts (A-Z, type, location, genre) efficiently.
 *
 * Uses react-window v2 List component with:
 * - Group headers as separate rows
 * - Dynamic column count based on container width
 * - Artist rows containing multiple cards per row
 */

import { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import { List, useListRef } from 'react-window';
import type { Artist } from '@/lib/types';
import ArtistCard from './ArtistCard';

interface VirtualizedArtistGridProps {
  groupedArtists: Record<string, Artist[]>;
  giggingArtistIds: Set<string>;
  groupBy: 'alpha' | 'type' | 'location' | 'genre';
}

// Row types for the virtual list
type VirtualRow =
  | { type: 'header'; groupKey: string }
  | { type: 'artists'; artists: Artist[]; groupKey: string };

// Responsive column counts matching the original grid
const BREAKPOINTS = [
  { width: 1280, cols: 8 },  // xl
  { width: 1024, cols: 6 },  // lg
  { width: 768, cols: 5 },   // md
  { width: 640, cols: 4 },   // sm
  { width: 0, cols: 3 },     // base
];

const HEADER_HEIGHT = 56; // Group header height
const CARD_HEIGHT = 180;  // Artist card height (including gap)
const GAP = 24;           // Gap between cards

function getColumnCount(width: number): number {
  for (const bp of BREAKPOINTS) {
    if (width >= bp.width) return bp.cols;
  }
  return 3;
}

// Row component for the list
interface RowData {
  rows: VirtualRow[];
  giggingArtistIds: Set<string>;
  columnCount: number;
}

// react-window v2 row component signature
function RowComponent({
  index,
  style,
  rows,
  giggingArtistIds,
  columnCount,
}: {
  index: number;
  style: React.CSSProperties;
  ariaAttributes?: Record<string, unknown>;
} & RowData) {
  const row = rows[index];

  if (row.type === 'header') {
    return (
      <div
        style={style}
        id={`artist-group-${row.groupKey}`}
        className="pt-6"
      >
        <h2 className="bndy-letter-head">{row.groupKey}</h2>
      </div>
    );
  }

  // Artist row
  return (
    <div
      style={{
        ...style,
        display: 'grid',
        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
        gap: `${GAP}px`,
        paddingLeft: '8px',
        paddingRight: '8px',
      }}
    >
      {row.artists.map((artist) => (
        <ArtistCard
          key={artist.id}
          artist={artist}
          hasUpcomingGigs={giggingArtistIds.has(artist.id)}
        />
      ))}
    </div>
  );
}

export default function VirtualizedArtistGrid({
  groupedArtists,
  giggingArtistIds,
  groupBy,
}: VirtualizedArtistGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useListRef(null);
  const [containerWidth, setContainerWidth] = useState(1024);
  const [containerHeight, setContainerHeight] = useState(800);

  // Track container size
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
        // Use viewport height minus header/filters (~280px)
        setContainerHeight(window.innerHeight - 280);
      }
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const columnCount = useMemo(
    () => getColumnCount(containerWidth),
    [containerWidth]
  );

  // Build virtual rows from grouped artists
  const virtualRows = useMemo((): VirtualRow[] => {
    const rows: VirtualRow[] = [];

    Object.entries(groupedArtists).forEach(([groupKey, artists]) => {
      // Add group header
      rows.push({ type: 'header', groupKey });

      // Split artists into rows based on column count
      for (let i = 0; i < artists.length; i += columnCount) {
        rows.push({
          type: 'artists',
          artists: artists.slice(i, i + columnCount),
          groupKey,
        });
      }
    });

    return rows;
  }, [groupedArtists, columnCount]);

  // Row height function
  const getRowHeight = useCallback(
    (index: number): number => {
      const row = virtualRows[index];
      if (row.type === 'header') return HEADER_HEIGHT;
      return CARD_HEIGHT;
    },
    [virtualRows]
  );

  // Scroll to group function (for A-Z rail)
  const scrollToGroup = useCallback((groupKey: string) => {
    const index = virtualRows.findIndex(
      (row) => row.type === 'header' && row.groupKey === groupKey
    );
    if (index !== -1 && listRef.current) {
      listRef.current.scrollToRow({ index, align: 'start' });
    }
  }, [virtualRows, listRef]);

  // Expose scroll function via data attribute for external access
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).scrollToGroup = scrollToGroup;
    }
  }, [scrollToGroup]);

  // Row props passed to each row
  const rowData = useMemo((): RowData => ({
    rows: virtualRows,
    giggingArtistIds,
    columnCount,
  }), [virtualRows, giggingArtistIds, columnCount]);

  if (Object.keys(groupedArtists).length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="w-full" data-virtualized-grid style={{ minHeight: '400px' }}>
      <List
        listRef={listRef}
        defaultHeight={containerHeight}
        rowCount={virtualRows.length}
        rowHeight={getRowHeight}
        rowComponent={RowComponent as any}
        rowProps={rowData as any}
        overscanCount={3}
        className="scrollbar-thin"
        style={{ width: containerWidth, height: containerHeight, overflowX: 'hidden' }}
      />
    </div>
  );
}
