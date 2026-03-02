const BASE = 'https://amy-production-fd10.up.railway.app';
const ADMIN_WALLET = '0x296E35950Dacb58692D0693834F28C4692B36DC3';
const RAFFLE_ID = 3;

const TEST_USERS = [
  { wallet: '0x0e1f06eb83c10797c57968a42c4a65f960ad94d9', xUsername: 'Joedark01' },
  { wallet: '0xb6a9f27f861b023c72781561ed479ffb8d033080', xUsername: 'FreddysGarage' },
  { wallet: '0x5bc4346fef094ae8e9492a97d5751065db18f944', xUsername: 'PawelB88' },
  { wallet: '0x60a34ae9d71e1195f04e465b1cf7d1dc94243de9', xUsername: 'ArcadeTopArcade' },
  { wallet: '0xc54c6055caef70dc0ea774e186c65ac2277e2d47', xUsername: 'AaiissMrWavvy' },
  { wallet: '0xdb63dc8cd8da57d26ba9ac730e05912874ca7148', xUsername: 'ModestChefHat' },
  { wallet: '0x6aa487b58bb897f87009fec99540c86959cefe07', xUsername: 'JohnHill73254' },
  { wallet: '0xf2ae58af7ec68a90958345acd50820d000062b32', xUsername: 'viccweb3' },
  { wallet: '0x86f5355f694175cd2ffb1b9c04a3692fa8134c49', xUsername: 'Jujaki_01' },
  { wallet: '0xdb458a96bb73c668e7e7fa288203d5003c5b4481', xUsername: 'Chom_sky1' },
];

async function adminPost(path, body) {
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-wallet-address': ADMIN_WALLET },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function post(path, body) {
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}

(async () => {
  console.log(`\nTriggering TNM → LIVE for raffle id=${RAFFLE_ID}...\n`);

  // Step 1: seed 500 pts to each user (net-zero: will be spent on tickets)
  console.log('Seeding 500 pts to 10 users...');
  for (const u of TEST_USERS) {
    const b = await adminPost('/api/points/add-bonus', {
      xUsername: u.xUsername, points: 500, reason: 'LIVE_TRIGGER_TEST',
    });
    console.log(`  @${u.xUsername}: ${b.success ? 'ok' : b.error}`);
  }

  // Step 2: each user buys 10 tickets (500 pts each)
  console.log('\nBuying 10 tickets from each wallet...');
  for (const u of TEST_USERS) {
    const b = await post('/api/raffles/buy', { wallet: u.wallet, raffleId: RAFFLE_ID, quantity: 10 });
    console.log(`  ${u.wallet.slice(0,10)}...: ${b.success ? 'ok' : b.error}`);
  }

  // Step 3: check status
  const r = await fetch(`${BASE}/api/raffles`);
  const { data } = await r.json();
  const raffle = data.find(r => r.id === RAFFLE_ID);
  if (!raffle) {
    console.log('\nRaffle not found in active list — may have auto-completed.');
    return;
  }
  console.log(`\nRaffle status: ${raffle.status}`);
  if (raffle.status === 'LIVE') {
    console.log(`ends_at: ${raffle.ends_at}`);
    console.log(`participants: ${raffle.unique_participants}, pts: ${raffle.total_points_committed}`);
    console.log('\n✅ Raffle is LIVE — countdown is now showing in the UI.');
  } else {
    console.log(`⚠️  Still ${raffle.status} — pts=${raffle.total_points_committed}, participants=${raffle.unique_participants}`);
  }
})();
