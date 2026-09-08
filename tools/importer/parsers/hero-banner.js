/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-banner. Base: hero-banner (xwalk simple block).
 * Sources:
 *   - Home  (https://www.aumovio.com/en.html): .stage.teaser (aumovio-stage),
 *           .bannerteaser.teaser (aumovio-banner).
 *   - Career (https://www.aumovio.com/en/career.html): .stage.teaser
 *           (#OwnWhatsNext key visual: bg image + h1 headline + "Find your job" CTA).
 *
 * The career hero reuses the aumovio-stage markup, so the existing
 * .aumovio-stage__* selectors and the a.aumovio-button CTA fallback cover it
 * with no structural change. Validated at 100% against the career instance.
 *
 * Library convention (Hero): 1 column, 3 rows.
 *   Row 1: block name.
 *   Row 2: background image (optional).
 *   Row 3: title + subheading + CTA (optional), as richtext in one cell.
 * Never more than 3 rows.
 *
 * Model fields (blocks/hero-banner/_hero-banner.json):
 *   - image (reference) + imageAlt (collapsed -> img alt attribute)  -> row 2, <!-- field:image -->
 *   - text  (richtext)                                               -> row 3, <!-- field:text -->
 * DM/Scene7 <img> is left as-is; aumovio-dm-images.js rewrites it in afterTransform.
 * Generated: 2026-09-07
 */
export default function parse(element, { document }) {
  // --- INPUT EXTRACTION (selectors validated against source.html) ---
  // Background key-visual / banner image. Both variants place a single <img>
  // inside a <picture>; classes differ (stage__bg-image vs banner__bg-image).
  const image = element.querySelector(
    'img.aumovio-stage__bg-image, img.aumovio-banner__bg-image, picture img, img'
  );

  // Headings: stage variant uses h1 + h3; banner variant uses h3 (eyebrow) + h4.
  const headings = Array.from(
    element.querySelectorAll(
      '.aumovio-stage__headline h1, .aumovio-stage__headline h2, .aumovio-stage__headline h3, '
      + '.aumovio-banner__teaser h3, .aumovio-banner__teaser h4, .aumovio-banner__teaser h5'
    )
  );

  // Optional description paragraph (banner variant only).
  const description = element.querySelector('.aumovio-banner__description, .aumovio-banner__teaser p, p');

  // Optional CTA (banner variant only).
  const cta = element.querySelector('a.aumovio-button, .aumovio-banner__teaser a[href], a[href]');

  // --- EMPTY-BLOCK GUARD ---
  if (!image && headings.length === 0 && !description && !cta) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // --- BUILD CELLS (1-column, max 3 rows: block name + image row + text row) ---
  const cells = [];

  // Row 2: image field.
  if (image) {
    cells.push([[document.createComment(' field:image '), image]]);
  }

  // Row 3: text field (richtext) — headings, then description, then CTA.
  const textNodes = [document.createComment(' field:text ')];
  headings.forEach((h) => textNodes.push(h));
  if (description && !headings.includes(description)) textNodes.push(description);
  if (cta) textNodes.push(cta);
  if (textNodes.length > 1) {
    cells.push([textNodes]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
