// src/components/overlays/VenueInfoOverlay.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Building,
  Globe,
  ExternalLink,
  Share2,
  Phone,
  Mail,
  Facebook,
  Instagram,
} from "lucide-react";
import Link from "next/link";
import { Venue, SocialMediaURL } from "@/lib/types";
import { getDirectionsUrl } from "@/lib/utils/mapLinks";

interface VenueInfoOverlayProps {
  venue: Venue;
  isOpen: boolean;
  onClose: () => void;
  position?: "map" | "list";
}

export default function VenueInfoOverlay({
  venue,
  isOpen,
  onClose,
  position = "map",
}: VenueInfoOverlayProps) {
  const [error, setError] = useState<string | null>(null);

  // Get directions URL
  const directionsUrl = getDirectionsUrl(venue);

  // Handle sharing
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: venue.name,
          text: `Check out ${venue.name} on bndy.live`,
          url: `${window.location.origin}/venues/${venue.id}`,
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      console.log("Web Share API not supported.");
    }
  };

  // Get social media links
  const getSocialLink = (platform: string): string | undefined => {
    return venue.socialMediaURLs?.find(
      (social: SocialMediaURL) => social.platform === platform
    )?.url;
  };

  // Define the outer overlay container styles
  const overlayStyles =
    position === "map"
      ? "fixed top-0 left-0 w-full h-full z-50 flex items-center justify-center backdrop-blur-sm"
      : "fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={overlayStyles} onClick={onClose}>
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-[320px] bg-[var(--background)] rounded-lg shadow-lg border border-[var(--border)]"
            style={{ boxShadow: "0 4px 10px rgba(0,0,0,0.15)" }}
          >
            <div className="absolute top-0 left-0 h-full w-1 bg-[var(--secondary)] rounded-tl-lg rounded-bl-lg" />

            <div className="p-4 pl-6">
              {/* Venue header */}
              <Link
                href={`/venues/${venue.id}`}
                className="group flex items-center gap-3 mb-3 transition-shadow duration-200 hover:shadow-[0_0_8px_rgba(6,182,212,0.8)]"
              >
                <div className="w-[3.125rem] h-[3.125rem] rounded-full overflow-hidden flex-shrink-0">
                  {venue.imageUrl ? (
                    <img
                      src={venue.imageUrl}
                      alt=""
                      className="object-cover w-full h-full"
                      onError={() => {
                        setError("Could not load venue image");
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[var(--secondary-translucent)]">
                      <Building className="w-5 h-5 text-[var(--secondary)]" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <h2 className="text-[var(--foreground)] font-semibold text-sm leading-tight">
                    {venue.name}
                  </h2>
                  <span className="text-xs text-[var(--secondary)]">(view venue)</span>
                </div>
              </Link>

              <div className="h-px bg-[var(--border)] mb-3" />

              <div className="space-y-3 text-sm">
                {/* Address */}
                {venue.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[var(--secondary)]" />
                    <span className="text-[var(--foreground)]">{venue.address}</span>
                    {directionsUrl && (
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-[var(--foreground)]/70 text-xs hover:text-[var(--secondary)]"
                      >
                        Directions
                      </a>
                    )}
                  </div>
                )}

                {/* Phone */}
                {venue.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[var(--foreground)]/70" />
                    <a
                      href={`tel:${venue.phone}`}
                      className="text-[var(--foreground)] hover:text-[var(--secondary)]"
                    >
                      {venue.phone}
                    </a>
                  </div>
                )}

                {/* Email */}
                {venue.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[var(--foreground)]/70" />
                    <a
                      href={`mailto:${venue.email}`}
                      className="text-[var(--foreground)] hover:text-[var(--secondary)]"
                    >
                      {venue.email}
                    </a>
                  </div>
                )}

                {/* Website */}
                {getSocialLink("website") && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[var(--foreground)]/70" />
                    <a
                      href={getSocialLink("website")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--secondary)] text-xs hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}

                {/* Facebook */}
                {getSocialLink("facebook") && (
                  <div className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-[var(--foreground)]/70" />
                    <a
                      href={getSocialLink("facebook")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--secondary)] text-xs hover:underline"
                    >
                      Facebook Page
                    </a>
                  </div>
                )}

                {/* Instagram */}
                {getSocialLink("instagram") && (
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-[var(--foreground)]/70" />
                    <a
                      href={getSocialLink("instagram")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--secondary)] text-xs hover:underline"
                    >
                      Instagram
                    </a>
                  </div>
                )}

                {/* Description */}
                {venue.description && (
                  <p className="mt-2 text-[var(--foreground)]/80 text-sm leading-snug">
                    {venue.description}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="absolute bottom-2 right-2 p-2 rounded-full hover:shadow-[0_0_8px_rgba(0,0,0,0.3)] transition-shadow"
              aria-label="Share Venue"
            >
              <Share2 className="w-5 h-5 text-[var(--foreground)]" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}