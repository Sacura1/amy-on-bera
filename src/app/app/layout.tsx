'use client';

import { useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { Background, Footer, FloatingMemes } from '@/components';
import { AnimationProvider, CustomizationProvider, useCustomization } from '@/contexts';
import { API_BASE_URL } from '@/lib/constants';
import AppHeader from './components/AppHeader';

// Component that syncs customizations from backend when wallet is connected
function CustomizationSync() {
  const account = useActiveAccount();
  const { setBackgroundId, setFilterId } = useCustomization();

  useEffect(() => {
    const syncCustomizations = async () => {
      if (!account?.address) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${account.address}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            // Sync background and filter from backend
            if (data.user.backgroundId) {
              setBackgroundId(data.user.backgroundId);
            }
            if (data.user.filterId) {
              setFilterId(data.user.filterId);
            }
          }
        }
      } catch (error) {
        console.error('Error syncing customizations:', error);
      }
    };

    syncCustomizations();
  }, [account?.address, setBackgroundId, setFilterId]);

  return null;
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomizationProvider>
      <AnimationProvider>
        <CustomizationSync />
        <Background />
        <FloatingMemes />
        <div className="relative z-10 min-h-screen flex flex-col">
          <AppHeader />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
      </AnimationProvider>
    </CustomizationProvider>
  );
}
