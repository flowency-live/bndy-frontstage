"use client";

import { useState } from "react";
import { ArtistProfileData } from "@/lib/types/artist-profile";
import SocialMediaLinks from "./SocialMediaLinks";
import OptimizedImage from "./OptimizedImage";
import { RESPONSIVE_SIZES } from "@/lib/utils/imagePreloader";

interface ArtistProfileHeaderProps {
  profileData: ArtistProfileData;
}

export default function ArtistProfileHeader({ profileData }: ArtistProfileHeaderProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="w-full bg-gradient-to-b from-[var(--primary)]/10 to-transparent">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 sm:pt-8 sm:pb-12">
        <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6">
          {/* Profile Image with enhanced optimization and fallbacks */}
          <div className="relative">
            {profileData.profileImageUrl && !imageError ? (
              <OptimizedImage
                src={profileData.profileImageUrl}
                alt={`${profileData.name} profile picture`}
                width={128}
                height={128}
                className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-full border-4 border-white shadow-lg transition-all duration-300 hover:scale-105"
                priority={true}
                lazy={false}
                quality={85}
                sizes={RESPONSIVE_SIZES.profile}
                placeholder="blur"
                onError={() => {
                  setImageError(true);
                }}
                fallback={
                  <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/30 flex items-center justify-center border-4 border-white shadow-lg transition-all duration-300 hover:scale-105">
                    <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--primary)]" aria-label={`${profileData.name} initial`}>
                      {profileData.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                }
              />
            ) : (
              /* Enhanced fallback avatar with artist initial */
              <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/30 flex items-center justify-center border-4 border-white shadow-lg transition-all duration-300 hover:scale-105">
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--primary)]" aria-label={`${profileData.name} initial`}>
                  {profileData.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Artist Name with responsive typography */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-[var(--foreground)] leading-tight px-4 transition-all duration-300">
              {profileData.name}
            </h1>
          </div>

          {/* Genre Tags with modern pill design and smooth animations */}
          {profileData.genres && profileData.genres.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg px-4">
              {profileData.genres.map((genre, index) => (
                <span
                  key={index}
                  className="genre-tag touch-feedback gpu-layer px-3 py-1.5 sm:px-4 sm:py-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full text-xs sm:text-sm font-medium transition-all duration-200 hover:bg-[var(--primary)]/20 hover:scale-105 active:scale-95 cursor-default"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Social Media Links with platform-specific styling */}
          {profileData.socialMediaURLs && profileData.socialMediaURLs.length > 0 && (
            <SocialMediaLinks 
              socialMediaURLs={profileData.socialMediaURLs}
              className="animate-fade-in-up"
            />
          )}
        </div>
      </div>
    </div>
  );
}