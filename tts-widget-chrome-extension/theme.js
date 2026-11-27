(function () {
"use strict";

const DARK_STYLE_ID = "tts-widget-global-dark-mode";
const FONT_STYLE_ID = "tts-widget-global-font-size";
const DARK_ATTRIBUTE = "data-tts-widget-dark-mode";
const FONT_ATTRIBUTE = "data-tts-widget-page-font";
const CONTROLLER_KEY = "__ttsWidgetThemeController";

const darkCss = `
html[${DARK_ATTRIBUTE}="true"] {
  color-scheme: dark !important;
  background: #111827 !important;
}
html[${DARK_ATTRIBUTE}="true"] body {
  color: #e5e7eb !important;
  background: #111827 !important;
}
/* Ép nền các lớp bố cục phổ biến về tối; không phủ lên ảnh/media hoặc TTS-widget. */
html[${DARK_ATTRIBUTE}="true"] body :not(.tts-widget-root):not(.tts-widget-root *):not(img):not(video):not(canvas):not(svg):not(iframe):not(picture):not(source) {
  color: #e5e7eb !important;
  background-color: #111827 !important;
  border-color: #374151 !important;
}
html[${DARK_ATTRIBUTE}="true"] body a:not(.tts-widget-root a) {
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
html[${DARK_ATTRIBUTE}="true"] body svg,
html[${DARK_ATTRIBUTE}="true"] body iframe {
  filter: none !important;
}
`;

function apply(settings) {
  const root = document.documentElement;
  if (!root) return;

  const darkEnabled = settings?.darkMode === true;
  const darkStyle = document.getElementById(DARK_STYLE_ID);

  if (darkEnabled) {
    root.setAttribute(DARK_ATTRIBUTE, "true");
    if (!darkStyle) {
      const style = document.createElement("style");
      style.id = DARK_STYLE_ID;
      style.textContent = darkCss;
      (document.head || root).appendChild(style);
    }
  } else {
    root.removeAttribute(DARK_ATTRIBUTE);
    darkStyle?.remove();
  }

  const fontSize = Math.min(24, Math.max(12, Number(settings?.pageFontSize) || 16));
  const fontStyle = document.getElementById(FONT_STYLE_ID);
  if (fontSize === 16) {
    fontStyle?.remove();
    root.removeAttribute(FONT_ATTRIBUTE);
  } else {
    const style = fontStyle || document.createElement("style");
    style.id = FONT_STYLE_ID;
    style.textContent = `html[${FONT_ATTRIBUTE}="true"] body, html[${FONT_ATTRIBUTE}="true"] body :not(.tts-widget-root):not(.tts-widget-root *) { font-size: ${fontSize}px !important; }`;
    root.setAttribute(FONT_ATTRIBUTE, "true");
    (document.head || root).appendChild(style);
  }
}

const previous = globalThis[CONTROLLER_KEY];
if (previous?.listener && globalThis.chrome?.storage?.onChanged) {
  chrome.storage.onChanged.removeListener(previous.listener);
}
globalThis.__ttsWidgetApplyTheme = apply;

const listener = (changes, area) => {
  if (area !== "sync" || (!changes.darkMode && !changes.pageFontSize)) return;
  chrome.storage.sync.get({ darkMode: false, pageFontSize: 16 }, apply);
};
globalThis[CONTROLLER_KEY] = { listener };

if (globalThis.chrome?.storage?.sync) {
  chrome.storage.sync.get({ darkMode: false, pageFontSize: 16 }, apply);
  chrome.storage.onChanged.addListener(listener);
}
})();