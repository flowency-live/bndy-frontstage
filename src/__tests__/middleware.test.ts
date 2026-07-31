// Mock next/server FIRST before any imports
jest.mock('next/server', () => {
  // Define mock classes inside the mock factory
  class MockHeaders {
    private headers = new Map<string, string>();

    get(key: string): string | null {
      return this.headers.get(key.toLowerCase()) ?? null;
    }

    set(key: string, value: string): void {
      this.headers.set(key.toLowerCase(), value);
    }

    has(key: string): boolean {
      return this.headers.has(key.toLowerCase());
    }
  }

  class MockNextResponse {
    headers: MockHeaders;

    constructor() {
      this.headers = new MockHeaders();
    }

    static next(): MockNextResponse {
      return new MockNextResponse();
    }
  }

  return {
    NextResponse: MockNextResponse,
    NextRequest: jest.fn(),
  };
});

import { extractSubdomain, config, middleware } from '../middleware';

// Helper class for creating mock requests
class MockRequestHeaders {
  private headers = new Map<string, string>();

  get(key: string): string | null {
    return this.headers.get(key.toLowerCase()) ?? null;
  }

  set(key: string, value: string): void {
    this.headers.set(key.toLowerCase(), value);
  }

  has(key: string): boolean {
    return this.headers.has(key.toLowerCase());
  }
}

describe('extractSubdomain', () => {
  it('extracts "congleton" from congleton.bndy.live', () => {
    const result = extractSubdomain('congleton.bndy.live');
    expect(result).toBe('congleton');
  });

  it('extracts "klmastoke" from klmastoke.bndy.live', () => {
    const result = extractSubdomain('klmastoke.bndy.live');
    expect(result).toBe('klmastoke');
  });

  it('extracts "on-the-case" from on-the-case.bndy.live', () => {
    const result = extractSubdomain('on-the-case.bndy.live');
    expect(result).toBe('on-the-case');
  });

  it('returns null for live.bndy.co.uk (main site)', () => {
    const result = extractSubdomain('live.bndy.co.uk');
    expect(result).toBeNull();
  });

  it('returns null for www.bndy.co.uk', () => {
    const result = extractSubdomain('www.bndy.co.uk');
    expect(result).toBeNull();
  });

  it('returns null for bndy.live (root domain)', () => {
    const result = extractSubdomain('bndy.live');
    expect(result).toBeNull();
  });

  it('returns null for localhost:3000', () => {
    const result = extractSubdomain('localhost:3000');
    expect(result).toBeNull();
  });

  it('returns null for localhost', () => {
    const result = extractSubdomain('localhost');
    expect(result).toBeNull();
  });

  it('returns null for 127.0.0.1', () => {
    const result = extractSubdomain('127.0.0.1');
    expect(result).toBeNull();
  });

  it('returns null for IP addresses with port', () => {
    const result = extractSubdomain('192.168.1.1:3000');
    expect(result).toBeNull();
  });

  it('handles uppercase host names', () => {
    const result = extractSubdomain('CONGLETON.BNDY.LIVE');
    expect(result).toBe('congleton');
  });

  it('returns null for empty string', () => {
    const result = extractSubdomain('');
    expect(result).toBeNull();
  });

  it('returns null for undefined', () => {
    const result = extractSubdomain(undefined);
    expect(result).toBeNull();
  });
});

describe('middleware', () => {
  const createMockRequest = (host: string) => {
    const headers = new MockRequestHeaders();
    headers.set('host', host);

    return {
      headers,
      nextUrl: { pathname: '/' },
      url: 'https://example.com/',
    };
  };

  it('sets x-tenant-subdomain header when subdomain found', () => {
    const request = createMockRequest('congleton.bndy.live');
    const response = middleware(request as any);

    expect(response.headers.get('x-tenant-subdomain')).toBe('congleton');
  });

  it('passes through without header when no subdomain', () => {
    const request = createMockRequest('live.bndy.co.uk');
    const response = middleware(request as any);

    expect(response.headers.has('x-tenant-subdomain')).toBe(false);
  });

  it('passes through without header for localhost', () => {
    const request = createMockRequest('localhost:3000');
    const response = middleware(request as any);

    expect(response.headers.has('x-tenant-subdomain')).toBe(false);
  });

  it('extracts subdomain with hyphen', () => {
    const request = createMockRequest('on-the-case.bndy.live');
    const response = middleware(request as any);

    expect(response.headers.get('x-tenant-subdomain')).toBe('on-the-case');
  });
});

describe('middleware config', () => {
  it('exports matcher configuration', () => {
    expect(config).toBeDefined();
    expect(config.matcher).toBeDefined();
  });

  it('matcher is an array with path patterns', () => {
    expect(Array.isArray(config.matcher)).toBe(true);
    expect(config.matcher.length).toBeGreaterThan(0);
  });

  it('matcher pattern contains exclusions for static files', () => {
    const matcher = config.matcher[0];
    // The pattern should exclude _next/static, _next/image, favicon.ico
    expect(matcher).toContain('_next/static');
    expect(matcher).toContain('_next/image');
    expect(matcher).toContain('favicon.ico');
  });
});
