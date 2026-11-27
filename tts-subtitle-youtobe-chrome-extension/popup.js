const $=id=>document.getElementById(id);let tabId=null;
function showStatus(s){$("status").textContent=s;}
function send(type,value,callback){if(tabId===null)return;chrome.tabs.sendMessage(tabId,{target:"tts-subtitle-youtube",type,value},r=>{if(chrome.runtime.lastError){showStatus("Không thể kết nối. Hãy tải lại trang YouTube.");return;}if(r?.error)showStatus(r.error);if(callback)callback(r);});}
function loadState(){send("GET_STATE",null,r=>{if(!r)return;$("enabled").checked=r.enabled;$("rate").value=r.rate||1;$("rateValue").textContent=Number(r.rate||1).toFixed(1)+"×";$("volume").value=r.volume??1;$("volumeValue").textContent=Math.round((r.volume??1)*100)+"%";$("rotateVoices").checked=!!r.rotateVoices;$("autoLanguage").checked=r.autoLanguage!==false;const select=$("voices");select.innerHTML="";(r.voices||[]).forEach(v=>{const o=document.createElement("option");o.value=v.voiceURI;o.textContent=v.name+" ("+v.lang+")";o.selected=(r.voiceURIs||[]).includes(v.voiceURI);select.append(o);});showStatus("Đã kết nối với YouTube.");});}
chrome.tabs.query({active:true,currentWindow:true},tabs=>{const tab=tabs[0];if(!tab?.url||!/^https:\/\/(www\.)?youtube\.com\//.test(tab.url)){showStatus("Hãy mở video trên YouTube.");["enabled","rate","volume","voices","rotateVoices","autoLanguage","stop"].forEach(id=>$(id).disabled=true);return;}tabId=tab.id;loadState();});
$("enabled").addEventListener("change",e=>send("SET_ENABLED",e.target.checked,r=>{if(r?.enabled)showStatus("Đang đọc phụ đề theo thời gian video.");}));
$("rate").addEventListener("input",e=>{$("rateValue").textContent=Number(e.target.value).toFixed(1)+"×";send("SET_RATE",e.target.value);});
$("volume").addEventListener("input",e=>{$("volumeValue").textContent=Math.round(Number(e.target.value)*100)+"%";send("SET_VOLUME",e.target.value);});
$("voices").addEventListener("change",e=>send("SET_VOICES",Array.from(e.target.selectedOptions).map(o=>o.value)));
$("rotateVoices").addEventListener("change",e=>send("SET_ROTATE",e.target.checked));
$("autoLanguage").addEventListener("change",e=>send("SET_AUTO_LANGUAGE",e.target.checked));
$("stop").addEventListener("click",()=>send("STOP"));