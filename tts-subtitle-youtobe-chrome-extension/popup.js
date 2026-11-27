const $ = id => document.getElementById(id);
let tabId = null;
let injecting = false;

function showStatus(message) {
  $("status").textContent = message;
}

let vieneuVoiceOptions = [];

function normalizeVieNeuVoices(data) {
  let source = data?.voices ?? data?.data?.voices ?? data?.items ?? data?.data ?? data;
  if (source && !Array.isArray(source) && typeof source === "object") {
    source = Object.entries(source).map(([key, value]) =>
      typeof value === "string" ? { id: key, name: value } : { id: key, ...value });
  }
  if (!Array.isArray(source)) return [];
  return source.map(item => {
    if (typeof item === "string") return { id: item, name: item };
    const id = item?.voice ?? item?.id ?? item?.name ?? item?.voice_id ?? item?.speaker ?? item?.key;
    const name = item?.display_name ?? item?.label ?? item?.name ?? id;
    return id ? { id: String(id), name: String(name) } : null;
  }).filter(Boolean);
}

function currentVieNeuEngine() {
  return $("engine").value === "vieneu-gpu" ? "vieneu-gpu" : "vieneu";
}

function loadVieNeuVoices(selected = []) {
  const status = $("vieneuVoiceStatus");
  const isGpu = currentVieNeuEngine() === "vieneu-gpu";
  status.textContent = "Đang tải danh sách giọng từ VieNeu " + (isGpu ? "GPU (8081)" : "CPU (8080)") + "...";
  status.className = "voice-api-status";
  chrome.runtime.sendMessage({ target: "vieneu-local-tts", type: "GET_VOICES", engine: currentVieNeuEngine() }, response => {
    const runtimeError = chrome.runtime.lastError;
    if (runtimeError || !response?.ok) {
      status.textContent = response?.error || runtimeError?.message || "Không kết nối được VieNeu GPU.";
      status.className = "voice-api-status error";
      return;
    }
    vieneuVoiceOptions = normalizeVieNeuVoices(response.data);
    const select = $("vieneuVoices");
    select.innerHTML = "";
    vieneuVoiceOptions.forEach(voice => {
      const option = document.createElement("option");
      option.value = voice.id;
      option.textContent = voice.name === voice.id ? voice.name : voice.name + " · " + voice.id;
      option.selected = selected.includes(voice.id);
      select.append(option);
    });
    if (!vieneuVoiceOptions.length) {
      status.textContent = "API đã phản hồi nhưng không tìm thấy danh sách giọng. Cần kiểm tra cấu trúc JSON.";
      status.className = "voice-api-status error";
    } else {
      status.textContent = "Đã tải " + vieneuVoiceOptions.length + " giọng. Đang chọn " + selected.filter(id => vieneuVoiceOptions.some(v => v.id === id)).length + ".";
      status.className = "voice-api-status success";
    }
  });
}


function updateEngineSettings(engine) {
  const isVieNeu = engine === "vieneu" || engine === "vieneu-gpu";
  const isGpu = engine === "vieneu-gpu";
  $("browserSettings").hidden = isVieNeu;
  $("vieneuSettings").hidden = !isVieNeu;
  $("vieneuCpuSettings").hidden = !isVieNeu || isGpu;
  $("vieneuGpuSettings").hidden = !isGpu;
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
    // Ưu tiên engine đã lưu trong storage vì content script có thể chưa đọc xong cấu hình.
    chrome.storage.local.get({ engine: response.engine || "browser" }, stored => {
    $("enabled").checked = response.enabled;
    $("engine").value = stored.engine || response.engine || "browser";
    updateEngineSettings($("engine").value);
    syncEngineCards($("engine").value);
    if ($("engine").value === "vieneu-gpu") loadVieNeuVoices(response.vieneuVoices || []);

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
    else if((response.engine==="vieneu"||response.engine==="vieneu-gpu")&&response.enabled)showStatus("VieNeu "+(response.engine==="vieneu-gpu"?"GPU":"CPU")+": "+(response.preloadedAudio||0)+" audio đã tạo sẵn; "+(response.pendingAudio||0)+" đang xử lý.");
    else showStatus("Đã kết nối với YouTube. Hãy bật “Đọc phụ đề”.");
    });
  });
}

chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  const tab = tabs[0];
  if (!tab?.url || !/^https:\/\/(www\.)?youtube\.com\//.test(tab.url)) {
    showStatus("Hãy mở video trên YouTube.");
    ["enabled", "engine", "vieneuVoices", "readingMode", "rate", "volume", "voices", "rotateVoices", "autoLanguage", "stop", "refreshVieNeuVoices"]
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
  chrome.storage.local.set({ engine: event.target.value });
  updateEngineSettings(event.target.value);
  syncEngineCards(event.target.value);
  if (event.target.value === "vieneu-gpu") loadVieNeuVoices(Array.from($("vieneuVoices").selectedOptions).map(o => o.value));
  send("SET_ENGINE", event.target.value, response => {
    if (response?.error) showStatus(response.error);
    else showStatus(event.target.value === "vieneu" ? "Đã chọn VieNeu CPU (8080)." : event.target.value === "vieneu-gpu" ? "Đã chọn VieNeu GPU (8081)." : "Đã chọn giọng đọc trình duyệt.");
  });
});
$("vieneuVoices").addEventListener("change", event => {
  const selected = Array.from(event.target.selectedOptions).map(option => option.value);
  if (!selected.length) {
    $("vieneuVoiceStatus").textContent = "Hãy chọn ít nhất một giọng.";
    $("vieneuVoiceStatus").className = "voice-api-status error";
    return;
  }
  send("SET_VIENEU_VOICES", selected, response => {
    if (response?.error) {
      $("vieneuVoiceStatus").textContent = response.error;
      $("vieneuVoiceStatus").className = "voice-api-status error";
    } else {
      $("vieneuVoiceStatus").textContent = selected.length === 1
        ? "Đã chọn giọng: " + selected[0]
        : "Đã chọn " + selected.length + " giọng để luân phiên.";
      $("vieneuVoiceStatus").className = "voice-api-status success";
    }
  });
});
$("refreshVieNeuVoices").addEventListener("click", () => {
  loadVieNeuVoices(Array.from($("vieneuVoices").selectedOptions).map(o => o.value));
});