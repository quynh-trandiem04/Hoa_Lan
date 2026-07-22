import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const serverDirectory = join(process.cwd(), 'dist', 'server');
const workerSource = `const API_ORIGIN = 'https://quan-ly-hoa-lan.onrender.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/backend-api' || url.pathname.startsWith('/backend-api/')) {
      const upstreamPath = url.pathname.replace(/^\\/backend-api/, '') || '/';
      const upstreamUrl = new URL(upstreamPath + url.search, API_ORIGIN);
      return fetch(new Request(upstreamUrl, request));
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404 || request.method !== 'GET') return assetResponse;

    const accept = request.headers.get('accept') || '';
    if (!accept.includes('text/html')) return assetResponse;

    const indexRequest = new Request(new URL('/index.html', request.url), request);
    return env.ASSETS.fetch(indexRequest);
  },
};
`;

await mkdir(serverDirectory, { recursive: true });
await writeFile(join(serverDirectory, 'index.js'), workerSource, 'utf8');
