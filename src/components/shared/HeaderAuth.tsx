// src/components/shared/HeaderAuth.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function HeaderAuth() {
  const { user, profile, logout, isGodMode } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setDropdownOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {user ? (
        <>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1 text-sm hover:text-[var(--primary)] transition-colors p-1"
          >
            <span className="hidden sm:inline-block">
              {profile?.displayName || user.email?.split('@')[0]}
            </span>
            <User className="w-5 h-5" />
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 py-2 bg-[var(--background)] border border-[var(--foreground)]/10 rounded-md shadow-lg z-50">
              <div className="px-4 py-2 text-sm text-[var(--foreground)]/70 border-b border-[var(--foreground)]/10">
                {user.email}
                
                {isGodMode && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-[var(--primary)] text-white rounded">
                    Admin
                  </span>
                )}
              </div>
              
              {isGodMode && (
                <Link 
                  href="/admin" 
                  className="block px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}
              
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          )}
        </>
      ) : (
        <Link
          href="/auth/login"
          className="flex items-center gap-1 text-sm hover:text-[var(--primary)] transition-colors p-1"
          title="Login"
        >
          <User className="w-5 h-5" />
        </Link>
      )}
    </div>
  );
}