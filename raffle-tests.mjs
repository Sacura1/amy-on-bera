const BASE = 'https://amy-production-fd10.up.railway.app';
const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  process.stdout.write('  ' + name + '... ');
  try {
    const result = await fn();
    console.log('\x1b[32mPASS\x1b[0m' + (result ? ' — ' + result : ''));
    passed++;
  } catch(e) {
    console.log('\x1b[31mFAIL\x1b[0m — ' + e.message);
    failed++;
  }
}

async function get(path) {
  const r = await fetch(BASE + path);
  return { status: r.status, headers: r.headers, body: await r.json() };
}

async function post(path, body) {
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { status: r.status, body: await r.json() };
}

(async () => {
  console.log('\n=== RAFFLE API TESTS ===\n');

  // 1. GET /api/raffles — no wallet
  await test('GET /api/raffles — no wallet', async () => {
    const { status, body } = await get('/api/raffles');
    if (status !== 200) throw new Error('HTTP ' + status);
    if (typeof body.success !== 'boolean') throw new Error('missing success field');
    if (!Array.isArray(body.data)) throw new Error('data is not an array');
    if (typeof body.userEntries !== 'object') throw new Error('userEntries field missing');
    return `${status} OK, ${body.data.length} raffle(s)`;
  });

  // 2. GET /api/raffles — with wallet param
  await test('GET /api/raffles — with wallet param', async () => {
    const { status, body } = await get('/api/raffles?wallet=' + TEST_WALLET);
    if (status !== 200) throw new Error('HTTP ' + status);
    if (!Array.isArray(body.data)) throw new Error('data is not an array');
    if (typeof body.userEntries !== 'object') throw new Error('userEntries missing');
    return `${status} OK, userEntries keys: ${Object.keys(body.userEntries).length}`;
  });

  // 3. GET /api/raffles/history
  await test('GET /api/raffles/history', async () => {
    const { status, body } = await get('/api/raffles/history');
    if (status !== 200) throw new Error('HTTP ' + status);
    if (typeof body.success !== 'boolean') throw new Error('missing success field');
    if (!Array.isArray(body.data)) throw new Error('data is not an array');
    return `${status} OK, ${body.data.length} completed/cancelled raffle(s)`;
  });

  // 4. Raffle data shape validation
  await test('Raffle field shape (id, title, status, ticket_cost)', async () => {
    const { body } = await get('/api/raffles');
    const validStatuses = ['TNM', 'LIVE', 'COMPLETED', 'CANCELLED'];
    for (const r of body.data) {
      if (typeof r.id !== 'number') throw new Error('raffle.id not number');
      if (typeof r.title !== 'string') throw new Error('raffle.title not string');
      if (!validStatuses.includes(r.status)) throw new Error('invalid status: ' + r.status);
      if (typeof r.ticket_cost !== 'number') throw new Error('ticket_cost not number for id=' + r.id);
      if (typeof r.total_tickets !== 'number') throw new Error('total_tickets not number');
    }
    return `${body.data.length} raffle(s) all have valid shapes`;
  });

  // 5. History data shape validation
  await test('History field shape (id, title, status, winner_wallet)', async () => {
    const { body } = await get('/api/raffles/history');
    for (const r of body.data) {
      if (typeof r.id !== 'number') throw new Error('history.id not number');
      if (typeof r.title !== 'string') throw new Error('history.title not string');
      if (!['COMPLETED', 'CANCELLED'].includes(r.status)) throw new Error('invalid history status: ' + r.status);
    }
    return `${body.data.length} history record(s) all valid`;
  });

  // 6. POST /api/raffles/buy — missing wallet → 400
  await test('POST /api/raffles/buy — missing wallet → 400', async () => {
    const { status, body } = await post('/api/raffles/buy', { raffleId: 1, quantity: 1 });
    if (status !== 400) throw new Error('Expected 400, got ' + status + ': ' + JSON.stringify(body));
    if (body.success !== false) throw new Error('Expected success:false');
    return `${status} — ${body.error}`;
  });

  // 7. POST /api/raffles/buy — missing raffleId → 400
  await test('POST /api/raffles/buy — missing raffleId → 400', async () => {
    const { status, body } = await post('/api/raffles/buy', { wallet: TEST_WALLET, quantity: 1 });
    if (status !== 400) throw new Error('Expected 400, got ' + status + ': ' + JSON.stringify(body));
    if (body.success !== false) throw new Error('Expected success:false');
    return `${status} — ${body.error}`;
  });

  // 8. POST /api/raffles/buy — quantity 0 → 400
  await test('POST /api/raffles/buy — quantity 0 → 400', async () => {
    const { status, body } = await post('/api/raffles/buy', { wallet: TEST_WALLET, raffleId: 1, quantity: 0 });
    if (status !== 400) throw new Error('Expected 400, got ' + status + ': ' + JSON.stringify(body));
    if (body.success !== false) throw new Error('Expected success:false');
    return `${status} — ${body.error}`;
  });

  // 9. POST /api/raffles/buy — negative quantity → 400
  await test('POST /api/raffles/buy — negative quantity → 400', async () => {
    const { status, body } = await post('/api/raffles/buy', { wallet: TEST_WALLET, raffleId: 1, quantity: -5 });
    if (status !== 400) throw new Error('Expected 400, got ' + status + ': ' + JSON.stringify(body));
    if (body.success !== false) throw new Error('Expected success:false');
    return `${status} — ${body.error}`;
  });

  // 10. POST /api/raffles/buy — nonexistent raffleId
  await test('POST /api/raffles/buy — nonexistent raffleId → error', async () => {
    const { body } = await post('/api/raffles/buy', { wallet: TEST_WALLET, raffleId: 999999, quantity: 1 });
    if (body.success !== false) throw new Error('Expected failure for nonexistent raffle, got: ' + JSON.stringify(body));
    return 'Correctly rejected: ' + body.error;
  });

  // 11. POST /api/raffles/buy — wallet with zero points (can't afford)
  await test('POST /api/raffles/buy — wallet with no points → insufficient error', async () => {
    const { body } = await post('/api/raffles/buy', { wallet: TEST_WALLET, raffleId: 1, quantity: 1 });
    // Either the raffle doesn't exist (error) or the user has no points (error). Either way success must be false.
    if (body.success === true) throw new Error('Should not succeed for a test wallet with no points');
    return 'Correctly rejected: ' + body.error;
  });

  // 12. Admin guard — POST /api/raffles/create without auth → 401/403
  await test('POST /api/raffles/create — no admin auth → 401/403', async () => {
    const { status, body } = await post('/api/raffles/create', { title: 'Test Raffle', countdownHours: 24 });
    if (![401, 403].includes(status)) throw new Error(`Expected 401/403, got ${status}: ` + JSON.stringify(body));
    return `${status} blocked — ${body.error || body.message || 'unauthorized'}`;
  });

  // 13. Admin guard — POST /api/raffles/draw without auth → 401/403
  await test('POST /api/raffles/draw — no admin auth → 401/403', async () => {
    const { status, body } = await post('/api/raffles/draw', { raffleId: 1 });
    if (![401, 403].includes(status)) throw new Error(`Expected 401/403, got ${status}: ` + JSON.stringify(body));
    return `${status} blocked — ${body.error || body.message || 'unauthorized'}`;
  });

  // 14. Admin guard — POST /api/raffles/cancel without auth → 401/403
  await test('POST /api/raffles/cancel — no admin auth → 401/403', async () => {
    const { status, body } = await post('/api/raffles/cancel', { raffleId: 1 });
    if (![401, 403].includes(status)) throw new Error(`Expected 401/403, got ${status}: ` + JSON.stringify(body));
    return `${status} blocked — ${body.error || body.message || 'unauthorized'}`;
  });

  // 15. CORS headers
  await test('CORS — access-control-allow-credentials on /api/raffles', async () => {
    const r = await fetch(BASE + '/api/raffles', { headers: { Origin: 'https://amy-on-bera.vercel.app' } });
    const creds = r.headers.get('access-control-allow-credentials');
    if (!creds) throw new Error('access-control-allow-credentials header missing');
    return 'header value: ' + creds;
  });

  // 16. /api/points endpoint (used by TicketModal for balance check)
  await test('GET /api/points/:wallet — returns totalPoints', async () => {
    const { status, body } = await get('/api/points/' + TEST_WALLET);
    if (status !== 200) throw new Error('HTTP ' + status);
    if (!body.success) throw new Error('success false: ' + JSON.stringify(body));
    if (!body.data || typeof body.data.totalPoints !== 'number') throw new Error('totalPoints missing in data');
    return `totalPoints for test wallet: ${body.data.totalPoints}`;
  });

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
})();
