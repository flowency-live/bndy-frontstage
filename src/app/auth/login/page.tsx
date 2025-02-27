// src/app/auth/login/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import BndyLogo  from '@/components/ui/bndylogo';

// This component wraps the part that uses useSearchParams
function LoginContent() {
  const router = useRouter();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const { user, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Extract redirect info from query params
  const redirectPath = searchParams.get('redirect') || '/';
  const claimType = searchParams.get('claimType') || null;
  const claimId = searchParams.get('claimId') || null;

  useEffect(() => {
    if (user) {
      // If the user has a pending claim, handle it after login
      if (claimType && claimId) {
        handleClaim();
      } else {
        router.push(redirectPath);
      }
    }
  }, [user, router, redirectPath, claimType, claimId]);

  const handleClaim = async () => {
    // This will be implemented in the next step
    router.push(redirectPath);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password, rememberMe);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get query parameters for linking to register page
  const searchParamsString = searchParams.toString() ? `?${searchParams.toString()}` : '';

  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-8 text-center">
        {claimType ? 'Claim Your Page' : 'Artist & Venue Login'}
      </h1>

      <div className="w-48 md:w-64 mx-auto mb-8 transition-all">
        <BndyLogo />
      </div>

      {claimType && (
        <div className="bg-[var(--primary)]/10 border border-[var(--primary)] text-[var(--foreground)] px-4 py-2 rounded-lg mb-6">
          <p>You're about to claim a {claimType === 'artist' ? 'artist' : 'venue'} page. After logging in, you'll be able to manage its content.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleEmailLogin}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--background)] border border-gray-300 dark:border-gray-700 rounded-md text-[var(--foreground)]"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="relative">
          <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--background)] border border-gray-300 dark:border-gray-700 rounded-md text-[var(--foreground)]"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--foreground)] transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 text-[var(--primary)] bg-[var(--background)] border-gray-300 dark:border-gray-700 rounded"
          />
          <label htmlFor="rememberMe" className="ml-2 text-sm text-[var(--foreground)]/70">
            Remember Me
          </label>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary)]/90 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-[var(--foreground)]/70">
        Don't have an account?{' '}
        <Link 
          href={`/auth/register${searchParamsString}`} 
          className="text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors"
        >
          Create account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  // This part doesn't use useSearchParams
  return (
    <main className="min-h-screen flex flex-col bg-[var(--background)] p-4">
      <Link
        href="/"
        className="inline-flex items-center text-[var(--foreground)]/70 hover:text-[var(--foreground)] transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Link>

      <Suspense fallback={<div className="flex justify-center items-center flex-1">Loading...</div>}>
        <LoginContent />
      </Suspense>
    </main>
  );
}