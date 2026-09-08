/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroBannerParser from './parsers/hero-banner.js';
import cardsTeaserParser from './parsers/cards-teaser.js';
import tabsEventsParser from './parsers/tabs-events.js';
import columnsMediaParser from './parsers/columns-media.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/aumovio-cleanup.js';
import dmImagesTransformer from './transformers/aumovio-dm-images.js';

// PARSER REGISTRY - Map parser names to functions
const parsers = {
  'hero-banner': heroBannerParser,
  'cards-teaser': cardsTeaserParser,
  'tabs-events': tabsEventsParser,
  'columns-media': columnsMediaParser,
};

// TRANSFORMER REGISTRY - Array of transformer functions
// cleanup runs first (removes cookie banner/header/footer), then DM image rewrite.
const transformers = [
  cleanupTransformer,
  dmImagesTransformer,
];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'home',
  description: 'AUMOVIO homepage',
  urls: [
    'https://www.aumovio.com/en.html',
  ],
  blocks: [
    {
      name: 'hero-banner',
      instances: ['.stage.teaser', '.bannerteaser.teaser'],
    },
    {
      name: 'cards-teaser',
      instances: ['.teasercards'],
    },
    {
      name: 'tabs-events',
      instances: ['.eventsteaser'],
    },
    {
      name: 'columns-media',
      instances: ['div.maincontainer.container.responsivegrid:nth-of-type(7) div.cmp-container > div.columncontrol'],
    },
  ],
};

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - The hook name ('beforeTransform' or 'afterTransform')
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - The payload containing { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

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
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
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

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
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

    // 4. Execute afterTransform transformers (final cleanup + DM image rewrite)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path. Map the root/homepage URL to `/index`
    //    to avoid the bundled importer's empty-path crash.
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
