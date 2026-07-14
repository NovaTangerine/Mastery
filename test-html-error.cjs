const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  const hasError = await page.evaluate(() => {
    const el = document.getElementById('error-log');
    return el ? el.innerHTML : 'NOT FOUND';
  });
  console.log('ERROR LOG CONTENT:', hasError);
  
  await browser.close();
})();
