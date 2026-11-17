/* TTS-widget Chrome Extension content entry.
 * Runs in the extension isolated world; it does not modify the host page scripts.
 */
(function () {
  "use strict";

  if (window.__TTS_WIDGET_EXTENSION_ACTIVE__) {
    return;
  }

  if (!window.TTSWidget || typeof window.TTSWidget.init !== "function") {
    console.error("[TTS-widget Extension] Không tải được lõi TTS-widget.");
    return;
  }

  function findContentSelector() {
    // Article is the most reliable semantic container on ordinary editorial sites.
    if (document.querySelector("article")) return "article";

    // Chat applications and many modern sites expose their central content in main.
    const main = document.querySelector("main");
    if (main && main.querySelector("p, h1, h2, h3, li, blockquote")) return "main";

    // Avoid attaching to a mostly empty page or browser-internal document.
    const bodyBlocks = document.body
      ? document.body.querySelectorAll("p, h1, h2, h3, li, blockquote")
      : [];
    if (bodyBlocks.length >= 2) return "body";

    return null;
  }

  const selector = findContentSelector();
  if (!selector) {
    console.info("[TTS-widget Extension] Không tìm thấy vùng nội dung phù hợp trên trang này.");
    window.__TTS_WIDGET_EXTENSION_ACTIVE__ = false;
    return;
  }

  const widget = window.TTSWidget.init({ contentSelector: selector });
  window.__TTS_WIDGET_EXTENSION_ACTIVE__ = !!widget;
  if (widget) {
    console.info("[TTS-widget Extension] Đã kích hoạt trên:", location.href);
  }
})();
