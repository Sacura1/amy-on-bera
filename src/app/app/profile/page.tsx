'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { useSearchParams } from 'next/navigation';
import { useAmyBalance } from '@/hooks';
import { API_BASE_URL, MINIMUM_AMY_BALANCE, ADMIN_WALLETS } from '@/lib/constants';

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const account = useActiveAccount();
  const { balance, isLoading: balanceLoading, isEligible, walletAddress } = useAmyBalance();

  const [xConnected, setXConnected] = useState(false);
  const [xUsername, setXUsername] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [userReferralCode, setUserReferralCode] = useState('');
  const [usedReferralCode, setUsedReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [referralInputStatus, setReferralInputStatus] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Admin state
  const [leaderboardInput, setLeaderboardInput] = useState('');
  const [isUploadingLeaderboard, setIsUploadingLeaderboard] = useState(false);
  const [leaderboardStatus, setLeaderboardStatus] = useState('');
  const [isDownloadingUsers, setIsDownloadingUsers] = useState(false);

  // Check if current wallet is admin
  const isAdmin = walletAddress ? ADMIN_WALLETS.includes(walletAddress.toLowerCase()) : false;

  const checkXStatus = useCallback(async () => {
    if (!walletAddress) return;

    try {
      // Check user verification status from backend
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
      // Fetch referral data from backend
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
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, [walletAddress]);

  // Check X connection status when wallet is connected
  useEffect(() => {
    if (walletAddress) {
      checkXStatus();
      fetchUserData();
    }
  }, [walletAddress, checkXStatus, fetchUserData]);

  // Handle OAuth callback - read URL params and save to backend
  useEffect(() => {
    const xConnectedParam = searchParams.get('x_connected');
    const usernameParam = searchParams.get('username');
    const walletParam = searchParams.get('wallet');
    const errorParam = searchParams.get('error');

    // Handle error cases
    if (errorParam) {
      console.error('OAuth error:', errorParam, searchParams.get('reason'), searchParams.get('details'));
      return;
    }

    // Handle successful OAuth callback
    if (xConnectedParam === 'true' && usernameParam && walletParam) {
      console.log('OAuth success - saving user:', usernameParam, walletParam);

      // Update UI immediately
      setXConnected(true);
      setXUsername(usernameParam);

      // Save to backend (single endpoint handles all tables)
      const saveOAuthUser = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/oauth/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              wallet: walletParam,
              xUsername: usernameParam,
              amyBalance: balance || 0
            }),
          });

          const data = await response.json();
          if (data.success) {
            console.log('OAuth user saved successfully');
          } else {
            console.error('Failed to save OAuth user:', data.error);
          }

          // Clean up URL params
          window.history.replaceState({}, '', '/app/profile');
        } catch (error) {
          console.error('Error saving OAuth user:', error);
        }
      };

      saveOAuthUser();
    }
  }, [searchParams, balance]);

  const connectX = () => {
    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    // Redirect to X OAuth
    window.location.href = `${API_BASE_URL}/auth/x?wallet=${walletAddress}`;
  };

  const generateReferralCode = async () => {
    if (!walletAddress) return;

    setIsGeneratingCode(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/referral/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddress, xUsername, amyBalance: balance }),
      });
      const data = await response.json();

      if (data.success && data.referralCode) {
        setUserReferralCode(data.referralCode);
      } else {
        alert(data.error || 'Failed to generate referral code');
      }
    } catch (error) {
      console.error('Error generating referral code:', error);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const useReferralCode = async () => {
    if (!walletAddress || !referralCode.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/referral/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddress, referralCode: referralCode.toUpperCase() }),
      });
      const data = await response.json();

      if (data.success) {
        setUsedReferralCode(referralCode.toUpperCase());
        setReferralInputStatus('Referral code applied successfully!');
      } else {
        setReferralInputStatus(data.error || 'Failed to apply referral code');
      }
    } catch (error) {
      console.error('Error using referral code:', error);
      setReferralInputStatus('Error applying referral code');
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(userReferralCode);
    alert('Referral code copied!');
  };

  const copyReferralLink = () => {
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/app/profile?ref=${userReferralCode}`;
    navigator.clipboard.writeText(link);
    alert('Referral link copied!');
  };

  // Admin: Download all holders (X + wallet connected with 300+ AMY)
  const downloadUsersList = async () => {
    if (!walletAddress || !isAdmin) return;

    setIsDownloadingUsers(true);
    try {
      // Get all holders (anyone with X + wallet + 300+ AMY) - admin endpoint includes all
      const response = await fetch(`${API_BASE_URL}/api/holders/all?wallet=${walletAddress}`);
      const data = await response.json();

      if (data.success && data.holders) {
        // Format as CSV
        const headers = ['X Username', 'Wallet Address', 'AMY Balance', 'First Recorded', 'Last Updated'];
        const rows = data.holders.map((holder: { xUsername: string; wallet: string; amyBalance: number; firstRecordedAt: string; lastUpdatedAt: string }) => [
          `@${holder.xUsername}`,
          holder.wallet,
          holder.amyBalance,
          new Date(holder.firstRecordedAt).toLocaleString(),
          new Date(holder.lastUpdatedAt).toLocaleString()
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map((row: string[]) => row.join(','))
        ].join('\n');

        // Download as CSV file
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

  // Admin: Upload leaderboard data
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
      // Parse usernames from various formats:
      // - "1 JoeDark - @Joedark01"
      // - "@username"
      // - "username"
      // Assign sequential positions based on order in the pasted data
      const entries: { position: number; xUsername: string }[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Try to match @username pattern first (handles "Name - @username" format)
        const atMatch = line.match(/@([a-zA-Z0-9_]+)/);
        if (atMatch) {
          entries.push({
            position: entries.length + 1,
            xUsername: atMatch[1].trim()
          });
        } else {
          // Fallback: treat whole line as username (after removing numbers and trimming)
          const cleaned = line.replace(/^\d+\s*/, '').trim();
          if (cleaned.length > 0) {
            entries.push({
              position: entries.length + 1,
              xUsername: cleaned
            });
          }
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/leaderboard/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          entries
        }),
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

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="max-w-2xl mx-auto">
        {/* X Account Connection Card */}
        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap md:flex-nowrap">
            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              <div className="icon-badge-small flex-shrink-0">𝕏</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`connection-status ${xConnected ? 'status-connected' : 'status-disconnected'}`}
                  />
                  <h3 className="text-lg md:text-xl font-bold text-yellow-400">X Account</h3>
                </div>
                <p className="text-xs text-gray-300">
                  {xConnected ? 'Connected' : 'Not connected'}
                </p>
                {xUsername && (
                  <p className="text-sm text-gray-200 mt-1 font-semibold">@{xUsername}</p>
                )}
              </div>
            </div>
            <button
              onClick={connectX}
              disabled={xConnected}
              className="btn-samy btn-samy-enhanced text-white px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-base font-bold uppercase w-full md:w-auto disabled:opacity-50"
            >
              {xConnected ? 'CONNECTED' : 'CONNECT'}
            </button>
          </div>
        </div>

        {/* Balance Display */}
        {account && (
          <div className="glass-card p-4 md:p-6 mt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="icon-badge-small">💰</div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">
                    Your Holdings
                  </div>
                  <div className="text-lg md:text-xl text-yellow-300 font-bold">$AMY Balance</div>
                </div>
              </div>
              <div className="text-right">
                {balanceLoading ? (
                  <div className="loading-spinner w-8 h-8" />
                ) : (
                  <>
                    <div className="text-3xl md:text-4xl font-black hero-text">
                      {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">tokens</div>
                  </>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-yellow-400/20">
              <div className="flex items-center justify-between text-xs md:text-sm">
                <span className="text-gray-400">Minimum Required:</span>
                <span className="text-yellow-300 font-bold">{MINIMUM_AMY_BALANCE} $AMY</span>
              </div>
            </div>
          </div>
        )}

        {/* Eligibility Status */}
        {account && xConnected && (
          <div className="glass-card p-6 md:p-8 mt-6">
            <div className="text-center">
              <div className="icon-badge mx-auto mb-4">{isEligible ? '✅' : '⚠️'}</div>
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-white">
                {isEligible ? 'You are Eligible!' : 'Not Yet Eligible'}
              </h3>
              <p className="text-xs md:text-sm text-gray-300">
                {isEligible
                  ? 'You hold enough $AMY to access all features.'
                  : `You need at least ${MINIMUM_AMY_BALANCE} $AMY tokens to be eligible.`}
              </p>
            </div>
          </div>
        )}

        {/* Referral Section */}
        {account && isEligible && (
          <div className="glass-card mt-6 overflow-hidden">
            {/* Enter Referral Code Section */}
            {!usedReferralCode && (
              <div className="p-4 md:p-6 border-b border-yellow-400/20">
                <div className="mb-4">
                  <h3 className="text-lg md:text-xl font-bold text-yellow-400 mb-2">
                    Enter a referral code here (this cannot be changed):
                  </h3>
                </div>
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

            {/* Already Used Referral Code Section */}
            {usedReferralCode && (
              <div className="p-4 md:p-6 border-b border-yellow-400/20">
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

            {/* Your Referral Code Section */}
            <div className="p-4 md:p-6 border-b border-yellow-400/20">
              {!userReferralCode ? (
                <div className="text-center">
                  <p className="text-gray-300 mb-4">
                    Generate your unique referral code to share with friends
                  </p>
                  <button
                    onClick={generateReferralCode}
                    disabled={isGeneratingCode}
                    className="btn-samy btn-samy-enhanced text-white px-8 py-3 rounded-full text-base font-bold uppercase disabled:opacity-50"
                  >
                    {isGeneratingCode ? 'GENERATING...' : 'GENERATE CODE'}
                  </button>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 p-4 rounded-xl border-2 border-green-500/30">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-green-400 font-bold text-sm mb-1">Your referral code:</p>
                      <p className="text-2xl md:text-3xl font-black text-white font-mono tracking-wider">
                        {userReferralCode}
                      </p>
                    </div>
                    <button
                      onClick={copyReferralCode}
                      className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                    >
                      <span>📋</span>
                      <span>COPY CODE</span>
                    </button>
                  </div>
                  <div className="mt-4 pt-4 border-t border-green-500/20">
                    <p className="text-green-400 font-bold text-sm mb-2">Your referral link:</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-gray-300 font-mono bg-black/30 px-3 py-2 rounded-lg break-all flex-1">
                        {typeof window !== 'undefined' ? window.location.origin : ''}/app/profile?ref=
                        {userReferralCode}
                      </p>
                      <button
                        onClick={copyReferralLink}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap"
                      >
                        <span>🔗</span>
                        <span>COPY LINK</span>
                      </button>
                    </div>
                    <p className="text-gray-300 text-xs mt-3">
                      Share your code or link for an increased multiplier on Amy Points
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Completed Referrals Section */}
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

        {/* Admin Section - Leaderboard Management */}
        {account && isAdmin && (
          <div className="glass-card mt-6 overflow-hidden">
            <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 p-4 md:p-5 border-b-2 border-red-400/30">
              <div className="flex items-center gap-3">
                <div className="icon-badge-small">🔐</div>
                <h3 className="text-lg md:text-xl font-black text-red-400">Admin Panel</h3>
              </div>
            </div>

            {/* Download Holders Button */}
            <div className="p-4 md:p-6 border-b border-red-400/20">
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
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 md:py-24">
        <div className="max-w-2xl mx-auto">
          <div className="glass-card p-6 flex justify-center">
            <div className="loading-spinner w-12 h-12" />
          </div>
        </div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
