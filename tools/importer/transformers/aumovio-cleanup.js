/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: AUMOVIO site-wide cleanup.
 *
 * Source is a client-rendered web-component SPA: <body> > <aumovio-app> holds
 * a global <aumovio-main-header> (header/nav/search/language switch), the real
 * page content in <main>, and a global <footer class="aumovio-footer">. A
 * ConsentManager cookie banner lives in <div id="cmpwrapper"> as the first body
 * child. Header nav and footer are global/auto-populated in EDS and must be
 * excluded; the cookie banner and other chrome are non-authorable.
 *
 * All selectors verified by reading migration-work/cleaned.html:
 *   - #cmpwrapper (line 2)                 ConsentManager cookie banner
 *   - aumovio-main-header (line 5)         global header wrapper (nav/search/lang)
 *   - aumovio-back-top-top (line 1078)     back-to-top chrome button
 *   - footer.aumovio-footer (line 2574)    global footer
 *   - iframe (lines 2781, 2783)            hidden "Intentionally hidden" iframes
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

/**
 * Remove leaked client-side-rendering comment nodes (empty `<!---->` markers and
 * Lit template markers like `<!--?lit$123$-->`). The source is a Lit/web-component
 * SPA, so these litter the DOM. When html2md serialises them they become raw
 * `html`-type markdown nodes, and the xwalk md2jcr converter throws
 * "Element 'html' is currently not supported" on them.
 *
 * IMPORTANT: the excat parsers emit `<!-- field:xxx -->` hint comments that md2jcr
 * DOES understand and rely on — those must be preserved. Only strip empty/Lit ones.
 * @param {Element} root
 */
function removeSpaComments(root) {
  const COMMENT_NODE = 8;
  const isFieldHint = (text) => text.startsWith('field:');
  // Portable recursive walk over childNodes — avoids TreeWalker/NodeFilter,
  // which are unevenly implemented across importer DOM environments.
  const visit = (node) => {
    // Copy children first: removing during iteration mutates the live list.
    const children = Array.from(node.childNodes || []);
    children.forEach((child) => {
      if (child.nodeType === COMMENT_NODE) {
        const text = (child.nodeValue || '').trim();
        // Keep excat field hints (md2jcr relies on them); drop everything else
        // that leaked from the Lit SPA (empty `<!---->`, `?lit$…`, etc.).
        if (!isFieldHint(text)) {
          child.remove();
        }
      } else if (child.nodeType === 1 /* ELEMENT_NODE */) {
        visit(child);
      }
    });
  };
  visit(root);
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // ConsentManager cookie banner (first body child) — non-authorable overlay.
    WebImporter.DOMUtils.remove(element, ['#cmpwrapper']);

    // Strip leaked SPA/Lit comment nodes before parsing (see helper above).
    removeSpaComments(element);

    // The SPA locks the body with style="overflow: hidden" (verified on <body>);
    // restore scrolling so nothing depends on the locked state during parsing.
    if (element.style && element.style.overflow === 'hidden') {
      element.style.overflow = 'scroll';
    }

    // Decorative lazy-load placeholder icons: the source ships empty
    // <img src="data:image/svg+xml"> spinners/zoom icons that never resolve to a
    // real asset. They render broken and log ERR_INVALID_URL. Remove them so they
    // don't leak into blocks or default content.
    element.querySelectorAll('img[src^="data:image/svg+xml"]').forEach((img) => {
      const src = img.getAttribute('src') || '';
      // Only drop the empty/malformed placeholders (no encoded payload).
      if (!src.includes(',') || src.trim() === 'data:image/svg+xml') {
        (img.closest('picture') || img).remove();
      }
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Global chrome — auto-populated / global in EDS, not authored per page.
    WebImporter.DOMUtils.remove(element, [
      'aumovio-main-header', // header, main navigation, search, language switch
      'aumovio-back-top-top', // back-to-top button
      'footer.aumovio-footer', // global footer navigation + social links + copyright
      'iframe', // hidden "Intentionally hidden, please ignore" iframes
    ]);

    // Re-run the empty data:svg placeholder cleanup after parsing/rules, catching
    // any that only get their placeholder src finalized late (e.g. lazy-load
    // spinners in default content wrapped in <picture>).
    element.querySelectorAll('img[src^="data:image/svg+xml"]').forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (!src.includes(',') || src.trim() === 'data:image/svg+xml') {
        (img.closest('picture') || img).remove();
      }
    });

    // Re-strip leaked SPA/Lit comment nodes after parsing (field: hints preserved).
    removeSpaComments(element);
  }
}
