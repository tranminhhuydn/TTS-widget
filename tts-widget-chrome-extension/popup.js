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
          root.querySelector("#closeBtn")?.click();
          root.classList.remove("reader-open");
          root.querySelector("#ttsWidgetReader")?.classList.remove("open");
          root.style.removeProperty("display");
          root.dataset.extensionActive = "true";
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

refreshState();
