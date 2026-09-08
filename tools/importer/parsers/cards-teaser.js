/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-teaser. Base: cards-teaser (xwalk container block).
 * Sources:
 *   - Home  (https://www.aumovio.com/en.html): .teasercards
 *       -> solutions carousel + newsroom carousel, ARTICLE-based cards.
 *   - Career (https://www.aumovio.com/en/career.html): div.columncontrol
 *       -> "Corporate culture" grid + "What we do" grid, FLEX-based cards.
 *
 * Library convention (Cards): N rows, each row = 1 card = 2 columns:
 *   [ image | heading + description (+ optional category tag / CTA) ].
 * An image or text cell may be empty, but the empty cell is still included.
 * Child model `card` (blocks/cards-teaser/_cards-teaser.json):
 *   - image (reference) + imageAlt (collapsed)  -> col 1, <!-- field:image -->
 *   - text  (richtext)                          -> col 2, <!-- field:text -->
 *
 * This parser handles BOTH source shapes:
 *
 * 1) HOME "article" cards: <article class="aumovio-card-teasers__card">
 *      media/figure -> card image (.aumovio-card-teasers__img)
 *                      + optional category tag (.aumovio-tag--category, newsroom)
 *      content      -> h2 heading + p description + "Learn more" CTA anchor.
 *
 * 2) CAREER "flex" cards: div.aumovio-flex > div.aumovio-flex-1 (one per card),
 *    each holding a div.cmp-container with:
 *      div.headline.title      -> card heading (h3)
 *      div.responsiveimage     -> card image (picture > img, Scene7 DM)
 *      div.text                -> description paragraph(s)
 *      div.button (optional)   -> "Learn more" CTA ("What we do" grid only)
 *
 * The decorative vehicle-icon / zoom-icon SVGs (data: URIs) and the duplicate
 * <responsive-image> custom element are intentionally excluded.
 * DM/Scene7 <img> is left as-is; aumovio-dm-images.js rewrites it afterTransform.
 * Generated: 2026-09-07 | Updated for career flex-cards: 2026-09-08
 */
export default function parse(element, { document }) {
  // --- Detect source shape and collect one card element per card ---
  // HOME: article-based cards.
  let cards = Array.from(element.querySelectorAll('article.aumovio-card-teasers__card'));

  // CAREER: flex-based cards. Each card is a .aumovio-flex-1 that directly
  // contains a .cmp-container (guards against nested flex wrappers matching).
  if (cards.length === 0) {
    cards = Array.from(element.querySelectorAll('.aumovio-flex-1'))
      .filter((c) => c.querySelector(':scope > .cmp-container'));
  }

  // --- EMPTY-BLOCK GUARD ---
  if (cards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  cards.forEach((card) => {
    // ---------------- Image cell (col 1) ----------------
    // Real content image lives in a <picture>. Exclude any data: URI icon and
    // the <responsive-image> custom element (which is not an <img>).
    const image = card.querySelector(
      '.aumovio-card-teasers__media img.aumovio-card-teasers__img, '
      + '.aumovio-card-teasers__figure img:not([src^="data:"]), '
      + '.responsiveimage picture img:not([src^="data:"]), '
      + 'picture img:not([src^="data:"])',
    );
    const imageCell = [document.createComment(' field:image ')];
    if (image) imageCell.push(image);

    // ---------------- Text cell (col 2) ----------------
    const textCell = [document.createComment(' field:text ')];

    // Optional category tag(s) (HOME newsroom cards only) — placed as rich text
    // ahead of the heading. Collect DISTINCT values (tags duplicate across
    // responsive breakpoints and a card may carry more than one category).
    const tagNodes = card.querySelectorAll(
      '.aumovio-card-teasers__figure--tags .aumovio-text--tag, .aumovio-tag--category .aumovio-text--tag',
    );
    const seenTags = new Set();
    tagNodes.forEach((tag) => {
      const label = tag.textContent.trim();
      if (label && !seenTags.has(label)) {
        seenTags.add(label);
        const tagPara = document.createElement('p');
        tagPara.textContent = label;
        textCell.push(tagPara);
      }
    });

    // Heading: HOME uses .aumovio-card-teasers__heading / h2; CAREER uses
    // .headline.title h3.
    const heading = card.querySelector(
      '.aumovio-card-teasers__content .aumovio-card-teasers__heading, '
      + '.aumovio-card-teasers__content h2, .aumovio-card-teasers__content h3, '
      + '.headline.title h3, .headline h3, .aumovio-headline h3',
    );
    if (heading) textCell.push(heading);

    // Description paragraph(s): HOME .aumovio-card-teasers__para; CAREER .text p.
    // Collect DISTINCT paragraphs (guards responsive duplication).
    const descNodes = card.querySelectorAll(
      '.aumovio-card-teasers__content .aumovio-card-teasers__para, '
      + '.aumovio-card-teasers__content > p, '
      + '.text .cmp-text p, .text p',
    );
    const seenDesc = new Set();
    descNodes.forEach((p) => {
      const txt = p.textContent.trim();
      if (txt && !seenDesc.has(txt)) {
        seenDesc.add(txt);
        textCell.push(p);
      }
    });

    // Optional CTA: HOME content anchor; CAREER .button anchor ("Learn more").
    const cta = card.querySelector(
      '.aumovio-card-teasers__content a.aumovio-button, '
      + '.aumovio-card-teasers__content a[href], '
      + '.button a[href], a.aumovio-button[href]',
    );
    if (cta) textCell.push(cta);

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-teaser', cells });
  element.replaceWith(block);
}
