/* Local VieNeu TTS bridge. Network requests are proxied through the MV3 service worker. */
(function (global) {
  "use strict";
  if (global.VieNeuTTS) return;
  let audio = null, resolveCurrent = null, rejectCurrent = null, objectUrl = null, generation = 0;
  const clamp = (value, min, max, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };
  async function config() {
    let stored = {};
    try {
      if (global.chrome?.storage?.sync) stored = await chrome.storage.sync.get({ ttsEngine: "browser", ttsLocalVoice: "" });
    } catch (_) {}
    return {
      engine: ["browser", "vieneu-cpu", "vieneu-gpu"].includes(stored.ttsEngine) ? stored.ttsEngine : "browser",
      voice: String(stored.ttsLocalVoice || "").trim()
    };
  }
  function request(type, data = {}) {
    return new Promise((resolve, reject) => {
      if (!global.chrome?.runtime?.sendMessage) return reject(new Error("Không kết nối được dịch vụ TTS của Extension."));
      chrome.runtime.sendMessage({ type, ...data }, response => {
        const err = chrome.runtime.lastError;
        if (err) return reject(new Error(err.message));
        if (!response?.ok) return reject(new Error(response?.error || "VieNeu TTS không phản hồi."));
        resolve(response);
      });
    });
  }
  function settle() {
    const resolve = resolveCurrent;
    resolveCurrent = null; rejectCurrent = null;
    if (resolve) resolve();
  }
  function cleanup() {
    if (audio) {
      audio.onended = audio.onerror = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audio = null;
    }
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
  }
  async function speak(text, options = {}) {
    cancel();
    const token = generation;
    const cfg = await config();
    const engine = options.engine || cfg.engine;
    const voice = options.voice !== undefined ? options.voice : cfg.voice;
    const result = await request("VIENEU_TTS_SYNTHESIZE", {
      engine, input: String(text || ""), voice,
      volume: clamp(options.volume, 0, 1, 1)
    });
    if (token !== generation) return;
    const binary = atob(result.audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    objectUrl = URL.createObjectURL(new Blob([bytes], { type: result.mime || "audio/wav" }));
    audio = new Audio(objectUrl);
    audio.volume = clamp(options.volume, 0, 1, 1);
    audio.playbackRate = clamp(options.rate, 0.6, 1.8, 1);
    return new Promise((resolve, reject) => {
      resolveCurrent = resolve; rejectCurrent = reject;
      audio.onended = () => { cleanup(); settle(); };
      audio.onerror = () => { cleanup(); const fail = rejectCurrent; resolveCurrent = rejectCurrent = null; if (fail) fail(new Error("Không phát được âm thanh WAV từ VieNeu.")); };
      audio.play().catch(error => { cleanup(); const fail = rejectCurrent; resolveCurrent = rejectCurrent = null; if (fail) fail(error); });
    });
  }
  function cancel() { generation++; cleanup(); settle(); }
  function pause() { if (audio && !audio.paused) audio.pause(); }
  function resume() { if (audio && audio.paused) audio.play().catch(error => console.warn("[VieNeu TTS]", error)); }
  async function health(engine) { return request("VIENEU_TTS_HEALTH", { engine }); }
  async function voices(engine) { return request("VIENEU_TTS_VOICES", { engine }); }
  global.VieNeuTTS = { speak, cancel, pause, resume, health, voices, getConfig: config };
})(globalThis);
