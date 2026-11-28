"use strict";

const BASE_URL = "http://127.0.0.1:8081";

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !["VIENEU_TTS_SYNTHESIZE", "VIENEU_TTS_VOICES", "VIENEU_TTS_HEALTH"].includes(message.type)) return;
  (async () => {
    const base = BASE_URL;
    if (message.type === "VIENEU_TTS_HEALTH") {
      const response = await fetch(base + "/health");
      const body = await response.text();
      return { ok: response.ok, status: response.status, body };
    }
    if (message.type === "VIENEU_TTS_VOICES") {
      const response = await fetch(base + "/v1/audio/voices?model=vieneu");
      const body = await response.text();
      if (!response.ok) throw new Error("Không lấy được danh sách voice (" + response.status + "): " + body);
      try { return { ok: true, data: JSON.parse(body) }; }
      catch (_) { throw new Error("API voice trả dữ liệu không hợp lệ."); }
    }
    const input = String(message.input || "").trim();
    if (!input) throw new Error("Văn bản tổng hợp đang trống.");
    const payload = { model: "vieneu", input, response_format: "wav" };
    if (message.voice) payload.voice = String(message.voice);
    const response = await fetch(base + "/v1/audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("VieNeu API lỗi " + response.status + ": " + (await response.text()).slice(0, 1200));
    return { ok: true, mime: response.headers.get("content-type") || "audio/wav", audioBase64: toBase64(await response.arrayBuffer()) };
  })().then(sendResponse).catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
  return true;
});
