(() => {
  "use strict";
  if (window.__ttsTimedtextNetworkListener) return;
  window.__ttsTimedtextNetworkListener = true;

  const cache = [];
  const MAX_CACHE = 12;
  const isTimedtext = value => {
    try {
      const url = new URL(value, location.href);
      return url.hostname === "www.youtube.com" && url.pathname === "/api/timedtext";
    } catch (_) { return false; }
  };
  const publish = (url, body) => {
    if (!isTimedtext(url) || typeof body !== "string" || !body.trim() || body.length > 8 * 1024 * 1024) return;
    const entry = { url: String(url), body, capturedAt: Date.now() };
    cache.push(entry);
    if (cache.length > MAX_CACHE) cache.shift();
    window.postMessage({ source: "tts-subtitle-network", type: "TIMEDTEXT_RESPONSE", ...entry }, location.origin);
  };

  // content.js có thể được nạp sau khi YouTube đã tải phụ đề.
  // Cho phép content script yêu cầu phát lại các response đã bắt được.
  window.addEventListener("message", event => {
    const data = event.data;
    if (event.source !== window || event.origin !== location.origin ||
        data?.source !== "tts-subtitle-content" || data.type !== "GET_TIMEDTEXT_CACHE") return;
    const videoId = new URL(location.href).searchParams.get("v");
    for (const entry of cache) {
      let requestVideoId = "";
      try { requestVideoId = new URL(entry.url, location.href).searchParams.get("v") || ""; } catch (_) {}
      if (!requestVideoId || !videoId || requestVideoId === videoId) {
        window.postMessage({ source: "tts-subtitle-network", type: "TIMEDTEXT_RESPONSE", ...entry }, location.origin);
      }
    }
  });

  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const requestUrl = args[0] instanceof Request ? args[0].url : String(args[0]);
    return originalFetch.apply(this, args).then(response => {
      if (isTimedtext(requestUrl)) {
        response.clone().text().then(body => publish(response.url || requestUrl, body)).catch(() => {});
      }
      return response;
    });
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this.__ttsTimedtextUrl = String(url);
    return originalOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function(...args) {
    if (isTimedtext(this.__ttsTimedtextUrl)) {
      this.addEventListener("load", () => {
        try {
          if (!this.responseType || this.responseType === "text") {
            publish(this.responseURL || this.__ttsTimedtextUrl, this.responseText);
          }
        } catch (_) {}
      }, { once: true });
    }
    return originalSend.apply(this, args);
  };
})();