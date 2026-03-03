'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, ADMIN_WALLETS } from '@/lib/constants';

const ALL_NOVELTIES = [
  { label: 'Lamp',          value: '/novelty-1.png' },
  { label: 'Tennis',        value: '/novelty-2.png' },
  { label: 'Speaker',       value: '/novelty-3.png' },
  { label: 'Cooker',        value: '/novelty-4.png' },
  { label: 'Teddy Bear',    value: '/novelty-5.png' },
];

const ALL_FRAMES = [
  { label: 'Default Frame', value: '/frame.png' },
];

const PRIZE_IMAGE_OPTIONS = [
  { label: '$50 AMY',        value: '/prize-50amy.png' },
  { label: '$25 plvHEDGE',   value: '/prize-25plvhedge.png' },
  { label: '$25 SAIL',       value: '/prize-25sail.png' },
  { label: 'Bullas NFT',     value: '/prize-bulas-nft.png' },
  { label: 'Booga Bulla NFT',value: '/prize-booga-bulla-nft.png' },
  { label: 'X Premium',      value: '/prize-x-premium.png' },
  { label: 'Custom URL',     value: '' },
];

export default function AdminRafflesPage() {
  const account = useActiveAccount();
  const wallet = account?.address?.toLowerCase();
  const router = useRouter();

  const isAdmin = wallet ? ADMIN_WALLETS.includes(wallet) : false;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imagePreset, setImagePreset] = useState(PRIZE_IMAGE_OPTIONS[0].value);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [countdownHours, setCountdownHours] = useState(72);
  const [ticketCost, setTicketCost] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Carousel settings state
  const [activeNovelties, setActiveNovelties] = useState<string[]>(['/novelty-1.png','/novelty-2.png','/novelty-3.png','/novelty-4.png','/novelty-5.png']);
  const [activeFrame, setActiveFrame] = useState('/frame.png');
  const [carouselSaving, setCarouselSaving] = useState(false);
  const [carouselResult, setCarouselResult] = useState<{ success: boolean; message: string } | null>(null);
  const [customNoveltyUrl, setCustomNoveltyUrl] = useState('');
  const [customFrameUrl, setCustomFrameUrl] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/carousel-settings`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          if (Array.isArray(d.data.novelties)) setActiveNovelties(d.data.novelties);
          if (d.data.frame) setActiveFrame(d.data.frame);
        }
      })
      .catch(() => {});
  }, []);

  const imageUrl = imagePreset === '' ? customImageUrl : imagePreset;
  const isCustom = imagePreset === '';

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-400">Connect your wallet to access this page.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-400 font-bold">Access denied. Admin only.</p>
      </div>
    );
  }

  const toggleNovelty = (val: string) => {
    setActiveNovelties(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const customNovelties = activeNovelties.filter(v => !ALL_NOVELTIES.some(n => n.value === v));
  const isCustomFrame = !ALL_FRAMES.some(f => f.value === activeFrame);

  const addCustomNovelty = () => {
    const url = customNoveltyUrl.trim();
    if (!url || activeNovelties.includes(url)) return;
    setActiveNovelties(prev => [...prev, url]);
    setCustomNoveltyUrl('');
  };

  const removeNovelty = (val: string) => {
    setActiveNovelties(prev => prev.filter(v => v !== val));
  };

  const saveCarouselSettings = async () => {
    if (activeNovelties.length === 0) {
      setCarouselResult({ success: false, message: 'Select at least one novelty.' });
      return;
    }
    setCarouselSaving(true);
    setCarouselResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/carousel-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-wallet-address': account.address },
        body: JSON.stringify({ frame: activeFrame, novelties: activeNovelties }),
      });
      const data = await res.json();
      setCarouselResult({ success: data.success, message: data.success ? 'Carousel settings saved!' : (data.error || 'Failed') });
    } catch {
      setCarouselResult({ success: false, message: 'Network error.' });
    } finally {
      setCarouselSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/raffles/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': account.address,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          imageUrl: imageUrl.trim(),
          countdownHours,
          ticketCost,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ success: true, message: `Raffle created! ID: ${data.raffle?.id ?? data.data?.id ?? '?'} — "${title}"` });
        setTitle('');
        setDescription('');
        setImagePreset(PRIZE_IMAGE_OPTIONS[0].value);
        setCustomImageUrl('');
        setCountdownHours(72);
        setTicketCost(50);
      } else {
        setResult({ success: false, message: data.error || 'Failed to create raffle.' });
      }
    } catch {
      setResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-black text-yellow-400">🎟️ Create New Raffle</h1>
      </div>

      <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 overflow-hidden">
        {/* Info bar */}
        <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 px-5 py-3 border-b border-gray-700/50">
          <p className="text-xs text-gray-300">
            <span className="text-orange-400 font-bold">TNM threshold:</span> 10 unique participants + 5,000 pts committed — raffle goes LIVE automatically. Draw runs <span className="text-white font-bold">{countdownHours}h</span> after going live.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-yellow-400 mb-1">
              Raffle Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. $50 AMY"
              required
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-400 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-yellow-400 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Win $50 worth of AMY tokens!"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-400 focus:outline-none"
            />
          </div>

          {/* Prize image */}
          <div>
            <label className="block text-sm font-bold text-yellow-400 mb-1">Prize Image</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {PRIZE_IMAGE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setImagePreset(opt.value)}
                  className={`rounded-lg border-2 p-2 text-xs font-bold transition-colors ${
                    imagePreset === opt.value
                      ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                      : 'border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-400'
                  }`}
                >
                  {opt.value && opt.value !== '' ? (
                    <img src={opt.value} alt={opt.label} className="w-full h-10 object-contain mb-1" />
                  ) : (
                    <div className="w-full h-10 flex items-center justify-center text-lg">🔗</div>
                  )}
                  {opt.label}
                </button>
              ))}
            </div>
            {isCustom && (
              <input
                type="text"
                value={customImageUrl}
                onChange={e => setCustomImageUrl(e.target.value)}
                placeholder="https://... or /prize-custom.png"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-400 focus:outline-none"
              />
            )}
            {imageUrl && (
              <div className="mt-2 flex items-center gap-2">
                <img src={imageUrl} alt="Preview" className="h-12 object-contain rounded border border-gray-600" />
                <span className="text-xs text-gray-400">{imageUrl}</span>
              </div>
            )}
          </div>

          {/* Countdown hours + Ticket cost */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-yellow-400 mb-1">
                Draw timer (hours after LIVE)
              </label>
              <input
                type="number"
                min={1}
                max={720}
                value={countdownHours}
                onChange={e => setCountdownHours(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-400 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Default: 72h (3 days)</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-yellow-400 mb-1">
                Ticket cost (pts)
              </label>
              <input
                type="number"
                min={1}
                value={ticketCost}
                onChange={e => setTicketCost(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-400 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Default: 50 pts</p>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-lg px-4 py-3 text-sm font-bold ${result.success ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
              {result.success ? '✅ ' : '❌ '}{result.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="w-full btn-samy btn-samy-enhanced text-white py-3 rounded-full font-black uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', margin: '0 auto' }} />
            ) : '🎟️ Create Raffle'}
          </button>
        </form>
      </div>

      {/* Carousel Settings */}
      <div className="mt-6 bg-gray-900/80 rounded-2xl border border-gray-700/50 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 px-5 py-3 border-b border-gray-700/50">
          <h2 className="text-base font-black text-purple-300">🎠 Carousel Asset Settings</h2>
          <p className="text-xs text-gray-400 mt-0.5">Control which novelty decorations and frame appear on the prize carousel for all users.</p>
        </div>

        <div className="p-5 space-y-5">
          {/* Novelty picker */}
          <div>
            <label className="block text-sm font-bold text-yellow-400 mb-2">
              Novelty Decorations <span className="text-gray-500 font-normal text-xs">(select which appear in the carousel)</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ALL_NOVELTIES.map(nov => {
                const active = activeNovelties.includes(nov.value);
                return (
                  <button
                    key={nov.value}
                    type="button"
                    onClick={() => toggleNovelty(nov.value)}
                    className={`rounded-lg border-2 p-2 text-xs font-bold transition-colors ${
                      active
                        ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                        : 'border-gray-600 bg-gray-800 text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    <img src={nov.value} alt={nov.label} className="w-full h-10 object-contain mb-1" draggable={false} />
                    <span className="block truncate">{nov.label}</span>
                    <span className="block text-xs mt-0.5">{active ? '✓ ON' : 'OFF'}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">{activeNovelties.length} selected ({customNovelties.length} custom)</p>

            {/* Custom novelties already added */}
            {customNovelties.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {customNovelties.map(url => (
                  <div key={url} className="relative rounded-lg border-2 border-yellow-400 bg-yellow-400/10 p-2 text-xs flex flex-col items-center" style={{ minWidth: 64 }}>
                    <img src={url} alt="custom" className="w-10 h-10 object-contain mb-1" draggable={false} />
                    <span className="block text-yellow-400 font-bold">Custom</span>
                    <button
                      type="button"
                      onClick={() => removeNovelty(url)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center text-xs font-black leading-none hover:bg-red-400"
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Add custom novelty */}
            <div className="mt-3 p-3 bg-gray-800/50 rounded-xl border border-dashed border-gray-600">
              <p className="text-xs font-bold text-gray-300 mb-2">Add Custom Novelty URL</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customNoveltyUrl}
                  onChange={e => setCustomNoveltyUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomNovelty()}
                  placeholder="https://example.com/image.png"
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-xs focus:border-yellow-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCustomNovelty}
                  disabled={!customNoveltyUrl.trim() || activeNovelties.includes(customNoveltyUrl.trim())}
                  className="px-3 py-1.5 bg-yellow-400/20 border border-yellow-400/50 text-yellow-400 rounded-lg text-xs font-bold hover:bg-yellow-400/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              {customNoveltyUrl.trim() && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={customNoveltyUrl.trim()} alt="preview" className="h-10 object-contain rounded border border-gray-600 bg-gray-900" />
                  <span className="text-xs text-gray-400 truncate">{customNoveltyUrl.trim()}</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Any image format works (PNG, JPG, GIF, WebP). External URLs may go offline — hosting in <code className="text-gray-400">/public/</code> is more reliable. Custom novelties use default sizing (not the special wide sizing that the built-in Cooker uses).
              </p>
            </div>
          </div>

          {/* Frame picker */}
          <div>
            <label className="block text-sm font-bold text-yellow-400 mb-2">Frame</label>
            <div className="flex gap-2 flex-wrap">
              {ALL_FRAMES.map(fr => (
                <button
                  key={fr.value}
                  type="button"
                  onClick={() => setActiveFrame(fr.value)}
                  className={`rounded-lg border-2 px-4 py-2 text-xs font-bold transition-colors ${
                    activeFrame === fr.value
                      ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                      : 'border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-400'
                  }`}
                >
                  {fr.label}
                </button>
              ))}
              {isCustomFrame && (
                <div className="rounded-lg border-2 border-yellow-400 bg-yellow-400/10 px-4 py-2 text-xs font-bold text-yellow-400 flex items-center gap-2">
                  Custom Frame (active)
                  <button type="button" onClick={() => setActiveFrame('/frame.png')} className="text-red-400 hover:text-red-300 ml-1">Reset</button>
                </div>
              )}
            </div>
            {isCustomFrame && (
              <p className="text-xs text-yellow-400/70 mt-1 truncate">Active: {activeFrame}</p>
            )}

            {/* Custom frame URL */}
            <div className="mt-3 p-3 bg-gray-800/50 rounded-xl border border-dashed border-gray-600">
              <p className="text-xs font-bold text-gray-300 mb-2">Custom Frame URL</p>
              <div className="bg-amber-950/50 border border-amber-600/50 rounded-lg px-3 py-2 mb-3">
                <p className="text-xs font-bold text-amber-400 mb-1">Requirements — read before using:</p>
                <ul className="text-xs text-amber-200/80 space-y-0.5 list-disc list-inside">
                  <li>Must be a <strong>PNG with a transparent center</strong></li>
                  <li>The carousel content shows through the transparent hole</li>
                  <li>A regular image with no transparency will cover everything</li>
                  <li>Recommended size: 1366×768px (wide format)</li>
                  <li>Decorative border + transparent interior = correct frame design</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customFrameUrl}
                  onChange={e => setCustomFrameUrl(e.target.value)}
                  placeholder="https://example.com/frame.png"
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-xs focus:border-yellow-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => { if (customFrameUrl.trim()) setActiveFrame(customFrameUrl.trim()); }}
                  disabled={!customFrameUrl.trim()}
                  className="px-3 py-1.5 bg-yellow-400/20 border border-yellow-400/50 text-yellow-400 rounded-lg text-xs font-bold hover:bg-yellow-400/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Use
                </button>
              </div>
              {customFrameUrl.trim() && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Preview (transparency shown as white/grey checkerboard in some browsers):</p>
                  <img src={customFrameUrl.trim()} alt="frame preview" className="max-h-24 object-contain rounded border border-gray-600 bg-gray-900" />
                </div>
              )}
            </div>
          </div>

          {/* Result */}
          {carouselResult && (
            <div className={`rounded-lg px-4 py-3 text-sm font-bold ${carouselResult.success ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
              {carouselResult.success ? '✅ ' : '❌ '}{carouselResult.message}
            </div>
          )}

          <button
            type="button"
            onClick={saveCarouselSettings}
            disabled={carouselSaving}
            className="w-full btn-samy btn-samy-enhanced text-white py-3 rounded-full font-black uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {carouselSaving ? (
              <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', margin: '0 auto' }} />
            ) : '💾 Save Carousel Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
