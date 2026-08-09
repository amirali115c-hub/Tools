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
let cleaned = 0;

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);

  let modified = false;

  // Remove <footer id="cv-footer">...</footer> block
  const footerStart = html.indexOf('<footer id="cv-footer">');
  if (footerStart !== -1) {
    const footerEnd = html.indexOf('</footer>', footerStart);
    if (footerEnd !== -1) {
      html = html.slice(0, footerStart) + html.slice(footerEnd + 9);
      modified = true;
    }
  }

  // Remove <header id="clienvora-master-header">...</header> block (if present)
  const headerStart = html.indexOf('<header id="clienvora-master-header">');
  if (headerStart !== -1) {
    const headerEnd = html.indexOf('</header>', headerStart);
    if (headerEnd !== -1) {
      html = html.slice(0, headerStart) + html.slice(headerEnd + 9);
      modified = true;
    }
  }

  // Remove CSS links
  const cssLinks = [
    `<link rel="stylesheet" href="../../shared-components/header.css">`,
    `<link rel="stylesheet" href="../../shared-components/footer.css">`
  ];
  for (const link of cssLinks) {
    if (html.includes(link)) {
      html = html.replace(link + '\n', '').replace(link, '');
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(file, html, 'utf8');
    cleaned++;
    console.log(`CLEANED: ${rel}`);
  }
}

console.log(`\nDone. ${cleaned} app pages cleaned.`);
