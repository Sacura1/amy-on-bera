const BASE = 'https://amy-production-fd10.up.railway.app';
const ADMIN_WALLET = '0x296E35950Dacb58692D0693834F28C4692B36DC3';

async function adminDelete(path) {
  const r = await fetch(BASE + path, {
    method: 'DELETE',
    headers: { 'x-wallet-address': ADMIN_WALLET },
  });
  return { status: r.status, body: await r.json() };
}

(async () => {
  // Fetch all history to find test raffle IDs
  const r = await fetch(`${BASE}/api/raffles/history`);
  const { data } = await r.json();

  const testRaffles = data.filter(r => r.title.startsWith('[TEST]'));
  if (testRaffles.length === 0) {
    console.log('No [TEST] raffles found in history.');
    return;
  }

  console.log(`Found ${testRaffles.length} test raffle(s) to delete:`);
  for (const raffle of testRaffles) {
    process.stdout.write(`  Deleting id=${raffle.id} "${raffle.title}"... `);
    const { status, body } = await adminDelete(`/api/raffles/${raffle.id}`);
    if (body.success) {
      console.log(`deleted.`);
    } else {
      console.log(`FAILED — HTTP ${status}: ${body.error}`);
    }
  }

  // Also check active list for any leftover test raffles
  const r2 = await fetch(`${BASE}/api/raffles`);
  const { data: active } = await r2.json();
  const activeTest = active.filter(r => r.title.startsWith('[TEST]'));
  for (const raffle of activeTest) {
    process.stdout.write(`  Deleting active id=${raffle.id} "${raffle.title}"... `);
    const { status, body } = await adminDelete(`/api/raffles/${raffle.id}`);
    console.log(body.success ? 'deleted.' : `FAILED — HTTP ${status}: ${body.error}`);
  }

  console.log('Done.');
})();
