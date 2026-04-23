const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// File paths
const QUEUE_FILE = path.join(__dirname, 'queue.json');
const VISITED_FILE = path.join(__dirname, 'visited.json');
const RESULTS_FILE = path.join(__dirname, 'results.json');

// Global state
let browser = null;
let queue = [];
let visited = new Set();
let results = [];
let resultsLinks = new Set(); // Track unique links in results for dedup
let stats = { processed: 0, found: 0, errors: 0 };

// ============================================================
// MAIN - Start crawling
// ============================================================
async function main() {
  console.log('🚀 Starting Slash Crawler...\n');
  
  // Load existing data if resuming
  loadData();
  
  // Initialize queue from sitemap if empty
  if (queue.length === 0) {
    console.log('📋 Fetching sitemap URLs...');
    queue = await fetchSitemaps();
    saveData();
    console.log(`   Found ${queue.length} URLs from sitemap\n`);
  }
  
  // Start browser
  console.log('🌐 Launching browser...');
  browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });
  console.log('   Browser ready!\n');
  
  // Process queue
  console.log(`📊 Queue: ${queue.length} URLs | Visited: ${visited.size}`);
  
  const startTime = Date.now();
  let lastSave = Date.now();
  
  while (queue.length > 0) {
    const url = queue.shift();
    
    // Skip if already visited
    if (visited.has(url)) {
      continue;
    }
    
    try {
      // Process URL
      await processURL(url);
      visited.add(url);
      stats.processed++;
      
      // Rate limiting
      await sleep(1000 / config.RATE_LIMIT);
      
    } catch (e) {
      console.error(`   ❌ Error: ${url} - ${e.message}`);
      visited.add(url);
      stats.errors++;
    }
    
    // Progress every 100 URLs
    if (stats.processed % 100 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (stats.processed / elapsed).toFixed(1);
      console.log(`   📈 ${stats.processed} processed | ${rate}/sec | Queue: ${queue.length} | Results: ${results.length}`);
    }
    
    // Save progress every BATCH_SIZE
    if (stats.processed % config.BATCH_SIZE === 0) {
      saveData();
      console.log('   💾 Progress saved');
    }
  }
  
  // Final save
  saveData();
  
  // Close browser
  await browser.close();
  
  // Summary
  console.log('\n✅ Crawl Complete!');
  console.log(`   Processed: ${stats.processed}`);
  console.log(`   Results: ${results.length}`);
  console.log(`   Errors: ${stats.errors}`);
  console.log(`\n   Results saved to: ${RESULTS_FILE}`);
}

// ============================================================
// Fetch URLs from sitemaps
// ============================================================
async function fetchSitemaps() {
  const urls = [];
  
  for (const sitemapUrl of config.SITEMAPS) {
    try {
      const response = await fetch(sitemapUrl);
      const xml = await response.text();
      
      // Parse URLs from XML
      const urlMatches = xml.match(/<loc>([^<]+)<\/loc>/g);
      if (urlMatches) {
        for (const match of urlMatches) {
          const url = match.replace(/<\/?loc>/g, '');
          if (url.startsWith(config.DOMAIN)) {
            urls.push(url);
          }
        }
      }
      console.log(`   ✓ ${sitemapUrl}: ${urlMatches ? urlMatches.length : 0} URLs`);
    } catch (e) {
      console.error(`   ❌ ${sitemapUrl}: ${e.message}`);
    }
  }
  
  return urls;
}

// ============================================================
// Process single URL - extract links and check slash issues
// ============================================================
async function processURL(url) {
  const page = await browser.newPage();
  
  try {
    // Navigate to URL
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Get all links from the page
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors.map(a => a.href);
    });
    
    // Process each link
    for (const link of links) {
      // Skip external links
      if (!link.startsWith(config.DOMAIN)) continue;
      
      // Skip anchor links (#)
      if (link.includes('#')) continue;
      
      // Skip already visited
      if (visited.has(link)) continue;
      
      // Check for slash issues
      const issue = checkSlashIssue(link);
      if (issue) {
        // Deduplicate - only add if not already in results
        if (!resultsLinks.has(link)) {
          results.push({
            source: url,
            link: link,
            type: issue.type,
            detail: issue.detail,
            timestamp: new Date().toISOString()
          });
          resultsLinks.add(link);
          stats.found++;
        }
      }
      
      // Add new URLs to queue
      if (!visited.has(link) && !queue.includes(link)) {
        queue.push(link);
      }
    }
    
  } finally {
    await page.close();
  }
}

// ============================================================
// Check if URL is missing trailing slash
// ============================================================
function checkSlashIssue(url) {
  try {
    // Skip if URL has # (anchor links)
    if (url.includes('#')) return null;
    
    // Parse URL
    const urlObj = new URL(url);
    let pathname = urlObj.pathname;
    
    // Remove query string
    pathname = pathname.split('?')[0];
    
    // Skip files (has file extension like .html, .php, etc.)
    const filename = pathname.split('/').pop();
    if (filename.includes('.')) return null;
    
    // Skip URLs that already have trailing slash (these are correct!)
    if (pathname.endsWith('/')) return null;
    
    // This URL is MISSING trailing slash - this is the issue!
    return {
      type: 'MISSING_TRAILING_SLASH',
      detail: `Path "${pathname}" should end with /`
    };
    
  } catch (e) {
    return null;
  }
}

// ============================================================
// Data persistence
// ============================================================
function loadData() {
  // Load queue
  if (fs.existsSync(QUEUE_FILE)) {
    queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
  }
  
  // Load visited
  if (fs.existsSync(VISITED_FILE)) {
    const visitedArray = JSON.parse(fs.readFileSync(VISITED_FILE, 'utf8'));
    visited = new Set(visitedArray);
  }
  
  // Load results
  if (fs.existsSync(RESULTS_FILE)) {
    results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
    // Also populate resultsLinks for dedup
    for (const r of results) {
      resultsLinks.add(r.link);
    }
  }
  
  // Load stats
  stats.processed = visited.size;
  stats.found = results.length;
}

function saveData() {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  fs.writeFileSync(VISITED_FILE, JSON.stringify([...visited], null, 2));
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
}

// ============================================================
// Utils
// ============================================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run
main().catch(e => {
  console.error('Fatal error:', e);
  if (browser) browser.close();
  process.exit(1);
});