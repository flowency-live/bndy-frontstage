// src/components/Footer.tsx
"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Footer() {
  const { user } = useAuth();
  
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} bndy.live BETA – Version 0.3.1 |{" "}
        <Link href="/about" className="underline">
          About
        </Link>
        {" | "}
        {!user ? (
          <Link 
            href="/auth/login" 
            className="inline-flex items-center hover:text-[var(--primary)] transition-colors"
            title="Artist/Venue Login"
          >
            <User className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        ) : (
          <Link 
            href="/profile" 
            className="inline-flex items-center text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors"
            title="Your Profile"
          >
            <User className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        )}
      </p>
    </footer>
  );
}