const $ = id => document.getElementById(id);
let tabId = null;
let injecting = false;

function showStatus(message) {
  $("status").textContent = message;
}

function updateEngineSettings(engine) {
  const isVieNeu = engine === "vieneu";
  $("browserSettings").hidden = isVieNeu;
  $("vieneuSettings").hidden = !isVieNeu;
  $("rotateSetting").hidden = isVieNeu;
}

function injectContentScripts(done) {
  if (injecting) {
    showStatus("Đang nạp bộ đọc phụ đề...");
    return;
  }
  injecting = true;

  // Network Listener phải chạy trong MAIN world để quan sát fetch/XHR của YouTube.
  chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    files: ["network-listener.js"]
  }, () => {
    const networkError = chrome.runtime.lastError;
    if (networkError) {
      injecting = false;
      showStatus("Không thể nạp Network Listener: " + networkError.message);
      return;
    }

    chrome.scripting.executeScript({
      target: { tabId },
      files: ["subtitle-parser.js", "hybrid-sync.js", "content.js"]
    }, () => {
      const scriptError = chrome.runtime.lastError;
      if (scriptError) {
        injecting = false;
        showStatus("Không thể nạp bộ đọc: " + scriptError.message);
        return;
      }
      chrome.scripting.insertCSS({
        target: { tabId },
        files: ["content.css"]
      }, () => {
        const cssError = chrome.runtime.lastError;
        injecting = false;
        if (cssError) {
          showStatus("Không thể nạp kiểu hiển thị: " + cssError.message);
          return;
        }
        done();
      });
    });
  });
}

function send(type, value, callback, retry = true) {
  if (tabId === null) return;
  chrome.tabs.sendMessage(tabId, {
    target: "tts-subtitle-youtube",
    type,
    value
  }, response => {
    const error = chrome.runtime.lastError;
    if (error) {
      if (retry && type === "GET_STATE") {
        injectContentScripts(() => send(type, value, callback, false));
      } else {
        showStatus("Không kết nối được với YouTube: " + error.message);
      }
      return;
    }
    if (response?.error) showStatus(response.error);
    if (callback) callback(response);
  });
}

function loadState() {
  send("GET_STATE", null, response => {
    if (!response) {
      showStatus("Không nhận được trạng thái từ bộ đọc phụ đề.");
      return;
    }
    $("enabled").checked = response.enabled;
    $("engine").value = response.engine || "browser";
    updateEngineSettings($("engine").value);
    syncEngineCards($("engine").value);
    $("vieneuVoice").value = response.vieneuVoice || "Pham Tuyen";
    $("readingMode").value = response.readingMode || "story";
    $("rate").value = response.rate || 1;
    $("rateValue").textContent = Number(response.rate || 1).toFixed(1) + "×";
    $("volume").value = response.volume ?? 1;
    $("volumeValue").textContent = Math.round((response.volume ?? 1) * 100) + "%";
    $("rotateVoices").checked = !!response.rotateVoices;
    $("autoLanguage").checked = response.autoLanguage !== false;

    const select = $("voices");
    select.innerHTML = "";
    (response.voices || []).forEach(voice => {
      const option = document.createElement("option");
      option.value = voice.voiceURI;
      option.textContent = voice.name + " (" + voice.lang + ")";
      option.selected = (response.voiceURIs || []).includes(voice.voiceURI);
      select.append(option);
    });
    if(response.lastError)showStatus("Lỗi VieNeu: "+response.lastError);
    else if(response.engine==="vieneu"&&response.enabled)showStatus("VieNeu Local: "+(response.preloadedAudio||0)+" audio đã tạo sẵn; "+(response.pendingAudio||0)+" đang xử lý.");
    else showStatus("Đã kết nối với YouTube. Hãy bật “Đọc phụ đề”.");
  });
}

chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  const tab = tabs[0];
  if (!tab?.url || !/^https:\/\/(www\.)?youtube\.com\//.test(tab.url)) {
    showStatus("Hãy mở video trên YouTube.");
    ["enabled", "engine", "vieneuVoice", "readingMode", "rate", "volume", "voices", "rotateVoices", "autoLanguage", "stop"]
      .forEach(id => { $(id).disabled = true; });
    return;
  }
  tabId = tab.id;
  loadState();
});

$("enabled").addEventListener("change", event => {
  send("SET_ENABLED", event.target.checked, response => {
    if (response?.enabled) showStatus("Đang đọc phụ đề theo thời gian video.");
    else if (response?.error) $("enabled").checked = false;
  });
});
$("readingMode").addEventListener("change", event => {
  send("SET_READING_MODE", event.target.value, response => {
    if (response?.error) showStatus(response.error);
    else showStatus(event.target.value === "original" ? "Đã chọn chế độ nguyên bản." : "Đã chọn chế độ kể chuyện.");
  });
});
$("rate").addEventListener("input", event => {
  $("rateValue").textContent = Number(event.target.value).toFixed(1) + "×";
  send("SET_RATE", event.target.value);
});
$("volume").addEventListener("input", event => {
  $("volumeValue").textContent = Math.round(Number(event.target.value) * 100) + "%";
  send("SET_VOLUME", event.target.value);
});
$("voices").addEventListener("change", event => {
  send("SET_VOICES", Array.from(event.target.selectedOptions).map(option => option.value));
});
$("rotateVoices").addEventListener("change", event => send("SET_ROTATE", event.target.checked));
$("autoLanguage").addEventListener("change", event => send("SET_AUTO_LANGUAGE", event.target.checked));
$("stop").addEventListener("click", () => send("STOP"));

document.querySelectorAll(".engine-card").forEach(card => {
  card.addEventListener("click", () => {
    const engine = card.dataset.engine;
    $("engine").value = engine;
    $("engine").dispatchEvent(new Event("change"));
  });
});

function syncEngineCards(engine) {
  document.querySelectorAll(".engine-card").forEach(card => {
    const active = card.dataset.engine === engine;
    card.classList.toggle("is-active", active);
    card.setAttribute("aria-pressed", String(active));
  });
}

$("engine").addEventListener("change", event => {
  updateEngineSettings(event.target.value);
  syncEngineCards(event.target.value);
  send("SET_ENGINE", event.target.value, response => {
    if (response?.error) showStatus(response.error);
    else showStatus(event.target.value === "vieneu" ? "Đã chọn VieNeu TTS Local." : "Đã chọn giọng đọc trình duyệt.");
  });
});
$("vieneuVoice").addEventListener("change", event => {
  send("SET_VIENEU_VOICE", event.target.value, response => {
    if (response?.error) showStatus(response.error);
    else showStatus("Đã lưu giọng VieNeu: " + (response?.vieneuVoice || event.target.value));
  });
});