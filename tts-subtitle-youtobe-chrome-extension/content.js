(() => {
  if (window.__ttsSubtitleYouTubeLoaded) return;
  window.__ttsSubtitleYouTubeLoaded = true;

  const DEFAULTS = { enabled: false, rate: 1, voiceURI: "", voiceURIs: [], rotateVoices: false, autoLanguage: true };
  let settings = { ...DEFAULTS };
  let enabled = false, currentUtterance = null, lastCueKey = "", rotationIndex = 0;
  let activeVideo = null, poller = null, pageObserver = null, voiceList = [];
  const captionRootSelector = ".ytp-caption-window-container";

  function getVideo() { return document.querySelector("video"); }
  function normalizeText(value) { return String(value || "").replace(/\s+/g, " ").trim(); }

  function detectLanguage(text, trackLanguage) {
    if (trackLanguage && /^[a-z]{2,3}(-[A-Z]{2})?$/i.test(trackLanguage)) return trackLanguage;
    if (/[\u3040-\u30ff\u4e00-\u9faf]/.test(text)) return /[\u3040-\u30ff]/.test(text) ? "ja" : "zh";
    if (/[\uac00-\ud7af]/.test(text)) return "ko";
    if (/[\u0400-\u04ff]/.test(text)) return "ru";
    if (/[\u0600-\u06ff]/.test(text)) return "ar";
    if (/[\u0e00-\u0e7f]/.test(text)) return "th";
    if (/[\u00c0-\u024f]/.test(text)) return "fr";
    if (/[\u0100-\u017f]/.test(text)) return "vi";
    return "en";
  }

  function getTrackCue(video) {
    if (!video || !video.textTracks) return null;
    for (const track of Array.from(video.textTracks)) {
      if (track.mode === "disabled") continue;
      const cues = track.activeCues;
      if (!cues || !cues.length) continue;
      const cue = cues[0];
      const text = normalizeText(cue.text);
      if (text) return { text, start: cue.startTime, end: cue.endTime, lang: track.language || "" };
    }
    return null;
  }

  function getDomCue() {
    const root = document.querySelector(captionRootSelector);
    if (!root) return null;
    const text = normalizeText(Array.from(root.querySelectorAll(".ytp-caption-segment"))
      .map(node => node.textContent).filter(Boolean).join(" "));
    return text ? { text, start: null, end: null, lang: "" } : null;
  }

  function getCue(video) { return getTrackCue(video) || getDomCue(); }
  function getVoices() { voiceList = window.speechSynthesis.getVoices(); return voiceList; }

  function chooseVoice(text, trackLanguage) {
    const voices = getVoices();
    const language = detectLanguage(text, trackLanguage).toLowerCase();
    const selected = (settings.voiceURIs || []).map(uri => voices.find(v => v.voiceURI === uri)).filter(Boolean);
    if (settings.rotateVoices && selected.length) {
      const voice = selected[rotationIndex % selected.length];
      rotationIndex++;
      return voice;
    }
    if (settings.autoLanguage) {
      const match = voices.find(v => v.lang.toLowerCase() === language) ||
        voices.find(v => v.lang.toLowerCase().startsWith(language + "-"));
      if (match) return match;
    }
    return voices.find(v => v.voiceURI === settings.voiceURI) || selected[0] || null;
  }

  function stopSpeech() {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }

  function speakCue(cue) {
    if (!enabled || !cue || !cue.text) return;
    const video = getVideo();
    if (!video || video.paused || video.ended) return;
    const key = cue.start == null ? "dom:" + cue.text : cue.start + ":" + cue.end + ":" + cue.text;
    if (key === lastCueKey) return;
    lastCueKey = key;
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(cue.text);
    utterance.rate = Math.min(2, Math.max(0.5, Number(settings.rate) || 1));
    const voice = chooseVoice(cue.text, cue.lang);
    if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
    else utterance.lang = detectLanguage(cue.text, cue.lang);
    utterance.onend = () => { if (currentUtterance === utterance) currentUtterance = null; };
    utterance.onerror = () => { if (currentUtterance === utterance) currentUtterance = null; };
    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function tick() {
    const video = getVideo();
    if (!video) return;
    if (video !== activeVideo) bindVideo(video);
    if (!enabled || video.paused || video.ended) return;
    const cue = getCue(video);
    if (cue) speakCue(cue);
  }

  function bindVideo(video) {
    if (activeVideo) {
      activeVideo.removeEventListener("pause", handlePause);
      activeVideo.removeEventListener("play", handlePlay);
      activeVideo.removeEventListener("ended", handlePause);
      activeVideo.removeEventListener("seeked", handleSeek);
    }
    activeVideo = video;
    lastCueKey = "";
    if (!video) return;
    video.addEventListener("pause", handlePause);
    video.addEventListener("play", handlePlay);
    video.addEventListener("ended", handlePause);
    video.addEventListener("seeked", handleSeek);
  }
  function handlePause() { stopSpeech(); }
  function handlePlay() { lastCueKey = ""; tick(); }
  function handleSeek() { stopSpeech(); lastCueKey = ""; tick(); }

  function setEnabled(value) {
    enabled = Boolean(value);
    document.documentElement.classList.toggle("tts-subtitle-enabled", enabled);
    if (enabled) { lastCueKey = ""; tick(); }
    else stopSpeech();
    chrome.storage.local.set({ enabled });
  }

  function stateResponse() {
    return {
      enabled, rate: settings.rate, voiceURI: settings.voiceURI,
      voiceURIs: settings.voiceURIs || [], rotateVoices: Boolean(settings.rotateVoices),
      autoLanguage: settings.autoLanguage !== false,
      voices: getVoices().map(v => ({ name: v.name, lang: v.lang, voiceURI: v.voiceURI }))
    };
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.target !== "tts-subtitle-youtube") return;
    switch (message.type) {
      case "GET_STATE": sendResponse(stateResponse()); break;
      case "SET_ENABLED": setEnabled(message.value); sendResponse({ enabled }); break;
      case "SET_RATE":
        settings.rate = Math.min(2, Math.max(0.5, Number(message.value) || 1));
        chrome.storage.local.set({ rate: settings.rate }); sendResponse({ rate: settings.rate }); break;
      case "SET_VOICES":
        settings.voiceURIs = Array.isArray(message.value) ? message.value : [];
        rotationIndex = 0; chrome.storage.local.set({ voiceURIs: settings.voiceURIs });
        sendResponse({ voiceURIs: settings.voiceURIs }); break;
      case "SET_ROTATE":
        settings.rotateVoices = Boolean(message.value);
        chrome.storage.local.set({ rotateVoices: settings.rotateVoices });
        sendResponse({ rotateVoices: settings.rotateVoices }); break;
      case "SET_AUTO_LANGUAGE":
        settings.autoLanguage = Boolean(message.value);
        chrome.storage.local.set({ autoLanguage: settings.autoLanguage });
        sendResponse({ autoLanguage: settings.autoLanguage }); break;
      case "STOP": stopSpeech(); lastCueKey = ""; sendResponse({ stopped: true }); break;
    }
    return true;
  });

  window.speechSynthesis.onvoiceschanged = () => { getVoices(); };
  chrome.storage.local.get(DEFAULTS, stored => {
    settings = { ...DEFAULTS, ...stored };
    enabled = Boolean(settings.enabled);
    document.documentElement.classList.toggle("tts-subtitle-enabled", enabled);
    bindVideo(getVideo());
    tick();
  });
  poller = window.setInterval(tick, 80);
  pageObserver = new MutationObserver(() => {
    const video = getVideo();
    if (video !== activeVideo) bindVideo(video);
  });
  pageObserver.observe(document.documentElement, { childList: true, subtree: true });
})();