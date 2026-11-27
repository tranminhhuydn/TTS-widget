const $ = id => document.getElementById(id);
let currentTabId = null;
let selectedId = null;
let currentItems = [];

async function send(type, extra = {}) {
  return chrome.runtime.sendMessage({ type, tabId: currentTabId, ...extra });
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}
function shortUrl(url) {
  try {
    const u = new URL(url);
    return u.host + u.pathname + u.search;
  } catch { return url || ""; }
}
function setActive(active) {
  $("stateBadge").textContent = active ? "Đang lắng nghe" : "Đã tắt";
  $("stateBadge").classList.toggle("active", active);
  $("toggleListen").textContent = active ? "Dừng lắng nghe" : "Bắt đầu lắng nghe";
}
function renderList() {
  $("fileCount").textContent = String(currentItems.length);
  if (!currentItems.length) {
    $("fileList").innerHTML = '<div class="empty">Chưa ghi nhận request nào.</div>';
    return;
  }
  $("fileList").innerHTML = currentItems.map(item => `
    <button class="file-row ${item.id === selectedId ? "selected" : ""}" data-id="${escapeHtml(item.id)}">
      <span class="method">${escapeHtml(item.method)}</span>
      <span class="file-main">
        <span class="file-name">${escapeHtml(item.name || shortUrl(item.url))}</span>
        <span class="file-url">${escapeHtml(shortUrl(item.url))} · ${escapeHtml(item.mimeType || "unknown")}</span>
      </span>
      <span class="status">${item.status ?? (item.failed ? "Lỗi" : "…")}</span>
    </button>`).join("");
  $("fileList").querySelectorAll("[data-id]").forEach(button => {
    button.addEventListener("click", () => {
      selectedId = button.dataset.id;
      renderList();
      renderViewer(currentItems.find(x => x.id === selectedId));
    });
  });
}
function renderViewer(item) {
  if (!item) {
    $("viewerType").textContent = "Chưa chọn";
    $("viewer").innerHTML = '<div class="empty">Chọn một file trong danh sách để xem.</div>';
    return;
  }
  const metadata = `
    <div class="file-meta">
      <span class="key">Tên file</span><span class="value">${escapeHtml(item.name)}</span>
      <span class="key">URL</span><span class="value">${escapeHtml(item.url)}</span>
      <span class="key">HTTP</span><span class="value">${escapeHtml(item.status)} ${escapeHtml(item.statusText)}</span>
      <span class="key">Content-Type</span><span class="value">${escapeHtml(item.mimeType)}</span>
      <span class="key">Kích thước</span><span class="value">${item.bodySize != null ? item.bodySize.toLocaleString() + " bytes" : item.contentLength != null ? item.contentLength.toLocaleString() + " bytes" : "Không rõ"}</span>
    </div>`;
  if (item.isText && typeof item.bodyText === "string") {
    $("viewerType").textContent = "Text";
    $("viewer").innerHTML = metadata + `<pre class="text-content">${escapeHtml(item.bodyText)}</pre>`;
  } else if (item.bodyCaptured && item.isText && item.bodyTooLarge) {
    $("viewerType").textContent = "Text quá lớn";
    $("viewer").innerHTML = metadata + '<div class="binary-notice">Đây là dữ liệu dạng văn bản nhưng vượt giới hạn xem trước 500 KB.</div>';
  } else if (item.bodyCaptured && item.isText === false) {
    $("viewerType").textContent = "Nhị phân";
    $("viewer").innerHTML = metadata + '<div class="binary-notice">File này là dữ liệu nhị phân. Extension không giải mã hoặc hiển thị nội dung nhị phân.</div>';
  } else if (item.bodyError) {
    $("viewerType").textContent = "Không lấy được";
    $("viewer").innerHTML = metadata + `<div class="binary-notice">Không lấy được Response Body: ${escapeHtml(item.bodyError)}</div>`;
  } else {
    $("viewerType").textContent = "Đang tải";
    $("viewer").innerHTML = metadata + '<div class="empty">Đang chờ response hoàn tất hoặc website chưa trả về dữ liệu.</div>';
  }
}
async function refresh() {
  const state = await send("GET_STATE");
  if (!state.ok) throw new Error(state.error);
  setActive(state.active);
  currentItems = state.items || [];
  if (selectedId && !currentItems.some(x => x.id === selectedId)) selectedId = null;
  renderList();
  if (selectedId) renderViewer(currentItems.find(x => x.id === selectedId));
}
async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    $("tabHost").textContent = "Không xác định được tab";
    $("toggleListen").disabled = true;
    return;
  }
  currentTabId = tab.id;
  $("tabHost").textContent = tab.url || tab.title || "Tab hiện tại";
  try { await refresh(); } catch (error) { $("tabHost").textContent = error.message; }
}
$("toggleListen").addEventListener("click", async () => {
  $("toggleListen").disabled = true;
  try {
    const active = $("stateBadge").classList.contains("active");
    const result = await send(active ? "STOP_LISTENING" : "START_LISTENING");
    if (!result.ok) throw new Error(result.error);
    setActive(result.active);
  } catch (error) {
    alert("Không thể thay đổi trạng thái Network Listener. " + error.message);
  } finally {
    $("toggleListen").disabled = false;
  }
});
$("clearList").addEventListener("click", async () => {
  await send("CLEAR_ITEMS");
  currentItems = [];
  selectedId = null;
  renderList();
  renderViewer(null);
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "session" && changes["networkItems_" + currentTabId]) {
    currentItems = changes["networkItems_" + currentTabId].newValue || [];
    renderList();
    if (selectedId) renderViewer(currentItems.find(x => x.id === selectedId));
  }
});
init();
