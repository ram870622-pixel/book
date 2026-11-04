import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    // Serve only the public application files; never expose Git or local files.
    if (!['/', '/index.html', '/src/app.js', '/src/library.js', '/src/model.js', '/src/storage.js', '/src/workflow.js', '/src/style.css', '/samples/imagination.svg'].includes(pathname)) {
      res.writeHead(404).end('Not found'); return;
    }
    const file = path.join(root, pathname === '/' ? 'index.html' : pathname);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)], 'X-Content-Type-Options': 'nosniff' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(500).end('Unable to load application');
  }
});
server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('Storybook server listening on port ' + server.address().port));
