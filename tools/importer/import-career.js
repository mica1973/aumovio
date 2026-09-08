/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroBannerParser from './parsers/hero-banner.js';
import cardsTeaserParser from './parsers/cards-teaser.js';
import columnsMediaParser from './parsers/columns-media.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/aumovio-cleanup.js';
import dmImagesTransformer from './transformers/aumovio-dm-images.js';

// PARSER REGISTRY
const parsers = {
  'hero-banner': heroBannerParser,
  'cards-teaser': cardsTeaserParser,
  'columns-media': columnsMediaParser,
};

// TRANSFORMER REGISTRY - cleanup first (removes cookie banner/header/footer), then DM image rewrite.
const transformers = [
  cleanupTransformer,
  dmImagesTransformer,
];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (career)
const PAGE_TEMPLATE = {
  name: 'career',
  description: 'Career/content pages',
  urls: [
    'https://www.aumovio.com/en/career.html',
    'https://www.aumovio.com/en/company.html',
    'https://www.aumovio.com/en/solutions.html',
  ],
  blocks: [
    {
      name: 'hero-banner',
      instances: ['.stage.teaser'],
    },
    {
      name: 'cards-teaser',
      instances: [
        '#corporate_culture div.columncontrol:nth-of-type(2)',
        '#what_we_do div.columncontrol.aumovio-bottom-spacing--big',
        '.teasercards',
      ],
    },
    {
      name: 'columns-media',
      instances: ['.contentteaser.teaser'],
    },
  ],
};

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // Already replaced by earlier parser
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + DM image rewrite)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (map root to /index just in case)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
