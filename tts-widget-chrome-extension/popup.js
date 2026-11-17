"use strict";

const toggleButton = document.getElementById("toggleButton");
const statusNode = document.getElementById("status");

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
          root.style.removeProperty("display");
          root.dataset.extensionActive = "true";
          return true;
        }
      });

      if (!existing?.result) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["lib/tts-widget.js", "content.js"]
        });
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

refreshState();
