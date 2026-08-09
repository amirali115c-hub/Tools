#!/usr/bin/env node
/**
 * inject-homepage-only.js — Injects Clienvora header & footer ONLY on homepage.
 * Run: node shared-components/inject-homepage-only.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SHARED = __dirname;

// Read shared components
const headerHTML = fs.readFileSync(path.join(SHARED, 'header.html'), 'utf8');
const footerHTML = fs.readFileSync(path.join(SHARED, 'footer.html'), 'utf8');

// Only target homepage
const homepagePath = path.join(ROOT, 'index.html');

if (!fs.existsSync(homepagePath)) {
  console.log('Homepage not found!');
  process.exit(1);
}

let html = fs.readFileSync(homepagePath, 'utf8');

// Skip if already injected
if (html.includes('<!--CLIENVORA_HEADER-->')) {
  console.log('SKIP: Already injected');
  process.exit(0);
}

// Inject CSS into <head>
const headEnd = html.indexOf('</head>');
if (headEnd === -1) {
  console.log('ERROR: No </head> found');
  process.exit(1);
}
const cssLinks = `  <link rel="stylesheet" href="./shared-components/header.css">\n  <link rel="stylesheet" href="./shared-components/footer.css">\n`;
html = html.slice(0, headEnd) + cssLinks + html.slice(headEnd);

// Inject header after <body>
const bodyTag = html.indexOf('<body>');
if (bodyTag === -1) {
  console.log('ERROR: No <body> found');
  process.exit(1);
}
const bodyEnd = bodyTag + 6;
html = html.slice(0, bodyEnd) + '\n<!--CLIENVORA_HEADER-->\n' + headerHTML + '\n' + html.slice(bodyEnd);

// Inject footer before </body>
const bodyClose = html.lastIndexOf('</body>');
if (bodyClose === -1) {
  console.log('ERROR: No </body> found');
  process.exit(1);
}
html = html.slice(0, bodyClose) + '<!--CLIENVORA_FOOTER-->\n' + footerHTML + '\n' + html.slice(bodyClose);

// Write back
fs.writeFileSync(homepagePath, html, 'utf8');
console.log('SUCCESS: Injected Clienvora header/footer on homepage only');
