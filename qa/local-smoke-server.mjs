import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const upstream = 'https://dinliminates1.vercel.app';
const port = Number(process.env.PORT || 4173);
const types = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon',
};

function safePath(urlPath) {
  const requested = decodeURIComponent(urlPath.split('?')[0]);
  const rel = requested === '/' ? 'index.html' : requested.replace(/^\/+/, '');
  const full = path.resolve(root, rel);
  return full.startsWith(root + path.sep) ? full : null;
}

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || '/', 'http://localhost');
    if (requestUrl.pathname === '/api/restaurant-search') {
      const target = upstream + requestUrl.pathname + requestUrl.search;
      const response = await fetch(target, { headers: { accept:'application/json' } });
      res.statusCode = response.status;
      res.setHeader('content-type', response.headers.get('content-type') || 'application/json; charset=utf-8');
      const body = Buffer.from(await response.arrayBuffer());
      res.end(body);
      return;
    }
    const full = safePath(requestUrl.pathname);
    if (!full || !fs.existsSync(full) || !fs.statSync(full).isFile()) { res.statusCode=404; res.end('Not found'); return; }
    const ext = path.extname(full).toLowerCase();
    res.statusCode=200;
    res.setHeader('content-type', types[ext] || 'application/octet-stream');
    res.end(fs.readFileSync(full));
  } catch (err) {
    res.statusCode=500; res.end('Local QA server error: ' + String(err?.message || err));
  }
});
server.listen(port, '127.0.0.1', () => console.log('Dinliminate local QA server listening on http://127.0.0.1:' + port));