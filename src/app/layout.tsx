// app/layout.tsx - Updated
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ViewToggleProvider } from "@/context/ViewToggleContext";
import { AuthProvider } from '@/context/AuthContext';
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "bndy.live",
  description: "Discover live music events near you",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen m-0 p-0 overflow-hidden">
        <Providers>
          <AuthProvider>
            <ViewToggleProvider>
              <Header />
              <main className="flex-1 mt-[88px] mb-0 p-0 flex flex-col">
                {children}
              </main>
              <Footer />
            </ViewToggleProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}