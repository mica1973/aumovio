import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-teaser-card-image';
      else div.className = 'cards-teaser-card-body';
    });

    // Tag leading category paragraphs (those appearing before the title) as pills.
    const body = li.querySelector('.cards-teaser-card-body');
    if (body) {
      const heading = body.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) {
        let node = body.firstElementChild;
        while (node && node !== heading) {
          const next = node.nextElementSibling;
          if (node.tagName === 'P' && node.textContent.trim() && !node.querySelector('a')) {
            node.classList.add('cards-teaser-tag');
          }
          node = next;
        }
      }
    }

    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  // Variant detection: the "simple" 4-up grid (career page) uses <h3> card titles,
  // whereas the default carousel-style teaser (homepage, solutions, company) uses <h2>.
  // This drives layout without hardcoding a page-specific column count.
  const hasH3 = ul.querySelector('.cards-teaser-card-body h3');
  const hasH2 = ul.querySelector('.cards-teaser-card-body h2');
  if (hasH3 && !hasH2) block.classList.add('cards-teaser-simple');

  block.textContent = '';
  block.append(ul);
}
