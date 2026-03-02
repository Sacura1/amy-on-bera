const BASE = 'https://amy-production-fd10.up.railway.app';
const ADMIN_WALLET = '0x296e35950dacb58692d0693834f28c4692b36dc3';

const RAFFLES = [
  {
    title: '$50 AMY',
    description: 'Win $50 worth of AMY tokens!',
    imageUrl: '/prize-50amy.png',
    countdownHours: 24,
  },
  {
    title: '$25 plvHEDGE',
    description: 'Win $25 worth of plvHEDGE!',
    imageUrl: '/prize-25plvhedge.png',
    countdownHours: 24,
  },
  {
    title: '$25 SAIL',
    description: 'Win $25 worth of SAIL tokens!',
    imageUrl: '/prize-25sail.png',
    countdownHours: 24,
  },
  {
    title: 'Booga Bulla NFT',
    description: 'Win a Booga Bulla NFT!',
    imageUrl: '/prize-booga-bulla-nft.png',
    countdownHours: 24,
  },
  {
    title: 'Bulas NFT',
    description: 'Win a Bulas NFT!',
    imageUrl: '/prize-bulas-nft.png',
    countdownHours: 24,
  },
  {
    title: 'X Premium',
    description: 'Win an X Premium subscription!',
    imageUrl: '/prize-x-premium.png',
    countdownHours: 24,
  },
];

(async () => {
  console.log('Creating 5 raffles...\n');
  for (const raffle of RAFFLES) {
    const r = await fetch(`${BASE}/api/raffles/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': ADMIN_WALLET,
      },
      body: JSON.stringify(raffle),
    });
    const data = await r.json();
    if (data.success) {
      console.log(`✅ Created id=${data.raffle?.id ?? '?'}: "${raffle.title}"`);
    } else {
      console.log(`❌ Failed "${raffle.title}": ${data.error}`);
    }
  }

  // Verify
  console.log('\nVerifying active raffles...');
  const res = await fetch(`${BASE}/api/raffles`);
  const { data } = await res.json();
  console.log(`Active raffles: ${data.length}`);
  for (const r of data) {
    console.log(`  id=${r.id} [${r.status}] "${r.title}" image=${r.image_url}`);
  }
})();
