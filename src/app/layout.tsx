// app/layout.tsx - Updated
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ViewToggleProvider } from "@/context/ViewToggleContext";
import { Providers } from "./providers";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "bndy.live",
  description: "Discover live music events near you",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
    // Enhanced mobile viewport settings
    minimumScale: 1,
    interactiveWidget: 'resizes-content'
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'bndy.live',
    startupImage: '/openmic.png'
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
    url: false
  },
  // Enhanced mobile-specific metadata
  other: {
    'mobile-web-app-capable': 'yes',
    'format-detection': 'telephone=no',
    'HandheldFriendly': 'true',
    'MobileOptimized': '320'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Enhanced mobile-specific meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="HandheldFriendly" content="true" />
        <meta name="MobileOptimized" content="320" />
        
        {/* Preconnect to external domains for better performance */}
        <link rel="preconnect" href="https://graph.facebook.com" />
        <link rel="dns-prefetch" href="https://graph.facebook.com" />
        
        {/* Resource hints for better mobile performance */}
        <link rel="preload" href="/openmic.png" as="image" type="image/png" />
      </head>
      <body className="flex flex-col min-h-screen min-h-dvh m-0 p-0 mobile-optimized keyboard-safe">
        <Providers>
          <ViewToggleProvider>
            <ServiceWorkerRegistration />
            <Header />
            <main className="flex-1 mt-[88px] mb-0 p-0 flex flex-col overflow-y-auto mobile-scroll-enhanced">
              {children}
            </main>
            <Footer />
          </ViewToggleProvider>
        </Providers>
      </body>
    </html>
  );
}