/**
 * Raffle Lifecycle Tests
 *
 * Tests the full TNM → LIVE → COMPLETED flow against the live Railway backend.
 *
 * Uses 10 real users from the leaderboard. Net points impact = 0:
 *   +500 pts bonus given → 500 pts spent buying tickets = wash.
 */

const BASE = 'https://amy-production-fd10.up.railway.app';
const ADMIN_WALLET = '0x296E35950Dacb58692D0693834F28C4692B36DC3';

// 10 real users pulled from leaderboard (wallet + xUsername needed for add-bonus)
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

// Each user gets +500 pts bonus then spends 500 pts on 10 tickets → net 0
const BONUS_PTS = 500;
const TICKETS_PER_USER = 10; // 10 tickets × 50 pts = 500 pts
const TICKET_COST = 50;

let passed = 0;
let failed = 0;
let createdRaffleId = null;

async function test(name, fn) {
  process.stdout.write(`  ${name}... `);
  try {
    const result = await fn();
    console.log(`\x1b[32mPASS\x1b[0m${result ? ' — ' + result : ''}`);
    passed++;
    return result;
  } catch (e) {
    console.log(`\x1b[31mFAIL\x1b[0m — ${e.message}`);
    failed++;
    return null;
  }
}

async function get(path) {
  const r = await fetch(BASE + path);
  return { status: r.status, body: await r.json() };
}

async function adminPost(path, body) {
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-wallet-address': ADMIN_WALLET },
    body: JSON.stringify(body),
  });
  return { status: r.status, body: await r.json() };
}

async function post(path, body) {
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: r.status, body: await r.json() };
}

(async () => {
  console.log('\n=== RAFFLE LIFECYCLE TESTS ===');
  console.log(`    Testing against: ${BASE}\n`);

  // ─── PHASE 1: CREATE ───────────────────────────────────────────────────────
  console.log('── Phase 1: Create raffle (admin) ──');

  await test('POST /api/raffles/create → status TNM', async () => {
    const { status, body } = await adminPost('/api/raffles/create', {
      title: '[TEST] Lifecycle Raffle',
      description: 'Automated test — ignore',
      imageUrl: '',
      countdownHours: 1,
    });
    if (status !== 200) throw new Error(`HTTP ${status}: ${JSON.stringify(body)}`);
    if (!body.success) throw new Error(body.error);
    if (body.data.status !== 'TNM') throw new Error(`Expected TNM, got ${body.data.status}`);
    createdRaffleId = body.data.id;
    return `id=${createdRaffleId}, status=TNM`;
  });

  if (!createdRaffleId) {
    console.log('\n\x1b[31mAbort — raffle creation failed.\x1b[0m\n');
    process.exit(1);
  }

  await test('New raffle visible in GET /api/raffles as TNM', async () => {
    const { body } = await get('/api/raffles');
    const r = body.data.find(r => r.id === createdRaffleId);
    if (!r) throw new Error('Not in active list');
    if (r.status !== 'TNM') throw new Error(`Expected TNM, got ${r.status}`);
    return `id=${createdRaffleId} found`;
  });

  // ─── PHASE 2: SEED POINTS ──────────────────────────────────────────────────
  console.log('\n── Phase 2: Seed 500 pts to 10 real users (net-zero: will be spent on tickets) ──');

  const pointsBefore = [];
  for (let i = 0; i < TEST_USERS.length; i++) {
    const u = TEST_USERS[i];
    await test(`add-bonus +500 pts → @${u.xUsername}`, async () => {
      // Snapshot balance before
      const { body: before } = await get(`/api/points/${u.wallet}`);
      pointsBefore[i] = parseFloat(before.data?.totalPoints || 0);

      const { status, body } = await adminPost('/api/points/add-bonus', {
        xUsername: u.xUsername,
        points: BONUS_PTS,
        reason: 'RAFFLE_LIFECYCLE_TEST',
      });
      if (status !== 200) throw new Error(`HTTP ${status}: ${JSON.stringify(body)}`);
      if (!body.success) throw new Error(body.error);
      return `balance: ${pointsBefore[i]} → ${body.newTotal}`;
    });
  }

  // ─── PHASE 3: TRIGGER TNM → LIVE ──────────────────────────────────────────
  console.log('\n── Phase 3: Buy tickets (10 wallets × 10 tickets = 5 000 pts total) ──');

  for (let i = 0; i < 9; i++) {
    const u = TEST_USERS[i];
    await test(`Wallet[${i}] @${u.xUsername} buys ${TICKETS_PER_USER} tickets`, async () => {
      const { body } = await post('/api/raffles/buy', {
        wallet: u.wallet,
        raffleId: createdRaffleId,
        quantity: TICKETS_PER_USER,
      });
      if (!body.success) throw new Error(body.error);
      return 'ok';
    });
  }

  // After 9 wallets the threshold (10 participants, 5000 pts) isn't met yet
  await test('Raffle still TNM after 9 participants', async () => {
    const { body } = await get('/api/raffles');
    const r = body.data.find(r => r.id === createdRaffleId);
    if (!r) throw new Error('Not found');
    if (r.status !== 'TNM') throw new Error(`Expected TNM, got ${r.status}`);
    return `participants=${r.unique_participants}, pts=${r.total_points_committed}`;
  });

  // 10th wallet pushes over both thresholds → LIVE
  await test(`Wallet[9] @${TEST_USERS[9].xUsername} buys tickets → triggers TNM→LIVE`, async () => {
    const { body } = await post('/api/raffles/buy', {
      wallet: TEST_USERS[9].wallet,
      raffleId: createdRaffleId,
      quantity: TICKETS_PER_USER,
    });
    if (!body.success) throw new Error(body.error);
    return 'buy succeeded';
  });

  await test('Raffle is now LIVE (10 participants, 5 000 pts committed)', async () => {
    const { body } = await get('/api/raffles');
    const r = body.data.find(r => r.id === createdRaffleId);
    if (!r) throw new Error('Not in active list');
    if (r.status !== 'LIVE') throw new Error(`Expected LIVE, got ${r.status} (pts=${r.total_points_committed}, participants=${r.unique_participants})`);
    if (!r.ends_at) throw new Error('ends_at not set');
    return `status=LIVE, ends_at=${r.ends_at}, participants=${r.unique_participants}, pts=${r.total_points_committed}`;
  });

  // ─── PHASE 4: WHILE-LIVE CHECKS ───────────────────────────────────────────
  console.log('\n── Phase 4: Verify behaviour while LIVE ──');

  await test('LIVE raffle rejects buy from wallet with 0 points', async () => {
    const broke = '0x000000000000000000000000000000000000dead';
    const { body } = await post('/api/raffles/buy', { wallet: broke, raffleId: createdRaffleId, quantity: 1 });
    if (body.success) throw new Error('Should have been rejected');
    return `Rejected: ${body.error}`;
  });

  await test('GET /api/raffles?wallet= returns correct userEntries for participant', async () => {
    const { body } = await get(`/api/raffles?wallet=${TEST_USERS[0].wallet}`);
    const entries = body.userEntries || {};
    const tickets = entries[createdRaffleId];
    if (!tickets) throw new Error(`No entry found for raffle ${createdRaffleId}`);
    if (tickets !== TICKETS_PER_USER) throw new Error(`Expected ${TICKETS_PER_USER} tickets, got ${tickets}`);
    return `user has ${tickets} tickets on raffle ${createdRaffleId}`;
  });

  await test('Points correctly deducted from buyer after ticket purchase', async () => {
    const u = TEST_USERS[0];
    const { body } = await get(`/api/points/${u.wallet}`);
    const currentPts = parseFloat(body.data?.totalPoints || 0);
    const expectedPts = pointsBefore[0]; // bonus was spent on tickets, so back to original
    const spent = TICKETS_PER_USER * TICKET_COST;
    const expectedAfterBuy = pointsBefore[0] + BONUS_PTS - spent;
    if (Math.abs(currentPts - expectedAfterBuy) > 1) {
      throw new Error(`Expected ~${expectedAfterBuy} pts, got ${currentPts}`);
    }
    return `${currentPts} pts (original ${pointsBefore[0]} + bonus ${BONUS_PTS} - spent ${spent})`;
  });

  // ─── PHASE 5: DRAW WINNER ──────────────────────────────────────────────────
  console.log('\n── Phase 5: Draw winner (early admin draw) ──');

  await test('POST /api/raffles/draw (admin) → returns winner', async () => {
    const { status, body } = await adminPost('/api/raffles/draw', { raffleId: createdRaffleId });
    if (status !== 200) throw new Error(`HTTP ${status}: ${JSON.stringify(body)}`);
    if (!body.success) throw new Error(body.error);
    const winner = body.data?.winner || body.winner;
    if (!winner) throw new Error('winner is null — no entries? ' + JSON.stringify(body));
    return `winner=${winner}`;
  });

  // ─── PHASE 6: VERIFY COMPLETED ────────────────────────────────────────────
  console.log('\n── Phase 6: Verify COMPLETED state ──');

  await test('Raffle appears in /api/raffles/history as COMPLETED', async () => {
    const { body } = await get('/api/raffles/history');
    const r = body.data.find(r => r.id === createdRaffleId);
    if (!r) throw new Error('Not in history');
    if (r.status !== 'COMPLETED') throw new Error(`Expected COMPLETED, got ${r.status}`);
    return `status=COMPLETED, winner=${r.winner_wallet}`;
  });

  await test('winner_wallet is set and belongs to one of the ticket buyers', async () => {
    const { body } = await get('/api/raffles/history');
    const r = body.data.find(r => r.id === createdRaffleId);
    if (!r.winner_wallet) throw new Error('winner_wallet is null');
    const participants = TEST_USERS.map(u => u.wallet.toLowerCase());
    if (!participants.includes(r.winner_wallet.toLowerCase())) {
      throw new Error(`winner ${r.winner_wallet} is not one of our 10 test participants`);
    }
    return `winner=${r.winner_wallet} ✓ is a participant`;
  });

  await test('Completed raffle no longer in active list', async () => {
    const { body } = await get('/api/raffles');
    const r = body.data.find(r => r.id === createdRaffleId);
    if (r) throw new Error(`Still in active list with status=${r.status}`);
    return 'correctly absent from active list';
  });

  await test('COMPLETED raffle rejects further ticket purchases', async () => {
    const { body } = await post('/api/raffles/buy', {
      wallet: TEST_USERS[0].wallet,
      raffleId: createdRaffleId,
      quantity: 1,
    });
    if (body.success) throw new Error('Should have rejected buy on completed raffle');
    return `Rejected: ${body.error}`;
  });

  // ─── SUMMARY ──────────────────────────────────────────────────────────────
  console.log(`\n=== RESULTS: \x1b[32m${passed} passed\x1b[0m, ${failed > 0 ? '\x1b[31m' : ''}${failed} failed${failed > 0 ? '\x1b[0m' : ''} ===\n`);
  process.exit(failed > 0 ? 1 : 0);
})();
