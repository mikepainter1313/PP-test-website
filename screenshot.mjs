import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/micha/AppData/Local/Temp/puppeteer-test/node_modules/puppeteer/lib/cjs/puppeteer/puppeteer.js');
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotDir = join(__dirname, 'temporary screenshots');

if (!existsSync(screenshotDir)) mkdirSync(screenshotDir, { recursive: true });

// Auto-increment screenshot number
const existing = existsSync(screenshotDir)
  ? readdirSync(screenshotDir).filter(f => f.endsWith('.png')).map(f => {
      const m = f.match(/^screenshot-(\d+)/);
      return m ? parseInt(m[1]) : 0;
    })
  : [];
const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] ? `-${process.argv[3]}` : '';
const filename = `screenshot-${nextNum}${label}.png`;
const outPath = join(screenshotDir, filename);

const browser = await puppeteer.launch({
  headless: 'new',
  args: [
    '--no-sandbox', '--disable-setuid-sandbox',
    '--disable-extensions', '--disable-spell-checking',
    '--disable-features=Translate,PageContentAnnotations,LensOverlay,TextSuggestions,SpellcheckService,AutofillEnableAccountWalletStorage',
    '--lang=en-GB',
  ],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

// Force all fade-in elements visible (IntersectionObserver won't fire reliably in headless)
await page.evaluate(() => {
  document.querySelectorAll('.fi').forEach(el => {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.transition = 'none';
  });
  // Clear any text selection from scrolling
  if (window.getSelection) window.getSelection().removeAllRanges();
});

// Allow fonts and layout to settle
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Saved: temporary screenshots/${filename}`);
