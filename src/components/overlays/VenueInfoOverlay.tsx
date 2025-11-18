// src/components/overlays/VenueInfoOverlay.tsx
"use client";

import React from "react"; // removed { useState }
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Building,
  Globe,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Navigation,
} from "lucide-react";
import SocialShareButton from "@/components/shared/SocialShareButton";
import Link from "next/link";
import Image from "next/image";
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
  // Get directions URL
  const directionsUrl = getDirectionsUrl(venue);

  // Generate share data for the venue
  const getShareData = () => ({
    title: `${venue.name} | bndy`,
    text: `Check out ${venue.name} on bndy.live`,
    url: `${typeof window !== 'undefined' ? window.location.origin : ''}/venues/${venue.id}`,
  });

  // Get social media links
  const getSocialLink = (platform: string): string | undefined => {
    return venue.socialMediaUrls?.find(
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
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="relative w-[300px] bg-[#f5f1e8] rounded-lg shadow-2xl border-2 border-[#d4c5a0]"
            style={{
              boxShadow: "0 8px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)",
              background: "linear-gradient(135deg, #f5f1e8 0%, #e8dfc8 100%)"
            }}
          >
            {/* Luggage tag hole with string */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
              <div className="w-1 h-6 bg-[#8b7355]" />
              <div className="w-12 h-12 rounded-full bg-[#f5f1e8] border-4 border-[#d4c5a0] shadow-md"
                   style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.2), inset 0 0 0 8px #e8dfc8" }} />
            </div>

            <div className="pt-10 pb-6 px-6">
              {/* Venue badge */}
              <div className="flex justify-center mb-4">
                <div className="inline-block px-4 py-1 bg-[#0891b2] text-white text-xs font-bold uppercase tracking-wider rounded">
                  Venue
                </div>
              </div>

              {/* Venue Name - Clickable */}
              <Link
                href={`/venues/${venue.id}`}
                className="block text-center mb-6 group"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-[#0891b2] text-2xl font-bold hover:text-[#0e7490] transition-colors">
                  {venue.name}
                </h2>
              </Link>

              {/* Decorative divider */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="h-px flex-1 bg-[#d4c5a0]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#d4c5a0]" />
                <div className="h-px flex-1 bg-[#d4c5a0]" />
              </div>

              {/* Address section */}
              <div className="text-center space-y-2">
                <div className="text-xs text-[#8b7355] uppercase tracking-wide font-semibold mb-2">
                  Address
                </div>
                {venue.address && (
                  <div className="text-sm text-[#4a4035] font-medium leading-relaxed">
                    {venue.address}
                  </div>
                )}
                {venue.city && (
                  <div className="text-base text-[#2d2417] font-bold">
                    {venue.city}
                  </div>
                )}
                <div className="text-xs text-[#8b7355]">
                  United Kingdom
                </div>
              </div>

              {/* Bottom tag section with BNDY branding */}
              <div className="mt-6 pt-4 border-t-2 border-dashed border-[#d4c5a0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-[#0891b2] flex items-center justify-center">
                    <Building className="w-4 h-4 text-[#0891b2]" />
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8b7355] uppercase">BNDY</div>
                    <div className="text-[8px] text-[#8b7355]">#{venue.id.substring(0, 5)}</div>
                  </div>
                </div>

                {/* Directions link */}
                {directionsUrl && (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#0891b2] text-white text-xs font-semibold rounded hover:bg-[#0e7490] transition-colors"
                  >
                    <Navigation className="w-3 h-3" />
                    Directions
                  </a>
                )}
              </div>

              {/* Additional contact info - collapsed by default */}
              {(venue.phone || venue.email || getSocialLink("website")) && (
                <div className="mt-4 pt-4 border-t border-[#d4c5a0]/50 space-y-2">
                  {venue.phone && (
                    <div className="flex items-center justify-center gap-2 text-xs">
                      <Phone className="w-3 h-3 text-[#8b7355]" />
                      <a
                        href={`tel:${venue.phone}`}
                        className="text-[#4a4035] hover:text-[#0891b2] transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {venue.phone}
                      </a>
                    </div>
                  )}
                  {venue.email && (
                    <div className="flex items-center justify-center gap-2 text-xs">
                      <Mail className="w-3 h-3 text-[#8b7355]" />
                      <a
                        href={`mailto:${venue.email}`}
                        className="text-[#4a4035] hover:text-[#0891b2] transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {venue.email}
                      </a>
                    </div>
                  )}
                  {getSocialLink("website") && (
                    <div className="flex items-center justify-center gap-2 text-xs">
                      <Globe className="w-3 h-3 text-[#8b7355]" />
                      <a
                        href={getSocialLink("website")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0891b2] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Website
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Share button */}
            <div className="absolute top-2 right-2">
              <SocialShareButton
                {...getShareData()}
                variant="icon"
                size="sm"
                className="hover:shadow-[0_0_8px_rgba(0,0,0,0.3)] transition-shadow"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
