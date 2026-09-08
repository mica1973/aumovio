// AUMOVIO footer — content-first. Reads the footer fragment (social row,
// link columns, legal + copyright) and decorates it with section classes.
// All copy/links/images come from content/footer.plain.html.

// AEM DAM folder where the nav/footer images are uploaded for this site.
const AEM_ASSET_BASE = '/content/dam/aumovio/images/';

/**
 * Resolve a fragment image reference to a path that works in the current host.
 * Fragments store images relatively (e.g. `images/social-facebook.svg`) so they
 * render on the local preview at any page depth; on the AEM host the same asset
 * lives in the DAM. Rewrite accordingly.
 * @param {string} src the raw src from the fragment
 * @returns {string}
 */
function applyImageSrc(img) {
  const raw = img.getAttribute('src');
  if (!raw || /^(https?:)?\/\//.test(raw)) return;
  const file = raw.replace(/^\/?(?:content\/)?images\//, '').replace(/^\//, '');
  const relPath = `/images/${file}`;
  const damPath = `${AEM_ASSET_BASE}${file}`;
  // On the AEM author host (Universal Editor) assets come from the DAM and a
  // missing /images/ request may not fire a clean error event — use the DAM
  // path up front there; elsewhere use the root-absolute relative path. Swap
  // to the other candidate on error so it self-heals on any host.
  const onAem = /\.adobeaemcloud\.com$/.test(window.location.hostname);
  const primary = onAem ? damPath : relPath;
  const fallback = onAem ? relPath : damPath;
  img.addEventListener('error', function onErr() {
    img.removeEventListener('error', onErr);
    if (img.getAttribute('src') !== fallback) img.setAttribute('src', fallback);
  });
  img.setAttribute('src', primary);
}

/**
 * Fetch the footer fragment, metadata-independent: /content first (localhost),
 * then root (DA/EDS production).
 * @returns {Promise<Document|null>}
 */
async function fetchFooterFragment() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const doc = document.implementation.createHTMLDocument('footer');
  doc.body.innerHTML = html;
  return doc;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const doc = await fetchFooterFragment();
  block.textContent = '';
  if (!doc) return;

  const footer = document.createElement('div');
  footer.className = 'footer-content';

  const sections = [...doc.body.children].filter((el) => el.tagName === 'DIV');
  const classNames = ['footer-social', 'footer-columns', 'footer-legal'];
  sections.forEach((section, i) => {
    if (classNames[i]) section.classList.add(classNames[i]);
    footer.append(section);
  });

  // Rewrite fragment image refs (social icons) for the current host.
  footer.querySelectorAll('img[src]').forEach((img) => applyImageSrc(img));

  // Social row: label paragraph + icon list
  const social = footer.querySelector('.footer-social');
  if (social) {
    const label = social.querySelector(':scope > p');
    if (label) label.classList.add('footer-social-label');
    const list = social.querySelector(':scope > ul');
    if (list) list.classList.add('footer-social-list');
  }

  // Link columns: each top-level li is a column group (optional heading + link list)
  const columns = footer.querySelector('.footer-columns');
  if (columns) {
    const groupList = columns.querySelector(':scope > ul');
    if (groupList) groupList.classList.add('footer-column-groups');
    groupList?.querySelectorAll(':scope > li').forEach((group) => {
      group.classList.add('footer-column');
      const heading = group.querySelector(':scope > p');
      if (heading) heading.classList.add('footer-column-title');
    });
  }

  // Legal row: link list + copyright
  const legal = footer.querySelector('.footer-legal');
  if (legal) {
    const links = legal.querySelector(':scope > ul');
    if (links) links.classList.add('footer-legal-links');
    const copyright = legal.querySelector(':scope > p');
    if (copyright) copyright.classList.add('footer-copyright');
  }

  block.append(footer);
}
