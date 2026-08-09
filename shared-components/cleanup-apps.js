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

  // Remove Clienvora header HTML
  const headerStart = html.indexOf('<!--CLIENVORA_HEADER-->');
  if (headerStart !== -1) {
    const headerEnd = html.indexOf('</script>', headerStart);
    if (headerEnd !== -1) {
      const scriptEnd = headerEnd + 9;
      html = html.slice(0, headerStart) + html.slice(scriptEnd);
      modified = true;
    }
  }

  // Remove Clienvora footer HTML
  const footerStart = html.indexOf('<!--CLIENVORA_FOOTER-->');
  if (footerStart !== -1) {
    const bodyClose = html.lastIndexOf('</body>');
    if (bodyClose !== -1 && bodyClose > footerStart) {
      html = html.slice(0, footerStart) + html.slice(bodyClose);
      modified = true;
    }
  }

  // Remove CSS links
  const headerCssLink = `<link rel="stylesheet" href="../../shared-components/header.css">`;
  const footerCssLink = `<link rel="stylesheet" href="../../shared-components/footer.css">`;
  if (html.includes(headerCssLink)) {
    html = html.replace(headerCssLink + '\n', '').replace(headerCssLink, '');
    modified = true;
  }
  if (html.includes(footerCssLink)) {
    html = html.replace(footerCssLink + '\n', '').replace(footerCssLink, '');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(file, html, 'utf8');
    cleaned++;
    console.log(`CLEANED: ${rel}`);
  }
}

console.log(`\nDone. ${cleaned} app pages cleaned.`);
