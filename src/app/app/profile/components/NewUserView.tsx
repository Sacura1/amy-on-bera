'use client';

interface NewUserViewProps {
  onConnectX: () => void;
  onConnectDiscord: () => void;
  onConnectTelegram: () => void;
  onConnectEmail: () => void;
}

export default function NewUserView({
  onConnectX,
  onConnectDiscord,
  onConnectTelegram,
  onConnectEmail
}: NewUserViewProps) {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12">
      <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
        {/* Main Connect Card */}
        <div className="bg-gray-900/90 rounded-2xl border border-gray-700/50 p-4 sm:p-6 md:p-8 text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">
            Connect your wallet to get started
          </h1>

          <p className="text-gray-300 text-sm sm:text-base mb-2">
            Unlock your Amy profile and start tracking your activity across the ecosystem.
          </p>
          <p className="text-gray-300 text-sm sm:text-base mb-4 sm:mb-6">
            No wallet? Create one instantly using your email or a social account.
          </p>

          <div className="text-center">
            <p className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Once connected, you can:</p>
            <div className="space-y-1 text-gray-300 text-xs sm:text-sm md:text-base">
              <p>Link social accounts to personalise your profile</p>
              <p>Unlock features and access more tools</p>
              <p>Track activity, rewards, and progress in one place</p>
            </div>
          </div>
        </div>

        {/* Social Connection Cards */}
        <SocialConnectionCard
          icon="x"
          iconBg="bg-black"
          name="X Account"
          connected={false}
          onConnect={onConnectX}
        />

        <SocialConnectionCard
          icon="discord"
          iconBg="bg-indigo-600"
          name="Discord"
          connected={false}
          onConnect={onConnectDiscord}
        />

        <SocialConnectionCard
          icon="telegram"
          iconBg="bg-blue-500"
          name="Telegram"
          connected={false}
          onConnect={onConnectTelegram}
        />

        <SocialConnectionCard
          icon="email"
          iconBg="bg-gray-600"
          name="Email"
          connected={false}
          onConnect={onConnectEmail}
        />
      </div>
    </div>
  );
}

interface SocialConnectionCardProps {
  icon: string;
  iconBg: string;
  name: string;
  connected: boolean;
  username?: string;
  onConnect: () => void;
}

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
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function SocialConnectionCard({
  icon,
  iconBg,
  name,
  connected,
  username,
  onConnect
}: SocialConnectionCardProps) {
  const renderIcon = () => {
    switch (icon) {
      case 'x':
        return <XIcon />;
      case 'discord':
        return <DiscordIcon />;
      case 'telegram':
        return <TelegramIcon />;
      case 'email':
        return <EmailIcon />;
      default:
        return <span className="text-xl text-white">{icon}</span>;
    }
  };

  return (
    <div className="bg-gray-800/80 rounded-2xl border border-gray-700/50 p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${iconBg} flex items-center justify-center border-2 border-yellow-600/50 text-white flex-shrink-0`}>
            {renderIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-green-400' : 'bg-gray-500'}`}></span>
              <span className="text-yellow-400 font-bold text-sm sm:text-base">{name}</span>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm truncate">
              {connected ? username : 'Not connected'}
            </p>
          </div>
        </div>

        <button
          onClick={onConnect}
          disabled={connected}
          className="btn-samy btn-samy-enhanced px-4 sm:px-6 py-2 rounded-full text-white font-bold uppercase text-xs sm:text-sm disabled:opacity-50 w-full sm:w-auto flex-shrink-0"
        >
          {connected ? 'CONNECTED' : 'CONNECT'}
        </button>
      </div>
    </div>
  );
}
