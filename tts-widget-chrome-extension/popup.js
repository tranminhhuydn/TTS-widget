"use strict";

const activateButton = document.getElementById("activateButton");
const statusNode = document.getElementById("status");

function showStatus(message, type) {
  statusNode.textContent = message;
  statusNode.className = "status" + (type ? " " + type : "");
}

activateButton.addEventListener("click", async () => {
  activateButton.disabled = true;
  showStatus("Đang kích hoạt TTS-widget…");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || typeof tab.id !== "number") {
      throw new Error("Không xác định được tab hiện tại.");
    }

    const url = tab.url || "";
    if (/^(chrome|edge|about|chrome-extension|devtools):/i.test(url)) {
      throw new Error("Chrome không cho phép Extension chạy trên trang nội bộ này.");
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["lib/tts-widget.js", "content.js"]
    });

    showStatus("Đã gửi bộ đọc vào trang. Tìm nút “Đọc nội dung này” ở góc dưới bên phải.", "success");
  } catch (error) {
    showStatus(error && error.message ? error.message : "Không thể kích hoạt trên tab này.", "error");
  } finally {
    activateButton.disabled = false;
  }
});
