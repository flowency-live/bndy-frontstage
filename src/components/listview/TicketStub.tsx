// src/components/listview/TicketStub.tsx
"use client";

import { motion } from "framer-motion";

interface TicketStubProps {
  price: string | null;
  isFree: boolean;
}

export function TicketStub({ price, isFree }: TicketStubProps) {
  const displayText = isFree ? "£ree" : price || "TBC";

  return (
    <motion.span
      whileTap={{
        rotate: [0, -2, 2, 0],
        transition: { duration: 0.2 }
      }}
      className={`ev-stub ${!isFree ? "paid" : ""}`}
    >
      {displayText}
    </motion.span>
  );
}
