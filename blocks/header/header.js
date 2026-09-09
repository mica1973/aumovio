// AUMOVIO header — content-first, generic drill-in navigation.
// Reads a fetched nav fragment (logo + nested <ul> menu tree + tools) and
// builds: a solid header bar with logo, top-level nav whose items open a
// click-triggered panel that drills into nested levels with a Back button,
// plus a search box and a language switcher. All copy/links come from the
// fragment; this file only builds structure + behavior.

const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Fetch the nav fragment, metadata-independent: /content first (localhost),
 * then root (DA/EDS production).
 * @returns {Promise<Document|null>}
 */
async function fetchNavFragment() {
  // Resolve across hosts. On AEM author the code + content live under
  // codeBasePath (e.g. /content/AUMOVIO), so the nav fragment is at
  // `${codeBasePath}/nav.plain.html`. Locally codeBasePath is '' and the
  // fragment is served at /content/nav.plain.html; on published EDS it's at
  // the site root /nav.plain.html. Try the candidates in order.
  const base = window.hlx?.codeBasePath || '';
  const candidates = [
    `${base}/nav.plain.html`,
    '/content/nav.plain.html',
    '/nav.plain.html',
  ];
  let html = null;
  // eslint-disable-next-line no-restricted-syntax
  for (const url of candidates) {
    /* eslint-disable no-await-in-loop */
    const resp = await fetch(url);
    if (resp.ok) { html = await resp.text(); break; }
    /* eslint-enable no-await-in-loop */
  }
  if (html === null) return null;
  const doc = document.implementation.createHTMLDocument('nav');
  doc.body.innerHTML = html;
  return doc;
}

/**
 * Build a nav item (li) into a { label, href, children[] } model.
 * @param {HTMLLIElement} li
 */
function modelFromLi(li) {
  // The link is a direct child locally (`<li><a>…</a><ul>…</ul></li>`), but the
  // xwalk md2jcr conversion wraps it in a <p> (`<li><p><a>…</a></p><ul>…</ul></li>`).
  // Match both; read ONLY the link's own text (never li.textContent, which would
  // include the entire subtree and produce a label like
  // "Career Job openings Life at AUMOVIO …").
  const link = li.querySelector(':scope > a, :scope > p > a');
  const subUl = li.querySelector(':scope > ul');
  return {
    label: link ? link.textContent.trim() : '',
    href: link ? link.getAttribute('href') : null,
    children: subUl ? [...subUl.children].filter((c) => c.tagName === 'LI').map(modelFromLi) : [],
  };
}

/**
 * Close any open top-level menu.
 * @param {HTMLElement} nav
 */
function closeAllMenus(nav) {
  nav.querySelectorAll('.nav-menu-item[aria-expanded="true"]').forEach((el) => {
    el.setAttribute('aria-expanded', 'false');
  });
  nav.querySelectorAll('.nav-panel.open').forEach((p) => p.classList.remove('open'));
}

/**
 * Render one drill level as a <ul> of links / expandable rows.
 * @param {Array} items model children
 * @param {object} ctx shared context { panel, stack, titleEl, backBtn }
 */
function renderLevel(items, ctx) {
  const ul = document.createElement('ul');
  ul.className = 'nav-panel-list';
  items.forEach((item) => {
    const li = document.createElement('li');
    if (item.children && item.children.length) {
      // expandable row: a link to the overview + a drill-in button
      const row = document.createElement('div');
      row.className = 'nav-panel-row';
      const a = document.createElement('a');
      a.href = item.href || '#';
      a.textContent = item.label;
      const drill = document.createElement('button');
      drill.type = 'button';
      drill.className = 'nav-drill';
      drill.setAttribute('aria-label', `Open ${item.label}`);
      drill.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // push a new level
        ctx.stack.push({ title: item.label, node: renderLevel(item.children, ctx) });
        // eslint-disable-next-line no-use-before-define
        showTop(ctx);
      });
      row.append(a, drill);
      li.append(row);
    } else {
      const a = document.createElement('a');
      a.href = item.href || '#';
      a.textContent = item.label;
      li.append(a);
    }
    ul.append(li);
  });
  return ul;
}

/**
 * Render the current top of the drill stack into the panel body.
 * @param {object} ctx
 */
function showTop(ctx) {
  const top = ctx.stack[ctx.stack.length - 1];
  ctx.body.replaceChildren(top.node);
  ctx.titleEl.textContent = top.title;
  ctx.backBtn.style.visibility = ctx.stack.length > 1 ? 'visible' : 'hidden';
}

/**
 * Build a click-triggered panel for a top-level menu item with children.
 * @param {object} model { label, href, children }
 * @param {HTMLElement} nav
 */
function buildMenuItem(model, nav) {
  const li = document.createElement('li');
  li.className = 'nav-menu-item';

  if (!model.children || model.children.length === 0) {
    // plain top-level link (e.g. Investor Relations, external)
    const a = document.createElement('a');
    a.href = model.href || '#';
    a.textContent = model.label;
    a.className = 'nav-menu-link';
    li.append(a);
    return li;
  }

  li.setAttribute('aria-expanded', 'false');
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nav-menu-link nav-menu-trigger';
  trigger.textContent = model.label;

  const panel = document.createElement('div');
  panel.className = 'nav-panel';

  // panel header: Back + title + overview link
  const header = document.createElement('div');
  header.className = 'nav-panel-header';
  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'nav-panel-back';
  backBtn.textContent = 'Back';
  const titleEl = document.createElement('span');
  titleEl.className = 'nav-panel-title';
  header.append(backBtn, titleEl);

  const body = document.createElement('div');
  body.className = 'nav-panel-body';

  const overview = document.createElement('a');
  overview.className = 'nav-panel-overview';
  overview.href = model.href || '#';
  overview.textContent = `${model.label} overview`;

  panel.append(header, overview, body);

  const ctx = {
    panel, body, titleEl, backBtn, stack: [],
  };
  ctx.stack.push({ title: model.label, node: renderLevel(model.children, ctx) });
  showTop(ctx);

  backBtn.addEventListener('click', () => {
    if (ctx.stack.length > 1) {
      ctx.stack.pop();
      showTop(ctx);
    }
  });

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = li.getAttribute('aria-expanded') === 'true';
    closeAllMenus(nav);
    if (!isOpen) {
      // reset to first level each open
      ctx.stack = [{ title: model.label, node: renderLevel(model.children, ctx) }];
      showTop(ctx);
      li.setAttribute('aria-expanded', 'true');
      panel.classList.add('open');
    }
  });

  li.append(trigger, panel);
  return li;
}

/**
 * Build the search control (structure created here; copy from fragment).
 * @param {string} placeholder
 */
function buildSearch(placeholder) {
  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  form.action = '/search';
  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = placeholder || 'Search';
  input.setAttribute('aria-label', placeholder || 'Search');
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'nav-search-submit';
  submit.setAttribute('aria-label', 'Submit search');
  submit.textContent = '⌕';
  form.append(input, submit);
  return form;
}

/**
 * loads and decorates the header nav
 * @param {Element} block
 */
export default async function decorate(block) {
  const doc = await fetchNavFragment();
  block.textContent = '';
  if (!doc) return;

  // Fragment sections: [0] nav tree, [1] tools (search + language). The logo is
  // NOT in the fragment — it is code-owned chrome rendered below from /icons/.
  const sections = [...doc.body.children].filter((el) => el.tagName === 'DIV');
  const navSection = sections[0];
  const toolsSection = sections[1];

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  // --- Brand / logo ---
  // The logo is code-owned brand chrome served from the git-deployed /icons/
  // folder — NOT from the nav content fragment. Authoring it as fragment content
  // caused md2jcr (xwalk) to remodel the image-only link into an empty Button and
  // drop the <img>. Serving it from /icons/ works identically on localhost, AEM
  // author, and published, with no DAM/path/casing concerns.
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  const brandLink = document.createElement('a');
  brandLink.href = '/';
  brandLink.setAttribute('aria-label', 'AUMOVIO - Homepage');
  const img = document.createElement('img');
  img.src = `${window.hlx?.codeBasePath || ''}/icons/aumovio-logo.svg`;
  img.alt = 'AUMOVIO';
  img.width = 200;
  brandLink.append(img);
  brand.append(brandLink);

  // --- Hamburger (mobile) ---
  const hamburger = document.createElement('button');
  hamburger.type = 'button';
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('aria-controls', 'nav');
  hamburger.setAttribute('aria-label', 'Open navigation');
  hamburger.innerHTML = '<span class="nav-hamburger-icon"></span>';

  // --- Primary nav ---
  const navSections = document.createElement('div');
  navSections.className = 'nav-sections';
  // Prefer a direct-child <ul>, but fall back to the first descendant <ul>:
  // md2jcr may wrap the list in a richtext container on AEM.
  const topUl = navSection?.querySelector(':scope > ul') || navSection?.querySelector('ul');
  const menuUl = document.createElement('ul');
  menuUl.className = 'nav-menu';
  if (topUl) {
    [...topUl.children].filter((c) => c.tagName === 'LI').forEach((li) => {
      menuUl.append(buildMenuItem(modelFromLi(li), nav));
    });
  }
  navSections.append(menuUl);

  // --- Tools: search + language switcher ---
  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  tools.append(buildSearch('Search'));
  // language switcher from fragment tools section (list of language links)
  const langLinks = toolsSection ? [...toolsSection.querySelectorAll('ul a')] : [];
  if (langLinks.length) {
    // Derive a 2-letter language code from a link href (/en.html -> en) so we
    // can show the matching flag. Flags are code-owned SVGs under /icons/ so
    // they resolve on every host (see logo handling).
    const langCode = (href) => (href || '').split('/').pop().split('.')[0].toLowerCase();
    const flagImg = (code) => {
      const img = document.createElement('img');
      img.className = 'nav-lang-flag';
      img.src = `${window.hlx?.codeBasePath || ''}/icons/flag-${code}.svg`;
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.loading = 'lazy';
      return img;
    };
    const langWrap = document.createElement('div');
    langWrap.className = 'nav-lang';
    const current = langLinks[0];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-lang-current';
    btn.append(flagImg(langCode(current.getAttribute('href'))));
    btn.append(document.createTextNode(current.textContent.trim()));
    btn.setAttribute('aria-expanded', 'false');
    const list = document.createElement('ul');
    list.className = 'nav-lang-list';
    langLinks.forEach((a) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.append(flagImg(langCode(a.getAttribute('href'))));
      link.append(document.createTextNode(a.textContent.trim()));
      li.append(link);
      list.append(li);
    });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      langWrap.classList.toggle('open', !open);
    });
    langWrap.append(btn, list);
    tools.append(langWrap);
  }

  nav.append(hamburger, brand, navSections, tools);

  // --- Mobile toggle ---
  function setMenu(open) {
    nav.setAttribute('aria-expanded', open ? 'true' : 'false');
    hamburger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    document.body.style.overflowY = open && !isDesktop.matches ? 'hidden' : '';
  }
  hamburger.addEventListener('click', () => {
    setMenu(nav.getAttribute('aria-expanded') !== 'true');
  });

  // Close menus on outside click / escape
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) {
      closeAllMenus(nav);
      nav.querySelector('.nav-lang.open')?.classList.remove('open');
      nav.querySelector('.nav-lang-current')?.setAttribute('aria-expanded', 'false');
    }
  });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      closeAllMenus(nav);
      if (!isDesktop.matches) setMenu(false);
    }
  });

  // Reset state when crossing the breakpoint
  isDesktop.addEventListener('change', () => {
    closeAllMenus(nav);
    setMenu(false);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);

  // Skip-to-content link (first focusable element, before the nav)
  const skip = document.createElement('a');
  skip.className = 'skip-link visually-hidden';
  skip.href = '#main';
  skip.textContent = 'Skip to main content';
  block.append(skip, navWrapper);
}
