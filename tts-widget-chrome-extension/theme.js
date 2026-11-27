(function () {
  "use strict";

  const STYLE_ID = "tts-widget-global-dark-mode";
  const DARK_ATTRIBUTE = "data-tts-widget-dark-mode";

  const css = `
    html[${DARK_ATTRIBUTE}="true"] {
      color-scheme: dark !important;
      background: #111827 !important;
    }
    html[${DARK_ATTRIBUTE}="true"] body {
      color: #e5e7eb !important;
      background-color: #111827 !important;
    }
    html[${DARK_ATTRIBUTE}="true"] body :not(.tts-widget-root):not(.tts-widget-root *) {
      color: #e5e7eb !important;
      border-color: #374151 !important;
    }
    html[${DARK_ATTRIBUTE}="true"] body :not(.tts-widget-root):not(.tts-widget-root *) {
      background-color: transparent !important;
    }
    html[${DARK_ATTRIBUTE}="true"] body,
    html[${DARK_ATTRIBUTE}="true"] body main,
    html[${DARK_ATTRIBUTE}="true"] body article,
    html[${DARK_ATTRIBUTE}="true"] body section,
    html[${DARK_ATTRIBUTE}="true"] body nav,
    html[${DARK_ATTRIBUTE}="true"] body header,
    html[${DARK_ATTRIBUTE}="true"] body footer,
    html[${DARK_ATTRIBUTE}="true"] body aside,
    html[${DARK_ATTRIBUTE}="true"] body [role="main"],
    html[${DARK_ATTRIBUTE}="true"] body [role="dialog"] {
      background-color: #111827 !important;
    }
    html[${DARK_ATTRIBUTE}="true"] body a,
    html[${DARK_ATTRIBUTE}="true"] body a :not(.tts-widget-root *) {
      color: #93c5fd !important;
    }
    html[${DARK_ATTRIBUTE}="true"] body input,
    html[${DARK_ATTRIBUTE}="true"] body textarea,
    html[${DARK_ATTRIBUTE}="true"] body select,
    html[${DARK_ATTRIBUTE}="true"] body button {
      color: #f3f4f6 !important;
      background-color: #1f2937 !important;
      border-color: #4b5563 !important;
    }
    html[${DARK_ATTRIBUTE}="true"] body img,
    html[${DARK_ATTRIBUTE}="true"] body video,
    html[${DARK_ATTRIBUTE}="true"] body canvas,
    html[${DARK_ATTRIBUTE}="true"] body svg {
      filter: none !important;
    }
  `;

  function apply(enabled) {
    const root = document.documentElement;
    if (!root) return;
    let style = document.getElementById(STYLE_ID);

    if (enabled) {
      root.setAttribute(DARK_ATTRIBUTE, "true");
      if (!style) {
        style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = css;
        (root.head || root).appendChild(style);
      }
    } else {
      root.removeAttribute(DARK_ATTRIBUTE);
      style?.remove();
    }
  }

  if (typeof chrome !== "undefined" && chrome.storage?.sync) {
    chrome.storage.sync.get({ darkMode: false }, result => apply(result.darkMode === true));
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "sync" && changes.darkMode) {
        apply(changes.darkMode.newValue === true);
      }
    });
  }
})();