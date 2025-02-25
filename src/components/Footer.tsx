// src/components/Footer.tsx - Updated
"use client";

import Link from "next/link";

// src/components/Footer.tsx
export default function Footer() {
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} bndy.live BETA – Version 0.3.1 |{" "}
        <Link href="/about" className="underline">
          About
        </Link>
      </p>
    </footer>
  );
}