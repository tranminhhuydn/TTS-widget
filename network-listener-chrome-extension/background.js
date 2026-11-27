const CDP_VERSION = "1.3";
const MAX_BODY_CHARS = 500_000;
const MAX_ITEMS = 300;
const itemsByTab = new Map();
const requestsByTab = new Map();
const attachedTabs = new Set();

const TEXT_MIME = /^(text\/|application\/(json|\w+\+json|xml|javascript|x-javascript|graphql|x-www-form-urlencoded)|image\/svg\+xml)/i;
const BINARY_MIME = /^(image\/(?!svg\+xml)|audio\/|video\/|font\/|application\/(octet-stream|pdf|zip|gzip|x-rar|wasm))/i;

function tabItems(tabId) {
  if (!itemsByTab.has(tabId)) itemsByTab.set(tabId, []);
  return itemsByTab.get(tabId);
}
function tabRequests(tabId) {
  if (!requestsByTab.has(tabId)) requestsByTab.set(tabId, new Map());
  return requestsByTab.get(tabId);
}
function fileName(url) {
  try {
    const u = new URL(url);
    const part = u.pathname.split("/").filter(Boolean).pop();
    return decodeURIComponent(part || u.hostname);
  } catch {
    return url;
  }
}
function isTextPayload(bytes, mimeType) {
  if (BINARY_MIME.test(mimeType || "")) return false;
  if (TEXT_MIME.test(mimeType || "")) return true;
  const sample = bytes.subarray(0, Math.min(bytes.length, 4096));
  if (!sample.length) return true;
  let suspicious = 0;
  for (const byte of sample) {
    if (byte === 0) return false;
    if ((byte < 9) || (byte > 13 && byte < 32)) suspicious++;
  }
  return suspicious / sample.length < 0.02;
}
function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
function headersToObject(headers = {}) {
  const out = {};
  if (Array.isArray(headers)) {
    for (const h of headers) {
      if (h && h.name != null) out[String(h.name).toLowerCase()] = String(h.value ?? "");
    }
  } else if (headers && typeof headers === "object") {
    for (const [name, value] of Object.entries(headers)) {
      out[String(name).toLowerCase()] = String(value ?? "");
    }
  }
  return out;
}
function updateItem(tabId, item) {
  const list = tabItems(tabId);
  const index = list.findIndex(x => x.id === item.id);
  if (index >= 0) list[index] = { ...list[index], ...item };
  else list.unshift(item);
  if (list.length > MAX_ITEMS) list.length = MAX_ITEMS;
  chrome.storage.session.set({ ["networkItems_" + tabId]: list }).catch(() => {});
}
async function loadItems(tabId) {
  if (itemsByTab.has(tabId)) return tabItems(tabId);
  const key = "networkItems_" + tabId;
  const stored = await chrome.storage.session.get(key);
  itemsByTab.set(tabId, stored[key] || []);
  return tabItems(tabId);
}
async function getBody(tabId, requestId, item) {
  try {
    const result = await chrome.debugger.sendCommand(
      { tabId }, "Network.getResponseBody", { requestId }
    );
    const bytes = result.base64Encoded
      ? base64ToBytes(result.body)
      : new TextEncoder().encode(result.body);
    const textual = isTextPayload(bytes, item.mimeType);
    const next = {
      ...item,
      bodyCaptured: true,
      isText: textual,
      bodySize: bytes.byteLength
    };
    if (textual) {
      if (bytes.byteLength <= MAX_BODY_CHARS) {
        next.bodyText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      } else {
        next.bodyTooLarge = true;
      }
    } else {
      next.bodyText = undefined;
    }
    updateItem(tabId, next);
  } catch (error) {
    updateItem(tabId, {
      ...item,
      bodyCaptured: false,
      bodyError: error?.message || "Không lấy được response body"
    });
  }
}
chrome.debugger.onEvent.addListener((source, method, params) => {
  const tabId = source.tabId;
  if (typeof tabId !== "number") return;

  if (method === "Network.requestWillBeSent") {
    const req = params.request || {};
    tabRequests(tabId).set(params.requestId, {
      id: params.requestId,
      url: req.url,
      method: req.method,
      requestHeaders: headersToObject(req.headers),
      startedAt: Date.now(),
      resourceType: params.type || "Other"
    });
    return;
  }

  if (method === "Network.responseReceived") {
    const response = params.response || {};
    const req = tabRequests(tabId).get(params.requestId) || {};
    const headers = headersToObject(response.headers);
    const item = {
      id: params.requestId,
      url: response.url || req.url || "",
      name: fileName(response.url || req.url || ""),
      method: req.method || "GET",
      status: response.status,
      statusText: response.statusText || "",
      mimeType: response.mimeType || headers["content-type"] || "unknown",
      contentLength: Number(headers["content-length"]) || null,
      resourceType: params.type || req.resourceType || "Other",
      startedAt: req.startedAt || Date.now(),
      finished: false,
      bodyCaptured: false
    };
    updateItem(tabId, item);
    tabRequests(tabId).set(params.requestId, { ...req, item });
    return;
  }

  if (method === "Network.loadingFinished") {
    const req = tabRequests(tabId).get(params.requestId);
    if (!req?.item) return;
    updateItem(tabId, { ...req.item, finished: true, encodedDataLength: params.encodedDataLength });
    getBody(tabId, params.requestId, req.item);
    tabRequests(tabId).delete(params.requestId);
    return;
  }

  if (method === "Network.loadingFailed") {
    const req = tabRequests(tabId).get(params.requestId);
    if (req?.item) updateItem(tabId, { ...req.item, failed: true, failureText: params.errorText });
    tabRequests(tabId).delete(params.requestId);
  }
});

chrome.debugger.onDetach.addListener(source => {
  if (typeof source.tabId !== "number") return;
  attachedTabs.delete(source.tabId);
  chrome.storage.session.set({ ["networkActive_" + source.tabId]: false }).catch(() => {});
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    const tabId = message.tabId;
    if (typeof tabId !== "number") throw new Error("Không xác định được tab hiện tại");

    if (message.type === "START_LISTENING") {
      if (!attachedTabs.has(tabId)) {
        await chrome.debugger.attach({ tabId }, CDP_VERSION);
        attachedTabs.add(tabId);
        await chrome.debugger.sendCommand({ tabId }, "Network.enable", {
          maxTotalBufferSize: 10_000_000,
          maxResourceBufferSize: 2_000_000
        });
      }
      await chrome.storage.session.set({ ["networkActive_" + tabId]: true });
      sendResponse({ ok: true, active: true });
      return;
    }

    if (message.type === "STOP_LISTENING") {
      if (attachedTabs.has(tabId)) {
        await chrome.debugger.detach({ tabId });
        attachedTabs.delete(tabId);
      }
      await chrome.storage.session.set({ ["networkActive_" + tabId]: false });
      sendResponse({ ok: true, active: false });
      return;
    }

    if (message.type === "GET_STATE") {
      const stored = await chrome.storage.session.get(["networkActive_" + tabId, "networkItems_" + tabId]);
      sendResponse({
        ok: true,
        active: attachedTabs.has(tabId) || stored["networkActive_" + tabId] === true,
        items: await loadItems(tabId)
      });
      return;
    }

    if (message.type === "CLEAR_ITEMS") {
      itemsByTab.set(tabId, []);
      await chrome.storage.session.remove("networkItems_" + tabId);
      sendResponse({ ok: true });
    }
  })().catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
  return true;
});

chrome.tabs.onRemoved.addListener(tabId => {
  itemsByTab.delete(tabId);
  requestsByTab.delete(tabId);
  attachedTabs.delete(tabId);
  chrome.storage.session.remove(["networkItems_" + tabId, "networkActive_" + tabId]).catch(() => {});
});