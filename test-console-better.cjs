const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', async msg => {
    const args = await Promise.all(msg.args().map(a => a.jsonValue().catch(() => a.toString())));
    console.log('CONSOLE', msg.type(), ...args);
  });
  page.on('pageerror', error => console.log('PAGEERROR:', error));
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
