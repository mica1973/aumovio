export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-media-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-media-img-col');
        }
      }
    });
  });

  // Teaser variant (heading + CTA): alternate the image side across a run of
  // consecutive teaser blocks so every other row places the image on the right.
  // The source ("Explore") alternates image-left / image-right / image-left.
  if (block.querySelector('h3')) {
    const wrapper = block.closest('.columns-media-wrapper') || block;
    const isTeaserWrapper = (el) => el
      && el.classList.contains('columns-media-wrapper')
      && el.querySelector('.columns-media h3');

    // count preceding consecutive teaser wrappers to derive this block's index
    let index = 0;
    let prev = wrapper.previousElementSibling;
    while (isTeaserWrapper(prev)) {
      index += 1;
      prev = prev.previousElementSibling;
    }

    if (index % 2 === 1) {
      block.classList.add('columns-media-reverse');
    }
  }
}
