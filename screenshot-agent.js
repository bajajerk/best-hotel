const { chromium } = require('playwright');

(async () => {
  const viewport = process.argv[2] || 'desktop';
  const sizes = {
    desktop: { width: 1440, height: 900 },
    tablet:  { width: 768,  height: 1024 },
    mobile:  { width: 375,  height: 812 }
  };
  const size = sizes[viewport] || sizes.desktop;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize(size);

  const urls = [
    { name: 'home', path: '/' },
    { name: 'city', path: '/city/bangkok' },
    { name: 'hotel', path: '/hotel/10666' },
  ];

  for (const { name, path } of urls) {
    await page.goto(process.env.DEV_URL + path, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    const file = `screenshot-${name}-${viewport}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(`Saved: ${file}`);
  }

  await browser.close();
})();
