// src/components/Footer.tsx - Updated
"use client";

import Link from "next/link";

// src/components/Footer.tsx
export default function Footer() {
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} bndy.live – Version 0.1.0 |{" "}
        <Link href="/about" className="underline">
          About
        </Link>
      </p>
    </footer>
  );
}