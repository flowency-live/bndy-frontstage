// src/app/auth/register/page.tsx
'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import BndyLogo from '@/components/ui/bndylogo';
import { auth, db } from '@/lib/config/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore'; 
import { COLLECTIONS } from '@/lib/constants';

// Component that uses search params
function RegisterContent() {
  const router = useRouter();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Extract redirect info from query params
  const redirectPath = searchParams.get('redirect') || '/';
  const claimType = searchParams.get('claimType') || null;
  const claimId = searchParams.get('claimId') || null;

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
  
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
  
    setIsLoading(true);
  
    try {
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Create user profile document
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: email.split('@')[0], // Simple displayName from email
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        godMode: false // Regular users are not admins by default
      });
      
      // Redirect to login page with success message
      // For an artist/venue claim, include those parameters
      const params = new URLSearchParams();
      params.set('registered', 'true');
      
      if (claimType && claimId) {
        params.set('claimType', claimType);
        params.set('claimId', claimId);
      }
      
      if (redirectPath !== '/') {
        params.set('redirect', redirectPath);
      }
      
      router.push(`/auth/login?${params.toString()}`);
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get search params string for links
  const searchParamsString = searchParams.toString() ? `?${searchParams.toString()}` : '';

  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-8 text-center">
        {claimType ? `Register to Claim Your ${claimType === 'artist' ? 'Artist' : 'Venue'} Page` : 'Create your account'}
      </h1>

      <div className="w-48 md:w-64 mx-auto mb-8 transition-all">
        <BndyLogo />
      </div>

      {claimType && (
        <div className="bg-[var(--primary)]/10 border border-[var(--primary)] text-[var(--foreground)] px-4 py-2 rounded-lg mb-6">
          <p>By registering, you'll be able to claim and manage this {claimType === 'artist' ? 'artist' : 'venue'} page.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleEmailRegister}>
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
              minLength={6}
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

        <div className="relative">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--background)] border border-gray-300 dark:border-gray-700 rounded-md text-[var(--foreground)]"
              placeholder="••••••••"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--foreground)] transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary)]/90 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-[var(--foreground)]/70">
        Already have an account?{' '}
        <Link 
          href={`/auth/login${searchParamsString}`} 
          className="text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
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
        <RegisterContent />
      </Suspense>
    </main>
  );
}