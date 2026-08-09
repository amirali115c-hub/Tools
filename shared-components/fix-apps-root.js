#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function findAppFiles(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'shared-components' && entry.name !== '.git') {
      results = results.concat(findAppFiles(full));
    } else if (entry.name === 'index.html') {
      const rel = path.relative(ROOT, full);
      if (rel.includes('/app/index.html')) {
        results.push(full);
      }
    }
  }
  return results;
}

const files = findAppFiles(ROOT);
let fixed = 0;

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);

  // Find <body> and ensure it has <div id="root"></div>
  const bodyStart = html.indexOf('<body>');
  if (bodyStart !== -1) {
    const bodyEnd = bodyStart + 6;
    const afterBody = html.slice(bodyEnd);
    
    // Check if root div already exists
    if (!afterBody.trim().startsWith('<div id="root">')) {
      // Add root div after <body>
      html = html.slice(0, bodyEnd) + '\n  <div id="root"></div>\n' + afterBody;
      fs.writeFileSync(file, html, 'utf8');
      fixed++;
      console.log(`FIXED: ${rel} - added root div`);
    }
  }
}

console.log(`\nDone. ${fixed} app pages fixed.`);
