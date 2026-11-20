/* TTS-widget Chrome Extension content entry.
 * Runs in the extension isolated world; it does not modify host page scripts.
 */
(function () {
  "use strict";

  // If the widget already exists, restore it without creating a second instance.
  const existingRoot = document.querySelector(".tts-widget-root");
  if (existingRoot) {
    // A previously hidden reader may retain its open-state class. Close it
    // before restoring the launcher so reactivation always shows the speaker.
    existingRoot.querySelector("#closeBtn")?.click();
    existingRoot.classList.remove("reader-open");
    existingRoot.querySelector("#ttsWidgetReader")?.classList.remove("open");
    existingRoot.style.removeProperty("display");
    existingRoot.dataset.extensionActive = "true";
    const launcher = existingRoot.querySelector("#openReaderBtn");
    if (launcher) {
      launcher.style.setProperty("display", "inline-flex", "important");
      launcher.style.setProperty("visibility", "visible", "important");
      launcher.style.setProperty("opacity", "1", "important");
    }
    return;
  }

  if (!window.TTSWidget || typeof window.TTSWidget.init !== "function") {
    console.error("[TTS-widget Extension] Không tải được lõi TTS-widget.");
    return;
  }

  function findContentSelector() {
    const host = location.hostname.toLowerCase();
    const isAiConversation =
      host === "chatgpt.com" ||
      host.endsWith(".chatgpt.com") ||
      host === "chat.openai.com" ||
      host === "gemini.google.com" ||
      host.endsWith(".gemini.google.com");

    const hasReadableBlocks = (element) =>
      !!element && !!element.querySelector("p, h1, h2, h3, h4, h5, h6, li, blockquote, pre");

    // AI chat interfaces commonly create one <article> per message.
    // Observe the stable conversation container instead of the first message.
    if (isAiConversation) {
      const main = document.querySelector("main");
      if (hasReadableBlocks(main)) return "main";
    }

    // For ordinary article-oriented sites, retain the narrower article scope.
    if (hasReadableBlocks(document.querySelector("article"))) return "article";

    const main = document.querySelector("main");
    if (hasReadableBlocks(main)) return "main";

    const bodyBlocks = document.body
      ? document.body.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote, pre")
      : [];
    if (bodyBlocks.length >= 1) return "body";
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
    root.dataset.contentSelector = selector;
    console.info("[TTS-widget Extension] Đã kích hoạt trên:", location.href, "| vùng nội dung:", selector);
  }
})();
