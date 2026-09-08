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

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // ConsentManager cookie banner (first body child) — non-authorable overlay.
    WebImporter.DOMUtils.remove(element, ['#cmpwrapper']);

    // The SPA locks the body with style="overflow: hidden" (verified on <body>);
    // restore scrolling so nothing depends on the locked state during parsing.
    if (element.style && element.style.overflow === 'hidden') {
      element.style.overflow = 'scroll';
    }
  }

  if (hookName === TransformHook.afterTransform) {
    // Global chrome — auto-populated / global in EDS, not authored per page.
    WebImporter.DOMUtils.remove(element, [
      'aumovio-main-header', // header, main navigation, search, language switch
      'aumovio-back-top-top', // back-to-top button
      'footer.aumovio-footer', // global footer navigation + social links + copyright
      'iframe', // hidden "Intentionally hidden, please ignore" iframes
    ]);
  }
}
