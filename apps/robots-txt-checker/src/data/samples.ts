import { StarterTemplate } from '../types';

export const SAMPLE_ROBOTS_PRESETS = [
  {
    id: 'wordpress-nuanced',
    name: 'WordPress (Optimized)',
    description: 'Standard WP setup with admin disallowed and admin-ajax.php explicitly re-allowed.',
    content: `# WordPress Default robots.txt Configuration
User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php

# Block search and tag archives from crawl waste
Disallow: /?s=
Disallow: /search/

Sitemap: https://example.com/wp-sitemap.xml
`,
  },
  {
    id: 'shopify-store',
    name: 'Shopify E-Commerce',
    description: 'Realistic Shopify e-commerce rules for cart, orders, and checkout.',
    content: `# Shopify E-Commerce Store robots.txt
User-agent: *
Disallow: /admin
Disallow: /cart
Disallow: /orders
Disallow: /checkout
Disallow: /54980702/checkouts
Disallow: /carts
Disallow: /account
Disallow: /collections/*+*
Disallow: /collections/*%2B*
Disallow: /search

# Allow rendering assets
Allow: /assets/
Allow: /files/

# Specific rules for Googlebot-Image
User-agent: Googlebot-Image
Disallow: /private-gallery/

Sitemap: https://example.com/sitemap.xml
`,
  },
  {
    id: 'misconfigured-rendering-blocked',
    name: 'Misconfigured Site (Diagnostics Test)',
    description: 'Contains orphaned directives, blocked CSS/JS rendering, relative sitemaps, and syntax errors for testing.',
    content: `# CAUTION: This sample exhibits common real-world SEO mistakes!
Disallow: /orphaned-page # Orphaned directive before User-agent!

User-agent: *
Disallow: /wp-content/
Disallow: /*.css$
Disallow: /js/
Disallow: /cgi-bin/
Crawl-delay: 10
sitemap /invalid-relative-sitemap.xml
UnknownDirective: test

User-agent: Googlebot
Disallow: /private/
Allow: /private/public-demo/

Sitemap: relative-sitemap.xml
`,
  },
  {
    id: 'staging-blocked',
    name: 'Staging Environment (Site Blocked)',
    description: 'Blocks all crawlers completely with Disallow: /.',
    content: `# Staging Environment - Do Not Index
User-agent: *
Disallow: /
`,
  },
  {
    id: 'googlebot-vs-bingbot',
    name: 'Googlebot vs Bingbot Multi-Group',
    description: 'Demonstrates specific User-agent group selection and equal-length Allow vs Disallow ties.',
    content: `# Multi-User-Agent Group Rules
User-agent: Googlebot
Disallow: /products/
Allow: /products/shoes

User-agent: Bingbot
Disallow: /products/
Crawl-delay: 5

User-agent: *
Disallow: /internal/
Sitemap: https://example.com/sitemap.xml
`,
  },
];

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    key: 'wordpress',
    name: 'WordPress',
    description: 'Disallows /wp-admin/ while preserving /wp-admin/admin-ajax.php for frontend dynamic widgets.',
    sitemap: 'https://example.com/wp-sitemap.xml',
    content: `User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php
Disallow: /?s=

Sitemap: https://example.com/wp-sitemap.xml`,
    groups: [
      {
        userAgents: ['*'],
        rules: [
          { type: 'disallow', pattern: '/wp-admin/' },
          { type: 'allow', pattern: '/wp-admin/admin-ajax.php' },
          { type: 'disallow', pattern: '/?s=' },
        ],
      },
    ],
  },
  {
    key: 'shopify',
    name: 'Shopify',
    description: 'Protects cart, checkout, customer accounts, and internal search filters from crawl budget waste.',
    sitemap: 'https://example.com/sitemap.xml',
    content: `User-agent: *
Disallow: /cart
Disallow: /orders
Disallow: /checkout
Disallow: /account
Disallow: /search

Sitemap: https://example.com/sitemap.xml`,
    groups: [
      {
        userAgents: ['*'],
        rules: [
          { type: 'disallow', pattern: '/cart' },
          { type: 'disallow', pattern: '/orders' },
          { type: 'disallow', pattern: '/checkout' },
          { type: 'disallow', pattern: '/account' },
          { type: 'disallow', pattern: '/search' },
        ],
      },
    ],
  },
  {
    key: 'woocommerce',
    name: 'WooCommerce',
    description: 'Standard WooCommerce store setup blocking cart, checkout, and customer account endpoints.',
    sitemap: 'https://example.com/sitemap.xml',
    content: `User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php
Disallow: /cart/
Disallow: /checkout/
Disallow: /my-account/

Sitemap: https://example.com/sitemap.xml`,
    groups: [
      {
        userAgents: ['*'],
        rules: [
          { type: 'disallow', pattern: '/wp-admin/' },
          { type: 'allow', pattern: '/wp-admin/admin-ajax.php' },
          { type: 'disallow', pattern: '/cart/' },
          { type: 'disallow', pattern: '/checkout/' },
          { type: 'disallow', pattern: '/my-account/' },
        ],
      },
    ],
  },
  {
    key: 'staging',
    name: 'Staging / Block All',
    description: 'Strict block for development and staging environments to prevent accidental Google indexation.',
    content: `User-agent: *
Disallow: /`,
    groups: [
      {
        userAgents: ['*'],
        rules: [{ type: 'disallow', pattern: '/' }],
      },
    ],
  },
  {
    key: 'default',
    name: 'Minimal SEO Friendly',
    description: 'Clean permissive baseline protecting common admin and sensitive directories.',
    sitemap: 'https://example.com/sitemap.xml',
    content: `User-agent: *
Disallow: /admin/
Disallow: /private/
Disallow: /api/

Sitemap: https://example.com/sitemap.xml`,
    groups: [
      {
        userAgents: ['*'],
        rules: [
          { type: 'disallow', pattern: '/admin/' },
          { type: 'disallow', pattern: '/private/' },
          { type: 'disallow', pattern: '/api/' },
        ],
      },
    ],
  },
];
