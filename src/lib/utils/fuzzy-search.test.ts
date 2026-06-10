// src/lib/utils/fuzzy-search.test.ts
// TDD: Tests for fuzzy artist/venue search (FS-12)

import { fuzzyMatch, stripPrefix, normalizeForSearch } from './fuzzy-search';

describe('stripPrefix', () => {
  it('strips "The " prefix', () => {
    expect(stripPrefix('The Torrists')).toBe('Torrists');
    expect(stripPrefix('The Beatles')).toBe('Beatles');
    expect(stripPrefix('THE CLASH')).toBe('CLASH');
  });

  it('strips "A " prefix', () => {
    expect(stripPrefix('A Perfect Circle')).toBe('Perfect Circle');
    expect(stripPrefix('A Tribe Called Quest')).toBe('Tribe Called Quest');
  });

  it('strips "An " prefix', () => {
    expect(stripPrefix('An Horse')).toBe('Horse');
    expect(stripPrefix('AN ARTIST')).toBe('ARTIST');
  });

  it('strips "An\'" prefix (apostrophe variant)', () => {
    expect(stripPrefix("An' Other Band")).toBe('Other Band');
  });

  it('does not strip prefix when not at start', () => {
    expect(stripPrefix('In The End')).toBe('In The End');
    expect(stripPrefix('Band The')).toBe('Band The');
  });

  it('does not strip partial matches', () => {
    expect(stripPrefix('Theatre')).toBe('Theatre');
    expect(stripPrefix('Another Band')).toBe('Another Band');
    expect(stripPrefix('Anthem')).toBe('Anthem');
  });

  it('handles empty and whitespace strings', () => {
    expect(stripPrefix('')).toBe('');
    expect(stripPrefix('   ')).toBe('');
    expect(stripPrefix('The ')).toBe('');
  });

  it('trims whitespace after stripping', () => {
    expect(stripPrefix('  The  Band  ')).toBe('Band');
  });
});

describe('normalizeForSearch', () => {
  it('lowercases and strips prefix', () => {
    expect(normalizeForSearch('The Torrists')).toBe('torrists');
    expect(normalizeForSearch('A Band')).toBe('band');
  });

  it('normalizes punctuation', () => {
    expect(normalizeForSearch('Rock & Roll')).toBe('rock and roll');
    expect(normalizeForSearch("Rock 'n' Roll")).toBe('rock n roll');
  });

  it('removes extra whitespace', () => {
    expect(normalizeForSearch('  The   Band  ')).toBe('band');
  });
});

describe('fuzzyMatch', () => {
  describe('prefix-insensitive matching', () => {
    it('matches "Torrists" to "The Torrists"', () => {
      expect(fuzzyMatch('Torrists', 'The Torrists')).toBe(true);
    });

    it('matches "The Torrists" to "Torrists"', () => {
      expect(fuzzyMatch('The Torrists', 'Torrists')).toBe(true);
    });

    it('matches "Beatles" to "The Beatles"', () => {
      expect(fuzzyMatch('Beatles', 'The Beatles')).toBe(true);
    });

    it('matches "Perfect Circle" to "A Perfect Circle"', () => {
      expect(fuzzyMatch('Perfect Circle', 'A Perfect Circle')).toBe(true);
    });

    it('matches when both have different prefixes but same core name', () => {
      // Both normalize to "band" - prefix-insensitive matching means they match
      expect(fuzzyMatch('The Band', 'A Band')).toBe(true);
    });

    it('does not match when core names are different', () => {
      expect(fuzzyMatch('The Beatles', 'A Band')).toBe(false);
    });
  });

  describe('partial matching', () => {
    it('matches partial name at start', () => {
      expect(fuzzyMatch('Torr', 'The Torrists')).toBe(true);
    });

    it('matches partial name in middle', () => {
      expect(fuzzyMatch('orris', 'The Torrists')).toBe(true);
    });

    it('matches partial venue name', () => {
      expect(fuzzyMatch('Dog', 'The Dog and Rat')).toBe(true);
    });

    it('does not match unrelated strings', () => {
      expect(fuzzyMatch('XYZ', 'The Torrists')).toBe(false);
    });
  });

  describe('typo tolerance', () => {
    it('matches with single character typo', () => {
      expect(fuzzyMatch('Torrests', 'The Torrists')).toBe(true);
    });

    it('matches with transposed characters', () => {
      expect(fuzzyMatch('Toirrists', 'The Torrists')).toBe(true);
    });

    it('matches with missing character', () => {
      expect(fuzzyMatch('Torits', 'The Torrists')).toBe(true);
    });

    it('does not match with too many errors', () => {
      expect(fuzzyMatch('XXXXX', 'The Torrists')).toBe(false);
    });

    it('tolerates typos in venue names', () => {
      expect(fuzzyMatch('Dog and Rot', 'The Dog and Rat')).toBe(true);
    });
  });

  describe('case insensitivity', () => {
    it('matches regardless of case', () => {
      expect(fuzzyMatch('TORRISTS', 'the torrists')).toBe(true);
      expect(fuzzyMatch('the BEATLES', 'The Beatles')).toBe(true);
    });
  });

  describe('punctuation handling', () => {
    it('matches with & vs "and"', () => {
      expect(fuzzyMatch('Dog & Rat', 'The Dog and Rat')).toBe(true);
      expect(fuzzyMatch('Dog and Rat', 'The Dog & Rat')).toBe(true);
    });

    it('ignores apostrophes', () => {
      expect(fuzzyMatch("Rock n Roll", "Rock 'n' Roll")).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles empty search term', () => {
      expect(fuzzyMatch('', 'The Torrists')).toBe(false);
    });

    it('handles empty target', () => {
      expect(fuzzyMatch('Torrists', '')).toBe(false);
    });

    it('handles both empty', () => {
      expect(fuzzyMatch('', '')).toBe(false);
    });

    it('handles whitespace-only search', () => {
      expect(fuzzyMatch('   ', 'The Torrists')).toBe(false);
    });

    it('matches exact after normalization', () => {
      expect(fuzzyMatch('The Torrists', 'The Torrists')).toBe(true);
    });

    it('handles very short search terms', () => {
      // Single character should still work but with exact match only
      expect(fuzzyMatch('T', 'The Torrists')).toBe(true); // 't' is in 'torrists'
    });
  });

  describe('real-world examples from FS-12', () => {
    it('finds "The Torrists" when searching "Torrists"', () => {
      expect(fuzzyMatch('Torrists', 'The Torrists')).toBe(true);
    });

    it('finds "The Dog and Rat" when searching "Dog and Rat"', () => {
      expect(fuzzyMatch('Dog and Rat', 'The Dog and Rat')).toBe(true);
    });

    it('finds "A Perfect Circle" when searching "Perfect Circle"', () => {
      expect(fuzzyMatch('Perfect Circle', 'A Perfect Circle')).toBe(true);
    });

    it('finds artist despite typo in search', () => {
      expect(fuzzyMatch('Beatels', 'The Beatles')).toBe(true);
    });
  });
});