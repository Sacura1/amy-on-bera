'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useActiveAccount, useLinkProfile, useProfiles } from 'thirdweb/react';
import { useSearchParams } from 'next/navigation';
import { useAmyBalance } from '@/hooks';
import { API_BASE_URL, MINIMUM_AMY_BALANCE, ADMIN_WALLETS } from '@/lib/constants';
import { client } from '@/app/client';
import { useCustomization } from '@/contexts';
import {
  ProfileCard,
  BadgeSelector,
  SocialConnections,
  ProfileEditor,
  NewUserView,
  CustomiseSection,
  // EmailVerificationModal - Commented out until SendGrid implementation is ready
} from './components';

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
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [emailConnected, setEmailConnected] = useState(false);

  // Customization states
  const [currentBackground, setCurrentBackground] = useState('bg_default');
  const [currentFilter, setCurrentFilter] = useState('filter_none');
  const [currentAnimation, setCurrentAnimation] = useState('anim_none');

  // Modal states
  const [showBadgeSelector, setShowBadgeSelector] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  // const [showEmailModal, setShowEmailModal] = useState(false); // Commented out until SendGrid implementation is ready
  const [profileKey, setProfileKey] = useState(0); // For refreshing ProfileCard

  // Admin state
  const [leaderboardInput, setLeaderboardInput] = useState('');
  const [isUploadingLeaderboard, setIsUploadingLeaderboard] = useState(false);
  const [leaderboardStatus, setLeaderboardStatus] = useState('');
  const [isDownloadingUsers, setIsDownloadingUsers] = useState(false);

  // Thirdweb social linking
  const { mutate: linkProfile, isPending: isLinkingProfile } = useLinkProfile();
  const { data: linkedProfiles, refetch: refetchProfiles } = useProfiles({ client });

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
          setDiscordConnected(!!socialData.data.discord || !!socialData.data.discordUsername);
          setTelegramConnected(!!socialData.data.telegram || !!socialData.data.telegramUsername);
          setEmailConnected(!!socialData.data.email);
        }
      } catch (err) {
        console.error('Error fetching social data:', err);
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

  // Handle OAuth callback
  useEffect(() => {
    const xConnectedParam = searchParams.get('x_connected');
    const usernameParam = searchParams.get('username');
    const walletParam = searchParams.get('wallet');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      console.error('OAuth error:', errorParam, searchParams.get('reason'), searchParams.get('details'));
      return;
    }

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
  }, [searchParams, balance]);

  const connectX = () => {
    if (!walletAddress) return;
    window.location.href = `${API_BASE_URL}/auth/x?wallet=${walletAddress}`;
  };

  // Sync linked profiles to backend
  const syncLinkedProfiles = useCallback(async () => {
    if (!walletAddress || !linkedProfiles) return;

    try {
      // Extract usernames from linked profiles
      // Backend expects: discord, telegram, email (not discordUsername, etc.)
      const profileData: Record<string, string> = {};

      for (const profile of linkedProfiles) {
        // Get the profile details as any to access dynamic properties
        const details = profile.details as Record<string, unknown> | undefined;
        console.log(`Profile type: ${profile.type}, details:`, details);

        if (profile.type === 'discord') {
          // Try multiple fields for Discord username
          const username = (details?.username as string) ||
                          (details?.name as string) ||
                          (details?.id as string) ||
                          null;
          if (username && username !== 'connected') {
            profileData.discord = username;
          }
          setDiscordConnected(true);
        }
        if (profile.type === 'telegram') {
          // Try multiple fields for Telegram username
          const username = (details?.username as string) ||
                          (details?.first_name as string) ||
                          (details?.id as string) ||
                          null;
          if (username && username !== 'connected') {
            profileData.telegram = username;
          }
          setTelegramConnected(true);
        }
        if (profile.type === 'email' && details?.email) {
          profileData.email = details.email as string;
          setEmailConnected(true);
        }
      }

      // Sync to backend only if we have real usernames (not just 'connected')
      if (Object.keys(profileData).length > 0) {
        await fetch(`${API_BASE_URL}/api/social/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet: walletAddress, ...profileData })
        });
      }
    } catch (error) {
      console.error('Error syncing linked profiles:', error);
    }
  }, [walletAddress, linkedProfiles]);

  // Effect to sync profiles when they change
  useEffect(() => {
    if (linkedProfiles && linkedProfiles.length > 0) {
      syncLinkedProfiles();
    }
  }, [linkedProfiles, syncLinkedProfiles]);

  // Social connection handlers using Thirdweb useLinkProfile
  const connectDiscord = async () => {
    try {
      const result = await linkProfile({ client, strategy: 'discord' });
      console.log('Discord linkProfile result:', result);

      // Set connected state immediately
      setDiscordConnected(true);

      // Try to extract username from result (cast to any since Thirdweb types are incomplete)
      const resultAny = result as { profiles?: Array<{ type: string; details?: Record<string, unknown> }> } | undefined;
      const profiles = resultAny?.profiles || [];
      const discordProfile = profiles.find((p) => p.type === 'discord');
      const details = discordProfile?.details;
      const username = (details?.username as string) ||
                      (details?.name as string) ||
                      (details?.id as string) ||
                      null;

      // Sync to backend only if we have a real username
      if (walletAddress && username) {
        try {
          await fetch(`${API_BASE_URL}/api/social/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              wallet: walletAddress,
              discord: username
            })
          });
        } catch (syncError) {
          console.error('Error syncing Discord to backend:', syncError);
        }
      }

      // Refetch profiles to update any other state
      await refetchProfiles();
    } catch (error) {
      console.error('Error connecting Discord:', error);
      alert('Failed to connect Discord. Please try again.');
    }
  };

  const connectTelegram = async () => {
    try {
      const result = await linkProfile({ client, strategy: 'telegram' });
      console.log('Telegram linkProfile result:', result);

      // Set connected state immediately
      setTelegramConnected(true);

      // Try to extract username from result (cast to any since Thirdweb types are incomplete)
      const resultAny = result as { profiles?: Array<{ type: string; details?: Record<string, unknown> }> } | undefined;
      const profiles = resultAny?.profiles || [];
      const telegramProfile = profiles.find((p) => p.type === 'telegram');
      const details = telegramProfile?.details;
      const username = (details?.username as string) ||
                      (details?.first_name as string) ||
                      (details?.id as string) ||
                      null;

      // Sync to backend only if we have a real username
      if (walletAddress && username) {
        try {
          await fetch(`${API_BASE_URL}/api/social/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              wallet: walletAddress,
              telegram: username
            })
          });
        } catch (syncError) {
          console.error('Error syncing Telegram to backend:', syncError);
        }
      }

      await refetchProfiles();
    } catch (error) {
      console.error('Error connecting Telegram:', error);
      alert('Failed to connect Telegram. Please try again.');
    }
  };

  // Email connection - Commented out until SendGrid implementation is ready
  const connectEmail = () => {
    // setShowEmailModal(true);
    console.log('Email connection coming soon');
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
      const entries: { position: number; xUsername: string }[] = [];
      for (const line of lines) {
        const atMatch = line.match(/@([a-zA-Z0-9_]+)/);
        if (atMatch) {
          entries.push({ position: entries.length + 1, xUsername: atMatch[1].trim() });
        } else {
          const cleaned = line.replace(/^\d+\s*/, '').trim();
          if (cleaned.length > 0) {
            entries.push({ position: entries.length + 1, xUsername: cleaned });
          }
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/leaderboard/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddress, entries }),
      });
      const data = await response.json();

      if (data.success) {
        setLeaderboardStatus(`Successfully uploaded ${entries.length} X usernames!`);
        setLeaderboardInput('');
      } else {
        setLeaderboardStatus(data.error || 'Failed to upload leaderboard');
      }
    } catch (error) {
      console.error('Error uploading leaderboard:', error);
      setLeaderboardStatus('Error uploading leaderboard');
    } finally {
      setIsUploadingLeaderboard(false);
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

        {/* Social Connections - Show only if X not connected */}
        {!xConnected && (
          <SocialConnections
            wallet={walletAddress || ''}
            xConnected={xConnected}
            xUsername={xUsername}
            discordConnected={discordConnected}
            telegramConnected={telegramConnected}
            emailConnected={emailConnected}
            onXConnect={connectX}
            onDiscordConnect={connectDiscord}
            onTelegramConnect={connectTelegram}
            onEmailConnect={connectEmail}
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

            <div className="p-4 md:p-6">
              <div className="mb-4">
                <h4 className="text-base md:text-lg font-bold text-yellow-400 mb-2">
                  Upload Leaderboard Data
                </h4>
                <p className="text-xs md:text-sm text-gray-300 mb-2">
                  Paste the leaderboard data below. Supports formats like:
                </p>
                <p className="text-xs text-gray-500 mb-4 font-mono">
                  &quot;1 JoeDark - @Joedark01&quot; or &quot;@username&quot; or just &quot;username&quot;
                </p>
              </div>

              <textarea
                value={leaderboardInput}
                onChange={(e) => setLeaderboardInput(e.target.value)}
                placeholder={"1 JoeDark - @Joedark01\n2 JUJAKÏ - @Jujaki_01\n3 doru - @doruOlt\n@username\nusername"}
                rows={10}
                className="w-full px-4 py-3 rounded-xl bg-black/50 border-2 border-gray-600 text-white text-sm font-mono focus:border-yellow-400 focus:outline-none transition-all placeholder-gray-500 resize-none"
              />

              <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="text-xs text-gray-400">
                  {leaderboardInput.trim()
                    ? `${leaderboardInput.trim().split('\n').filter((l: string) => l.trim() && l.match(/@[a-zA-Z0-9_]+/)).length} X usernames detected`
                    : 'Paste leaderboard data above'}
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
