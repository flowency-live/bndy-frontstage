'use client';

/**
 * White-label footer component
 *
 * Shows "Powered by BNDY" attribution.
 */

import { useWhitelabel } from './WhitelabelProvider';

export function WhitelabelFooter() {
  const { tenant } = useWhitelabel();

  return (
    <footer
      className="py-3 px-4 text-center text-sm"
      style={{
        backgroundColor: tenant.theme.background,
        borderTop: `1px solid ${tenant.theme.primary}22`,
      }}
    >
      <a
        href="https://live.bndy.co.uk"
        target="_blank"
        rel="noopener noreferrer"
        className="opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: tenant.theme.foreground }}
      >
        Powered by{' '}
        <span
          className="font-semibold"
          style={{ color: tenant.theme.primary }}
        >
          bndy.live
        </span>
      </a>
    </footer>
  );
}
