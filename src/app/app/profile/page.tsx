'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { useSearchParams } from 'next/navigation';
import { useAmyBalance } from '@/hooks';
import { API_BASE_URL, BACKEND_URL, MINIMUM_AMY_BALANCE, ADMIN_WALLETS } from '@/lib/constants';
import { client } from '@/app/client';
import { useCustomization } from '@/contexts';
import {
  ProfileCard,
  BadgeSelector,
  SocialConnections,
  ProfileEditor,
  NewUserView,
  CustomiseSection,
  TelegramLoginWidget,
  DailyCheckIn,
  // EmailVerificationModal - Commented out until SendGrid implementation is ready
} from './components';

// Telegram bot username (without @)
const TELEGRAM_BOT_NAME = 'amyonberabot';

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const account = useActiveAccount();
  const { balance, isLoading: balanceLoading, isEligible, walletAddress } = useAmyBalance();
  const { setBackgroundId, setFilterId } = useCustomization();

  const [xConnected, setXConnected] = useState(false);
  const [xUsername, setXUsername] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [userReferralCode, setUserReferralCode] = useState('');
  const [usedReferralCode, setUsedReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [referralInputStatus, setReferralInputStatus] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [currentTier, setCurrentTier] = useState('none');
  const [totalMultiplier, setTotalMultiplier] = useState(1);
  const [pointsPerHour, setPointsPerHour] = useState(0);
  const [userPoints, setUserPoints] = useState(0);

  // Social connection states
  const [discordConnected, setDiscordConnected] = useState(false);
  const [discordUsername, setDiscordUsername] = useState<string | null>(null);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [emailConnected, setEmailConnected] = useState(false);

  // Customization states
  const [currentBackground, setCurrentBackground] = useState('bg_default');
  const [currentFilter, setCurrentFilter] = useState('filter_none');
  const [currentAnimation, setCurrentAnimation] = useState('anim_none');

  // Modal states
  const [showBadgeSelector, setShowBadgeSelector] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  // const [showEmailModal, setShowEmailModal] = useState(false); // Commented out until SendGrid implementation is ready
  const [profileKey, setProfileKey] = useState(0); // For refreshing ProfileCard

  // Admin state
  const [leaderboardInput, setLeaderboardInput] = useState('');
  const [isUploadingLeaderboard, setIsUploadingLeaderboard] = useState(false);
  const [leaderboardStatus, setLeaderboardStatus] = useState('');
  const [isDownloadingUsers, setIsDownloadingUsers] = useState(false);

  // Bonus points state
  const [bonusUsername, setBonusUsername] = useState('');
  const [bonusPoints, setBonusPoints] = useState('');
  const [bonusReason, setBonusReason] = useState('');
  const [isAwardingBonus, setIsAwardingBonus] = useState(false);
  const [bonusStatus, setBonusStatus] = useState('');

  // Badge management state (admin)
  const [raidsharkInput, setRaidsharkInput] = useState('');
  const [isUpdatingRaidshark, setIsUpdatingRaidshark] = useState(false);
  const [raidsharkStatus, setRaidsharkStatus] = useState('');
  const [raidsharkList, setRaidsharkList] = useState<Array<{ wallet: string; xUsername: string; telegramUsername?: string; multiplier: number }>>([]);
  const [convictionInput, setConvictionInput] = useState('');
  const [isUpdatingConviction, setIsUpdatingConviction] = useState(false);
  const [convictionStatus, setConvictionStatus] = useState('');
  const [convictionList, setConvictionList] = useState<Array<{ wallet: string; xUsername: string; multiplier: number }>>([]);
  const [swapperInput, setSwapperInput] = useState('');
  const [isUpdatingSwapper, setIsUpdatingSwapper] = useState(false);
  const [swapperStatus, setSwapperStatus] = useState('');
  const [swapperList, setSwapperList] = useState<Array<{ wallet: string; xUsername: string; multiplier: number }>>([]);
  // Telegram Mod badges
  const [telegramModInput, setTelegramModInput] = useState('');
  const [isUpdatingTelegramMod, setIsUpdatingTelegramMod] = useState(false);
  const [telegramModStatus, setTelegramModStatus] = useState('');
  const [telegramModList, setTelegramModList] = useState<Array<{ wallet: string; telegramUsername?: string; multiplier: number }>>([]);
  // Discord Mod badges
  const [discordModInput, setDiscordModInput] = useState('');
  const [isUpdatingDiscordMod, setIsUpdatingDiscordMod] = useState(false);
  const [discordModStatus, setDiscordModStatus] = useState('');
  const [discordModList, setDiscordModList] = useState<Array<{ wallet: string; discordUsername?: string; multiplier: number }>>([]);
  // Dawn referral archive
  const [isArchivingDawn, setIsArchivingDawn] = useState(false);
  const [dawnArchiveStatus, setDawnArchiveStatus] = useState('');

  // Check if current wallet is admin
  const isAdmin = walletAddress ? ADMIN_WALLETS.includes(walletAddress.toLowerCase()) : false;

  const checkXStatus = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/status/${walletAddress}`);
      const data = await response.json();

      if (data.verified && data.data) {
        setXConnected(true);
        setXUsername(data.data.xUsername || '');
      }
    } catch (error) {
      console.error('Error checking X status:', error);
    }
  }, [walletAddress]);

  const fetchUserData = useCallback(async () => {
    if (!walletAddress) return;

    try {
      // Fetch referral data
      const response = await fetch(`${API_BASE_URL}/api/referral/${walletAddress}`);
      const data = await response.json();

      if (data.success && data.data) {
        if (data.data.referralCode) {
          setUserReferralCode(data.data.referralCode);
        }
        if (data.data.referredBy) {
          setUsedReferralCode(data.data.referredBy);
        }
        if (data.data.referralCount !== undefined) {
          setReferralCount(data.data.referralCount);
        }
      }

      // Fetch points data to get tier and multiplier info
      const pointsRes = await fetch(`${API_BASE_URL}/api/points/${walletAddress}`);
      const pointsData = await pointsRes.json();
      if (pointsData.success && pointsData.data) {
        setCurrentTier(pointsData.data.currentTier || 'none');
        setTotalMultiplier(pointsData.data.totalMultiplier || 1);
        setPointsPerHour(pointsData.data.effectivePointsPerHour || pointsData.data.pointsPerHour || 0);
        setUserPoints(pointsData.data.totalPoints || 0);
      }

      // Fetch social connection status
      try {
        const socialRes = await fetch(`${API_BASE_URL}/api/social/${walletAddress}`);
        const socialData = await socialRes.json();
        if (socialData.success && socialData.data) {
          const discord = socialData.data.discord || socialData.data.discordUsername;
          const telegram = socialData.data.telegram || socialData.data.telegramUsername;
          setDiscordConnected(!!discord);
          setDiscordUsername(discord || null);
          setTelegramConnected(!!telegram);
          setTelegramUsername(telegram || null);
          setEmailConnected(!!socialData.data.email);
        }
      } catch {
        // Error fetching social data
      }

      // Fetch customization data
      try {
        const profileRes = await fetch(`${API_BASE_URL}/api/profile/${walletAddress}`);
        const profileData = await profileRes.json();
        if (profileData.success && profileData.data?.profile) {
          const profile = profileData.data.profile;
          if (profile.backgroundId) {
            setCurrentBackground(profile.backgroundId);
            // Sync to global context so Background component updates
            setBackgroundId(profile.backgroundId);
          }
          if (profile.filterId) {
            setCurrentFilter(profile.filterId);
            // Sync to global context so Background component updates
            setFilterId(profile.filterId);
          }
          if (profile.animationId) setCurrentAnimation(profile.animationId);
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, [walletAddress, setBackgroundId, setFilterId]);

  useEffect(() => {
    if (walletAddress) {
      checkXStatus();
      fetchUserData();
    }
  }, [walletAddress, checkXStatus, fetchUserData]);

  // Update balance on backend when balance is loaded (separate from fetchUserData to avoid race condition)
  useEffect(() => {
    if (!walletAddress || !balance || balance <= 0) return;
    
    const updateBalance = async () => {
      try {
        await fetch(`${API_BASE_URL}/api/points/update-balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet: walletAddress,
            amyBalance: balance,
            xUsername: xUsername || undefined
          })
        });
        // Refetch points data after balance update
        const pointsRes = await fetch(`${API_BASE_URL}/api/points/${walletAddress}`);
        const pointsData = await pointsRes.json();
        if (pointsData.success && pointsData.data) {
          setCurrentTier(pointsData.data.currentTier || 'none');
          setTotalMultiplier(pointsData.data.totalMultiplier || 1);
          setPointsPerHour(pointsData.data.effectivePointsPerHour || pointsData.data.pointsPerHour || 0);
          setUserPoints(pointsData.data.totalPoints || 0);
        }
      } catch (err) {
        console.error('Error updating balance:', err);
      }
    };
    updateBalance();
  }, [walletAddress, balance, xUsername]);

  // Fetch badge lists for admin
  useEffect(() => {
    if (isAdmin && walletAddress) {
      fetchRaidsharkList();
      fetchConvictionList();
      fetchSwapperList();
      fetchTelegramModList();
      fetchDiscordModList();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, walletAddress]);

  // Handle OAuth callback (X, Discord, Telegram)
  useEffect(() => {
    const xConnectedParam = searchParams.get('x_connected');
    const discordConnectedParam = searchParams.get('discord_connected');
    const telegramConnectedParam = searchParams.get('telegram_connected');
    const usernameParam = searchParams.get('username');
    const discordUsernameParam = searchParams.get('discord_username');
    const telegramUsernameParam = searchParams.get('telegram_username');
    const walletParam = searchParams.get('wallet');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      console.error('OAuth error:', errorParam, searchParams.get('reason'), searchParams.get('details'));
      return;
    }

    // Handle X/Twitter OAuth callback
    if (xConnectedParam === 'true' && usernameParam && walletParam) {
      setXConnected(true);
      setXUsername(usernameParam);

      const saveUserToBackend = async () => {
        try {
          await fetch(`${API_BASE_URL}/api/oauth/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              wallet: walletParam,
              xUsername: usernameParam,
              amyBalance: balance
            }),
          });
        } catch (error) {
          console.error('Error saving user:', error);
        }
      };

      saveUserToBackend();
    }

    // Handle Discord OAuth callback
    if (discordConnectedParam === 'true' && discordUsernameParam) {
      setDiscordConnected(true);
      setDiscordUsername(discordUsernameParam);
    }

    // Handle Telegram OAuth callback
    if (telegramConnectedParam === 'true' && telegramUsernameParam) {
      setTelegramConnected(true);
      setTelegramUsername(telegramUsernameParam);
    }
  }, [searchParams, balance, walletAddress, fetchUserData]);

  const connectX = () => {
    if (!walletAddress) return;
    // Use BACKEND_URL directly for OAuth (not proxy - browser needs to redirect)
    window.location.href = `${BACKEND_URL}/auth/x?wallet=${walletAddress}`;
  };

  // Social connection handlers using custom OAuth (like X/Twitter)
  const connectDiscord = () => {
    if (!walletAddress) return;
    // Use BACKEND_URL directly for OAuth (not proxy - browser needs to redirect)
    window.location.href = `${BACKEND_URL}/auth/discord?wallet=${walletAddress}`;
  };

  const connectTelegram = () => {
    if (!walletAddress) return;
    // Show the Telegram login widget modal
    setShowTelegramModal(true);
  };

  // Handle Telegram auth callback from widget
  const handleTelegramAuth = async (user: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
  }) => {
    setShowTelegramModal(false);

    try {
      // Send auth data to backend for verification and storage
      const response = await fetch(`${API_BASE_URL}/auth/telegram/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...user,
          wallet: walletAddress
        })
      });

      const data = await response.json();
      if (data.success) {
        setTelegramConnected(true);
        // Set username immediately from response or widget data
        setTelegramUsername(data.data?.username || user.username || user.first_name);
      } else {
        alert('Telegram authentication failed: ' + data.error);
      }
    } catch {
      alert('Failed to connect Telegram. Please try again.');
    }
  };

  // Email connection - Commented out until SendGrid implementation is ready
  const connectEmail = () => {
    // Coming soon
  };

  // const handleEmailSuccess = async () => {
  //   setEmailConnected(true);
  //
  //   // Sync email to backend
  //   if (walletAddress) {
  //     try {
  //       // We'll get the email from the linked profiles after refetch
  //       await refetchProfiles();
  //     } catch (error) {
  //       console.error('Error syncing email:', error);
  //     }
  //   }
  // };

  // Callback when customization is applied
  const handleCustomizationApplied = () => {
    fetchUserData();
  };

  const generateReferralCode = async () => {
    if (!walletAddress) return;
    setIsGeneratingCode(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/referral/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddress }),
      });
      const data = await response.json();
      if (data.success && data.referralCode) {
        setUserReferralCode(data.referralCode);
      }
    } catch (error) {
      console.error('Error generating code:', error);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const useReferralCode = async () => {
    if (!walletAddress || !referralCode.trim()) return;
    setReferralInputStatus('Submitting...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/referral/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddress, referralCode: referralCode.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        setUsedReferralCode(referralCode.trim());
        setReferralInputStatus(data.message || 'Referral code applied!');
      } else {
        setReferralInputStatus(data.error || 'Failed to apply referral code');
      }
    } catch (error) {
      setReferralInputStatus('Error applying referral code');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Admin functions
  const downloadUsersList = async () => {
    if (!walletAddress || !isAdmin) return;
    setIsDownloadingUsers(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/holders/all?wallet=${walletAddress}`);
      const data = await response.json();

      if (data.success && data.holders) {
        const headers = ['X Username', 'Wallet Address', 'AMY Balance', 'First Recorded', 'Last Updated'];
        const rows = data.holders.map((holder: { xUsername: string; wallet: string; amyBalance: number; firstRecordedAt: string; lastUpdatedAt: string }) => [
          `@${holder.xUsername}`,
          holder.wallet,
          holder.amyBalance,
          new Date(holder.firstRecordedAt).toLocaleString(),
          new Date(holder.lastUpdatedAt).toLocaleString()
        ]);

        const csvContent = [headers.join(','), ...rows.map((row: string[]) => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `amy-holders-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading holders:', error);
      alert('Failed to download holders list');
    } finally {
      setIsDownloadingUsers(false);
    }
  };

  const uploadLeaderboard = async () => {
    if (!walletAddress || !isAdmin) return;
    const lines = leaderboardInput.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      setLeaderboardStatus('Please enter at least one X username');
      return;
    }

    setIsUploadingLeaderboard(true);
    setLeaderboardStatus('');

    try {
      const entries: { position: number; xUsername: string; mindshare: number }[] = [];
      for (const line of lines) {
        // Try to extract username and mindshare
        // Formats supported:
        // "@username 12.5" or "@username, 12.5" or "@username | 12.5"
        // "1 @username 12.5" or "1. @username 12.5"
        // "username 12.5"

        const atMatch = line.match(/@([a-zA-Z0-9_]+)/);
        let xUsername = '';
        let mindshare = 0;

        if (atMatch) {
          xUsername = atMatch[1].trim();
          // Look for a number after the username (mindshare)
          const afterUsername = line.substring(line.indexOf(atMatch[0]) + atMatch[0].length);
          const mindshareMatch = afterUsername.match(/[\s,|]+(\d+\.?\d*)/);
          if (mindshareMatch) {
            mindshare = parseFloat(mindshareMatch[1]) || 0;
          }
        } else {
          // No @ symbol, try to parse "username number" format
          const parts = line.replace(/^\d+\.?\s*/, '').trim().split(/[\s,|]+/);
          if (parts.length >= 1) {
            xUsername = parts[0].trim();
            if (parts.length >= 2) {
              mindshare = parseFloat(parts[parts.length - 1]) || 0;
            }
          }
        }

        if (xUsername.length > 0) {
          entries.push({ position: entries.length + 1, xUsername, mindshare });
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/leaderboard/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress.toString()
        },
        body: JSON.stringify({ entries }),
      });
      const data = await response.json();

      if (data.success) {
        setLeaderboardStatus(`Successfully uploaded ${entries.length} entries with mindshare!`);
        setLeaderboardInput('');
      } else {
        setLeaderboardStatus(data.error || 'Failed to upload leaderboard');
      }
    } catch {
      setLeaderboardStatus('Error uploading leaderboard');
    } finally {
      setIsUploadingLeaderboard(false);
    }
  };

  // Award bonus points to a user
  const awardBonusPoints = async () => {
    if (!walletAddress || !isAdmin) return;
    if (!bonusUsername.trim() || !bonusPoints.trim()) {
      setBonusStatus('Please enter X username and points amount');
      return;
    }

    const points = parseFloat(bonusPoints);
    if (isNaN(points) || points <= 0) {
      setBonusStatus('Please enter a valid positive number for points');
      return;
    }

    setIsAwardingBonus(true);
    setBonusStatus('');

    try {
      // Clean the username (remove @ if present)
      const cleanUsername = bonusUsername.trim().replace(/^@/, '');

      const response = await fetch(`${API_BASE_URL}/api/points/add-bonus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          xUsername: cleanUsername,
          points: points,
          reason: bonusReason.trim() || 'admin_bonus'
        }),
      });
      const data = await response.json();

      if (data.success) {
        setBonusStatus(`Successfully awarded ${points} points to @${cleanUsername}!`);
        setBonusUsername('');
        setBonusPoints('');
        setBonusReason('');
      } else {
        setBonusStatus(data.error || 'Failed to award bonus points');
      }
    } catch {
      setBonusStatus('Error awarding bonus points');
    } finally {
      setIsAwardingBonus(false);
    }
  };

  // Fetch RaidShark badge list (admin)
  const fetchRaidsharkList = async () => {
    if (!walletAddress || !isAdmin) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/raidshark/list`, {
        headers: { 'x-wallet-address': walletAddress }
      });
      const data = await response.json();
      if (data.success) {
        setRaidsharkList(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching RaidShark list:', error);
    }
  };

  // Fetch Onchain Conviction badge list (admin)
  const fetchConvictionList = async () => {
    if (!walletAddress || !isAdmin) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/conviction/list`, {
        headers: { 'x-wallet-address': walletAddress }
      });
      const data = await response.json();
      if (data.success) {
        setConvictionList(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching conviction list:', error);
    }
  };

  // Fetch swapper badge holders (admin)
  const fetchSwapperList = async () => {
    if (!walletAddress || !isAdmin) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/swapper/list?wallet=${walletAddress.toString()}`, {
        headers: { 'x-wallet-address': walletAddress.toString() }
      });
      const data = await response.json();
      if (data.success) {
        setSwapperList(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching swapper list:', error);
    }
  };

  // Fetch Telegram Mod badge list (admin)
  const fetchTelegramModList = async () => {
    if (!walletAddress || !isAdmin) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/telegram-mod/list`, {
        headers: { 'x-wallet-address': walletAddress.toString() }
      });
      const data = await response.json();
      if (data.success) {
        setTelegramModList(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching telegram mod list:', error);
    }
  };

  // Fetch Discord Mod badge list (admin)
  const fetchDiscordModList = async () => {
    if (!walletAddress || !isAdmin) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/discord-mod/list`, {
        headers: { 'x-wallet-address': walletAddress.toString() }
      });
      const data = await response.json();
      if (data.success) {
        setDiscordModList(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching discord mod list:', error);
    }
  };

  // Update RaidShark badges from text input (admin)
  // Format: @telegramUsername tier (e.g., "@username 7" means x7 multiplier)
  const updateRaidsharkBadges = async () => {
    if (!walletAddress || !isAdmin) return;
    if (!raidsharkInput.trim()) {
      setRaidsharkStatus('Please enter Telegram usernames and multipliers');
      return;
    }

    setIsUpdatingRaidshark(true);
    setRaidsharkStatus('');

    try {
      // Parse input: each line is "@telegramUsername multiplier" or "telegramUsername multiplier"
      const lines = raidsharkInput.trim().split('\n').filter(l => l.trim());
      const updates: Array<{ telegramUsername: string; multiplier: number }> = [];

      for (const line of lines) {
        // Match patterns like "@username 7" or "username 15" or "@username x7"
        const match = line.trim().match(/^@?([^\s]+)\s+x?(\d+)$/i);
        if (match) {
          const telegramUsername = match[1];
          const multiplier = parseInt(match[2]);
          if ([3, 7, 15].includes(multiplier)) {
            updates.push({ telegramUsername, multiplier });
          }
        }
      }

      if (updates.length === 0) {
        setRaidsharkStatus('No valid entries found. Format: @telegram_username 3/7/15');
        setIsUpdatingRaidshark(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/raidshark/bulk-by-telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress
        },
        body: JSON.stringify({ updates }),
      });
      const data = await response.json();

      if (data.success) {
        const failed = data.results?.filter((r: { success: boolean }) => !r.success) || [];
        if (failed.length > 0) {
          setRaidsharkStatus(`Updated ${data.updated} users. ${failed.length} not found: ${failed.map((f: { telegramUsername: string }) => '@' + f.telegramUsername).join(', ')}`);
        } else {
          setRaidsharkStatus(`Successfully updated ${data.updated} RaidShark badges!`);
        }
        setRaidsharkInput('');
        fetchRaidsharkList();
      } else {
        setRaidsharkStatus(data.error || 'Failed to update badges');
      }
    } catch {
      setRaidsharkStatus('Error updating RaidShark badges');
    } finally {
      setIsUpdatingRaidshark(false);
    }
  };

  // Update Onchain Conviction badges from text input (admin) - bulk update
  // Format: wallet_address multiplier (e.g., "0x123...abc 5" means x5 multiplier)
  const updateConvictionBadges = async () => {
    if (!walletAddress || !isAdmin) return;
    if (!convictionInput.trim()) {
      setConvictionStatus('Please enter wallet addresses and multipliers');
      return;
    }

    setIsUpdatingConviction(true);
    setConvictionStatus('');

    try {
      // Parse input: each line is "wallet multiplier"
      const lines = convictionInput.trim().split('\n').filter(l => l.trim());
      const updates: Array<{ wallet: string; multiplier: number }> = [];

      for (const line of lines) {
        // Match patterns like "0x123...abc 5" or "0x123 x10"
        const match = line.trim().match(/^(0x[a-fA-F0-9]{40})\s+x?(\d+)$/i);
        if (match) {
          const wallet = match[1];
          const multiplier = parseInt(match[2]);
          if ([1, 3, 5, 10].includes(multiplier)) {
            updates.push({ wallet, multiplier });
          }
        }
      }

      if (updates.length === 0) {
        setConvictionStatus('No valid entries found. Format: 0x... 3/5/10');
        setIsUpdatingConviction(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/conviction/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress
        },
        body: JSON.stringify({ updates }),
      });
      const data = await response.json();

      if (data.success) {
        setConvictionStatus(`Successfully updated ${data.updated} Conviction badges! (All others reset)`);
        setConvictionInput('');
        fetchConvictionList();
      } else {
        setConvictionStatus(data.error || 'Failed to update badges');
      }
    } catch {
      setConvictionStatus('Error updating conviction badges');
    } finally {
      setIsUpdatingConviction(false);
    }
  };

  // Update swapper badges from text input (admin) - bulk update
  // Format: wallet_address multiplier (e.g., "0x123...abc 5" means x5 multiplier)
  const updateSwapperBadges = async () => {
    if (!walletAddress || !isAdmin) {
      setSwapperStatus('Admin wallet not connected');
      return;
    }
    if (!swapperInput.trim()) {
      setSwapperStatus('Please enter wallet addresses and multipliers');
      return;
    }

    setIsUpdatingSwapper(true);
    setSwapperStatus('');

    try {
      // Parse input: each line is "wallet multiplier"
      const lines = swapperInput.trim().split('\n').filter(l => l.trim());
      const updates: Array<{ wallet: string; multiplier: number }> = [];

      for (const line of lines) {
        // Match patterns like "0x123...abc 5" or "0x123 x10"
        const match = line.trim().match(/^(0x[a-fA-F0-9]{40})\s+x?(\d+)$/i);
        if (match) {
          const wallet = match[1];
          const multiplier = parseInt(match[2]);
          if ([0, 3, 5, 10].includes(multiplier)) {
            updates.push({ wallet, multiplier });
          }
        }
      }

      if (updates.length === 0) {
        setSwapperStatus('No valid entries found. Format: 0x... 0/3/5/10');
        setIsUpdatingSwapper(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/swapper/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress.toString()
        },
        body: JSON.stringify({ updates }),
      });
      const data = await response.json();

      if (data.success) {
        setSwapperStatus(`Successfully updated ${data.updated} Swapper badges! (All others reset)`);
        setSwapperInput('');
        fetchSwapperList();
      } else {
        setSwapperStatus(data.error || 'Failed to update badges');
      }
    } catch {
      setSwapperStatus('Error updating swapper badges');
    } finally {
      setIsUpdatingSwapper(false);
    }
  };

  // Update Telegram Mod badges from text input (admin) - bulk update by Telegram username
  const updateTelegramModBadges = async () => {
    if (!walletAddress || !isAdmin) {
      setTelegramModStatus('Admin wallet not connected');
      return;
    }
    if (!telegramModInput.trim()) {
      setTelegramModStatus('Please enter Telegram usernames and multipliers');
      return;
    }

    setIsUpdatingTelegramMod(true);
    setTelegramModStatus('');

    try {
      // Parse input: each line is "@telegramUsername multiplier"
      const lines = telegramModInput.trim().split('\n').filter(l => l.trim());
      const updates: Array<{ telegramUsername: string; multiplier: number }> = [];

      for (const line of lines) {
        // Match patterns like "@username 7" or "username 15"
        const match = line.trim().match(/^@?([^\s]+)\s+x?(\d+)$/i);
        if (match) {
          const telegramUsername = match[1];
          const multiplier = parseInt(match[2]);
          if ([0, 3, 7, 15].includes(multiplier)) {
            updates.push({ telegramUsername, multiplier });
          }
        }
      }

      if (updates.length === 0) {
        setTelegramModStatus('No valid entries found. Format: @telegram_username 3/7/15');
        setIsUpdatingTelegramMod(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/telegram-mod/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress.toString()
        },
        body: JSON.stringify({ updates }),
      });
      const data = await response.json();

      if (data.success) {
        const failed = data.results?.filter((r: { success: boolean }) => !r.success) || [];
        if (failed.length > 0) {
          setTelegramModStatus(`Updated ${data.updated} users. ${failed.length} not found: ${failed.map((f: { telegramUsername: string }) => '@' + f.telegramUsername).join(', ')}`);
        } else {
          setTelegramModStatus(`Successfully updated ${data.updated} Telegram Mod badges! (All others reset)`);
        }
        setTelegramModInput('');
        fetchTelegramModList();
      } else {
        setTelegramModStatus(data.error || 'Failed to update badges');
      }
    } catch {
      setTelegramModStatus('Error updating Telegram Mod badges');
    } finally {
      setIsUpdatingTelegramMod(false);
    }
  };

  // Update Discord Mod badges from text input (admin) - bulk update by Discord username
  const updateDiscordModBadges = async () => {
    if (!walletAddress || !isAdmin) {
      setDiscordModStatus('Admin wallet not connected');
      return;
    }
    if (!discordModInput.trim()) {
      setDiscordModStatus('Please enter Discord usernames and multipliers');
      return;
    }

    setIsUpdatingDiscordMod(true);
    setDiscordModStatus('');

    try {
      // Parse input: each line is "@discordUsername multiplier"
      const lines = discordModInput.trim().split('\n').filter(l => l.trim());
      const updates: Array<{ discordUsername: string; multiplier: number }> = [];

      for (const line of lines) {
        // Match patterns like "@username 7" or "username 15"
        const match = line.trim().match(/^@?([^\s]+)\s+x?(\d+)$/i);
        if (match) {
          const discordUsername = match[1];
          const multiplier = parseInt(match[2]);
          if ([0, 3, 7, 15].includes(multiplier)) {
            updates.push({ discordUsername, multiplier });
          }
        }
      }

      if (updates.length === 0) {
        setDiscordModStatus('No valid entries found. Format: @discord_username 3/7/15');
        setIsUpdatingDiscordMod(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/discord-mod/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress.toString()
        },
        body: JSON.stringify({ updates }),
      });
      const data = await response.json();

      if (data.success) {
        const failed = data.results?.filter((r: { success: boolean }) => !r.success) || [];
        if (failed.length > 0) {
          setDiscordModStatus(`Updated ${data.updated} users. ${failed.length} not found: ${failed.map((f: { discordUsername: string }) => '@' + f.discordUsername).join(', ')}`);
        } else {
          setDiscordModStatus(`Successfully updated ${data.updated} Discord Mod badges! (All others reset)`);
        }
        setDiscordModInput('');
        fetchDiscordModList();
      } else {
        setDiscordModStatus(data.error || 'Failed to update badges');
      }
    } catch {
      setDiscordModStatus('Error updating Discord Mod badges');
    } finally {
      setIsUpdatingDiscordMod(false);
    }
  };

  // Archive Dawn referral season (admin only)
  const archiveDawnSeason = async () => {
    if (!walletAddress || !isAdmin) return;

    setIsArchivingDawn(true);
    setDawnArchiveStatus('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/referrals/archive-dawn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress.toString()
        }
      });

      const data = await response.json();
      if (data.success) {
        const summary = data.summary;
        setDawnArchiveStatus(
          `Successfully archived Dawn season! ${summary.users_with_referrals} users with referrals, ` +
          `${summary.tier1_users} at x3, ${summary.tier2_users} at x5, ${summary.tier3_users} at x10`
        );
      } else {
        setDawnArchiveStatus(data.error || 'Failed to archive Dawn season');
      }
    } catch {
      setDawnArchiveStatus('Error archiving Dawn season');
    } finally {
      setIsArchivingDawn(false);
    }
  };

  // Show NewUserView if no wallet connected
  if (!account) {
    return (
      <NewUserView
        onConnectX={connectX}
        onConnectDiscord={connectDiscord}
        onConnectTelegram={connectTelegram}
        onConnectEmail={connectEmail}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Card */}
        {xConnected && (
          <ProfileCard
            key={profileKey}
            wallet={walletAddress || ''}
            xUsername={xUsername}
            tier={currentTier}
            balance={balance}
            totalMultiplier={totalMultiplier}
            pointsPerHour={pointsPerHour}
            onEditProfile={() => setShowProfileEditor(true)}
            onEditBadges={() => setShowBadgeSelector(true)}
            onConnectX={connectX}
            onConnectDiscord={connectDiscord}
            onConnectTelegram={connectTelegram}
            onConnectEmail={connectEmail}
            socialConnections={{
              xConnected,
              discordConnected,
              telegramConnected,
              emailConnected
            }}
          />
        )}

        {/* Social Connections */}
        <SocialConnections
          wallet={walletAddress || ''}
          xConnected={xConnected}
          xUsername={xUsername}
          discordConnected={discordConnected}
          discordUsername={discordUsername || undefined}
          telegramConnected={telegramConnected}
          telegramUsername={telegramUsername || undefined}
          emailConnected={emailConnected}
          onXConnect={connectX}
          onDiscordConnect={connectDiscord}
          onTelegramConnect={connectTelegram}
          onEmailConnect={connectEmail}
          onDisconnect={(platform) => {
            // Refresh state when a social is disconnected
            if (platform === 'x') {
              setXConnected(false);
              setXUsername('');
            } else if (platform === 'discord') {
              setDiscordConnected(false);
              setDiscordUsername(null);
            } else if (platform === 'telegram') {
              setTelegramConnected(false);
              setTelegramUsername(null);
            }
          }}
        />

        {/* Daily Check-In Section */}
        {xConnected && (
          <DailyCheckIn
            walletAddress={walletAddress || null}
            amyBalance={balance}
            isHolder={isEligible}
            onPointsEarned={(points) => setUserPoints(prev => prev + points)}
          />
        )}

        {/* Customise Section */}
        {xConnected && (
          <CustomiseSection
            wallet={walletAddress || ''}
            currentBackground={currentBackground}
            currentFilter={currentFilter}
            currentAnimation={currentAnimation}
            userPoints={userPoints}
            onItemApplied={handleCustomizationApplied}
          />
        )}

        {/* Referral Section */}
        {isEligible && (
          <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 overflow-hidden">
            {/* Enter Referral Code */}
            {!usedReferralCode && (
              <div className="p-4 md:p-6 border-b border-gray-700/50">
                <h3 className="text-lg md:text-xl font-bold text-yellow-400 mb-4">
                  Enter a referral code here (cannot be changed):
                </h3>
                <div className="flex gap-3 flex-col sm:flex-row">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    placeholder="XXXXXXXX"
                    className="flex-1 px-4 py-3 rounded-xl bg-black/50 border-2 border-gray-600 text-white text-lg font-mono uppercase tracking-wider focus:border-yellow-400 focus:outline-none transition-all placeholder-gray-500"
                  />
                  <button
                    onClick={useReferralCode}
                    className="btn-samy btn-samy-enhanced text-white px-6 py-3 rounded-full text-base font-bold uppercase whitespace-nowrap"
                  >
                    SUBMIT
                  </button>
                </div>
                {referralInputStatus && (
                  <p className="text-xs text-gray-400 mt-2">{referralInputStatus}</p>
                )}
              </div>
            )}

            {/* Already Used Code */}
            {usedReferralCode && (
              <div className="p-4 md:p-6 border-b border-gray-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-400 text-lg">✓</span>
                  <h3 className="text-lg md:text-xl font-bold text-green-400">Referral Code Used</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  You used referral code:{' '}
                  <span className="text-yellow-400 font-mono font-bold">{usedReferralCode}</span>
                </p>
              </div>
            )}

            {/* Your Referral Code */}
            <div className="p-4 md:p-6 border-b border-gray-700/50">
              {!userReferralCode ? (
                <div className="text-center">
                  <p className="text-gray-300 mb-4">
                    Generate your unique referral code to share with friends
                  </p>
                  <button
                    onClick={generateReferralCode}
                    disabled={isGeneratingCode}
                    className="btn-samy btn-samy-enhanced text-white px-6 py-3 rounded-full text-base font-bold uppercase disabled:opacity-50"
                  >
                    {isGeneratingCode ? 'GENERATING...' : 'GENERATE CODE'}
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-bold text-yellow-400 mb-3">Your Referral Code</h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="bg-black/50 px-6 py-3 rounded-xl border-2 border-yellow-400/50 font-mono text-2xl text-yellow-300 font-bold tracking-wider">
                      {userReferralCode}
                    </div>
                    <button
                      onClick={() => copyToClipboard(userReferralCode)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white font-semibold transition-colors"
                    >
                      Copy Code
                    </button>
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/app/profile?ref=${userReferralCode}`)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white font-semibold transition-colors"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Completed Referrals */}
            <div className="p-4 md:p-6">
              <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-4 rounded-xl border-2 border-purple-500/30">
                <h3 className="text-purple-400 font-bold text-sm mb-2">Completed referrals:</h3>
                <p className="text-4xl md:text-5xl font-black text-white">{referralCount}</p>
                <p className="text-gray-400 text-xs mt-2">
                  To count as a referral, the new user must hold 300+ $AMY and have connected their
                  wallet and X to the Amy website.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 overflow-hidden">
            <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 p-4 md:p-5 border-b border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="icon-badge-small">🔐</div>
                <h3 className="text-lg md:text-xl font-black text-red-400">Admin Panel</h3>
              </div>
            </div>

            <div className="p-4 md:p-6 border-b border-gray-700/50">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="text-base md:text-lg font-bold text-yellow-400 mb-1">
                    Download All Holders
                  </h4>
                  <p className="text-xs text-gray-400">
                    Export all users with X + wallet connected and 300+ $AMY
                  </p>
                </div>
                <button
                  onClick={downloadUsersList}
                  disabled={isDownloadingUsers}
                  className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-full text-sm font-bold uppercase disabled:opacity-50 flex items-center gap-2"
                >
                  {isDownloadingUsers ? (
                    <>
                      <span className="loading-spinner w-4 h-4" />
                      <span>DOWNLOADING...</span>
                    </>
                  ) : (
                    <>
                      <span>📥</span>
                      <span>DOWNLOAD CSV</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Award Bonus Points Section */}
            <div className="p-4 md:p-6 border-b border-gray-700/50">
              <div className="mb-4">
                <h4 className="text-base md:text-lg font-bold text-yellow-400 mb-1">
                  Award Bonus Points
                </h4>
                <p className="text-xs text-gray-400">
                  Give bonus points to a user by their X username
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">X Username</label>
                  <input
                    type="text"
                    value={bonusUsername}
                    onChange={(e) => setBonusUsername(e.target.value)}
                    placeholder="@username"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border-2 border-gray-600 text-white text-sm focus:border-yellow-400 focus:outline-none transition-all placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Points Amount</label>
                  <input
                    type="number"
                    value={bonusPoints}
                    onChange={(e) => setBonusPoints(e.target.value)}
                    placeholder="100"
                    min="1"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border-2 border-gray-600 text-white text-sm focus:border-yellow-400 focus:outline-none transition-all placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Reason (optional)</label>
                  <input
                    type="text"
                    value={bonusReason}
                    onChange={(e) => setBonusReason(e.target.value)}
                    placeholder="giveaway_winner"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border-2 border-gray-600 text-white text-sm focus:border-yellow-400 focus:outline-none transition-all placeholder-gray-500"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="text-xs text-gray-400">
                  {bonusUsername && bonusPoints
                    ? `Award ${bonusPoints} points to ${bonusUsername.startsWith('@') ? bonusUsername : '@' + bonusUsername}`
                    : 'Enter username and points amount'}
                </div>
                <button
                  onClick={awardBonusPoints}
                  disabled={isAwardingBonus || !bonusUsername.trim() || !bonusPoints.trim()}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-full text-sm font-bold uppercase disabled:opacity-50 flex items-center gap-2"
                >
                  {isAwardingBonus ? (
                    <>
                      <span className="loading-spinner w-4 h-4" />
                      <span>AWARDING...</span>
                    </>
                  ) : (
                    <>
                      <span>🎁</span>
                      <span>AWARD POINTS</span>
                    </>
                  )}
                </button>
              </div>

              {bonusStatus && (
                <p className={`text-sm mt-3 ${bonusStatus.includes('Successfully') ? 'text-green-400' : 'text-red-400'}`}>
                  {bonusStatus}
                </p>
              )}
            </div>

            <div className="p-4 md:p-6">
              <div className="mb-4">
                <h4 className="text-base md:text-lg font-bold text-yellow-400 mb-2">
                  Upload Weekly Focus Leaderboard
                </h4>
                <p className="text-xs md:text-sm text-gray-300 mb-2">
                  Paste the leaderboard data with mindshare values. Supports formats:
                </p>
                <p className="text-xs text-gray-500 mb-4 font-mono">
                  &quot;@username 12.5&quot; or &quot;1 @username 12.5&quot; or &quot;username 12.5&quot;
                </p>
              </div>

              <textarea
                value={leaderboardInput}
                onChange={(e) => setLeaderboardInput(e.target.value)}
                placeholder={"@Joedark01 15.2\n@Jujaki_01 12.8\n@doruOlt 10.5\n@username 8.3"}
                rows={10}
                className="w-full px-4 py-3 rounded-xl bg-black/50 border-2 border-gray-600 text-white text-sm font-mono focus:border-yellow-400 focus:outline-none transition-all placeholder-gray-500 resize-none"
              />

              <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="text-xs text-gray-400">
                  {leaderboardInput.trim()
                    ? `${leaderboardInput.trim().split('\n').filter((l: string) => l.trim()).length} entries detected`
                    : 'Paste leaderboard data above (format: @username mindshare)'}
                </div>
                <button
                  onClick={uploadLeaderboard}
                  disabled={isUploadingLeaderboard || !leaderboardInput.trim()}
                  className="btn-samy btn-samy-enhanced text-white px-6 py-3 rounded-full text-base font-bold uppercase disabled:opacity-50"
                >
                  {isUploadingLeaderboard ? 'UPLOADING...' : 'UPLOAD LEADERBOARD'}
                </button>
              </div>

              {leaderboardStatus && (
                <p className={`text-sm mt-3 ${leaderboardStatus.includes('Successfully') ? 'text-green-400' : 'text-red-400'}`}>
                  {leaderboardStatus}
                </p>
              )}
            </div>

            {/* RaidShark Badge Management */}
            <div className="p-4 md:p-6 border-t border-gray-700/50">
              <div className="mb-4">
                <h4 className="text-base md:text-lg font-bold text-yellow-400 mb-1 flex items-center gap-2">
                  <span>🦈</span> RaidShark Badges
                </h4>
                <p className="text-xs text-gray-400">
                  Paste Telegram usernames with multipliers. Format: @telegram_username 3/7/15
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  x3 = Raid Enthusiast (75+ pts), x7 = Raid Master (250+ pts), x15 = Raid Legend (600+ pts)
                </p>
              </div>

              <textarea
                value={raidsharkInput}
                onChange={(e) => setRaidsharkInput(e.target.value)}
                placeholder={"@telegram_user1 7\n@telegram_user2 7\n@telegram_user3 3\n@telegram_user4 3"}
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-black/50 border-2 border-gray-600 text-white text-sm font-mono focus:border-yellow-400 focus:outline-none transition-all placeholder-gray-500 resize-none"
              />

              <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="text-xs text-gray-400">
                  {raidsharkInput.trim()
                    ? `${raidsharkInput.trim().split('\n').filter(l => l.trim()).length} entries`
                    : 'Paste usernames above'}
                </div>
                <button
                  onClick={updateRaidsharkBadges}
                  disabled={isUpdatingRaidshark || !raidsharkInput.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-full text-sm font-bold uppercase disabled:opacity-50 flex items-center gap-2"
                >
                  {isUpdatingRaidshark ? (
                    <>
                      <span className="loading-spinner w-4 h-4" />
                      <span>UPDATING...</span>
                    </>
                  ) : (
                    <>
                      <span>🦈</span>
                      <span>UPDATE BADGES</span>
                    </>
                  )}
                </button>
              </div>

              {raidsharkStatus && (
                <p className={`text-sm mt-3 ${raidsharkStatus.includes('Successfully') ? 'text-green-400' : raidsharkStatus.includes('Updated') ? 'text-yellow-400' : 'text-red-400'}`}>
                  {raidsharkStatus}
                </p>
              )}

              {/* Current RaidShark badge holders */}
              {raidsharkList.length > 0 && (
                <div className="mt-4 p-3 bg-black/30 rounded-xl">
                  <p className="text-xs text-gray-400 mb-2">Current badge holders ({raidsharkList.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {raidsharkList.map((user, i) => (
                      <span key={i} className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-lg">
                        @{user.telegramUsername || user.xUsername} ({user.multiplier}x)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Onchain Conviction Badge Management */}
            <div className="p-4 md:p-6 border-t border-gray-700/50">
              <div className="mb-4">
                <h4 className="text-base md:text-lg font-bold text-yellow-400 mb-1 flex items-center gap-2">
                  <span>⛓️</span> Onchain Conviction Badges
                </h4>
                <p className="text-xs text-gray-400">
                  Paste wallet addresses with multipliers. Format: 0x... 3/5/10
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Level 1 = x3, Level 2 = x5, Level 3 = x10 (Bulk update resets all others)
                </p>
              </div>

              <textarea
                value={convictionInput}
                onChange={(e) => setConvictionInput(e.target.value)}
                placeholder={"0x1234567890123456789012345678901234567890 5\n0xabcdef1234567890abcdef1234567890abcdef12 10\n0x9876543210987654321098765432109876543210 3"}
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-black/50 border-2 border-gray-600 text-white text-sm font-mono focus:border-yellow-400 focus:outline-none transition-all placeholder-gray-500 resize-none"
              />

              <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="text-xs text-gray-400">
                  {convictionInput.trim()
                    ? `${convictionInput.trim().split('\n').filter(l => l.trim()).length} entries`
                    : 'Paste wallet addresses above'}
                </div>
                <button
                  onClick={updateConvictionBadges}
                  disabled={isUpdatingConviction || !convictionInput.trim()}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-full text-sm font-bold uppercase disabled:opacity-50 flex items-center gap-2"
                >
                  {isUpdatingConviction ? (
                    <>
                      <span className="loading-spinner w-4 h-4" />
                      <span>UPDATING...</span>
                    </>
                  ) : (
                    <>
                      <span>⛓️</span>
                      <span>UPDATE BADGES</span>
                    </>
                  )}
                </button>
              </div>

              {convictionStatus && (
                <p className={`text-sm mt-3 ${convictionStatus.includes('Successfully') ? 'text-green-400' : 'text-red-400'}`}>
                  {convictionStatus}
                </p>
              )}

              {/* Current Onchain Conviction badge holders */}
              {convictionList.length > 0 && (
                <div className="mt-4 p-3 bg-black/30 rounded-xl">
                  <p className="text-xs text-gray-400 mb-2">Current badge holders ({convictionList.length}):</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {convictionList.map((user, i) => (
                      <div key={i} className="text-xs flex justify-between items-center bg-purple-900/30 text-purple-300 px-2 py-1 rounded">
                        <span className="font-mono">{user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}</span>
                        <span className="bg-purple-700/50 px-2 rounded">{user.multiplier}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Seasoned Swapper Badge Management */}
            <div className="p-4 md:p-6 border-t border-gray-700/50">
              <div className="mb-4">
                <h4 className="text-base md:text-lg font-bold text-yellow-400 mb-1 flex items-center gap-2">
                  <span>🔄</span> Seasoned Swapper Badges
                </h4>
                <p className="text-xs text-gray-400">
                  Paste wallet addresses with multipliers. Format: 0x... 0/3/5/10
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Engaged ($250+) = x3, Committed ($1,000+) = x5, Elite ($3,000+) = x10 (Bulk update resets all others)
                </p>
              </div>

              <textarea
                value={swapperInput}
                onChange={(e) => setSwapperInput(e.target.value)}
                placeholder={"0x1234567890123456789012345678901234567890 5\n0xabcdef1234567890abcdef1234567890abcdef12 10\n0x9876543210987654321098765432109876543210 3"}
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-black/50 border-2 border-gray-600 text-white text-sm font-mono focus:border-yellow-400 focus:outline-none transition-all placeholder-gray-500 resize-none"
              />

              <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="text-xs text-gray-400">
                  {swapperInput.trim()
                    ? `${swapperInput.trim().split('\n').filter(l => l.trim()).length} entries`
                    : 'Paste wallet addresses above'}
                </div>
                <button
                  onClick={updateSwapperBadges}
                  disabled={isUpdatingSwapper || !swapperInput.trim()}
                  className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-full text-sm font-bold uppercase disabled:opacity-50 flex items-center gap-2"
                >
                  {isUpdatingSwapper ? (
                    <>
                      <span className="loading-spinner w-4 h-4" />
                      <span>UPDATING...</span>
                    </>
                  ) : (
                    <>
                      <span>🔄</span>
                      <span>UPDATE BADGES</span>
                    </>
                  )}
                </button>
              </div>

              {swapperStatus && (
                <p className={`text-sm mt-3 ${swapperStatus.includes('Successfully') ? 'text-green-400' : 'text-red-400'}`}>
                  {swapperStatus}
                </p>
              )}

              {/* Current Swapper badge holders */}
              {swapperList.length > 0 && (
                <div className="mt-4 p-3 bg-black/30 rounded-xl">
                  <p className="text-xs text-gray-400 mb-2">Current badge holders ({swapperList.length}):</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {swapperList.map((user, i) => (
                      <div key={i} className="text-xs flex justify-between items-center bg-green-900/30 text-green-300 px-2 py-1 rounded">
                        <span className="font-mono">{user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}</span>
                        <span className="bg-green-700/50 px-2 rounded">{user.multiplier}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Telegram Mod Badge Management */}
            <div className="p-4 md:p-6 border-t border-gray-700/50">
              <div className="mb-4">
                <h4 className="text-base md:text-lg font-bold text-yellow-400 mb-1 flex items-center gap-2">
                  <span>📱</span> Telegram Mod Badges
                </h4>
                <p className="text-xs text-gray-400">
                  Paste Telegram usernames with multipliers. Format: @telegram_username 3/7/15
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Guardian = x3, Sentinel = x7, Archlord = x15 (Bulk update resets all others)
                </p>
              </div>

              <textarea
                value={telegramModInput}
                onChange={(e) => setTelegramModInput(e.target.value)}
                placeholder={"@bee_username 3\n@mercury_username 3"}
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-black/50 border-2 border-gray-600 text-white text-sm font-mono focus:border-yellow-400 focus:outline-none transition-all placeholder-gray-500 resize-none"
              />

              <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="text-xs text-gray-400">
                  {telegramModInput.trim()
                    ? `${telegramModInput.trim().split('\n').filter(l => l.trim()).length} entries`
                    : 'Paste Telegram usernames above'}
                </div>
                <button
                  onClick={updateTelegramModBadges}
                  disabled={isUpdatingTelegramMod || !telegramModInput.trim()}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2.5 rounded-full text-sm font-bold uppercase disabled:opacity-50 flex items-center gap-2"
                >
                  {isUpdatingTelegramMod ? (
                    <>
                      <span className="loading-spinner w-4 h-4" />
                      <span>UPDATING...</span>
                    </>
                  ) : (
                    <>
                      <span>📱</span>
                      <span>UPDATE BADGES</span>
                    </>
                  )}
                </button>
              </div>

              {telegramModStatus && (
                <p className={`text-sm mt-3 ${telegramModStatus.includes('Successfully') ? 'text-green-400' : telegramModStatus.includes('Updated') ? 'text-yellow-400' : 'text-red-400'}`}>
                  {telegramModStatus}
                </p>
              )}

              {/* Current Telegram Mod badge holders */}
              {telegramModList.length > 0 && (
                <div className="mt-4 p-3 bg-black/30 rounded-xl">
                  <p className="text-xs text-gray-400 mb-2">Current badge holders ({telegramModList.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {telegramModList.map((user, i) => (
                      <span key={i} className="text-xs bg-cyan-900/50 text-cyan-300 px-2 py-1 rounded-lg">
                        @{user.telegramUsername || user.wallet.slice(0, 8)} ({user.multiplier}x)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Discord Mod Badge Management */}
            <div className="p-4 md:p-6 border-t border-gray-700/50">
              <div className="mb-4">
                <h4 className="text-base md:text-lg font-bold text-yellow-400 mb-1 flex items-center gap-2">
                  <span>💬</span> Discord Mod Badges
                </h4>
                <p className="text-xs text-gray-400">
                  Paste Discord usernames with multipliers. Format: @discord_username 3/7/15
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Guardian = x3, Sentinel = x7, Archlord = x15 (Bulk update resets all others)
                </p>
              </div>

              <textarea
                value={discordModInput}
                onChange={(e) => setDiscordModInput(e.target.value)}
                placeholder={"@discord_user1 3\n@discord_user2 7"}
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-black/50 border-2 border-gray-600 text-white text-sm font-mono focus:border-yellow-400 focus:outline-none transition-all placeholder-gray-500 resize-none"
              />

              <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="text-xs text-gray-400">
                  {discordModInput.trim()
                    ? `${discordModInput.trim().split('\n').filter(l => l.trim()).length} entries`
                    : 'Paste Discord usernames above'}
                </div>
                <button
                  onClick={updateDiscordModBadges}
                  disabled={isUpdatingDiscordMod || !discordModInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-full text-sm font-bold uppercase disabled:opacity-50 flex items-center gap-2"
                >
                  {isUpdatingDiscordMod ? (
                    <>
                      <span className="loading-spinner w-4 h-4" />
                      <span>UPDATING...</span>
                    </>
                  ) : (
                    <>
                      <span>💬</span>
                      <span>UPDATE BADGES</span>
                    </>
                  )}
                </button>
              </div>

              {discordModStatus && (
                <p className={`text-sm mt-3 ${discordModStatus.includes('Successfully') ? 'text-green-400' : discordModStatus.includes('Updated') ? 'text-yellow-400' : 'text-red-400'}`}>
                  {discordModStatus}
                </p>
              )}

              {/* Current Discord Mod badge holders */}
              {discordModList.length > 0 && (
                <div className="mt-4 p-3 bg-black/30 rounded-xl">
                  <p className="text-xs text-gray-400 mb-2">Current badge holders ({discordModList.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {discordModList.map((user, i) => (
                      <span key={i} className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded-lg">
                        @{user.discordUsername || user.wallet.slice(0, 8)} ({user.multiplier}x)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dawn Referral Season Archive */}
            <div className="p-4 md:p-6 border-t border-gray-700/50">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  {/* <h4 className="text-base md:text-lg font-bold text-yellow-400 mb-1 flex items-center gap-2">
                    <span>📦</span> Archive Dawn Referral Season
                  </h4> */}
                  {/* <p className="text-xs text-gray-400">
                    Archive current referral counts to dawn_referral_count and reset for Season 2
                  </p> */}
                  {/* <p className="text-xs text-red-400 mt-1">
                    ⚠️ This action cannot be undone. Only run once when ending Dawn season.
                  </p> */}
                </div>
                {/* <button
                  onClick={archiveDawnSeason}
                  disabled={isArchivingDawn}
                  className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-full text-sm font-bold uppercase disabled:opacity-50 flex items-center gap-2"
                >
                  {isArchivingDawn ? (
                    <>
                      <span className="loading-spinner w-4 h-4" />
                      <span>ARCHIVING...</span>
                    </>
                  ) : (
                    <>
                      <span>📦</span>
                      <span>ARCHIVE DAWN</span>
                    </>
                  )}
                </button> */}
              </div>
              {dawnArchiveStatus && (
                <p className={`text-sm mt-3 ${dawnArchiveStatus.includes('Successfully') ? 'text-green-400' : 'text-red-400'}`}>
                  {dawnArchiveStatus}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <BadgeSelector
        wallet={walletAddress || ''}
        isOpen={showBadgeSelector}
        onClose={() => setShowBadgeSelector(false)}
        onBadgesUpdated={() => setProfileKey(prev => prev + 1)}
      />

      <ProfileEditor
        wallet={walletAddress || ''}
        isOpen={showProfileEditor}
        onClose={() => setShowProfileEditor(false)}
        onProfileUpdated={() => setProfileKey(prev => prev + 1)}
      />

      {/* Telegram Login Modal */}
      {showTelegramModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Connect Telegram</h3>
              <button
                onClick={() => setShowTelegramModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Click the button below to connect your Telegram account:
            </p>
            <div className="flex justify-center">
              <TelegramLoginWidget
                botName={TELEGRAM_BOT_NAME}
                onAuth={handleTelegramAuth}
                buttonSize="large"
              />
            </div>
          </div>
        </div>
      )}

      {/* EmailVerificationModal - Commented out until SendGrid implementation is ready
      <EmailVerificationModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSuccess={handleEmailSuccess}
      />
      */}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-6 flex justify-center">
            <div className="loading-spinner w-12 h-12" />
          </div>
        </div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
