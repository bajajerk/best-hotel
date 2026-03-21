const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  
  const deviceList = [
    { name: 'iPhone-14', config: devices['iPhone 14'] },
    { name: 'iPhone-14-Pro-Max', config: devices['iPhone 14 Pro Max'] },
    { name: 'Samsung-Galaxy-S23', config: { viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36', isMobile: true, hasTouch: true } },
    { name: 'iPad-Mini', config: devices['iPad Mini'] },
  ];

  const pages = [
    { name: 'home', path: '/' },
    { name: 'city', path: '/city/bangkok' },
    { name: 'hotel', path: '/hotel/10666' },
  ];

  for (const device of deviceList) {
    const ctx = await browser.newContext({ ...device.config });
    const page = await ctx.newPage();
    
    for (const pg of pages) {
      const url = process.env.DEV_URL + pg.path;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(1000);
        const file = `screenshot-${pg.name}-${device.name}.png`;
        await page.screenshot({ path: file, fullPage: true });
        console.log(`Saved: ${file}`);
      } catch(e) {
        console.log(`ERROR ${device.name}/${pg.name}: ${e.message}`);
      }
    }
    await ctx.close();
  }
  
  await browser.close();
  console.log('Done');
})();
