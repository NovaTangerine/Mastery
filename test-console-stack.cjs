const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.evaluateOnNewDocument(() => {
    window.__errors = [];
    window.addEventListener('error', e => window.__errors.push(e.message + '\n' + e.error?.stack));
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  const errors = await page.evaluate(() => window.__errors);
  console.log('CAPTURED ERRORS:\n', errors.join('\n---\n'));
  
  await browser.close();
})();
