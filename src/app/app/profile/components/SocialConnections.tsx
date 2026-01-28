'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/constants';

// SVG Icons for social platforms
function XIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

interface SocialConnectionsProps {
  wallet: string;
  xConnected: boolean;
  xUsername: string;
  discordConnected?: boolean;
  discordUsername?: string;
  telegramConnected?: boolean;
  telegramUsername?: string;
  emailConnected?: boolean;
  emailAddress?: string;
  onXConnect: () => void;
  onDiscordConnect?: () => void;
  onTelegramConnect?: () => void;
  onEmailConnect?: () => void;
  onDisconnect?: (platform: string) => void;
}

export default function SocialConnections({
  wallet,
  xConnected,
  xUsername,
  discordConnected = false,
  discordUsername,
  telegramConnected = false,
  telegramUsername,
  emailConnected = false,
  emailAddress,
  onXConnect,
  onDiscordConnect,
  onTelegramConnect,
  onEmailConnect,
  onDisconnect
}: SocialConnectionsProps) {
  const [socialData, setSocialData] = useState<{
    xUsername: string | null;
    discordUsername: string | null;
    telegramUsername: string | null;
    email: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async (platformId: string) => {
    if (!wallet) return;

    setIsDisconnecting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/social/${wallet}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId }),
      });
      const data = await response.json();

      if (data.success) {
        // Update local state
        if (socialData) {
          setSocialData({
            ...socialData,
            [`${platformId}Username`]: null,
          });
        }
        // Notify parent component
        if (onDisconnect) {
          onDisconnect(platformId);
        }
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    } finally {
      setIsDisconnecting(false);
      setShowDisconnectConfirm(null);
    }
  };

  useEffect(() => {
    if (!wallet) return;

    const fetchSocialData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/social/${wallet}`);
        const data = await response.json();

        if (data.success && data.data) {
          setSocialData(data.data);
        }
      } catch (error) {
        console.error('Error fetching social data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSocialData();
  }, [wallet]);

  const platforms = [
    {
      id: 'x',
      name: 'X (Twitter)',
      icon: <XIcon />,
      color: 'bg-black',
      connected: xConnected || !!socialData?.xUsername,
      username: xUsername || socialData?.xUsername,
      onConnect: onXConnect
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: <DiscordIcon />,
      color: 'bg-indigo-600',
      connected: discordConnected || !!socialData?.discordUsername,
      username: discordUsername || socialData?.discordUsername,
      onConnect: onDiscordConnect
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: <TelegramIcon />,
      color: 'bg-blue-500',
      connected: telegramConnected || !!socialData?.telegramUsername,
      username: telegramUsername || socialData?.telegramUsername,
      onConnect: onTelegramConnect
    }
    // Email connection - commented out until implementation is ready
    // {
    //   id: 'email',
    //   name: 'Email',
    //   icon: <EmailIcon />,
    //   color: 'bg-gray-600',
    //   connected: emailConnected || !!socialData?.email,
    //   username: emailAddress || socialData?.email,
    //   onConnect: onEmailConnect
    // }
  ];

  if (isLoading) {
    return (
      <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-4 md:p-6">
      <h3 className="text-lg font-bold text-yellow-400 mb-4">Social Connections</h3>

      <div className="space-y-3">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
              platform.connected
                ? 'border-green-500/30 bg-green-900/10'
                : 'border-gray-700/50 bg-gray-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center text-white relative group`}
                title={platform.connected && platform.username ? `${platform.id === 'x' ? '@' : ''}${platform.username}` : platform.name}
              >
                {platform.icon}
                {/* Tooltip on hover */}
                {platform.connected && platform.username && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {platform.id === 'x' ? '@' : ''}{platform.username}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{platform.name}</p>
                {platform.connected && platform.username && (
                  <p className="text-xs text-gray-400">
                    {platform.id === 'x' ? '@' : ''}{platform.username}
                  </p>
                )}
              </div>
            </div>

            {platform.connected ? (
              showDisconnectConfirm === platform.id ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDisconnect(platform.id)}
                    disabled={isDisconnecting}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {isDisconnecting ? 'Disconnecting...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setShowDisconnectConfirm(null)}
                    className="px-3 py-1.5 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <span className="text-green-400 text-sm group-hover:hidden">Connected</span>
                  <span className="w-2 h-2 rounded-full bg-green-400 group-hover:hidden"></span>
                  <button
                    onClick={() => setShowDisconnectConfirm(platform.id)}
                    className="hidden group-hover:block px-3 py-1.5 rounded-lg bg-gray-600 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              )
            ) : (
              <button
                onClick={platform.onConnect}
                disabled={!platform.onConnect}
                className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Connect
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Connect your social accounts to unlock additional features and badges
      </p>
    </div>
  );
}
