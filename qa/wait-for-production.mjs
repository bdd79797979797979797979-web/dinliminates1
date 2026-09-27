const base = process.env.DINLIMINATE_BASE_URL || 'https://dinliminates1.vercel.app';
const deadline = Date.now() + 360000;
while (Date.now() < deadline) {
  try {
    const r = await fetch(base + '/');
    const t = await r.text();
    if (r.ok && t.includes('p683-restaurant-quickcuts-live')) { console.log('Production exposes p683-restaurant-quickcuts-live.'); process.exit(0); }
  } catch {}
  await new Promise(resolve => setTimeout(resolve, 10000));
}
console.error('Production did not expose p683-restaurant-quickcuts-live within six minutes.');
process.exit(1);