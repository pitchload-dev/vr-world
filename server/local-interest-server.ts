import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterestHandler } from './interests';
import { fileInterestStore } from './file-interest-store';
import { configuredPasswordHash } from './interest-password';
const root = fileURLToPath(new URL('./', import.meta.url));
const publicRoot = resolve(root, 'public');
const api = createInterestHandler(
  fileInterestStore(resolve(root, '.local-data/interests.json')),
  configuredPasswordHash,
);
const port = Number(process.env.PORT || 4173);
const types: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.jpg': 'image/jpeg',
  '.vtt': 'text/vtt',
  '.md': 'text/plain',
};
createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://localhost:${port}`);
    if (url.pathname === '/api/interests') {
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 4096) {
          res.writeHead(413);
          res.end();
          return;
        }
        chunks.push(chunk);
      }
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers))
        if (value)
          headers.set(key, Array.isArray(value) ? value.join(';') : value);
      const response = await api(
        new Request(url, {
          method: req.method,
          headers,
          body: req.method === 'GET' ? undefined : Buffer.concat(chunks),
        }),
        req.socket.remoteAddress,
      );
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    let file = resolve(publicRoot, '.' + decodeURIComponent(url.pathname));
    if (file !== publicRoot && !file.startsWith(publicRoot + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (
      url.pathname === '/' ||
      url.pathname === '/meeting' ||
      url.pathname === '/meeting/'
    )
      file = resolve(publicRoot, 'index.html');
    if (!(await stat(file)).isFile()) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(port, '127.0.0.1', () =>
  console.log(`Demo with local persistent storage: http://localhost:${port}`),
);
