/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-media. Base: columns (xwalk Columns block).
 * Sources:
 *   - Home  (https://www.aumovio.com/en.html): div.columncontrol
 *       -> .aumovio-flex > .aumovio-flex-1 columns (image column + text/CTA column).
 *   - Career (https://www.aumovio.com/en/career.html): .contentteaser.teaser
 *       -> section.aumovio-content-teaser with a figure + content pair; the
 *          reversed layout carries .aumovio-content-teaser--reverse on the block.
 *
 * Library convention (Columns): row 1 = block name; row 2 = as many cells as
 * columns needed; each cell holds text/images/inline elements; further rows use
 * the same column count. Model declares columns=2, rows=1 -> one content row,
 * two cells.
 *
 * 🚨 Columns blocks do NOT use field-hint comments (per hinting.md Rule 4 and
 * the Columns special rule). Cells contain only default content.
 *
 * Content row, 2 cells (col order matches source reading order, so the reversed
 * career variant naturally yields [text | image] — CSS reflow is a delivery
 * concern, not an authoring one):
 *   - HOME:   Col 1 image, Col 2 text + optional CTA.
 *   - CAREER: figure (image) and content (heading + para + "Learn more" CTA),
 *             in document order.
 *
 * Excluded: the duplicate <responsive-image> custom element and any data: URI
 * decorative icon (zoom / action icons).
 * DM/Scene7 <img> is left as-is; aumovio-dm-images.js rewrites it afterTransform.
 * Generated: 2026-09-07 | Updated for career content-teaser: 2026-09-08
 */
export default function parse(element, { document }) {
  // Build the ordered list of column source elements for the current shape.
  // HOME: .aumovio-flex-1 columns.
  let columns = Array.from(element.querySelectorAll(':scope > .aumovio-flex > .aumovio-flex-1'));

  // CAREER: content-teaser figure + content are the two "columns". They live
  // inside section.aumovio-content-teaser; keep DOM order so the reversed
  // variant reads as authored.
  if (columns.length === 0) {
    const teaser = element.querySelector('section.aumovio-content-teaser, .aumovio-content-teaser');
    if (teaser) {
      columns = Array.from(teaser.querySelectorAll(
        ':scope > .aumovio-content-teaser__figure, :scope > .aumovio-content-teaser__content',
      ));
    }
  }

  // --- EMPTY-BLOCK GUARD ---
  if (columns.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const row = [];

  columns.forEach((col) => {
    const cellContent = [];

    // Real content image: the <picture> <img>. Excludes the <responsive-image>
    // duplicate and any data: URI decorative icon (zoom / action icons).
    const img = col.querySelector('picture img:not([src^="data:"])');
    if (img) cellContent.push(img);

    // Heading (career content-teaser column only).
    const heading = col.querySelector(
      '.aumovio-content-teaser__heading h1, .aumovio-content-teaser__heading h2, '
      + '.aumovio-content-teaser__heading h3, .aumovio-content-teaser__heading h4',
    );
    if (heading) cellContent.push(heading);

    // Text paragraphs. HOME uses .cmp-text p / .text p; CAREER uses
    // .aumovio-content-teaser__para. Collect DISTINCT non-empty paragraphs.
    const paragraphs = Array.from(col.querySelectorAll(
      '.cmp-text p, .text p, .aumovio-content-teaser__para, p.aumovio-content-teaser__para',
    ));
    const seen = new Set();
    paragraphs.forEach((p) => {
      const txt = p.textContent.trim();
      if (txt && !seen.has(txt)) {
        seen.add(txt);
        cellContent.push(p);
      }
    });

    // Optional CTA link inside the button / col container.
    const cta = col.querySelector(
      '.button a[href], .aumovio-content-teaser__col a[href], a.aumovio-button[href]',
    );
    if (cta && cta.textContent.trim()) cellContent.push(cta);

    cellContent.length ? row.push(cellContent) : row.push('');
  });

  const cells = [row];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  element.replaceWith(block);
}
