# Booking Flow Automation Test

This project automates the booking flow for the MSC Cruises UAT site, checking for expected dataLayer events, logging errors, and taking screenshots of each step.

## How to Use

1. **Install Node.js:**  
   Download and install from [nodejs.org](https://nodejs.org).

2. **Clone or Download this repository:**  
   Click "Code" > "Download ZIP" and extract the files.

3. **Install dependencies:**  
   In your terminal/command prompt, navigate to the folder and run:  
   ```
   npm install puppeteer json2csv
   ```

4. **Edit `config.json` as needed:**  
   Update selectors, field values, or expected events to match your site.

5. **Run the test:**  
   ```
   node check_datalayer_events.js
   ```

6. **View results:**  
   - See `results.json` and `results.csv` for a report.
   - See the `screenshots/` folder for screenshots of each step.

## What does it do?

- Goes step-by-step through the booking flow, clicking buttons and filling fields.
- Checks the presence of expected dataLayer events after each step.
- Logs missing events as errors, but continues testing.
- Takes screenshots at every step for debugging.
- Saves a summary report as both JSON and CSV.

## Customizing

- All steps, selectors, inputs, and expected events are set in `config.json`.
- If you need to add or change steps, simply edit `config.json`.

## Troubleshooting

- If selectors change, update them in `config.json`.
- If the script fails to find a selector, check the screenshot for that step.
- Review errors and missing events in `results.json` and `results.csv`.

## License

MIT
