const puppeteer = require('puppeteer');
const config = require('./config.json');
const fs = require('fs');
const path = require('path');
const { parse } = require('json2csv');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  let results = [];

  // Utility for screenshots
  async function takeScreenshot(stepIdx, stepName) {
    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir);
    const filename = `${stepIdx + 1}_${stepName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    await page.screenshot({ path: path.join(screenshotDir, filename), fullPage: true });
  }

  // Start booking flow
  await page.goto(config.steps[0].url, { waitUntil: 'networkidle2' });
  await takeScreenshot(0, config.steps[0].description);

  for (let i = 0; i < config.steps.length; i++) {
    const step = config.steps[i];
    let stepResult = {
      step: i + 1,
      description: step.description,
      action: step.action,
      selector: step.selector || "",
      inputs: step.inputs || {},
      expectedEvents: step.expectedEvents,
      foundEvents: [],
      missingEvents: [],
      screenshot: "",
      errors: []
    };

    // Perform the action (click, fill, etc)
    try {
      if (step.action === "click" && step.selector) {
        await page.waitForSelector(step.selector, { timeout: 10000 });
        await page.click(step.selector);
      }
      if (step.action === "fill" && step.inputs) {
        for (const [selector, value] of Object.entries(step.inputs)) {
          await page.waitForSelector(selector, { timeout: 10000 });
          await page.type(selector, value, { delay: 30 });
        }
      }
      // For filling AND clicking (e.g., forms with submit button)
      if (step.action === "fill_and_click" && step.inputs && step.selector) {
        for (const [selector, value] of Object.entries(step.inputs)) {
          await page.waitForSelector(selector, { timeout: 10000 });
          await page.type(selector, value, { delay: 30 });
        }
        await page.waitForSelector(step.selector, { timeout: 10000 });
        await page.click(step.selector);
      }
      // For entering card data (test payment popup)
      if (step.action === "payment" && step.inputs) {
        for (const [selector, value] of Object.entries(step.inputs)) {
          await page.waitForSelector(selector, { timeout: 10000 });
          await page.type(selector, value, { delay: 30 });
        }
        if (step.selector) {
          await page.waitForSelector(step.selector, { timeout: 10000 });
          await page.click(step.selector);
        }
      }
    } catch (err) {
      stepResult.errors.push(`Action error: ${err.message}`);
    }

    // Wait for possible event triggers
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Usage:
await wait(step.waitAfter || 2000);

    // Take screenshot
    await takeScreenshot(i, step.description);
    stepResult.screenshot = `screenshots/${i + 1}_${step.description.replace(/[^a-zA-Z0-9]/g, '_')}.png`;

    // Check dataLayer events
    try {
      const dataLayer = await page.evaluate(() => window.dataLayer || []);
      const foundEvents = [];
      for (const expectedEvent of step.expectedEvents) {
        // Simple string match for "event" or object match for advanced events
        let found = false;
        for (const dlEvent of dataLayer) {
          if (typeof expectedEvent === "string" && dlEvent.event === expectedEvent) {
            found = true;
            break;
          }
          // If expectedEvent is an object, match all key/value pairs
          if (typeof expectedEvent === "object") {
            let match = true;
            for (const [key, val] of Object.entries(expectedEvent)) {
              if (dlEvent[key] !== val) {
                match = false;
                break;
              }
            }
            if (match) {
              found = true;
              break;
            }
          }
        }
        if (found) foundEvents.push(expectedEvent);
        else stepResult.missingEvents.push(expectedEvent);
      }
      stepResult.foundEvents = foundEvents;
    } catch (err) {
      stepResult.errors.push(`dataLayer error: ${err.message}`);
    }

    results.push(stepResult);
  }

  await browser.close();

  // Save results as JSON
  fs.writeFileSync('results.json', JSON.stringify(results, null, 2));
  // Save results as CSV
  const csv = parse(results, { fields: ['step', 'description', 'action', 'selector', 'inputs', 'expectedEvents', 'foundEvents', 'missingEvents', 'screenshot', 'errors'] });
  fs.writeFileSync('results.csv', csv);

  // Log summary to console
  for (const r of results) {
    if (r.missingEvents.length) {
      console.log(`Step ${r.step}: Missing events:`, r.missingEvents);
    } else {
      console.log(`Step ${r.step}: All expected events found.`);
    }
    if (r.errors.length) {
      console.warn(`Step ${r.step}: Errors:`, r.errors);
    }
  }
  console.log('Test completed. See results.json, results.csv, and screenshots/ for details.');
})();
