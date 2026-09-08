/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-events. Base: tabs (xwalk container block).
 * Source: https://www.aumovio.com/en.html
 * Instance: .eventsteaser (cmp-tabs with two tabs: "Upcoming" / "Past").
 *
 * Library convention (Tabs): 2 columns, multiple rows. Each row = one tab:
 *   [ tab label (mandatory) | tab content (mandatory) ].
 * Tab content may contain headings, links, images, richtext.
 * The tabs-events decorate() reads the first cell of each row as the tab
 * button label and treats the rest of the row as the tab panel.
 *
 * Child model `tabs-events-item` (blocks/tabs-events/_tabs-events.json):
 *   - title            (text)      -> col 1, <!-- field:title -->
 *   - content_richtext (richtext)  -> col 2, <!-- field:content_richtext -->
 *     (content_heading / content_headingType / content_image are grouped
 *      content_* fields authored per event; here the source panel content is
 *      captured as richtext.)
 *
 * Each tab panel holds a carousel of event teasers. We aggregate the event
 * teaser anchors (a.aumovio-events-teaser__teaser) into the content cell —
 * each anchor wraps its image, date/location tags and event title, preserving
 * all event text. Decorative carousel controls (data: URI SVG buttons/dots)
 * are excluded. DM/Scene7 <img> is left as-is; aumovio-dm-images.js rewrites
 * it in afterTransform.
 * Generated: 2026-09-07
 */
export default function parse(element, { document }) {
  // Tab labels, in order.
  const tabLabels = Array.from(element.querySelectorAll('.cmp-tabs__tablist .cmp-tabs__tab'));
  // Tab panels, in order (must align 1:1 with labels).
  const tabPanels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));

  // --- EMPTY-BLOCK GUARD ---
  if (tabLabels.length === 0 || tabPanels.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  tabLabels.forEach((label, i) => {
    const panel = tabPanels[i];

    // --- Col 1: tab label (title field) ---
    const titleP = document.createElement('p');
    titleP.textContent = label.textContent.trim();
    const titleCell = [document.createComment(' field:title '), titleP];

    // --- Col 2: tab content (content_richtext field) = the event teasers ---
    const contentCell = [document.createComment(' field:content_richtext ')];
    if (panel) {
      const teasers = Array.from(panel.querySelectorAll('a.aumovio-events-teaser__teaser'));
      if (teasers.length > 0) {
        teasers.forEach((t) => contentCell.push(t));
      } else {
        // Fallback: keep any meaningful panel content if teaser markup differs.
        Array.from(panel.children).forEach((c) => contentCell.push(c));
      }
    }

    cells.push([titleCell, contentCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-events', cells });
  element.replaceWith(block);
}
