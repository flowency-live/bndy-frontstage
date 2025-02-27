// src/components/shared/ClaimPageButton.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface ClaimPageButtonProps {
  type: 'artist' | 'venue';
  id: string;
}

export default function ClaimPageButton({ type, id }: ClaimPageButtonProps) {
  const { user, canEditArtist, canEditVenue, claimArtist, claimVenue } = useAuth();
  const [isClaimed, setIsClaimed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const router = useRouter();

  // Check if page is already claimed
  useEffect(() => {
    const checkClaimed = async () => {
      if (!user) {
        setIsClaimed(false);
        setIsLoading(false);
        return;
      }

      try {
        if (type === 'artist') {
          const canEdit = await canEditArtist(id);
          setIsClaimed(canEdit);
        } else {
          const canEdit = await canEditVenue(id);
          setIsClaimed(canEdit);
        }
      } catch (err) {
        console.error(`Error checking if ${type} is claimed:`, err);
        setError(`Could not check if this ${type} page is claimed.`);
      } finally {
        setIsLoading(false);
      }
    };

    checkClaimed();
  }, [user, id, type, canEditArtist, canEditVenue]);

  // Handle claiming the page
  const handleClaim = async () => {
    if (!user) {
      // Redirect to login page with claim parameters
      router.push(`/auth/login?claimType=${type}&claimId=${id}&redirect=/${type}s/${id}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (type === 'artist') {
        await claimArtist(id);
      } else {
        await claimVenue(id);
      }
      setClaimSuccess(true);
      setIsClaimed(true);
    } catch (err) {
      console.error(`Error claiming ${type}:`, err);
      setError(err instanceof Error ? err.message : `Failed to claim this ${type} page.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show anything if the user can already edit the page
  if (isClaimed === true) {
    return null;
  }

  return (
    <div className="mt-8 border-t border-[var(--foreground)]/10 pt-4 text-center text-sm">
      {claimSuccess ? (
        <div className="text-green-500 py-2">
          Congratulations! You've successfully claimed this {type} page. You can now edit its content.
        </div>
      ) : (
        <>
          <div className="text-[var(--foreground)]/60">
            Are you the {type === 'artist' ? 'artist' : 'venue owner'}?
          </div>
          
          {error && (
            <div className="text-red-500 my-2 text-xs">{error}</div>
          )}
          
          <button
            onClick={handleClaim}
            disabled={isLoading}
            className="mt-1 text-[var(--primary)] hover:underline focus:outline-none text-sm"
          >
            {isLoading ? `Processing...` : `Claim this ${type} page to manage it`}
          </button>
        </>
      )}
    </div>
  );
}