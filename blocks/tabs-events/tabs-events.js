// eslint-disable-next-line import/no-unresolved
import { moveInstrumentation } from '../../scripts/scripts.js';

// keep track globally of the number of tab blocks on the page
let tabBlockCnt = 0;

/**
 * Group the flat panel content (image link, date, optional location, h4 title,
 * repeated per event) into discrete event cards laid out as a responsive grid.
 * @param {HTMLElement} panel the decorated tabpanel element
 */
function buildEventCards(panel) {
  const container = panel.firstElementChild;
  if (!container) return;

  const nodes = [...container.children];
  const list = document.createElement('ul');
  list.className = 'tabs-events-cards';

  let current = null;

  const startCard = (href) => {
    const li = document.createElement('li');
    const card = document.createElement('a');
    card.className = 'tabs-events-card';
    if (href) card.href = href;
    const media = document.createElement('div');
    media.className = 'tabs-events-card-media';
    const body = document.createElement('div');
    body.className = 'tabs-events-card-body';
    const header = document.createElement('div');
    header.className = 'tabs-events-card-header';
    body.append(header);
    card.append(media, body);
    li.append(card);
    list.append(li);
    current = {
      li, card, media, body, header, texts: 0,
    };
    return current;
  };

  nodes.forEach((node) => {
    const link = node.querySelector('a');
    const href = link ? link.getAttribute('href') : null;
    const picture = node.querySelector('picture');

    // A picture marks the start of a new card.
    if (picture) {
      startCard(href);
      current.media.append(picture);
      return;
    }

    // Empty link paragraph (button-container) with no picture: it only duplicates
    // the card href carried by the image link, so skip it entirely.
    if (link && !node.textContent.trim()) {
      return;
    }

    if (!current) startCard(href);

    // Heading closes the card body.
    if (node.tagName === 'H4') {
      current.body.append(node);
      moveInstrumentation(node, node);
      current = null; // next content starts a fresh card
      return;
    }

    // Plain text paragraphs: first is date, subsequent are location.
    if (node.tagName === 'P') {
      node.classList.remove('button-container');
      node.className = current.texts === 0 ? 'tabs-events-card-date' : 'tabs-events-card-location';
      current.header.append(node);
      current.texts += 1;
      return;
    }

    current.body.append(node);
  });

  container.replaceChildren(list);
}

export default async function decorate(block) {
  // build tablist
  const tablist = document.createElement('div');
  tablist.className = 'tabs-events-list';
  tablist.setAttribute('role', 'tablist');
  tablist.id = `tablist-${tabBlockCnt += 1}`;

  // the first cell of each row is the title of the tab
  const tabHeadings = [...block.children]
    .filter((child) => child.firstElementChild && child.firstElementChild.children.length > 0)
    .map((child) => child.firstElementChild);

  tabHeadings.forEach((tab, i) => {
    const id = `tabpanel-${tabBlockCnt}-tab-${i + 1}`;

    // decorate tabpanel
    const tabpanel = block.children[i];
    tabpanel.className = 'tabs-events-panel';
    tabpanel.id = id;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    // build tab button
    const button = document.createElement('button');
    button.className = 'tabs-events-tab';
    button.id = `tab-${id}`;

    button.innerHTML = tab.innerHTML;

    button.setAttribute('aria-controls', id);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');

    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });

    // add the new tab list button, to the tablist
    tablist.append(button);

    // remove the tab heading from the dom, which also removes it from the UE tree
    tab.remove();

    // remove the instrumentation from the button's h1, h2 etc (this removes it from the tree)
    if (button.firstElementChild) {
      moveInstrumentation(button.firstElementChild, null);
    }

    // group the flat panel content into event cards
    buildEventCards(tabpanel);
  });

  block.prepend(tablist);
}
