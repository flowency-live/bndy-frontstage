// src/components/Footer.tsx
import Link from "next/link";

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