(() => {
  if (window.__ttsSubtitleYouTubeLoaded) return;
  window.__ttsSubtitleYouTubeLoaded = true;

  const DEFAULTS = { enabled: false, rate: 1, voiceURI: "" };
  let settings = { ...DEFAULTS };
  let observer = null;
  let lastCaption = "";
  let lastSpokenAt = 0;
  let currentUtterance = null;
  let enabled = false;

  const captionRootSelector = ".ytp-caption-window-container";
  const videoSelector = "video";

  function getCaptionText() {
    const root = document.querySelector(captionRootSelector);
    if (!root) return "";
    return Array.from(root.querySelectorAll(".ytp-caption-segment"))
      .map(node => (node.textContent || "").trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getVideo() {
    return document.querySelector(videoSelector);
  }

  function getVoice() {
    const voices = window.speechSynthesis.getVoices();
    return voices.find(voice => voice.voiceURI === settings.voiceURI) || null;
  }

  function stopSpeech() {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }

  function speakCaption(text) {
    if (!enabled || !text || text === lastCaption) return;
    const video = getVideo();
    if (!video || video.paused || video.ended) return;

    lastCaption = text;
    lastSpokenAt = Date.now();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Math.min(2, Math.max(0.5, Number(settings.rate) || 1));
    const voice = getVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    utterance.onend = () => {
      if (currentUtterance === utterance) currentUtterance = null;
    };
    utterance.onerror = () => {
      if (currentUtterance === utterance) currentUtterance = null;
    };
    currentUtterance = utterance;
    stopSpeech();
    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function handleCaptionChange() {
    if (!enabled) return;
    const video = getVideo();
    if (!video || video.paused || video.ended) return;
    const text = getCaptionText();
    if (!text) return;

    // Avoid speaking transient duplicate DOM updates for the same caption.
    if (text !== lastCaption && Date.now() - lastSpokenAt > 100) {
      speakCaption(text);
    }
  }

  function attachObserver() {
    const root = document.querySelector(captionRootSelector);
    if (!root || observer) return;
    observer = new MutationObserver(handleCaptionChange);
    observer.observe(root, { childList: true, subtree: true, characterData: true });
  }

  function detachObserver() {
    if (observer) observer.disconnect();
    observer = null;
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    document.documentElement.classList.toggle("tts-subtitle-enabled", enabled);
    if (enabled) {
      lastCaption = "";
      attachObserver();
      handleCaptionChange();
    } else {
      detachObserver();
      stopSpeech();
    }
    chrome.storage.local.set({ enabled });
  }

  function onVideoPlayState() {
    const video = getVideo();
    if (!video) return;
    video.addEventListener("pause", stopSpeech);
    video.addEventListener("ended", stopSpeech);
    video.addEventListener("play", handleCaptionChange);
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.target !== "tts-subtitle-youtube") return;
    if (message.type === "GET_STATE") {
      sendResponse({ enabled, rate: settings.rate, voices: window.speechSynthesis.getVoices().map(v => ({ name: v.name, lang: v.lang, voiceURI: v.voiceURI })) });
    } else if (message.type === "SET_ENABLED") {
      setEnabled(message.value);
      sendResponse({ enabled });
    } else if (message.type === "SET_RATE") {
      settings.rate = Math.min(2, Math.max(0.5, Number(message.value) || 1));
      chrome.storage.local.set({ rate: settings.rate });
      sendResponse({ rate: settings.rate });
    } else if (message.type === "SET_VOICE") {
      settings.voiceURI = String(message.value || "");
      chrome.storage.local.set({ voiceURI: settings.voiceURI });
      sendResponse({ voiceURI: settings.voiceURI });
    } else if (message.type === "STOP") {
      stopSpeech();
      sendResponse({ stopped: true });
    }
    return true;
  });

  chrome.storage.local.get(DEFAULTS, stored => {
    settings = { ...DEFAULTS, ...stored };
    setEnabled(settings.enabled);
  });

  const pageObserver = new MutationObserver(() => {
    attachObserver();
    onVideoPlayState();
  });
  pageObserver.observe(document.documentElement, { childList: true, subtree: true });
  onVideoPlayState();
})();