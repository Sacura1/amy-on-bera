import type { Metadata } from "next";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";

export const metadata: Metadata = {
  title: "$AMY - Berachain Ecosystem Token",
  description: "$AMY is a next-generation token designed to empower users within the Berachain ecosystem. It fuels engagement, rewards participation, and enables access to unique features across DeFi and social platforms.",
  icons: {
    icon: '/favicon.svg',
    apple: '/pro.jpg',
  },
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
      </body>
    </html>
  );
}
