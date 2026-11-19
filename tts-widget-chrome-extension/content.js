/* TTS-widget Chrome Extension content entry.
 * Runs in the extension isolated world; it does not modify host page scripts.
 */
(function () {
  "use strict";

  // If the widget was previously created and then hidden, restore it without
  // calling init again (the shared core intentionally exposes a singleton).
  const existingRoot = document.querySelector(".tts-widget-root");
  if (existingRoot) {
    existingRoot.style.removeProperty("display");
    existingRoot.dataset.extensionActive = "true";
    return;
  }

  if (!window.TTSWidget || typeof window.TTSWidget.init !== "function") {
    console.error("[TTS-widget Extension] Không tải được lõi TTS-widget.");
    return;
  }

  function findContentSelector() {
    if (document.querySelector("article")) return "article";
    const main = document.querySelector("main");
    if (main && main.querySelector("p, h1, h2, h3, li, blockquote, pre")) return "main";
    const bodyBlocks = document.body
      ? document.body.querySelectorAll("p, h1, h2, h3, li, blockquote, pre")
      : [];
    if (bodyBlocks.length >= 2) return "body";
    return null;
  }

  const selector = findContentSelector();
  if (!selector) {
    console.info("[TTS-widget Extension] Không tìm thấy vùng nội dung phù hợp trên trang này.");
    return;
  }

  const widget = window.TTSWidget.init({ contentSelector: selector });
  const root = document.querySelector(".tts-widget-root");
  if (root && widget) {
    root.dataset.extensionActive = "true";
    console.info("[TTS-widget Extension] Đã kích hoạt trên:", location.href);
  }
})();
