module.exports = {
  // Your domain to crawl
  DOMAIN: 'https://designwiz.com',
  
  // Rate limit: URLs per second
  // 30 URLs/sec = ~2,592,000 URLs/day (very fast!)
  // If you get errors, reduce to 20 or 10
  RATE_LIMIT: 30,
  
  // Batch size - how many URLs to process before saving progress
  BATCH_SIZE: 100,
  
  // Max concurrent tabs in browser
  MAX_CONCURRENT: 5,
  
  // Sitemap URLs to start from
  SITEMAPS: [
    'https://designwiz.com/sitemap-template.xml',
    'https://designwiz.com/sitemap-tools.xml',
    'https://designwiz.com/sitemap-design.xml',
    'https://designwiz.com/sitemap-other.xml'
  ],
  
  // URL patterns that need trailing slash
  // These patterns indicate a directory/page, not a file
  NEEDS_TRAILING_SLASH: [
    '/flyer/',
    '/poster/',
    '/templates/',
    '/tools/',
    '/design/',
    '/blog/',
    '/ai-',
    '/graph-',
    '/color-',
    '/font-'
  ],
  
  // Ignore these patterns
  IGNORE_PATTERNS: [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
    '.css', '.js', '.json',
    '.pdf', '.doc', '.docx'
  ]
};