import { SamplePreset, BulkSamplePreset } from '../types';

export const DEFAULT_SINGLE_SAMPLE: SamplePreset = {
  id: 'ecommerce-audit-issues',
  title: 'E-commerce Product (Multi-Issue Audit)',
  description: 'Contains invalid <body> placement, relative URL, tracking parameters, and meta robots conflict.',
  badge: 'Multi-Issue Error',
  pageUrl: 'https://www.lumina-style.com/apparel/leather-jacket?utm_source=google&utm_medium=cpc&sessionid=849201',
  headers: `HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
Link: <https://www.lumina-style.com/products/leather-jacket>; rel="canonical"
Server: nginx/1.24.0`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Classic Leather Biker Jacket - Lumina Style</title>
  <meta name="description" content="Premium handcrafted genuine leather jacket for men and women.">
  <meta name="robots" content="noindex, follow">
  
  <!-- INTENTIONAL ISSUE 1: Relative Canonical inside Head -->
  <link rel="canonical" href="/products/classic-leather-jacket" />
  
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <h1>Classic Leather Biker Jacket</h1>
  
  <!-- INTENTIONAL ISSUE 2: Duplicate Canonical Tag placed outside <head> in <body> -->
  <link rel="canonical" href="https://www.lumina-style.com/apparel/leather-jacket" />
  
  <p>Crafted from full-grain leather with heavy-duty brass zippers.</p>
  <div class="price">$299.00</div>
</body>
</html>`
};

export const SAMPLE_PRESETS: SamplePreset[] = [
  DEFAULT_SINGLE_SAMPLE,
  {
    id: 'staging-cross-domain',
    title: 'Staging Environment Misconfiguration',
    description: 'Staging site canonicalized to itself instead of production domain, causing index leakage.',
    badge: 'Cross-Domain',
    pageUrl: 'https://staging.acmeshoes.shop/mens/running-shoe',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Men's Pro Running Shoes - Acme Staging</title>
  <!-- INTENTIONAL ISSUE: Staging canonical points to staging instead of production domain -->
  <link rel="canonical" href="https://staging.acmeshoes.shop/mens/running-shoe" />
</head>
<body>
  <h1>Men's Pro Running Shoes</h1>
</body>
</html>`
  },
  {
    id: 'paginated-legacy-pattern',
    title: 'Paginated Category Page (?page=3)',
    description: 'Paginated page canonicalized back to Page 1, de-indexing page 2+ products.',
    badge: 'Pagination Legacy',
    pageUrl: 'https://www.techgear.io/laptops?page=3',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Laptops & Notebooks - Page 3 - TechGear</title>
  <link rel="prev" href="https://www.techgear.io/laptops?page=2" />
  <link rel="next" href="https://www.techgear.io/laptops?page=4" />
  
  <!-- INTENTIONAL ISSUE: Canonical points back to page 1 instead of self-referencing page 3 -->
  <link rel="canonical" href="https://www.techgear.io/laptops" />
</head>
<body>
  <h1>High Performance Laptops (Page 3)</h1>
</body>
</html>`
  },
  {
    id: 'hreflang-master-conflict',
    title: 'International Multilingual Conflict',
    description: 'French locale canonicalizes to English master URL, destroying international SEO.',
    badge: 'International Conflict',
    pageUrl: 'https://www.globalshop.com/fr/chaussures',
    html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Chaussures de Sport - GlobalShop France</title>
  <link rel="alternate" hreflang="en" href="https://www.globalshop.com/en/shoes" />
  <link rel="alternate" hreflang="fr" href="https://www.globalshop.com/fr/chaussures" />
  <link rel="alternate" hreflang="es" href="https://www.globalshop.com/es/zapatos" />
  
  <!-- INTENTIONAL ISSUE: French variant canonicalizes to English URL instead of self-referencing -->
  <link rel="canonical" href="https://www.globalshop.com/en/shoes" />
</head>
<body>
  <h1>Chaussures de Sport</h1>
</body>
</html>`
  },
  {
    id: 'multiple-conflicting-tags',
    title: 'Multiple Conflicting Canonical Tags',
    description: 'Page contains 2 conflicting tags in HTML plus 1 conflicting tag in HTTP response header.',
    badge: 'Hard Error',
    pageUrl: 'https://www.newsblog.org/articles/ai-trends-2026',
    headers: `HTTP/1.1 200 OK
Link: <https://www.newsblog.org/news/ai-trends>; rel="canonical"`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Top AI Trends for 2026 - NewsBlog</title>
  <!-- INTENTIONAL ISSUE: Multiple conflicting canonical tags in same head -->
  <link rel="canonical" href="https://www.newsblog.org/articles/ai-trends-2026" />
  <link rel="canonical" href="https://www.newsblog.org/tech/ai-2026-report" />
</head>
<body>
  <h1>Top AI Trends for 2026</h1>
</body>
</html>`
  },
  {
    id: 'healthy-clean-canonical',
    title: 'Healthy Self-Referencing Canonical Page',
    description: 'Perfect implementation: absolute self-referencing URL, clean parameters, valid head placement.',
    badge: 'Pass Reference',
    pageUrl: 'https://www.optimizeseo.com/guides/canonical-tags-explained',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Complete Guide to Canonical Tags - OptimizeSEO</title>
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://www.optimizeseo.com/guides/canonical-tags-explained" />
</head>
<body>
  <h1>Complete Guide to Canonical Tags</h1>
  <p>Learn how search engines process rel=canonical hints.</p>
</body>
</html>`
  }
];

export const BULK_SAMPLE_PRESET: BulkSamplePreset = {
  id: 'ecommerce-section-audit',
  title: 'E-commerce Section Audit (5 Pages)',
  description: 'Audits variant clustering, canonical chains, orphaned targets, and duplicate titles without canonicals.',
  pages: [
    {
      url: 'https://shop.nexus.com/shoes/running-red',
      html: `<!DOCTYPE html>
<html>
<head>
  <title>Nexus Air Max Pro - Red Colorway</title>
  <link rel="canonical" href="https://shop.nexus.com/shoes/running-master" />
</head>
<body>
  <h1>Nexus Air Max Pro Shoes</h1>
</body>
</html>`
    },
    {
      url: 'https://shop.nexus.com/shoes/running-blue',
      html: `<!DOCTYPE html>
<html>
<head>
  <title>Nexus Air Max Pro - Blue Colorway</title>
  <link rel="canonical" href="https://shop.nexus.com/shoes/running-master" />
</head>
<body>
  <h1>Nexus Air Max Pro Shoes</h1>
</body>
</html>`
    },
    {
      url: 'https://shop.nexus.com/shoes/running-master',
      html: `<!DOCTYPE html>
<html>
<head>
  <title>Nexus Air Max Pro - Master Product</title>
  <link rel="canonical" href="https://shop.nexus.com/shoes/running-master" />
</head>
<body>
  <h1>Nexus Air Max Pro Shoes</h1>
</body>
</html>`
    },
    {
      url: 'https://shop.nexus.com/shoes/marathon-shoe',
      html: `<!DOCTYPE html>
<html>
<head>
  <title>Nexus Marathon Shoe - Ultra Light</title>
  <!-- INTENTIONAL CHAIN ISSUE: Points to running-red, which itself points to running-master -->
  <link rel="canonical" href="https://shop.nexus.com/shoes/running-red" />
</head>
<body>
  <h1>Nexus Marathon Shoe</h1>
</body>
</html>`
    },
    {
      url: 'https://shop.nexus.com/shoes/trail-blazer',
      html: `<!DOCTYPE html>
<html>
<head>
  <title>Nexus Trail Blazer Hiking Shoe</title>
  <!-- INTENTIONAL ORPHAN ISSUE: Points to mountain-pro which was never included in audit batch -->
  <link rel="canonical" href="https://shop.nexus.com/shoes/mountain-pro-2026" />
</head>
<body>
  <h1>Nexus Trail Blazer Hiking Shoe</h1>
</body>
</html>`
    }
  ]
};
