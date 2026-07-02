// src/components/listview/TicketStub.tsx
"use client";

import { motion } from "framer-motion";

interface TicketStubProps {
  price: string | null;
}

export function TicketStub({ price }: TicketStubProps) {
  // Don't render if no price info
  if (!price) return null;

  return (
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
}
