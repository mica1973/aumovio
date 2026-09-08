#!/usr/bin/env node
/*
 * One-shot import wrapper: runs the bulk content import, then automatically
 * strips leaked SPA/Lit comments from the generated content so the xwalk
 * (md2jcr) conversion doesn't fail with "Element 'html' is currently not
 * supported". This is the automatic replacement for running the two steps by
 * hand — the strip can't be done earlier because the bulk-import serializer
 * (helix-html2md) re-emits the comments after all transformers/parsers run.
 *
 * USAGE:
 *   node tools/importer/import-and-clean.mjs --import-script <bundle.js> --urls <urls.txt>
 *   # any extra args are passed straight through to run-bulk-import.js
 *
 * The bulk-import script is resolved from EXCAT_BULK_IMPORT (full path to
 * run-bulk-import.js) when set, otherwise from the marketplace default.
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const DEFAULT_BULK_IMPORT = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/run-bulk-import.js';
const bulkImport = process.env.EXCAT_BULK_IMPORT || DEFAULT_BULK_IMPORT;

if (!existsSync(bulkImport)) {
  // eslint-disable-next-line no-console
  console.error(`run-bulk-import.js not found at "${bulkImport}". Set EXCAT_BULK_IMPORT to its path.`);
  process.exit(1);
}

const passthrough = process.argv.slice(2);

// 1) Run the bulk import.
const imp = spawnSync('node', [bulkImport, ...passthrough], { stdio: 'inherit' });
if (imp.status !== 0) process.exit(imp.status || 1);

// 2) Strip leaked comments from the generated content.
const strip = spawnSync('node', ['tools/importer/strip-leaked-comments.mjs'], { stdio: 'inherit' });
process.exit(strip.status || 0);
