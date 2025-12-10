'use client';

import { Background, Footer, FloatingMemes } from '@/components';
import AppHeader from './components/AppHeader';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Background />
      <FloatingMemes />
      <div className="relative z-10 min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>
    </>
  );
}
