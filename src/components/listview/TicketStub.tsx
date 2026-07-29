// src/components/listview/TicketStub.tsx
"use client";

import { motion } from "framer-motion";

interface TicketStubProps {
  price: string | null;
  ticketUrl?: string | null;
}

export function TicketStub({ price, ticketUrl }: TicketStubProps) {
  // Don't render if no price info
  if (!price) return null;

  const stubContent = (
    <motion.span
      whileTap={{
        rotate: [0, -2, 2, 0],
        transition: { duration: 0.2 }
      }}
      className="ev-stub paid"
    >
      {price}
    </motion.span>
  );

  if (ticketUrl) {
    return (
      <a
        href={ticketUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        {stubContent}
      </a>
    );
  }

  return stubContent;
}
