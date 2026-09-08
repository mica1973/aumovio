#!/usr/bin/env node
/*
 * Post-import cleanup: strip leaked client-side-rendering comment nodes from the
 * generated content/*.plain.html files.
 *
 * WHY THIS EXISTS
 * The aumovio.com source is a Lit/web-component SPA whose DOM is littered with
 * empty `<!---->` markers and Lit template markers (`<!--?lit$123$-->`). These
 * are NOT strippable at the transformer stage — the bulk-import serializer
 * (helix-html2md) re-emits them into the final .plain.html. When the xwalk
 * conversion (helix-md2jcr) then processes that markup, every such comment
 * becomes a raw `html`-type node and md2jcr throws:
 *   "Element 'html' is currently not supported. Please open an issue..."
 *
 * The excat field hints (`<!-- field:image -->`, `<!-- field:text -->`, etc.)
 * MUST be preserved — md2jcr relies on them to map cells to block model fields.
 *
 * USAGE (run after run-bulk-import.js):
 *   node tools/importer/strip-leaked-comments.js
 *   # or target specific files:
 *   node tools/importer/strip-leaked-comments.js content/en.plain.html
 */

import fs from 'node:fs';
import { join } from 'node:path';

// Remove any HTML comment that is NOT an excat field hint (`<!-- field:… -->`).
const LEAKED_COMMENT = /<!--(?!\s*field:)[\s\S]*?-->/g;

function collectPlainHtml(dir) {
  return fs.readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (fs.statSync(full).isDirectory()) return collectPlainHtml(full);
    return entry.endsWith('.plain.html') ? [full] : [];
  });
}

const args = process.argv.slice(2);
const files = args.length ? args : collectPlainHtml('content');

let totalRemoved = 0;
files.forEach((file) => {
  const html = fs.readFileSync(file, 'utf8');
  const before = (html.match(/<!--/g) || []).length;
  const cleaned = html.replace(LEAKED_COMMENT, '');
  const after = (cleaned.match(/<!--/g) || []).length;
  if (after !== before) {
    fs.writeFileSync(file, cleaned);
    totalRemoved += before - after;
    // eslint-disable-next-line no-console
    console.log(`${file}: removed ${before - after} leaked comment(s), kept ${after} field hint(s)`);
  }
});
// eslint-disable-next-line no-console
console.log(`Done. Stripped ${totalRemoved} leaked comment(s) across ${files.length} file(s).`);
