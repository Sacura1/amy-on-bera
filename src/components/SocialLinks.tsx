import { SOCIAL_LINKS } from '@/lib/constants';

interface IconProps {
  className?: string;
}

export const XIcon = ({ className = "w-8 h-8 md:w-12 md:h-12" }: IconProps) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const TelegramIcon = ({ className = "w-8 h-8 md:w-12 md:h-12" }: IconProps) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
  </svg>
);

export const DiscordIcon = ({ className = "w-8 h-8 md:w-12 md:h-12" }: IconProps) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

interface SocialLinksProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function SocialLinks({ size = 'md' }: SocialLinksProps) {
  const sizeClasses = {
    sm: 'w-12 h-12 md:w-16 md:h-16 p-3 md:p-4',
    md: 'w-16 h-16 md:w-24 md:h-24 p-4 md:p-6',
    lg: 'w-24 h-24 md:w-32 md:h-32 p-6 md:p-8',
  };

  const gapClasses = {
    sm: 'gap-4 md:gap-6',
    md: 'gap-6 md:gap-8',
    lg: 'gap-8 md:gap-12',
  };

  return (
    <div className={`flex justify-center ${gapClasses[size]}`}>
      <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" className="group">
        <div
          className={`bg-white text-black rounded-full hover:scale-110 transition transform shadow-lg flex items-center justify-center ${sizeClasses[size]}`}
        >
          <XIcon />
        </div>
        <p className="text-white font-bold mt-3 text-center">X (Twitter)</p>
      </a>

      <a href={SOCIAL_LINKS.telegram} target="_blank" rel="noopener noreferrer" className="group">
        <div
          className={`bg-white text-black rounded-full hover:scale-110 transition transform shadow-lg flex items-center justify-center ${sizeClasses[size]}`}
        >
          <TelegramIcon />
        </div>
        <p className="text-white font-bold mt-3 text-center">Telegram</p>
      </a>

      <a href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer" className="group">
        <div
          className={`bg-white text-black rounded-full hover:scale-110 transition transform shadow-lg flex items-center justify-center ${sizeClasses[size]}`}
        >
          <DiscordIcon />
        </div>
        <p className="text-white font-bold mt-3 text-center">Discord</p>
      </a>
    </div>
  );
}
