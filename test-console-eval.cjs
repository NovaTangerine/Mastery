const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.evaluateOnNewDocument(() => {
    window.__errors = [];
    window.addEventListener('error', e => window.__errors.push(e.message + ' ' + e.filename + ':' + e.lineno + ':' + e.colno + '\n' + e.error?.stack));
    window.addEventListener('unhandledrejection', e => window.__errors.push(e.reason?.message + '\n' + e.reason?.stack));
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  const errors = await page.evaluate(() => window.__errors);
  console.log('CAPTURED ERRORS:', errors);
  
  await browser.close();
})();
