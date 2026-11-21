const $ = id => document.getElementById(id);
let tabId = null;
function showStatus(message) { $("status").textContent = message; }
function send(type, value) {
  if (tabId === null) return;
  chrome.tabs.sendMessage(tabId, { target: "tts-subtitle-youtube", type, value }, response => {
    if (chrome.runtime.lastError) showStatus("Không thể kết nối. Hãy tải lại trang YouTube.");
    return response;
  });
}
function loadState() {
  if (tabId === null) return;
  chrome.tabs.sendMessage(tabId, { target: "tts-subtitle-youtube", type: "GET_STATE" }, response => {
    if (chrome.runtime.lastError || !response) { showStatus("Không thể kết nối. Hãy tải lại trang YouTube."); return; }
    $("enabled").checked = response.enabled;
    $("rate").value = response.rate || 1;
    $("rateValue").textContent = Number(response.rate || 1).toFixed(1) + "×";
    $("rotateVoices").checked = Boolean(response.rotateVoices);
    $("autoLanguage").checked = response.autoLanguage !== false;
    const select = $("voices");
    select.innerHTML = "";
    (response.voices || []).forEach(voice => {
      const option = document.createElement("option");
      option.value = voice.voiceURI;
      option.textContent = voice.name + " (" + voice.lang + ")";
      option.selected = (response.voiceURIs || []).includes(voice.voiceURI);
      select.appendChild(option);
    });
    showStatus("Đã kết nối với tab YouTube.");
  });
}
chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  const tab = tabs[0];
  if (!tab || !tab.url || !/^https:\/\/(www\.)?youtube\.com\//.test(tab.url)) {
    showStatus("Hãy mở một video trên YouTube.");
    ["enabled", "rate", "voices", "rotateVoices", "autoLanguage", "stop"].forEach(id => $(id).disabled = true);
    return;
  }
  tabId = tab.id;
  loadState();
});
$("enabled").addEventListener("change", e => send("SET_ENABLED", e.target.checked));
$("rate").addEventListener("input", e => {
  $("rateValue").textContent = Number(e.target.value).toFixed(1) + "×";
  send("SET_RATE", e.target.value);
});
$("voices").addEventListener("change", e => send("SET_VOICES", Array.from(e.target.selectedOptions).map(o => o.value)));
$("rotateVoices").addEventListener("change", e => send("SET_ROTATE", e.target.checked));
$("autoLanguage").addEventListener("change", e => send("SET_AUTO_LANGUAGE", e.target.checked));
$("stop").addEventListener("click", () => send("STOP"));