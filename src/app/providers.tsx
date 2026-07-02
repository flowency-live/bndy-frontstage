"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ReactNode } from "react";
import { GoogleMapsProvider } from "@/components/providers/GoogleMapsProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleMapsProvider>
        {children}
      </GoogleMapsProvider>
    </QueryClientProvider>
  );
}
