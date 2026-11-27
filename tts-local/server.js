#!/usr/bin/env node
"use strict";

// VieNeu local supervisor + voice manager. No npm dependencies.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");

const MODEL_ROOT = process.env.VIENEU_MODEL_ROOT ||
  path.join(process.env.USERPROFILE || process.env.HOME, ".lmstudio", "models", "pnnbao-ump", "VieNeu-TTS-v3-Turbo");
const RUNTIME_DIR = process.env.VIENEU_RUNTIME_DIR ||
  path.join(MODEL_ROOT, "audio-v0.9.6-bin-windows-x64-cpu-portable");
const CONFIG_PATH = process.env.VIENEU_CONFIG ||
  path.join(MODEL_ROOT, "server.json");
const VOICES_DIR = process.env.VIENEU_VOICES_DIR ||
  path.join(MODEL_ROOT, "voices");
const BACKEND_HOST = "127.0.0.1";
const BACKEND_PORT = Number(process.env.VIENEU_BACKEND_PORT || 8080);
const HOST = process.env.VIENEU_WRAPPER_HOST || "127.0.0.1";
const PORT = Number(process.env.VIENEU_WRAPPER_PORT || 8081);
const SERVER_EXE = path.join(RUNTIME_DIR, "audiocpp_server.exe");
const MODEL_ID = process.env.VIENEU_MODEL_ID || "vieneu";

let backendProcess = null;
let restartChain = Promise.resolve();

function sendJson(res, status, value) {
  const body = Buffer.from(JSON.stringify(value, null, 2), "utf8");
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": body.length,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(body);
}

function readConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

function writeConfig(config) {
  const tempPath = CONFIG_PATH + ".tmp";
  fs.writeFileSync(tempPath, JSON.stringify(config, null, 2) + "\n", "utf8");
  fs.renameSync(tempPath, CONFIG_PATH);
}

function modelConfig(config) {
  const models = Array.isArray(config.models) ? config.models : [];
  const model = models.find(item => item.id === MODEL_ID);
  if (!model) throw new Error("Không tìm thấy model id '" + MODEL_ID + "' trong server.json");
  return model;
}

function currentVoiceSlug(model) {
  const file = model.default_request_options?.speaker_embedding_file;
  if (!file) return null;
  const parent = path.basename(path.dirname(file));
  return parent || null;
}

function listVoices() {
  if (!fs.existsSync(VOICES_DIR)) {
    throw new Error("Không tìm thấy thư mục voices: " + VOICES_DIR);
  }
  const config = readConfig();
  const model = modelConfig(config);
  const selected = currentVoiceSlug(model);
  const entries = fs.readdirSync(VOICES_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const id = entry.name;
      const dir = path.join(VOICES_DIR, id);
      const embedding = path.join(dir, "speaker.emb.txt");
      const codes = path.join(dir, "ref_codes.txt");
      const hasEmbedding = fs.existsSync(embedding) && fs.statSync(embedding).size > 0;
      const hasCodes = fs.existsSync(codes) && fs.statSync(codes).size > 0;
      return {
        id,
        name: id.split(/[_-]+/).map(part => part ? part[0].toUpperCase() + part.slice(1) : "").join(" "),
        available: hasEmbedding && hasCodes,
        selected: id === selected,
        files: { speaker_embedding: hasEmbedding, reference_codes: hasCodes }
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  return { model: MODEL_ID, selected_voice: selected, count: entries.length, voices: entries };
}

function requestBackend(method, route, body, timeoutMs = 1500) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: BACKEND_HOST,
      port: BACKEND_PORT,
      path: route,
      method,
      timeout: timeoutMs
    }, res => {
      const chunks = [];
      res.on("data", chunk => chunks.push(chunk));
      res.on("end", () => resolve({
        status: res.statusCode || 502,
        headers: res.headers,
        body: Buffer.concat(chunks)
      }));
    });
    req.on("timeout", () => req.destroy(new Error("Backend timeout")));
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function waitForBackend(timeoutMs = 60000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const result = await requestBackend("GET", "/health", null, 1200);
      if (result.status >= 200 && result.status < 300) return;
    } catch (_) {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error("audio.cpp không sẵn sàng sau " + timeoutMs + " ms. Kiểm tra log của tiến trình.");
}

async function stopBackend() {
  if (!backendProcess || backendProcess.exitCode !== null) {
    backendProcess = null;
    return;
  }
  const child = backendProcess;
  await new Promise(resolve => {
    const timer = setTimeout(() => {
      try { child.kill(); } catch (_) {}
      resolve();
    }, 5000);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
    try { child.kill(); } catch (_) {
      clearTimeout(timer);
      resolve();
    }
  });
  if (backendProcess === child) backendProcess = null;
}

async function startBackend() {
  if (!fs.existsSync(SERVER_EXE)) throw new Error("Không tìm thấy " + SERVER_EXE);
  if (!fs.existsSync(CONFIG_PATH)) throw new Error("Không tìm thấy " + CONFIG_PATH);
  await stopBackend();
  backendProcess = spawn(SERVER_EXE, ["--config", CONFIG_PATH], {
    cwd: RUNTIME_DIR,
    stdio: "inherit",
    windowsHide: false
  });
  const child = backendProcess;
  child.once("error", error => {
    console.error("Không chạy được audiocpp_server.exe:", error.message);
    if (backendProcess === child) backendProcess = null;
  });
  child.once("exit", (code, signal) => {
    if (backendProcess === child) backendProcess = null;
    if (code !== 0 && code !== null) {
      console.error("audio.cpp đã thoát, exit code:", code, "signal:", signal || "");
    }
  });
  await waitForBackend();
}

function selectVoice(voiceId) {
  restartChain = restartChain.catch(() => {}).then(async () => {
    if (typeof voiceId !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(voiceId)) {
      const error = new Error("voice phải là id thư mục hợp lệ, ví dụ pham_tuyen");
      error.status = 400;
      throw error;
    }
    const voiceDir = path.join(VOICES_DIR, voiceId);
    const embedding = path.join(voiceDir, "speaker.emb.txt");
    const codes = path.join(voiceDir, "ref_codes.txt");
    if (!fs.existsSync(embedding) || !fs.statSync(embedding).size ||
        !fs.existsSync(codes) || !fs.statSync(codes).size) {
      const error = new Error("Voice '" + voiceId + "' không tồn tại hoặc thiếu speaker.emb.txt/ref_codes.txt");
      error.status = 404;
      throw error;
    }

    const config = readConfig();
    const model = modelConfig(config);
    const oldEmbedding = model.default_request_options?.speaker_embedding_file;
    const oldCodes = model.default_request_options?.reference_codes_file;
    model.default_request_options = model.default_request_options || {};
    model.default_request_options.speaker_embedding_file = embedding.replace(/\\/g, "/");
    model.default_request_options.reference_codes_file = codes.replace(/\\/g, "/");
    writeConfig(config);

    try {
      await startBackend();
    } catch (error) {
      // Restore the previous configuration if the selected voice cannot start.
      if (oldEmbedding) model.default_request_options.speaker_embedding_file = oldEmbedding;
      if (oldCodes) model.default_request_options.reference_codes_file = oldCodes;
      writeConfig(config);
      try { await startBackend(); } catch (_) {}
      throw error;
    }
    return { selected_voice: voiceId, restarted: true };
  });
  return restartChain;
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) throw Object.assign(new Error("Request body quá lớn"), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch (_) { throw Object.assign(new Error("JSON không hợp lệ"), { status: 400 }); }
}

function proxy(req, res) {
  const headers = { ...req.headers, host: BACKEND_HOST + ":" + BACKEND_PORT };
  const upstream = http.request({
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: req.url,
    method: req.method,
    headers
  }, upstreamRes => {
    const responseHeaders = { ...upstreamRes.headers };
    responseHeaders["access-control-allow-origin"] = "*";
    responseHeaders["access-control-allow-methods"] = "GET, POST, OPTIONS";
    responseHeaders["access-control-allow-headers"] = "Content-Type";
    res.writeHead(upstreamRes.statusCode || 502, responseHeaders);
    upstreamRes.pipe(res);
  });
  upstream.on("error", error => {
    if (!res.headersSent) sendJson(res, 502, { error: "Không kết nối được audio.cpp", detail: error.message });
    else res.destroy(error);
  });
  req.pipe(upstream);
}

const app = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    return res.end();
  }

  try {
    if (req.method === "GET" && req.url === "/api/voices") {
      return sendJson(res, 200, listVoices());
    }
    if (req.method === "POST" && req.url === "/api/voices/select") {
      const body = await readJsonBody(req);
      const result = await selectVoice(body.voice);
      return sendJson(res, 200, { ok: true, ...result });
    }
    if (req.method === "GET" && req.url === "/api/status") {
      let backend = false;
      try {
        const result = await requestBackend("GET", "/health");
        backend = result.status >= 200 && result.status < 300;
      } catch (_) {}
      return sendJson(res, 200, {
        ok: true,
        wrapper: "running",
        backend,
        model: MODEL_ID,
        backend_url: "http://" + BACKEND_HOST + ":" + BACKEND_PORT
      });
    }
    return proxy(req, res);
  } catch (error) {
    return sendJson(res, error.status || 500, { error: error.message });
  }
});

app.listen(PORT, HOST, async () => {
  console.log("VieNeu wrapper: http://" + HOST + ":" + PORT);
  console.log("Voice API:      http://" + HOST + ":" + PORT + "/api/voices");
  try {
    await startBackend();
    console.log("audio.cpp backend is ready on port " + BACKEND_PORT);
  } catch (error) {
    console.error("Không khởi động được audio.cpp:", error.message);
  }
});

process.on("SIGINT", async () => {
  await stopBackend();
  app.close(() => process.exit(0));
});
process.on("SIGTERM", async () => {
  await stopBackend();
  app.close(() => process.exit(0));
});
