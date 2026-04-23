# SLASH CRAWLER - Node.js Setup Guide

## What This Does
Uses Puppeteer (headless Chrome) to:
- Render JavaScript on your pages
- Extract ALL internal links (including JS-rendered ones)
- Find links missing trailing slash `/`
- Auto-save progress every 100 URLs
- Resume from where it stopped

**Speed:** ~30 URLs/sec = ~100K URLs/day

---

## STEP 1: Install Dependencies

1. Open terminal/command prompt:
```bash
cd %USERPROFILE%\Desktop\slash-crawler-node
```

2. Install puppeteer:
```bash
npm install
```

> **Note:** First time install downloads Chrome (~200MB). Be patient.

---

## STEP 2: Configure (IMPORTANT)

Open `config.js` in a text editor:

```javascript
module.exports = {
  DOMAIN: 'https://designwiz.com',  // ← Your domain (already set)
  
  RATE_LIMIT: 30,                  // 30 URLs/sec (already set)
  
  SITEMAPS: [
    'https://designwiz.com/sitemap-template.xml',
    'https://designwiz.com/sitemap-tools.xml',
    'https://designwiz.com/sitemap-design.xml',
    'https://designwiz.com/sitemap-other.xml'
    // Add more sitemaps here if needed
  ],
  
  // ... rest is fine
};
```

If you have more sitemaps, add them to the `SITEMAPS` array.

---

## STEP 3: Initialize Files

```bash
npm run setup
```

This creates:
- `queue.json` - URLs waiting to be crawled
- `visited.json` - Already crawled URLs
- `results.json` - Links with missing `/` issues

---

## STEP 4: Run Crawler

```bash
npm start
```

---

## STEP 5: Monitor Progress

### While Running
You'll see output like:
```
🚀 Starting Slash Crawler...

📋 Fetching sitemap URLs...
   ✓ https://designwiz.com/sitemap-template.xml: 5000 URLs
   ✓ https://designwiz.com/sitemap-tools.xml: 15 URLs

🌐 Launching browser...
   Browser ready!

📊 Queue: 5015 URLs | Visited: 0
   📈 100 processed | 28.5/sec | Queue: 4900 | Results: 12
   💾 Progress saved
   📈 200 processed | 30.1/sec | Queue: 4750 | Results: 45
   ...
```

### Stop Any Time
Press `Ctrl + C` to stop. Progress is saved automatically.

### Resume Later
Just run `npm start` again - it picks up from where it stopped.

---

## STEP 6: View Results

When complete (or anytime), check `results.json`:

```bash
type results.json
```

Or open in any text editor.

### Results Format
```json
[
  {
    "source": "https://designwiz.com/flyer/templates/",
    "link": "https://designwiz.com/flyer/templates/business",
    "type": "MISSING_TRAILING_SLASH",
    "detail": "Path \"/flyer/templates/business\" should end with /",
    "timestamp": "2026-04-23T12:34:56.789Z"
  },
  ...
]
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Maximum concurrent connections" | Reduce `RATE_LIMIT` in config.js to 20 or 10 |
| "Timeout" errors | Increase timeout in crawl.js line ~120 |
| Chrome download fails | Run: `npm install puppeteer --ignore-scripts` then manually install Chrome |
| Out of memory | Reduce `MAX_CONCURRENT` in config.js to 2 or 1 |

---

## If It Stops Unexpectedly

Just run again - it auto-resumes:
```bash
npm start
```

---

## Full Commands Reference

| Command | What it does |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run setup` | Reset data files |
| `npm start` | Run crawler |
| `npm run clear` | Clear all data (if needed) |

---

## Expected Output Files

After running, you'll have:

| File | Description |
|------|-------------|
| `queue.json` | URLs to crawl (gets smaller as it runs) |
| `visited.json` | URLs already crawled (grows) |
| `results.json` | Found issues - missing slash (grows) |

---

## How Long to Complete?

With RATE_LIMIT = 30:

| Total URLs | Estimated Time |
|-----------|----------------|
| 100,000 | ~55 minutes |
| 200,000 | ~1.5 hours |

This is MUCH faster than Google Apps Script!

---

## After Complete

Once results.json has all issues:
1. Share file with your team
2. Fix links in your code
3. Re-run crawler to verify fixes

---

## Notes

- **Headless Mode:** Browser runs in background (no window)
- **Auto-Save:** Every 100 URLs
- **Resume:** Supports stopping and resuming anytime
- **Rate Limit:** 30 URLs/sec may be aggressive - if you get errors, reduce in config.js