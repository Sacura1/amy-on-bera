// API Configuration
// In development, use the proxy to avoid CORS issues
// In production, call the Railway API directly
const isDev = process.env.NODE_ENV === 'development';
export const API_BASE_URL = isDev
  ? '/api/proxy'
  : (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://amy-production-fd10.up.railway.app');

// Token Configuration
export const AMY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_AMY_TOKEN_ADDRESS || '0x098a75bAedDEc78f9A8D0830d6B86eAc5cC8894e';
export const MINIMUM_AMY_BALANCE = Number(process.env.NEXT_PUBLIC_MIN_AMY_BALANCE) || 300;

// Social Links
export const SOCIAL_LINKS = {
  twitter: 'https://x.com/amy_on_bera',
  telegram: 'https://t.me/amy_on_bera',
  discord: 'https://discord.gg/9Y3UzP93r3',
};

// Buy Link
export const BUY_LINK = `https://www.osito.finance/?token=${AMY_TOKEN_ADDRESS}`;

// ERC20 ABI for token balance
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
] as const;

// Navigation Links
export const NAV_LINKS = [
  { href: '/app/profile', label: 'PROFILE' },
  { href: '/app/leaderboard', label: 'LEADERBOARD' },
  { href: '/app/earn', label: 'EARN WITH AMY' },
  { href: '/app/points', label: 'AMY POINTS' },
  { href: '/app/trade', label: 'TRADE' },
  { href: '/app/contact', label: 'PARTNERS & INVESTORS' },
];

// Admin Wallets (lowercase for comparison)
export const ADMIN_WALLETS = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || '')
  .split(',')
  .map(w => w.trim().toLowerCase())
  .filter(w => w.length > 0);
