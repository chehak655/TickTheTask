const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Go to the local dev server
  await page.goto('http://localhost:5173/TickTheTask/register');
  
  // We need to trigger the navigate manually. 
  // Let's execute some JS on the page.
  // Wait, we need to interact with the React app to trigger navigate.
  
  await browser.close();
})();
