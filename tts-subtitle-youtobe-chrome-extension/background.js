"use strict";

// Proxy TTS requests from the YouTube content script. The extension service
// worker has host permission for the local VieNeu API (content scripts do not).
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.target !== "vieneu-local-tts" || message.type !== "SYNTHESIZE") return;
  (async () => {
    const response = await fetch("http://127.0.0.1:8080/v1/audio/speech", {
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
      throw new Error("VieNeu TTS lỗi HTTP " + response.status + (detail ? ": " + detail.slice(0, 300) : ""));
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
