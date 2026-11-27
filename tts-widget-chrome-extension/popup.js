"use strict";

const toggleButton = document.getElementById("toggleButton");
const statusNode = document.getElementById("status");
const darkModeToggle = document.getElementById("darkModeToggle");
const pageFontSize = document.getElementById("pageFontSize");
const pageFontEnabled = document.getElementById("pageFontEnabled");
const pageFontSizeValue = document.getElementById("pageFontSizeValue");
const ttsVolume = document.getElementById("ttsVolume");
const ttsVolumeValue = document.getElementById("ttsVolumeValue");
async function loadTtsVolume(){
  if(!ttsVolume)return;
  const stored=await chrome.storage.sync.get({ttsVolume:1});
  const value=Math.min(1,Math.max(0,Number(stored.ttsVolume)));
  ttsVolume.value=String(value);
  ttsVolumeValue.textContent=Math.round(value*100)+"%";
}
async function saveTtsVolume(){
  const value=Math.min(1,Math.max(0,Number(ttsVolume.value)));
  await chrome.storage.sync.set({ttsVolume:value});
  ttsVolumeValue.textContent=Math.round(value*100)+"%";
  try{
    const tab=await getActiveTab();
    await chrome.scripting.executeScript({target:{tabId:tab.id},func:(volume)=>{
      const key="tts-widget-settings-v2";let settings={};
      try{settings=JSON.parse(localStorage.getItem(key)||"{}")}catch(_){}
      settings.volume=volume;
      try{localStorage.setItem(key,JSON.stringify(settings))}catch(_){}
      document.dispatchEvent(new CustomEvent("tts-widget:volume-change",{detail:{volume}}));
      window.TTSYouTubeHybrid?.setVolume(volume);
    },args:[value]});
  }catch(_){}
}
if(ttsVolume){
  ttsVolume.addEventListener("input",()=>{ttsVolumeValue.textContent=Math.round(Number(ttsVolume.value)*100)+"%";});
  ttsVolume.addEventListener("change",()=>saveTtsVolume().catch(error=>showStatus(error?.message||"Không lưu được âm lượng.","error")));
}
async function loadAppearanceSettings(){const s=await chrome.storage.sync.get({darkMode:false,pageFontEnabled:false,pageFontSize:16});darkModeToggle.checked=s.darkMode===true;pageFontEnabled.checked=s.pageFontEnabled===true;pageFontSize.value=String(s.pageFontSize);pageFontSize.disabled=!pageFontEnabled.checked;pageFontSizeValue.textContent=s.pageFontSize+" px";}
async function applyAppearanceToActiveTab(){
  const tab=await getActiveTab();
  const settings=await chrome.storage.sync.get({darkMode:false,pageFontEnabled:false,pageFontSize:16});
  await chrome.scripting.executeScript({target:{tabId:tab.id},files:["theme.js"]});
  const [result]=await chrome.scripting.executeScript({
    target:{tabId:tab.id},
    func:(value)=>{
      if(typeof globalThis.__ttsWidgetApplyTheme!=="function") return false;
      globalThis.__ttsWidgetApplyTheme(value);
      return true;
    },
    args:[settings]
  });
  if(!result?.result) throw new Error("Không khởi tạo được bộ điều khiển giao diện trên trang.");
}
async function saveAppearanceSettings(){
  const s={darkMode:darkModeToggle.checked,pageFontEnabled:pageFontEnabled.checked,pageFontSize:Number(pageFontSize.value)};
  await chrome.storage.sync.set(s);
  pageFontSizeValue.textContent=s.pageFontSize+" px";
  try {
    await applyAppearanceToActiveTab();
    showStatus("Đã áp dụng giao diện cho tab hiện tại.","success");
  } catch(error) {
    showStatus("Đã lưu cài đặt. Không thể áp dụng trên tab này; hãy thử tải lại trang. "+(error?.message||""),"error");
  }
}
darkModeToggle.addEventListener("change",async()=>{darkModeToggle.disabled=true;try{await saveAppearanceSettings();}catch(error){darkModeToggle.checked=!darkModeToggle.checked;showStatus(error?.message||"Không lưu được chế độ ban đêm.","error");}finally{darkModeToggle.disabled=false;}});
pageFontEnabled.addEventListener("change",async()=>{pageFontSize.disabled=!pageFontEnabled.checked;pageFontEnabled.disabled=true;try{await saveAppearanceSettings();}catch(error){pageFontEnabled.checked=!pageFontEnabled.checked;pageFontSize.disabled=!pageFontEnabled.checked;showStatus(error?.message||"Không lưu được tùy chọn cỡ chữ.","error");}finally{pageFontEnabled.disabled=false;}});
pageFontSize.addEventListener("input",()=>{pageFontSizeValue.textContent=pageFontSize.value+" px";});
pageFontSize.addEventListener("change",async()=>{pageFontSize.disabled=true;try{await saveAppearanceSettings();}catch(error){showStatus(error?.message||"Không lưu được cỡ chữ.","error");}finally{pageFontSize.disabled=false;}});

function showStatus(message, type) {
  statusNode.textContent = message;
  statusNode.className = "status" + (type ? " " + type : "");
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || typeof tab.id !== "number") throw new Error("Không xác định được tab hiện tại.");
  if (/^(chrome|edge|about|chrome-extension|devtools):/i.test(tab.url || "")) {
    throw new Error("Chrome không cho phép Extension chạy trên trang nội bộ này.");
  }
  return tab;
}

async function refreshState() {
  try {
    const tab = await getActiveTab();
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => !!(document.querySelector(".tts-widget-root")?.dataset.extensionActive === "true")
    });
    const active = !!result?.result;
    toggleButton.textContent = active ? "Tắt trên trang này" : "Kích hoạt trên trang này";
    showStatus(active ? "TTS-widget đang được kích hoạt trên tab này." : "TTS-widget hiện đang tắt trên tab này.");
  } catch (error) {
    toggleButton.textContent = "Kích hoạt trên trang này";
    showStatus(error?.message || "Không thể kiểm tra trạng thái tab.", "error");
  }
}

toggleButton.addEventListener("click", async () => {
  toggleButton.disabled = true;
  try {
    const tab = await getActiveTab();
    const currentUrl=new URL(tab.url||"");
    const isYouTube=/(^|\.)youtube\.com$/i.test(currentUrl.hostname)&&currentUrl.pathname==="/watch";
    if(isYouTube){
      const [youtubeState]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>document.querySelector(".tts-widget-root")?.dataset.extensionActive==="true"});
      if(youtubeState?.result){
        await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>window.TTSYouTubeHybrid?.deactivate()});
        toggleButton.textContent="Kích hoạt trên trang này";
        showStatus("Đã tắt đọc phụ đề YouTube.","success");
      }else{
        await chrome.scripting.executeScript({target:{tabId:tab.id},files:["youtube-subtitle-parser.js","youtube-hybrid-sync.js","youtube-hybrid.js","content.js"]});
        const [verify]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>document.querySelector(".tts-widget-root")?.dataset.extensionActive==="true"});
        if(!verify?.result){showStatus("Chưa khởi tạo được bộ đọc phụ đề. Hãy kiểm tra video có phụ đề hay không.","error");return;}
        toggleButton.textContent="Tắt trên trang này";
        showStatus("Đã bật đọc phụ đề YouTube. Điều khiển phát/tạm dừng bằng YouTube.","success");
      }
      return;
    }
    const [state] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => !!(document.querySelector(".tts-widget-root")?.dataset.extensionActive === "true")
    });

    if (state?.result) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const root = document.querySelector(".tts-widget-root");
          if (!root) return false;
          root.querySelector("#stopBtn")?.click();
          root.querySelector("#closeBtn")?.click();
          root.dataset.extensionActive = "false";
          root.style.setProperty("display", "none", "important");
          document.documentElement.removeAttribute("data-tts-widget-page-theme");
          document.documentElement.style.removeProperty("--tts-widget-page-font-size");
          document.getElementById("tts-widget-page-appearance")?.remove();
          return true;
        }
      });
      toggleButton.textContent = "Kích hoạt trên trang này";
      showStatus("Đã tắt TTS-widget trên tab hiện tại.", "success");
    } else {
      const [existing] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const root = document.querySelector(".tts-widget-root");
          if (!root) return false;
          root.querySelector("#closeBtn")?.click();
          root.classList.remove("reader-open");
          root.querySelector("#ttsWidgetReader")?.classList.remove("open");
          root.style.removeProperty("display");
          root.dataset.extensionActive = "true";
          window.TTSWidget?.applyAppearance?.();
          const launcher = root.querySelector("#openReaderBtn");
          if (launcher) {
            launcher.style.setProperty("display", "inline-flex", "important");
            launcher.style.setProperty("visibility", "visible", "important");
            launcher.style.setProperty("opacity", "1", "important");
          }
          return true;
        }
      });

      if (!existing?.result) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["lib/tts-widget.js", "content.js"]
        });
      }

      // Verify the actual launcher before reporting a successful activation.
      const [verification] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const root = document.querySelector(".tts-widget-root");
          const launcher = root?.querySelector("#openReaderBtn");
          if (!root || !launcher || root.dataset.extensionActive !== "true") {
            return { active: false, reason: "Không tạo được nút loa trên trang này." };
          }
          const style = getComputedStyle(launcher);
          const rect = launcher.getBoundingClientRect();
          const visible = style.display !== "none" && style.visibility !== "hidden" &&
            Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
          return { active: visible, reason: visible ? "" : "Widget đã tạo nhưng nút loa đang bị ẩn." };
        }
      });
      if (!verification?.result?.active) {
        toggleButton.textContent = "Kích hoạt trên trang này";
        showStatus(verification?.result?.reason || "Không xác minh được nút loa.", "error");
        return;
      }
      toggleButton.textContent = "Tắt trên trang này";
      showStatus("Đã kích hoạt TTS-widget trên tab hiện tại.", "success");
    }
  } catch (error) {
    showStatus(error?.message || "Không thể thay đổi trạng thái TTS-widget.", "error");
  } finally {
    toggleButton.disabled = false;
  }
});

loadAppearanceSettings().catch(error=>showStatus(error?.message||'Không tải được cài đặt giao diện.','error'));
loadTtsVolume().catch(error=>showStatus(error?.message||'Không tải được âm lượng TTS.','error'));
refreshState();

