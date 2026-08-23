import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import { createServer } from 'node:http';
import puppeteer from 'puppeteer';
import { getPublicRoutes } from './routes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');
const PORT = 5123;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

// Analytics/tracking hosts to block during prerendering so the build doesn't fire real pageview events.
// Includes www.google.com because gtag beacons redirect /g/collect hits there, which also
// trips the page's CSP connect-src allowlist and shows up as a console error otherwise.
const BLOCKED_HOSTS = ['www.googletagmanager.com', 'www.google-analytics.com', 'www.google.com'];

// Minimal static file server for the built `dist/` output: serves the
// requested file if it exists, otherwise falls back to index.html (SPA routing).
function startStaticServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const urlPath = req.url.split('?')[0];
      let filePath = join(distDir, urlPath === '/' ? 'index.html' : urlPath);
      if (!existsSync(filePath) || urlPath.endsWith('/')) {
        filePath = join(distDir, 'index.html');
      }
      try {
        const content = readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[extname(filePath)] || 'application/octet-stream' });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    server.listen(PORT, () => resolve(server));
  });
}

async function main() {
  if (!existsSync(distDir)) {
    console.error('dist/ not found — run `vite build` before prerendering.');
    process.exit(1);
  }

  const server = await startStaticServer();
  const browser = await puppeteer.launch({ headless: true });

  const routes = getPublicRoutes();
  const results = [];

  try {
    for (const { path } of routes) {
      const page = await browser.newPage();
      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', (err) => consoleErrors.push(String(err)));

      // The page's own CSP blocks GA's cross-origin redirect target (google.com/g/collect)
      // and logs that as a console error independent of our request interception below
      // (CSP is enforced before interception sees the request). Bypass CSP for the
      // prerender browser only — analytics is still prevented from firing for real via
      // the request interception, this just stops CSP's own block from being logged as
      // a false-positive "error" in our clean-pass check.
      await page.setBypassCSP(true);

      // Headless Chrome throttles requestAnimationFrame for pages it treats as
      // backgrounded, which stalls react-helmet-async's rAF-scheduled DOM commit.
      // Route rAF through setTimeout so Helmet's head updates actually land.
      await page.evaluateOnNewDocument(() => {
        window.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
        window.cancelAnimationFrame = (id) => clearTimeout(id);
      });

      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const url = new URL(req.url());
        if (BLOCKED_HOSTS.includes(url.hostname)) {
          // Respond empty rather than abort() - an aborted request logs as a
          // "Failed to load resource" console error, which would falsely fail the
          // clean-pass check even though this is intentional analytics suppression.
          req.respond({ status: 200, contentType: 'application/javascript', body: '' });
        } else {
          req.continue();
        }
      });

      await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'networkidle0', timeout: 30000 });

      // Wait for Helmet to actually commit its tags (data-rh attribute) rather than a fixed sleep.
      let helmetCommitted = true;
      try {
        await page.waitForFunction(() => document.querySelector('[data-rh]') !== null, { timeout: 5000 });
      } catch {
        helmetCommitted = false;
      }

      // Helmet appends its per-route canonical/og/twitter tags alongside index.html's static
      // fallback tags rather than replacing them, so the captured HTML would otherwise contain
      // two (conflicting, on non-home routes) canonical/og/twitter tags. Strip the static
      // fallback whenever a Helmet-managed (data-rh) version of the same tag exists.
      await page.evaluate(() => {
        const dropDuplicates = (selector, keyAttr) => {
          const managedKeys = new Set(
            Array.from(document.querySelectorAll(`${selector}[data-rh]`)).map((el) => el.getAttribute(keyAttr))
          );
          document.querySelectorAll(`${selector}:not([data-rh])`).forEach((el) => {
            if (managedKeys.has(el.getAttribute(keyAttr))) el.remove();
          });
        };
        dropDuplicates('link[rel="canonical"]', 'rel');
        dropDuplicates('meta[property^="og:"]', 'property');
        dropDuplicates('meta[property^="twitter:"]', 'property');
      });

      const html = await page.content();
      const rootHasContent = await page.evaluate(() => {
        const root = document.getElementById('root');
        return !!root && root.children.length > 0;
      });

      const outDir = path === '/' ? distDir : join(distDir, path);
      mkdirSync(outDir, { recursive: true });
      writeFileSync(join(outDir, 'index.html'), html);

      results.push({ path, ok: rootHasContent && helmetCommitted, rootHasContent, helmetCommitted, consoleErrors });
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\nPrerender results:');
  let anyFailed = false;
  for (const r of results) {
    const issues = [];
    if (!r.rootHasContent) issues.push('empty root');
    if (!r.helmetCommitted) issues.push('Helmet tags never committed');
    if (r.consoleErrors.length) issues.push(`${r.consoleErrors.length} console error(s)`);
    const status = issues.length === 0 ? 'OK' : `FAILED (${issues.join(', ')})`;
    console.log(`  ${r.path} — ${status}`);
    r.consoleErrors.forEach((e) => console.log(`      ${e}`));
    if (issues.length) anyFailed = true;
  }

  if (anyFailed) {
    console.error('\nPrerender spike found issues — see above. Not treating as a clean pass.');
    process.exit(1);
  } else {
    console.log('\nAll routes prerendered cleanly: root content present, Helmet tags committed, no console errors.');
  }
}

main();
