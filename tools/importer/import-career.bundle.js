/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-career.js
  var import_career_exports = {};
  __export(import_career_exports, {
    default: () => import_career_default
  });

  // tools/importer/parsers/hero-banner.js
  function parse(element, { document }) {
    const image = element.querySelector(
      "img.aumovio-stage__bg-image, img.aumovio-banner__bg-image, picture img, img"
    );
    const headings = Array.from(
      element.querySelectorAll(
        ".aumovio-stage__headline h1, .aumovio-stage__headline h2, .aumovio-stage__headline h3, .aumovio-banner__teaser h3, .aumovio-banner__teaser h4, .aumovio-banner__teaser h5"
      )
    );
    const description = element.querySelector(".aumovio-banner__description, .aumovio-banner__teaser p, p");
    const cta = element.querySelector("a.aumovio-button, .aumovio-banner__teaser a[href], a[href]");
    if (!image && headings.length === 0 && !description && !cta) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (image) {
      cells.push([[document.createComment(" field:image "), image]]);
    }
    const textNodes = [document.createComment(" field:text ")];
    headings.forEach((h) => textNodes.push(h));
    if (description && !headings.includes(description)) textNodes.push(description);
    if (cta) textNodes.push(cta);
    if (textNodes.length > 1) {
      cells.push([textNodes]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-teaser.js
  function parse2(element, { document }) {
    let cards = Array.from(element.querySelectorAll("article.aumovio-card-teasers__card"));
    if (cards.length === 0) {
      cards = Array.from(element.querySelectorAll(".aumovio-flex-1")).filter((c) => c.querySelector(":scope > .cmp-container"));
    }
    if (cards.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cards.forEach((card) => {
      const image = card.querySelector(
        '.aumovio-card-teasers__media img.aumovio-card-teasers__img, .aumovio-card-teasers__figure img:not([src^="data:"]), .responsiveimage picture img:not([src^="data:"]), picture img:not([src^="data:"])'
      );
      const imageCell = [document.createComment(" field:image ")];
      if (image) imageCell.push(image);
      const textCell = [document.createComment(" field:text ")];
      const tagNodes = card.querySelectorAll(
        ".aumovio-card-teasers__figure--tags .aumovio-text--tag, .aumovio-tag--category .aumovio-text--tag"
      );
      const seenTags = /* @__PURE__ */ new Set();
      tagNodes.forEach((tag) => {
        const label = tag.textContent.trim();
        if (label && !seenTags.has(label)) {
          seenTags.add(label);
          const tagPara = document.createElement("p");
          tagPara.textContent = label;
          textCell.push(tagPara);
        }
      });
      const heading = card.querySelector(
        ".aumovio-card-teasers__content .aumovio-card-teasers__heading, .aumovio-card-teasers__content h2, .aumovio-card-teasers__content h3, .headline.title h3, .headline h3, .aumovio-headline h3"
      );
      if (heading) textCell.push(heading);
      const descNodes = card.querySelectorAll(
        ".aumovio-card-teasers__content .aumovio-card-teasers__para, .aumovio-card-teasers__content > p, .text .cmp-text p, .text p"
      );
      const seenDesc = /* @__PURE__ */ new Set();
      descNodes.forEach((p) => {
        const txt = p.textContent.trim();
        if (txt && !seenDesc.has(txt)) {
          seenDesc.add(txt);
          textCell.push(p);
        }
      });
      const cta = card.querySelector(
        ".aumovio-card-teasers__content a.aumovio-button, .aumovio-card-teasers__content a[href], .button a[href], a.aumovio-button[href]"
      );
      if (cta) textCell.push(cta);
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-teaser", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-media.js
  function parse3(element, { document }) {
    let columns = Array.from(element.querySelectorAll(":scope > .aumovio-flex > .aumovio-flex-1"));
    if (columns.length === 0) {
      const teaser = element.querySelector("section.aumovio-content-teaser, .aumovio-content-teaser");
      if (teaser) {
        columns = Array.from(teaser.querySelectorAll(
          ":scope > .aumovio-content-teaser__figure, :scope > .aumovio-content-teaser__content"
        ));
      }
    }
    if (columns.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const row = [];
    columns.forEach((col) => {
      const cellContent = [];
      const img = col.querySelector('picture img:not([src^="data:"])');
      if (img) cellContent.push(img);
      const heading = col.querySelector(
        ".aumovio-content-teaser__heading h1, .aumovio-content-teaser__heading h2, .aumovio-content-teaser__heading h3, .aumovio-content-teaser__heading h4"
      );
      if (heading) cellContent.push(heading);
      const paragraphs = Array.from(col.querySelectorAll(
        ".cmp-text p, .text p, .aumovio-content-teaser__para, p.aumovio-content-teaser__para"
      ));
      const seen = /* @__PURE__ */ new Set();
      paragraphs.forEach((p) => {
        const txt = p.textContent.trim();
        if (txt && !seen.has(txt)) {
          seen.add(txt);
          cellContent.push(p);
        }
      });
      const cta = col.querySelector(
        ".button a[href], .aumovio-content-teaser__col a[href], a.aumovio-button[href]"
      );
      if (cta && cta.textContent.trim()) cellContent.push(cta);
      cellContent.length ? row.push(cellContent) : row.push("");
    });
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-media", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/aumovio-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, ["#cmpwrapper"]);
      if (element.style && element.style.overflow === "hidden") {
        element.style.overflow = "scroll";
      }
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "aumovio-main-header",
        // header, main navigation, search, language switch
        "aumovio-back-top-top",
        // back-to-top button
        "footer.aumovio-footer",
        // global footer navigation + social links + copyright
        "iframe"
        // hidden "Intentionally hidden, please ignore" iframes
      ]);
    }
  }

  // tools/importer/transformers/aumovio-dm-images.js
  function detectDynamicMediaUrl(urlStr) {
    let u;
    try {
      u = new URL(urlStr, "https://x/");
    } catch (e) {
      return false;
    }
    if (u.pathname.startsWith("/is/image/")) {
      return "scene7";
    }
    if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname) && u.pathname.startsWith("/adobe/assets/urn:")) {
      return "dm-openapi";
    }
    return false;
  }
  var LINKED_DM_INLINE_WRAPPER_TAGS = /* @__PURE__ */ new Set(["PICTURE"]);
  var LINKED_DM_WRAPPER_SIBLING_TAGS = /* @__PURE__ */ new Set(["SOURCE"]);
  function findLinkedDmCarrier(img) {
    if (!img || !img.parentElement) return null;
    let node = img;
    let parent = img.parentElement;
    while (parent && LINKED_DM_INLINE_WRAPPER_TAGS.has(parent.tagName)) {
      let foundNode = false;
      for (const child of parent.children) {
        if (child === node) {
          foundNode = true;
        } else if (!LINKED_DM_WRAPPER_SIBLING_TAGS.has(child.tagName)) {
          return null;
        }
      }
      if (!foundNode) return null;
      node = parent;
      parent = parent.parentElement;
    }
    if (!parent || parent.tagName !== "A") return null;
    if (parent.children.length !== 1 || parent.children[0] !== node) return null;
    if (parent.textContent.trim() !== "") return null;
    return parent;
  }
  var EMPTY_ALT_SENTINEL = "Image without alt text";
  function altToLinkText(alt) {
    return alt || EMPTY_ALT_SENTINEL;
  }
  function transform2(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const doc = element.ownerDocument;
    element.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (!detectDynamicMediaUrl(src)) return;
      const alt = img.getAttribute("alt") || "";
      const linkedAnchor = findLinkedDmCarrier(img);
      if (linkedAnchor) {
        linkedAnchor.setAttribute("title", src);
        linkedAnchor.textContent = altToLinkText(alt);
        return;
      }
      const parent = img.parentElement;
      if (parent && parent.tagName === "A") {
        console.warn("DM image inside mixed-content anchor, skipped:", src);
        return;
      }
      const a = doc.createElement("a");
      a.href = src;
      a.textContent = altToLinkText(alt);
      img.replaceWith(a);
    });
  }

  // tools/importer/import-career.js
  var parsers = {
    "hero-banner": parse,
    "cards-teaser": parse2,
    "columns-media": parse3
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "career",
    description: "Career/content pages",
    urls: [
      "https://www.aumovio.com/en/career.html",
      "https://www.aumovio.com/en/company.html",
      "https://www.aumovio.com/en/solutions.html"
    ],
    blocks: [
      {
        name: "hero-banner",
        instances: [".stage.teaser"]
      },
      {
        name: "cards-teaser",
        instances: [
          "#corporate_culture div.columncontrol:nth-of-type(2)",
          "#what_we_do div.columncontrol.aumovio-bottom-spacing--big",
          ".teasercards"
        ]
      },
      {
        name: "columns-media",
        instances: [".contentteaser.teaser"]
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_career_default = {
    transform: (payload) => {
      const { document, url, html, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_career_exports);
})();
