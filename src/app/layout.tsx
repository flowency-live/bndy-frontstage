// app/layout.tsx - Updated
import type { Metadata } from "next";
import { Anton, Archivo, JetBrains_Mono, Bebas_Neue, Caveat, Bungee, Permanent_Marker, Special_Elite } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { ViewToggleProvider } from "@/context/ViewToggleContext";
import { Providers } from "./providers";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { MapboxProvider } from "@/context/MapboxContext";
import { EventsProvider } from "@/context/EventsContext";

// Display font - bold impactful headlines (gig poster aesthetic)
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

// Body font - clean readable sans-serif
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-archivo",
  display: "swap",
});

// Mono font - terminal/technical aesthetic for metadata
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

// Overlay fonts for event info cards
const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-caveat",
  display: "swap",
});

const bungee = Bungee({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bungee",
  display: "swap",
});

const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-marker",
  display: "swap",
});

const specialElite = Special_Elite({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-typewriter",
  display: "swap",
});

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
    <html lang="en" className={`${anton.variable} ${archivo.variable} ${jetbrainsMono.variable} ${bebasNeue.variable} ${caveat.variable} ${bungee.variable} ${permanentMarker.variable} ${specialElite.variable}`}>
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
      </head>
      <body className="flex flex-col min-h-screen min-h-dvh m-0 p-0 mobile-optimized keyboard-safe">
        <Providers>
          <ViewToggleProvider>
            {/* MapboxProvider at layout level - map survives route navigation */}
            <MapboxProvider>
              {/* EventsProvider at layout level - state survives route navigation */}
              <EventsProvider>
                <ServiceWorkerRegistration />
                <Header />
                <main className="flex-1 mt-[88px] mb-0 pb-16 md:pb-0 p-0 flex flex-col overflow-y-auto mobile-scroll-enhanced">
                  {children}
                </main>
                <Footer />
                <MobileBottomNav />
              </EventsProvider>
            </MapboxProvider>
          </ViewToggleProvider>
        </Providers>
      </body>
    </html>
  );
}