import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('console', (msg) => console.log('[console]', msg.type(), msg.text()));
page.on('pageerror', (err) => console.log('[pageerror]', err.message));
page.on('requestfailed', (req) => console.log('[requestfailed]', req.url(), req.failure()?.errorText));

await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);

const rootText = await page.locator('#root').innerText().catch(() => '');
const bodyHtml = await page.locator('body').innerHTML();
console.log('[rootText]', rootText.slice(0, 500));
console.log('[bodySnippet]', bodyHtml.slice(0, 500));

await page.screenshot({ path: '/tmp/grace-pw.png', fullPage: true });
console.log('[screenshot]', '/tmp/grace-pw.png');

await browser.close();
