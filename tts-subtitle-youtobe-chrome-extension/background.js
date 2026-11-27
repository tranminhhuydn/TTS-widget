"use strict";

// Only one YouTube tab may own the browser SpeechSynthesis engine at a time.
// This prevents cancel()/speak() calls in different tabs from interrupting each other.
let activeSpeechTabId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.target === "tts-subtitle-youtube" && message.type === "TTS_CLAIM") {
    const tabId = sender.tab?.id;
    if (typeof tabId !== "number") {
      sendResponse({ ok: false, error: "Không xác định được tab yêu cầu TTS." });
      return;
    }
    const previousTabId = activeSpeechTabId;
    activeSpeechTabId = tabId;
    if (previousTabId !== null && previousTabId !== tabId) {
      // Wait until the previous tab has cancelled its utterance before granting
      // ownership to the new tab, avoiding a late cancel() stopping new speech.
      chrome.tabs.sendMessage(previousTabId, {
        target: "tts-subtitle-youtube",
        type: "TTS_PREEMPT"
      }, () => {
        void chrome.runtime.lastError;
        sendResponse({ ok: true, tabId });
      });
      return true;
    }
    sendResponse({ ok: true, tabId });
    return;
  }

  if (message?.target === "tts-subtitle-youtube" && message.type === "TTS_RELEASE") {
    if (sender.tab?.id === activeSpeechTabId) activeSpeechTabId = null;
    sendResponse({ ok: true });
    return;
  }

  if (message?.target === "vieneu-local-tts" && message.type === "GET_VOICES") {
    (async () => {
      const port = message.engine === "vieneu-gpu" ? 8081 : 8080;
      const response = await fetch(`http://127.0.0.1:${port}/v1/audio/voices?model=vieneu`, { method: "GET" });
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error("Không lấy được danh sách giọng VieNeu " + (port === 8081 ? "GPU" : "CPU") + " (HTTP " + response.status + ")" + (detail ? ": " + detail.slice(0, 250) : ""));
      }
      const data = await response.json();
      sendResponse({ ok: true, data });
    })().catch(error => sendResponse({ ok: false, error: error.message || String(error) }));
    return true;
  }

  if (message?.target !== "vieneu-local-tts" || message.type !== "SYNTHESIZE") return;
  (async () => {
    const port = message.engine === "vieneu-gpu" ? 8081 : 8080;
    const response = await fetch(`http://127.0.0.1:${port}/v1/audio/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "vieneu",
        input: String(message.text || ""),
        voice: String(message.voice || "Pham Tuyen"),
        response_format: "wav"
      })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error("VieNeu " + (port === 8081 ? "GPU" : "CPU") + " TTS lỗi HTTP " + response.status + (detail ? ": " + detail.slice(0, 300) : ""));
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    sendResponse({ ok: true, audioBase64: btoa(binary), mimeType: response.headers.get("content-type") || "audio/wav" });
  })().catch(error => sendResponse({ ok: false, error: error.message || String(error) }));
  return true;
});


chrome.tabs.onRemoved.addListener(tabId => {
  if (tabId === activeSpeechTabId) activeSpeechTabId = null;
});
