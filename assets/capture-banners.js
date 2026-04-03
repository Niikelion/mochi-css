const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();

  const banners = [
    { src: 'mochi-css-banner.source.html', out: 'mochi-css-banner.png', w: 1280, h: 640 },
    { src: 'mochi-css-banner-wide.source.html', out: 'mochi-css-banner-wide.png', w: 2560, h: 640 },
  ];

  for (const { src, out, w, h } of banners) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.goto('file:///H:/projects/mochi-css/assets/' + src, { waitUntil: 'networkidle0' });
    // Wait for web fonts
    await new Promise(r => setTimeout(r, 1500));
    const el = await page.$('.banner');
    await el.screenshot({ path: 'H:/projects/mochi-css/assets/' + out, type: 'png' });
    console.log('wrote', out);
  }

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
