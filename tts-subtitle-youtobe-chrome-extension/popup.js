const $ = id => document.getElementById(id);
let tabId = null;

function showStatus(message) {
  $("status").textContent = message;
}

function send(type, value) {
  if (tabId === null) return;
  chrome.tabs.sendMessage(tabId, { target: "tts-subtitle-youtube", type, value }, response => {
    if (chrome.runtime.lastError) showStatus("Không thể kết nối. Hãy tải lại trang YouTube.");
    return response;
  });
}

function loadVoices() {
  if (tabId === null) return;
  chrome.tabs.sendMessage(tabId, { target: "tts-subtitle-youtube", type: "GET_STATE" }, response => {
    if (chrome.runtime.lastError || !response) return;
    $("enabled").checked = response.enabled;
    $("rate").value = response.rate || 1;
    $("rateValue").textContent = Number(response.rate || 1).toFixed(1) + "×";
    const select = $("voice");
    const selected = select.value;
    select.innerHTML = '<option value="">Giọng mặc định của hệ thống</option>';
    (response.voices || []).forEach(voice => {
      const option = document.createElement("option");
      option.value = voice.voiceURI;
      option.textContent = voice.name + " (" + voice.lang + ")";
      select.appendChild(option);
    });
    select.value = selected;
    showStatus("Đã kết nối với tab YouTube.");
  });
}

chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  const tab = tabs[0];
  if (!tab || !tab.url || !/^https:\/\/www\.youtube\.com\//.test(tab.url)) {
    showStatus("Hãy mở một video trên YouTube.");
    $("enabled").disabled = true;
    $("rate").disabled = true;
    $("voice").disabled = true;
    $("stop").disabled = true;
    return;
  }
  tabId = tab.id;
  loadVoices();
});

$("enabled").addEventListener("change", event => send("SET_ENABLED", event.target.checked));
$("rate").addEventListener("input", event => {
  $("rateValue").textContent = Number(event.target.value).toFixed(1) + "×";
  send("SET_RATE", event.target.value);
});
$("voice").addEventListener("change", event => send("SET_VOICE", event.target.value));
$("stop").addEventListener("click", () => send("STOP"));