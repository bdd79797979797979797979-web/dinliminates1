const base = process.env.DINLIMINATE_BASE_URL || 'https://dinliminates1.vercel.app';
const deadline = Date.now() + 360000;
while (Date.now() < deadline) {
  try {
    const r = await fetch(base + '/');
    const t = await r.text();
    if (r.ok && t.includes('p682-restaurant-quickcuts-live-sync')) { console.log('Production exposes p682-restaurant-quickcuts-live-sync.'); process.exit(0); }
  } catch {}
  await new Promise(resolve => setTimeout(resolve, 10000));
}
console.error('Production did not expose p682-restaurant-quickcuts-live-sync within six minutes.');
process.exit(1);