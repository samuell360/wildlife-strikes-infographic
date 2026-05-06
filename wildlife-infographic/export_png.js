import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set a standard wide viewport; we will scroll to trigger everything naturally.
  await page.setViewport({ width: 1400, height: 1080, deviceScaleFactor: 2 });
  
  console.log('Navigating to local server...');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  
  console.log('Smooth scrolling to bottom to trigger all IntersectionObservers...');
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 150; // Scroll by 150px
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        
        if(totalHeight >= scrollHeight - window.innerHeight){
          clearInterval(timer);
          resolve();
        }
      }, 50); // every 50ms
    });
  });

  console.log('Waiting 4 seconds for all D3 transitions to finalize...');
  await new Promise(r => setTimeout(r, 4000));
  
  // Scroll back to top just in case
  await page.evaluate(() => window.scrollTo(0, 0));

  console.log('Capturing full-page high-resolution PNG...');
  await page.screenshot({ path: 'Final_Infographic.png', fullPage: true });
  
  console.log('Capturing continuous PDF...');
  const bodyHandle = await page.$('body');
  const boundingBox = await bodyHandle.boundingBox();
  await page.pdf({ 
    path: 'Final_Infographic.pdf', 
    width: `${Math.ceil(boundingBox.width)}px`,
    height: `${Math.ceil(boundingBox.height)}px`,
    printBackground: true 
  });
  
  await browser.close();
  console.log('Done! Saved Final_Infographic.png and Final_Infographic.pdf');
})();
