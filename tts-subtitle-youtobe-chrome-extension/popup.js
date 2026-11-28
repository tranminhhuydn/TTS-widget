const $ = id => document.getElementById(id);
let tabId = null;
let injecting = false;

function showStatus(message) {
  $("status").textContent = message;
}

let vieneuVoiceOptions = [];
let browserVoiceOptions = [];
function editorVoiceOptions(){const engine=$("engine").value;if(engine==="browser")return browserVoiceOptions.map(v=>({id:String(v.voiceURI),name:String(v.name||v.voiceURI)+" ("+String(v.lang||"")+")"}));if(engine==="vieneu-gpu")return vieneuVoiceOptions;return [{id:"Pham Tuyen",name:"Pham Tuyen"}];}

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
    if($("editorPanel")&&!$("editorPanel").hidden)renderEditorCues();
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

    browserVoiceOptions = response.voices || [];
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
  if($("editorPanel")&&!$("editorPanel").hidden)renderEditorCues();
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
const DEFAULT_TEXT_FILTERS = {
  enabled: true,
  rules: [{ id: "default-music", enabled: true, pattern: "\\[(?:âm nhạc|nhạc nền|tiếng vỗ tay|music|background music|laughter|applause)\\]", replacement: "", flags: "gi" }]
};
let textFilterRules = [];
function normalizeTextFilterSettings(value) {
  const source = value && typeof value === "object" ? value : DEFAULT_TEXT_FILTERS;
  const rules = Array.isArray(source.rules) ? source.rules : DEFAULT_TEXT_FILTERS.rules;
  return { enabled: source.enabled !== false, rules: rules.slice(0, 30).map((rule, index) => ({
    id: String(rule.id || "rule-" + index), enabled: rule.enabled !== false,
    pattern: String(rule.pattern || ""), replacement: String(rule.replacement ?? ""),
    flags: String(rule.flags || "gi").replace(/[^dgimsuvy]/g, "").slice(0, 8)
  })) };
}
function renderTextFilterRules() {
  const host = $("textFilterRules"); host.innerHTML = "";
  textFilterRules.forEach((rule, index) => {
    const card = document.createElement("div"); card.className = "filter-rule";
    const top = document.createElement("div"); top.className = "filter-rule-top";
    const title = document.createElement("strong"); title.textContent = "Quy tắc " + (index + 1);
    const enabled = document.createElement("input"); enabled.type = "checkbox"; enabled.checked = rule.enabled;
    enabled.addEventListener("change", () => { rule.enabled = enabled.checked; persistTextFilters(); });
    const enabledLabel = document.createElement("label"); enabledLabel.className = "filter-rule-enabled"; enabledLabel.append(enabled, document.createTextNode(" Bật"));
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "filter-remove"; remove.textContent = "Xóa";
    remove.addEventListener("click", () => { textFilterRules.splice(index, 1); renderTextFilterRules(); persistTextFilters(); });
    top.append(title, enabledLabel, remove); card.append(top);
    const field = (caption, prop, placeholder) => {
      const label = document.createElement("label"); label.className = "filter-field";
      const span = document.createElement("span"); span.textContent = caption;
      const input = document.createElement("input"); input.type = "text"; input.value = rule[prop]; input.placeholder = placeholder;
      input.addEventListener("input", () => { rule[prop] = input.value; updateFilterPreview(); });
      input.addEventListener("change", persistTextFilters);
      label.append(span, input); card.append(label);
    };
    field("Biểu thức tìm kiếm (Regex)", "pattern", "\\[âm nhạc\\]");
    field("Thay thế bằng", "replacement", "Để trống để xóa");

    const flagsGroup = document.createElement("div");
    flagsGroup.className = "filter-flags";
    const flagsTitle = document.createElement("div");
    flagsTitle.className = "filter-flags-title";
    flagsTitle.textContent = "Cách tìm kiếm (chọn các tùy chọn)";
    flagsGroup.append(flagsTitle);
    [
      { flag: "g", title: "Tìm tất cả", description: "Thay thế tất cả đoạn tìm thấy, không chỉ đoạn đầu tiên." },
      { flag: "i", title: "Không phân biệt hoa/thường", description: "Ví dụ [ÂM NHẠC] và [âm nhạc] đều được nhận diện." },
      { flag: "m", title: "Theo từng dòng", description: "Giúp ký hiệu đầu dòng (^) và cuối dòng ($) áp dụng cho từng dòng." }
    ].forEach(option => {
      const label = document.createElement("label");
      label.className = "filter-flag-option";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = rule.flags.includes(option.flag);
      checkbox.addEventListener("change", () => {
        const selected = new Set(rule.flags.split(""));
        if (checkbox.checked) selected.add(option.flag);
        else selected.delete(option.flag);
        rule.flags = ["g", "i", "m"].filter(flag => selected.has(flag)).join("");
        persistTextFilters();
      });
      const copy = document.createElement("span");
      const name = document.createElement("strong");
      name.textContent = option.flag + " – " + option.title;
      const description = document.createElement("small");
      description.textContent = option.description;
      copy.append(name, description);
      label.append(checkbox, copy);
      flagsGroup.append(label);
    });
    card.append(flagsGroup);
    host.append(card);
  });
}
function getFilterResult(input, showErrors = false) {
  let result = String(input || ""), errorMessage = "";
  if ($("textFiltersEnabled").checked) for (let i = 0; i < textFilterRules.length; i++) {
    const rule = textFilterRules[i]; if (!rule.enabled || !rule.pattern) continue;
    try {
      if (rule.pattern.length > 300) throw new Error("Regex không được dài quá 300 ký tự.");
      result = result.replace(new RegExp(rule.pattern, rule.flags || "g"), rule.replacement || "");
    } catch (error) { errorMessage = "Quy tắc " + (i + 1) + ": " + error.message; break; }
  }
  result = result.replace(/[ \t]{2,}/g, " ").replace(/\s+([,.;!?])/g, "$1").trim();
  if (showErrors) $("filterStatus").textContent = errorMessage;
  return result;
}
function updateFilterPreview() {
  const result = getFilterResult($("filterTestInput").value, true);
  $("filterTestOutput").textContent = result || "(Không còn nội dung để đọc)";
}
function persistTextFilters() {
  const textFilters = { enabled: $("textFiltersEnabled").checked, rules: textFilterRules };
  chrome.storage.local.set({ textFilters }, () => {
    $("filterStatus").textContent = chrome.runtime.lastError ? "Không lưu được: " + chrome.runtime.lastError.message : "Đã lưu bộ lọc.";
    updateFilterPreview();
  });
}
function initializeTextFilters() {
  chrome.storage.local.get({ textFilters: DEFAULT_TEXT_FILTERS }, stored => {
    const config = normalizeTextFilterSettings(stored.textFilters);
    $("textFiltersEnabled").checked = config.enabled; textFilterRules = config.rules;
    renderTextFilterRules(); $("filterTestInput").value = "Xin chào [âm nhạc] mọi người"; updateFilterPreview();
  });
  $("textFiltersEnabled").addEventListener("change", persistTextFilters);
  $("addTextFilterRule").addEventListener("click", () => {
    textFilterRules.push({ id: "rule-" + Date.now(), enabled: true, pattern: "", replacement: "", flags: "gi" });
    renderTextFilterRules(); persistTextFilters();
  });
  $("filterTestInput").addEventListener("input", updateFilterPreview);
}
initializeTextFilters();

let editorVideoId=null,editorCues=[],editorCustom=false;
function setEditorStatus(message,kind=""){const node=$("editorStatus");node.textContent=message;node.className="editor-status"+(kind?" "+kind:"");}
function editorMessage(type,extra={},callback=()=>{}){if(tabId===null)return;chrome.tabs.sendMessage(tabId,{target:"tts-subtitle-youtube",type,...extra},response=>{const error=chrome.runtime.lastError;if(error){setEditorStatus("Không kết nối được với YouTube: "+error.message,"error");return;}callback(response||{});});}
function renderEditorCues(){
  const host=$("editorCueList");host.innerHTML="";$("editorCount").textContent=editorCues.length+" đoạn phụ đề";
  const activeEngine=$("engine").value,voiceOptions=editorVoiceOptions();
  editorCues.forEach((cue,index)=>{
    const card=document.createElement("article");card.className="editor-cue";card.dataset.cueIndex=String(index);
    const top=document.createElement("div");top.className="editor-cue-top";
    const title=document.createElement("strong");title.textContent="Đoạn "+(index+1);
    const actions=document.createElement("div");actions.className="editor-cue-actions";
    const jump=document.createElement("button");jump.type="button";jump.textContent="▶ Đến đoạn";jump.addEventListener("click",()=>editorMessage("SEEK_TO_TIME",{value:Number(cue.startTime)}));
    const pause=document.createElement("button");pause.type="button";pause.className="cue-pause";pause.textContent="⏸ Tạm dừng";pause.title="Tạm dừng video để biên tập";pause.addEventListener("click",()=>editorMessage("PAUSE_VIDEO"));
    const remove=document.createElement("button");remove.type="button";remove.className="cue-delete";remove.textContent="Xóa";remove.addEventListener("click",()=>{editorCues.splice(index,1);renderEditorCues();});
    actions.append(jump,pause,remove);top.append(title,actions);card.append(top);
    const times=document.createElement("div");times.className="editor-time-row";
    [["Bắt đầu (giây)","startTime"],["Kết thúc (giây)","endTime"]].forEach(([label,key])=>{const wrap=document.createElement("label");wrap.className="editor-time-field";wrap.textContent=label;const input=document.createElement("input");input.type="number";input.min="0";input.step="0.1";input.value=Number(cue[key]).toFixed(2);input.addEventListener("input",()=>{cue[key]=Number(input.value);});wrap.append(input);times.append(wrap);});
    const voiceWrap=document.createElement("label");voiceWrap.className="editor-voice-field";voiceWrap.textContent="Giọng đọc riêng";
    const voiceSelect=document.createElement("select");voiceSelect.className="editor-voice-select";
    const defaultOption=document.createElement("option");defaultOption.value="";defaultOption.textContent="Mặc định · dùng giọng ở Main";voiceSelect.append(defaultOption);
    voiceOptions.forEach(voice=>{const option=document.createElement("option");option.value=voice.id;option.textContent=voice.name;voiceSelect.append(option);});
    voiceSelect.value=cue.voice&&(!cue.voiceEngine||cue.voiceEngine===activeEngine)?cue.voice:"";
    if(cue.voice&&cue.voiceEngine&&cue.voiceEngine!==activeEngine){const unavailable=document.createElement("option");unavailable.value="__unavailable__";unavailable.textContent="Giọng đã gán thuộc bộ máy khác";voiceSelect.append(unavailable);voiceSelect.value="__unavailable__";}
    voiceSelect.addEventListener("change",()=>{if(voiceSelect.value==="__unavailable__")return;cue.voice=voiceSelect.value;cue.voiceEngine=voiceSelect.value?activeEngine:"";});
    voiceWrap.append(voiceSelect);
    const text=document.createElement("textarea");text.value=cue.text;text.placeholder="Nội dung phụ đề...";text.addEventListener("input",()=>{cue.text=text.value;});
    card.append(times,voiceWrap,text);host.append(card);
  });
}
let editorPlaybackPoll=null,editorPlaybackRequestPending=false;
function updateEditorPlaybackHighlight(){
  if(editorPlaybackRequestPending||$("editorPanel").hidden||!editorVideoId)return;
  editorPlaybackRequestPending=true;
  editorMessage("GET_STATE",{},state=>{
    editorPlaybackRequestPending=false;
    if(state.videoId!==editorVideoId)return;
    const now=Number(state.currentTime)||0;
    document.querySelectorAll(".editor-cue").forEach(card=>{
      const cue=editorCues[Number(card.dataset.cueIndex)];
      const active=!!cue&&now>=Number(cue.startTime)&&now<Number(cue.endTime);
      card.classList.toggle("is-playing",active);
      if(active)card.setAttribute("aria-current","time");else card.removeAttribute("aria-current");
    });
  });
}
function startEditorPlaybackPolling(){
  if(editorPlaybackPoll)clearInterval(editorPlaybackPoll);
  editorPlaybackPoll=setInterval(updateEditorPlaybackHighlight,180);
  updateEditorPlaybackHighlight();
}
function loadEditorData(){setEditorStatus("Đang tải phụ đề của video hiện tại...");editorMessage("GET_EDITOR_DATA",{},data=>{if(data.error){setEditorStatus(data.error,"error");return;}editorVideoId=data.videoId;editorCues=(data.cues||[]).map((cue,index)=>({id:String(cue.id||index+1),text:String(cue.text||""),startTime:Number(cue.startTime)||0,endTime:Number(cue.endTime)||0,voice:String(cue.voice||""),voiceEngine:String(cue.voiceEngine||"")}));editorCustom=!!data.custom;$("editorVideoTitle").textContent=data.title||("Video ID: "+data.videoId);renderEditorCues();setEditorStatus(editorCustom?"Đã tải bản biên tập đã lưu cho video này.":"Đang dùng phụ đề gốc. Hãy chỉnh sửa rồi lưu để tạo bản riêng.","success");});}
document.querySelectorAll(".tab-button").forEach(button=>button.addEventListener("click",()=>{const editor=button.dataset.tab==="editor";document.querySelectorAll(".tab-button").forEach(item=>{const active=item===button;item.classList.toggle("is-active",active);item.setAttribute("aria-selected",String(active));});$("mainPanel").hidden=editor;$("editorPanel").hidden=!editor;if(editor){if($("engine").value==="vieneu-gpu"&&!vieneuVoiceOptions.length)loadVieNeuVoices([]);loadEditorData();startEditorPlaybackPolling();}else if(editorPlaybackPoll){clearInterval(editorPlaybackPoll);editorPlaybackPoll=null;}}));
$("editorReload").addEventListener("click",loadEditorData);
$("editorAdd").addEventListener("click",()=>{const last=editorCues[editorCues.length-1],start=last?Math.max(Number(last.endTime),0):0;editorCues.push({id:"new-"+Date.now(),text:"",startTime:start,endTime:start+3,voice:"",voiceEngine:""});renderEditorCues();setEditorStatus("Đã thêm đoạn mới. Nhập nội dung và điều chỉnh thời gian.");});
$("editorSave").addEventListener("click",()=>{if(!editorVideoId){setEditorStatus("Chưa tải được video để lưu.","error");return;}const invalid=editorCues.find(cue=>!String(cue.text||"").trim()||!Number.isFinite(Number(cue.startTime))||!Number.isFinite(Number(cue.endTime))||Number(cue.endTime)<=Number(cue.startTime));if(invalid){setEditorStatus("Có đoạn chưa có nội dung hoặc thời gian kết thúc không lớn hơn thời gian bắt đầu.","error");return;}setEditorStatus("Đang lưu bản biên tập...");editorMessage("SAVE_EDITOR_DATA",{videoId:editorVideoId,cues:editorCues},response=>{if(response.error){setEditorStatus(response.error,"error");return;}editorCues=(response.cues||editorCues).map(cue=>({...cue,voice:String(cue.voice||""),voiceEngine:String(cue.voiceEngine||"")}));editorCustom=true;renderEditorCues();setEditorStatus("Đã lưu. Bản phụ đề này sẽ được ưu tiên cho TTS và hiển thị trên video.","success");});});
$("editorReset").addEventListener("click",()=>{if(!editorVideoId||!editorCustom){setEditorStatus("Video này chưa có bản biên tập để khôi phục.");return;}if(!confirm("Khôi phục phụ đề gốc YouTube? Bản biên tập đã lưu của video này sẽ bị xóa."))return;editorMessage("RESET_EDITOR_DATA",{videoId:editorVideoId},response=>{if(response.error){setEditorStatus(response.error,"error");return;}loadEditorData();});});
