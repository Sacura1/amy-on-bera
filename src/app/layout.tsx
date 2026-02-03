import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "$AMY - Berachain Ecosystem Token",
  description: "$AMY is a next-generation token designed to empower users within the Berachain ecosystem. It fuels engagement, rewards participation, and enables access to unique features across DeFi and social platforms.",
  icons: {
    icon: '/favicon.svg',
    apple: '/pro.jpg',
  },
};

// Enable viewport-fit=cover for iOS Safari to extend behind address bar
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="image" href="/image.png" />
      </head>
      <body className="min-h-screen text-white relative">
        <ThirdwebProvider>{children}</ThirdwebProvider>
        <Analytics />
      </body>
    </html>
  );
}
