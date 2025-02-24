// app/layout.tsx - Updated
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ViewToggleProvider } from "@/context/ViewToggleContext";

export const metadata: Metadata = {
  title: "bndy.live",
  description: "Discover live music events near you",
};

// app/layout.tsx
// Layout.tsx - complete overhaul
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen m-0 p-0 overflow-hidden">
        <ViewToggleProvider>
          <Header />
          <main className="flex-1 mt-[88px] mb-0 p-0 flex flex-col">
            {children}
          </main>
          <Footer />
        </ViewToggleProvider>
      </body>
    </html>
  );
}