/* TTS Widget - embeddable browser reader
 * Usage: <script src="tts-widget.js" defer data-content-selector="#article"></script>
 * Or call window.TTSWidget.init({ contentSelector: "#article" }).
 */
(function(){
"use strict";
const DEFAULTS={contentSelector:"article"};
let initialized=false;
let widgetRoot=null;
let config={...DEFAULTS};
function init(options={}){
  if(initialized)return window.TTSWidget;
  config={...DEFAULTS,...options};
  const source=document.querySelector(config.contentSelector);
  if(!source){console.error("[TTSWidget] Không tìm thấy vùng nội dung:",config.contentSelector);return null;}
  widgetRoot=document.createElement("div");
  widgetRoot.className="tts-widget-root";
  widgetRoot.innerHTML='<button type="button" class="tts-widget-launcher" id="openReaderBtn" aria-label="Đọc nội dung này" title="Đọc nội dung này"><span aria-hidden="true">🔊</span></button>'+"<div class=\"tts-widget-reader\" id=\"ttsWidgetReader\" aria-label=\"Cửa sổ đọc\">\n<div class=\"reader-toolbar\" id=\"readerToolbar\">\n<div class=\"toolbar-row\">\n<button class=\"danger\" id=\"closeBtn\" title=\"Đóng (Esc)\">✕</button>\n<button id=\"prevBtn\" title=\"Đoạn trước\">⏮</button>\n<button id=\"playBtn\" title=\"Đọc\">▶</button>\n<button id=\"pauseBtn\" title=\"Tạm dừng\">⏸</button>\n<button class=\"danger\" id=\"stopBtn\" title=\"Dừng\">■</button>\n<button id=\"nextBtn\" title=\"Đoạn tiếp\">⏭</button>\n<button class=\"secondary\" id=\"settingsBtn\" title=\"Cài đặt\">⚙</button>\n</div>\n</div>\n<div class=\"settings-panel\" id=\"settingsPanel\">\n<div class=\"settings-grid\">\n<section class=\"setting-group\"><h3>Tùy chọn đọc</h3>\n<label for=\"settingToolbarPosition\">Vị trí thanh điều khiển</label><select id=\"settingToolbarPosition\"><option value=\"header\">Header - Đầu trang</option><option value=\"footer\">Footer - Chân trang</option></select>\n<label><input type=\"checkbox\" id=\"settingBackgroundReading\" style=\"width:auto\" checked> Tiếp tục đọc khi chuyển tab hoặc cửa sổ mất tiêu điểm</label>\n</section>\n<section class=\"setting-group\"><h3>Giọng đọc</h3>\n<div class=\"voice-row engine-select-row\"><label for=\"settingTtsEngine\">Bộ máy</label><select id=\"settingTtsEngine\"><option value=\"browser\">Browser TTS</option><option value=\"vieneu-gpu\">VieNeu GPU</option></select></div>\n<div id=\"browserVoiceSettings\" class=\"browser-voice-settings\"><div class=\"voice-panel\">\n<div class=\"voice-row\">\n<label for=\"voiceSelect\">Giọng đọc:</label><input id=\"voiceSearch\" placeholder=\"Lọc giọng đọc...\" aria-label=\"Tìm giọng đọc\" style=\"max-width:180px\">\n<select id=\"voiceSelect\"><option value=\"\">Đang tải danh sách giọng đọc...</option></select>\n<button class=\"secondary\" id=\"refreshVoicesBtn\">Làm mới</button>\n<button class=\"secondary\" id=\"testVoiceBtn\">Thử giọng</button>\n</div>\n<div class=\"voice-info\" id=\"voiceInfo\" aria-live=\"polite\">Đang tìm giọng đọc...</div>\n\n<div class=\"voice-rotation\">\n<strong>Danh sách giọng đọc luân phiên</strong>\n<label><input type=\"checkbox\" id=\"settingVoiceRotation\" style=\"width:auto\"> Bật luân phiên giọng đọc theo từng đoạn văn</label>\n<div class=\"voice-rotation-heading\"><span>Giọng đang chọn sẽ được thêm vào danh sách:</span><button class=\"secondary\" id=\"addRotationVoiceBtn\" type=\"button\">+ Thêm giọng này</button></div>\n<ol id=\"voiceRotationList\" aria-label=\"Thứ tự giọng đọc luân phiên\"><li>Chưa thêm giọng đọc nào.</li></ol>\n<p class=\"voice-rotation-help\">Cách dùng: chọn giọng trong ô “Giọng đọc”, sau đó nhấn “+ Thêm giọng này”. Lặp lại để thêm giọng 2, giọng 3... Có thể đổi thứ tự hoặc xóa từng giọng. Mỗi đoạn văn sẽ dùng giọng kế tiếp trong danh sách.</p>\n</div></div>\n<div id=\"gpuVoiceSettings\" class=\"local-voice-settings\" hidden><div class=\"voice-row\"><label for=\"settingGpuVoice\">Giọng đọc</label><button class=\"secondary\" id=\"refreshGpuVoicesBtn\" type=\"button\">↻ Tải lại</button></div><input id=\"settingGpuVoiceSearch\" type=\"search\" placeholder=\"Lọc giọng đọc GPU...\" aria-label=\"Tìm giọng đọc VieNeu GPU\"><select id=\"settingGpuVoice\" multiple size=\"6\" aria-describedby=\"gpuVoiceSelectHelp\"><option value=\"\">Đang tải danh sách giọng đọc...</option></select><p id=\"gpuVoiceSelectHelp\" class=\"voice-rotation-help\">Chọn một hoặc nhiều giọng (giữ Ctrl để chọn nhiều), giống danh sách giọng của bộ đọc YouTube. Nhấn “Thêm giọng đã chọn” để đưa vào thứ tự luân phiên.</p><div class=\"voice-row\"><button class=\"secondary\" id=\"testLocalVoiceBtn\" type=\"button\">Thử giọng</button></div><div class=\"voice-rotation\"><strong>Danh sách giọng đọc luân phiên</strong><div class=\"voice-rotation-heading\"><span>Các giọng đã chọn ở danh sách phía trên:</span><button class=\"secondary\" id=\"addGpuRotationVoiceBtn\" type=\"button\">+ Thêm giọng đã chọn</button></div><label><input type=\"checkbox\" id=\"settingGpuVoiceRotation\" style=\"width:auto\"> Bật luân phiên giọng đọc theo từng đoạn văn</label><ol id=\"gpuVoiceRotationList\" aria-label=\"Thứ tự giọng đọc VieNeu GPU\"><li>Chưa thêm giọng đọc nào.</li></ol><p class=\"voice-rotation-help\">Cách dùng: chọn giọng trong ô “Giọng đọc”, sau đó nhấn “+ Thêm giọng này”. Lặp lại để thêm giọng 2, giọng 3... Có thể đổi thứ tự hoặc xóa từng giọng. Mỗi đoạn văn sẽ dùng giọng kế tiếp trong danh sách. VieNeu GPU hỗ trợ chỉnh tốc độ và âm lượng riêng cho từng giọng.</p></div><div class=\"voice-info engine-status\" id=\"gpuVoiceStatus\" role=\"status\" aria-live=\"polite\">Chưa tải danh sách giọng đọc GPU.</div></div>\n<label for=\"settingRate\">Tốc độ đọc</label><input id=\"settingRate\" type=\"range\" min=\".6\" max=\"1.8\" step=\".05\" value=\"1\">\n<label for=\"settingPitch\">Cao độ</label><input id=\"settingPitch\" type=\"range\" min=\".5\" max=\"2\" step=\".05\" value=\"1\">\n<label for=\"settingVolume\">Âm lượng</label><input id=\"settingVolume\" type=\"range\" min=\"0\" max=\"1\" step=\".05\" value=\"1\">\n</section>\n<section class=\"setting-group\"><h3>Đồng bộ đọc</h3>\n<label><input type=\"checkbox\" id=\"settingSync\" style=\"width:auto\" checked> Theo dõi đoạn đang đọc</label>\n<label><input type=\"checkbox\" id=\"settingWordSync\" style=\"width:auto\" checked> Highlight từ nếu API hỗ trợ</label>\n<p style=\"font-size:12px\">Sự kiện ranh giới từ (onboundary) phụ thuộc giọng đọc và trình duyệt. Nếu không có sự kiện này, widget chỉ đánh dấu đoạn hiện tại.</p>\n</section>\n<section class=\"setting-group\"><h3>Highlight</h3>\n<label><input type=\"checkbox\" id=\"settingHighlight\" style=\"width:auto\" checked> Bật highlight đoạn</label>\n<label for=\"settingHighlightColor\">Màu nền highlight</label><input id=\"settingHighlightColor\" type=\"color\" value=\"#ffe58a\">\n<label for=\"settingTextColor\">Màu chữ highlight</label><input id=\"settingTextColor\" type=\"color\" value=\"#332600\">\n<label for=\"settingBorderColor\">Màu viền highlight</label><input id=\"settingBorderColor\" type=\"color\" value=\"#e0a800\">\n</section>\n</div>\n<div class=\"setting-actions\"><button class=\"secondary\" id=\"resetSettingsBtn\">Mặc định</button><button id=\"saveSettingsBtn\">Lưu cài đặt</button></div>\n</div>\n</div>\n<div class=\"reader-content\" id=\"readerContent\"></div>\n<div class=\"reader-status\" id=\"status\" aria-live=\"polite\"></div>\n</div>";
  const style=document.createElement("style");
  style.id="tts-widget-styles";
  style.textContent=`\n.tts-widget-root{font:16px/1.5 Arial,sans-serif;color:#263238;--tts-ui-font-size:16px}\n.tts-widget-root button{font:inherit;border:0;border-radius:7px;padding:9px 13px;background:#2463a6;color:#fff;cursor:pointer}\n.tts-widget-root button:hover:not(:disabled){filter:brightness(1.08)}\n.tts-widget-root button:disabled{opacity:.42;cursor:not-allowed}\n.tts-widget-root button.secondary{background:#64748b}\n.tts-widget-root button.danger{background:#b83a3a}\n.tts-widget-root button.active{outline:2px solid #fbbf24;outline-offset:2px}\n.tts-widget-root.reader-open .tts-widget-launcher{display:none!important;visibility:hidden!important;pointer-events:none!important}\n.tts-widget-root:not(.reader-open) .tts-widget-launcher{display:inline-flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}\n.tts-widget-root .tts-widget-launcher{appearance:none!important;-webkit-appearance:none!important;display:inline-flex!important;visibility:visible!important;opacity:1!important;position:fixed!important;right:16px!important;bottom:16px!important;left:auto!important;top:auto!important;z-index:2147483647!important;align-items:center!important;justify-content:center!important;gap:0!important;margin:0!important;padding:0!important;width:48px!important;height:48px!important;min-width:48px!important;min-height:48px!important;border:0!important;border-radius:50%!important;background:#2463a6!important;color:#fff!important;font:600 22px/1 Arial,sans-serif!important;text-align:center!important;white-space:nowrap!important;box-shadow:0 2px 12px #0004!important;pointer-events:auto!important;cursor:pointer!important}\n.tts-widget-root .tts-widget-reader{display:none;position:static;pointer-events:auto!important}\n.tts-widget-root .tts-widget-reader.open{display:block}\n.tts-widget-root .reader-toolbar{font-size:var(--tts-ui-font-size);position:fixed;top:12px;left:12px;right:12px;z-index:2147483000;pointer-events:auto;background:#263b55;color:#fff;padding:10px 12px;border-radius:10px;box-shadow:0 2px 8px #0002}\n.tts-widget-root .reader-toolbar.toolbar-bottom{top:auto;bottom:12px}\n.tts-widget-root .tts-widget-reader .toolbar-row{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:8px}\n.tts-widget-root .reader-toolbar select,.tts-widget-root .reader-toolbar input{max-width:240px;padding:7px;border-radius:5px;border:1px solid #ccc;color:#222;background:#fff}\n.tts-widget-root .reader-content{display:none}\n.tts-widget-root .reader-status{font-size:var(--tts-ui-font-size);display:none;position:fixed;right:16px;top:76px;z-index:2147483000;pointer-events:auto;background:#263b55;color:#fff;padding:5px 9px;border-radius:6px;font-size:12px;max-width:min(420px,calc(100vw - 32px))}\n.tts-widget-root .reader-status.visible{display:block}\n.tts-widget-root .settings-panel,.tts-widget-root .settings-panel *{pointer-events:auto!important}\n.tts-widget-root .settings-panel label{cursor:pointer}\n.tts-widget-root .settings-panel input[type=checkbox]{-webkit-appearance:checkbox!important;appearance:auto!important;display:inline-block!important;position:static!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;box-sizing:border-box!important;width:16px!important;min-width:16px!important;height:16px!important;margin:0 7px 0 0!important;padding:0!important;border:initial!important;border-radius:3px!important;vertical-align:middle!important;accent-color:#2463a6!important;cursor:pointer!important;flex:0 0 16px!important}\n.tts-widget-root .settings-panel label:has(input[type=checkbox]){display:flex!important;align-items:center!important;gap:4px!important;pointer-events:auto!important;cursor:pointer!important}\n.tts-widget-root .settings-panel{font-size:var(--tts-ui-font-size);display:none;position:fixed;top:76px;right:12px;z-index:2147483000;pointer-events:auto;max-width:min(1000px,calc(100vw - 24px));margin:0;padding:14px;background:#fff;color:#263238;border-radius:9px;max-height:65vh;overflow:auto;box-shadow:0 8px 28px #0003}\n.tts-widget-root .settings-panel .setting-group label,.tts-widget-root .settings-panel .setting-group p,.tts-widget-root .settings-panel .setting-group h3,.tts-widget-root .settings-panel .setting-group strong,.tts-widget-root .settings-panel .voice-info,.tts-widget-root .settings-panel .voice-rotation li,.tts-widget-root .settings-panel .voice-rotation-help{font-size:var(--tts-ui-font-size)!important}\n.tts-widget-root .settings-panel.open{display:block}\n.tts-widget-root .voice-panel{max-width:1000px;margin:10px auto 0;padding:10px 14px;background:#ffffff18;border-radius:8px}\n.tts-widget-root .voice-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:7px 0}\n.tts-widget-root .voice-row label{min-width:100px;font-size:14px}\n.tts-widget-root .voice-row select{flex:1;min-width:180px}\n.tts-widget-root .voice-info{font-size:12px;color:#dce5ef;margin-top:5px}\n.tts-widget-root .settings-panel .voice-panel{max-width:none;margin:0;padding:0;background:transparent}\n.tts-widget-root .settings-panel .voice-info{color:#475569}\n.tts-widget-root .voice-rotation{margin-top:12px;padding-top:10px;border-top:1px solid #dbe1e8}\n.tts-widget-root .voice-rotation-heading{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;font-size:13px}\n.tts-widget-root .voice-rotation ol{margin:8px 0;padding-left:24px}\n.tts-widget-root .voice-rotation li{display:flex;align-items:center;gap:6px;margin:5px 0;font-size:13px}\n.tts-widget-root .voice-rotation li span{flex:1}\n.tts-widget-root .voice-rotation li button{padding:3px 8px;font-size:12px}\n.tts-widget-root .voice-rotation li{align-items:flex-start}.tts-widget-root .rotation-voice-settings{flex:1;min-width:180px}.tts-widget-root .rotation-voice-settings strong{display:block;margin:2px 0 6px}.tts-widget-root .rotation-setting-row{display:grid!important;grid-template-columns:76px minmax(80px,1fr) 42px;align-items:center;gap:6px;margin:3px 0!important;font-size:12px!important}.tts-widget-root .rotation-setting-row input{width:100%;padding:0!important}.tts-widget-root .rotation-setting-row output{text-align:right;font-variant-numeric:tabular-nums}\n.tts-widget-root .voice-rotation-help{font-size:12px;color:#64748b;margin:7px 0 0}\n.tts-widget-root .settings-panel.open{display:block}\n.tts-widget-root .tts-widget-reader.toolbar-at-footer .reader-status{top:auto;bottom:76px}\n.tts-widget-root .settings-grid{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:14px;width:100%}
.tts-widget-root .settings-grid>.setting-group{display:block!important;flex:0 0 auto!important;width:100%!important;max-width:none!important;min-width:0!important;grid-column:1/-1!important}\n.tts-widget-root .setting-group{border:1px solid #dbe1e8;border-radius:8px;padding:12px}\n.tts-widget-root .setting-group h3{font-size:15px;margin:0 0 10px}\n.tts-widget-root .setting-group label{display:block;font-size:13px;margin:8px 0 4px}\n.tts-widget-root .setting-group input,.tts-widget-root .setting-group select{width:100%;padding:7px;border:1px solid #cbd5e1;border-radius:5px}\n.tts-widget-root .setting-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}\n .tts-widget-root .reader-context-menu{font-size:var(--tts-ui-font-size);position:fixed;z-index:2147483001;display:none;pointer-events:auto;min-width:170px;padding:6px;background:#fff;color:#1f2937;border:1px solid #cbd5e1;border-radius:9px;box-shadow:0 8px 28px #0003}\n.tts-widget-root .reader-context-menu.open{display:block}\n.tts-widget-root .reader-context-menu button{display:block;width:100%;padding:9px 12px;text-align:left;background:transparent;color:#1f2937;border-radius:5px}\n.tts-widget-root .reader-context-menu button:hover{background:#eaf2fb;filter:none}\n\n.tts-widget-root[data-theme="dark"] .settings-panel{background:#18212f!important;color:#e5edf7!important;border:1px solid #3b4a60!important}\n.tts-widget-root[data-theme="dark"] .setting-group{background:#202c3d!important;border-color:#43536a!important}\n.tts-widget-root[data-theme="dark"] .setting-group h3,.tts-widget-root[data-theme="dark"] .settings-panel label,.tts-widget-root[data-theme="dark"] .settings-panel p,.tts-widget-root[data-theme="dark"] .settings-panel strong,.tts-widget-root[data-theme="dark"] .settings-panel span{color:#e5edf7!important}\n.tts-widget-root[data-theme="dark"] .settings-panel input:not([type="checkbox"]):not([type="range"]):not([type="color"]),.tts-widget-root[data-theme="dark"] .settings-panel select{background:#111a27!important;color:#e5edf7!important;border-color:#52647d!important}\n.tts-widget-root[data-theme="dark"] .settings-panel input[type="range"]{accent-color:#7db4ff}\n.tts-widget-root[data-theme="dark"] .voice-rotation{border-color:#43536a!important}\n.tts-widget-root[data-theme="dark"] .voice-rotation-help,.tts-widget-root[data-theme="dark"] .settings-panel .voice-info{color:#b8c6d8!important}\n.tts-widget-root[data-theme="dark"] .reader-toolbar{background:#111a27!important;color:#f1f5f9!important}\n.tts-widget-root[data-theme="dark"] .reader-status{background:#111a27!important;color:#f1f5f9!important;border:1px solid #43536a}\n.tts-widget-root[data-theme="dark"] .reader-context-menu{background:#18212f!important;color:#e5edf7!important;border-color:#43536a!important}\n.tts-widget-root[data-theme="dark"] .reader-context-menu button{color:#e5edf7!important}\n.tts-widget-root[data-theme="dark"] .reader-context-menu button:hover{background:#2b3b50!important}\n@media(max-width:700px){.tts-widget-root .reader-content{margin-top:22px}.tts-widget-root .reader-toolbar select{max-width:100%}.tts-widget-root .voice-row label{min-width:78px}}\n
.tts-widget-root .engine-select-row{align-items:center}
.tts-widget-root .engine-select-row label{min-width:100px}
.tts-widget-root .engine-select-row select{flex:1;min-width:180px}
.tts-widget-root .local-voice-settings{margin:8px 0;padding:10px;border:1px solid #dbe1e8;border-radius:7px}
.tts-widget-root .local-voice-settings[hidden]{display:none!important}
.tts-widget-root .local-voice-settings select,.tts-widget-root .local-voice-settings input{width:100%;padding:7px;border:1px solid #cbd5e1;border-radius:5px}
.tts-widget-root .local-voice-settings .voice-row button{width:auto;white-space:nowrap}
.tts-widget-root .engine-help{margin:6px 0 0;font-size:12px;color:#64748b}
.tts-widget-root .engine-status{margin-top:6px}
.tts-widget-root[data-theme="dark"] .local-voice-settings{border-color:#43536a}
.tts-widget-root[data-theme="dark"] .engine-help{color:#b8c6d8}
/* Settings redesign: responsive sidebar and focused sections */
.tts-widget-root .settings-panel{width:min(960px,calc(100vw - 24px));max-width:960px;max-height:min(80vh,820px);padding:16px}
.tts-widget-root .settings-layout{display:grid;grid-template-columns:180px minmax(0,1fr);gap:16px;align-items:start}
.tts-widget-root .settings-nav{display:flex;flex-direction:column;gap:5px;position:sticky;top:0}
.tts-widget-root .settings-nav button{width:100%;display:flex;align-items:center;gap:9px;text-align:left;padding:10px 12px;background:transparent;color:#475569;font-size:14px;font-weight:600}
.tts-widget-root .settings-nav button:hover{background:#eef4fb;filter:none}
.tts-widget-root .settings-nav button[aria-pressed=\"true\"]{background:#e7f0fb;color:#174f88;box-shadow:inset 3px 0 #2463a6}
.tts-widget-root .settings-main{min-width:0}
.tts-widget-root .settings-intro{margin:0 0 12px;color:#64748b;font-size:13px}
.tts-widget-root .settings-grid{display:block!important;width:100%}
.tts-widget-root .settings-grid>.setting-group{display:none!important;width:100%!important;margin:0}
.tts-widget-root .settings-grid>.setting-group.is-active{display:block!important}
.tts-widget-root .setting-group{padding:16px}
.tts-widget-root .setting-group h3{font-size:17px;margin:0 0 14px}
.tts-widget-root .setting-group label{margin:12px 0 6px}
.tts-widget-root .settings-panel input[type=\"range\"]{accent-color:#2463a6}
.tts-widget-root .audio-controls{display:grid;grid-template-columns:1fr;gap:10px}
.tts-widget-root .audio-control{padding:12px;border:1px solid #dbe1e8;border-radius:8px}
.tts-widget-root .audio-control label{display:flex;justify-content:space-between;align-items:center;margin:0 0 8px;font-weight:600}
.tts-widget-root .audio-control input[type=\"range\"]{margin:0}
.tts-widget-root .settings-panel .setting-actions{position:sticky;bottom:-16px;padding:12px 0 0;margin-top:14px;background:inherit;border-top:1px solid #dbe1e8}
.tts-widget-root[data-theme=\"dark\"] .settings-nav button{color:#cbd5e1}
.tts-widget-root[data-theme=\"dark\"] .settings-nav button:hover{background:#2b3b50}
.tts-widget-root[data-theme=\"dark\"] .settings-nav button[aria-pressed=\"true\"]{background:#263b55;color:#bfdbfe}
.tts-widget-root[data-theme=\"dark\"] .settings-intro{color:#b8c6d8}
.tts-widget-root[data-theme=\"dark\"] .audio-control{border-color:#43536a}
.tts-widget-root[data-theme=\"dark\"] .settings-panel .setting-actions{border-color:#43536a}
@media(max-width:640px){
 .tts-widget-root .settings-panel{top:62px;right:8px;width:calc(100vw - 16px);max-height:calc(100vh - 74px);padding:12px}
 .tts-widget-root .settings-layout{grid-template-columns:minmax(0,1fr);gap:10px}
 .tts-widget-root .settings-nav{position:static;display:flex;flex-direction:row;overflow-x:auto;padding-bottom:4px}
 .tts-widget-root .settings-nav button{width:auto;min-width:max-content;justify-content:center;padding:8px 10px}
 .tts-widget-root .settings-nav button[aria-pressed=\"true\"]{box-shadow:inset 0 -3px #2463a6}
 .tts-widget-root .setting-group{padding:12px}
 .tts-widget-root .voice-row{align-items:stretch}
 .tts-widget-root .voice-row label{min-width:100%}
 .tts-widget-root .setting-actions{position:sticky;bottom:-12px}
}
`;
  document.head.append(style);
  const highlightStyle=document.createElement("style");highlightStyle.id="tts-widget-highlight-colors";document.head.append(highlightStyle);
  document.body.append(widgetRoot);
  // Recompose the existing settings controls into accessible navigation sections.
  const settingsPanelElement=widgetRoot.querySelector("#settingsPanel");
  const settingsGridElement=widgetRoot.querySelector(".settings-grid");
  if(settingsPanelElement&&settingsGridElement){
    const groups=[...settingsGridElement.querySelectorAll(":scope > .setting-group")];
    const [readingGroup,voiceGroup,syncGroup,highlightGroup]=groups;
    const audioGroup=document.createElement("section");
    audioGroup.className="setting-group";
    audioGroup.innerHTML="<h3>Âm thanh</h3><p class=\"settings-intro\">Điều chỉnh các thông số phát âm thanh. Tốc độ áp dụng cho cả Browser TTS và VieNeu; cao độ chỉ áp dụng cho Browser TTS.</p><div class=\"audio-controls\"></div>";
    const audioControls=audioGroup.querySelector(".audio-controls");
    [["settingRate","Tốc độ đọc"],["settingPitch","Cao độ"],["settingVolume","Âm lượng"]].forEach(([id,labelText])=>{
      const input=widgetRoot.querySelector("#"+id);
      const label=widgetRoot.querySelector('label[for="'+id+'"]');
      if(!input||!label)return;
      const card=document.createElement("div");card.className="audio-control";
      label.textContent=labelText;
      card.append(label,input);audioControls.append(card);
    });
    const sections=[
      {id:"voice",label:"Giọng đọc",icon:"🎙",group:voiceGroup},
      {id:"audio",label:"Âm thanh",icon:"🔊",group:audioGroup},
      {id:"reading",label:"Tùy chọn đọc",icon:"📖",group:readingGroup},
      {id:"sync",label:"Đồng bộ đọc",icon:"🔄",group:syncGroup},
      {id:"highlight",label:"Highlight",icon:"🖍",group:highlightGroup}
    ];
    const layout=document.createElement("div");layout.className="settings-layout";
    const nav=document.createElement("nav");nav.className="settings-nav";nav.setAttribute("aria-label","Danh mục cài đặt Reader");
    const main=document.createElement("div");main.className="settings-main";
    const intro=document.createElement("p");intro.className="settings-intro";intro.textContent="Tùy chỉnh cách Reader đọc và hiển thị nội dung.";
    main.append(intro);
    sections.forEach((section,index)=>{
      const button=document.createElement("button");button.type="button";button.dataset.settingsTab=section.id;
      button.setAttribute("aria-controls","reader-settings-"+section.id);button.setAttribute("aria-pressed",String(index===0));
      button.innerHTML="<span aria-hidden=\"true\">"+section.icon+"</span><span>"+section.label+"</span>";
      nav.append(button);
      section.group.dataset.settingsSection=section.id;section.group.id="reader-settings-"+section.id;
      section.group.classList.toggle("is-active",index===0);
      section.group.setAttribute("aria-label",section.label);
      settingsGridElement.append(section.group);
      button.addEventListener("click",()=>{
        nav.querySelectorAll("button").forEach(item=>item.setAttribute("aria-pressed",String(item===button)));
        settingsGridElement.querySelectorAll("[data-settings-section]").forEach(item=>item.classList.toggle("is-active",item===section.group));
      });
    });
    layout.append(nav,main);main.append(settingsGridElement);
    settingsPanelElement.append(layout);
  }
  /* SETTINGS MANAGER */
class SettingsManager {
  constructor(){this.key="tts-widget-settings-v2";this.defaults={rate:1,pitch:1,volume:1,highlight:true,wordSync:true,sync:true,keepBackgroundReading:true,toolbarPosition:"header",theme:"system",fontSize:16,voiceRotationEnabled:false,highlightColor:"#ffe58a",textColor:"#332600",borderColor:"#e0a800"};this.value=this.load();
    document.addEventListener("tts-widget:volume-change",event=>{const value=Number(event.detail?.volume);if(Number.isFinite(value)){this.value.volume=Math.min(1,Math.max(0,value));this.save();}});
    try{
      if(typeof chrome!=="undefined"&&chrome.storage?.sync){
        chrome.storage.sync.get({ttsVolume:null},result=>{const value=Number(result.ttsVolume);if(result.ttsVolume!==null&&Number.isFinite(value)){this.value.volume=Math.min(1,Math.max(0,value));this.save();const slider=widgetRoot.querySelector("#settingVolume");if(slider)slider.value=String(this.value.volume);}});
        chrome.storage.onChanged.addListener((changes,area)=>{if(area==="sync"&&changes.ttsVolume){const value=Number(changes.ttsVolume.newValue);if(Number.isFinite(value)){this.value.volume=Math.min(1,Math.max(0,value));this.save();const slider=widgetRoot.querySelector("#settingVolume");if(slider)slider.value=String(this.value.volume);}}});
      }
    }catch(_){}
  }
  load(){try{const saved=JSON.parse(localStorage.getItem(this.key)||"{}");const value={...this.defaults,...(saved&&typeof saved==="object"&&!Array.isArray(saved)?saved:{})};
    ["font","size","line","width","autoScroll","compact"].forEach(key=>delete value[key]);
    const number=(key,min,max)=>{const n=Number(value[key]);value[key]=Number.isFinite(n)?Math.min(max,Math.max(min,n)):this.defaults[key];};
    number("rate",0.6,1.8);number("pitch",0.5,2);number("volume",0,1);number("fontSize",12,24);
    if(!["light","dark","system"].includes(value.theme))value.theme=this.defaults.theme;
    ["highlight","wordSync","sync","keepBackgroundReading","voiceRotationEnabled"].forEach(key=>{value[key]=typeof value[key]==="boolean"?value[key]:this.defaults[key];});
    if(!["header","footer"].includes(value.toolbarPosition))value.toolbarPosition=this.defaults.toolbarPosition;
    ["highlightColor","textColor","borderColor"].forEach(key=>{if(typeof value[key]!=="string"||!/^#[0-9a-f]{6}$/i.test(value[key]))value[key]=this.defaults[key];});
    return value;
  }catch(_){return {...this.defaults};}}
  save(){try{localStorage.setItem(this.key,JSON.stringify(this.value));}catch(_){}try{if(typeof chrome!=="undefined"&&chrome.storage?.sync)chrome.storage.sync.set({ttsVolume:this.value.volume});}catch(_){}}
  reset(){this.value={...this.defaults};this.save();}
}

/* VOICE MANAGER */
class VoiceManager {
  constructor(){
    this.voices=[];this.selected=null;this.select=widgetRoot.querySelector("#voiceSelect");this.search=widgetRoot.querySelector("#voiceSearch");this.info=widgetRoot.querySelector("#voiceInfo");this.storageKey="tts-widget-voice-v1";this.rotationStorageKey="tts-widget-voice-rotation-v1";this.rotation=[];this.rotationList=widgetRoot.querySelector("#voiceRotationList");this.onChange=()=>{};
    this.storedIdentity="";this.userSelected=false;this.hasInitialSelection=false;this.retryAttempt=0;this.retryTimer=null;this.retryDelays=[150,300,600,1000,1500];
    try{this.storedIdentity=localStorage.getItem(this.storageKey)||"";const stored=JSON.parse(localStorage.getItem(this.rotationStorageKey)||"[]");if(Array.isArray(stored))this.rotation=stored.map(item=>{if(typeof item==="string")return {identity:item,rate:null,pitch:null,volume:null};if(!item||typeof item.identity!=="string")return null;return {identity:item.identity,rate:item.rate!==null&&item.rate!==undefined&&Number.isFinite(Number(item.rate))?Math.min(1.8,Math.max(0.6,Number(item.rate))):null,pitch:item.pitch!==null&&item.pitch!==undefined&&Number.isFinite(Number(item.pitch))?Math.min(2,Math.max(0.5,Number(item.pitch))):null,volume:item.volume!==null&&item.volume!==undefined&&Number.isFinite(Number(item.volume))?Math.min(1,Math.max(0,Number(item.volume))):null};}).filter(Boolean);}catch(_){}
    
    this.rotationList.addEventListener("input",event=>{const input=event.target.closest("input[data-setting]");if(!input)return;const index=Number(input.dataset.index),key=input.dataset.setting;if(!Number.isInteger(index)||!this.rotation[index]||!["rate","pitch","volume"].includes(key))return;this.rotation[index][key]=Number(input.value);const output=Array.from(this.rotationList.querySelectorAll("output[data-setting]")).find(node=>node.dataset.index===String(index)&&node.dataset.setting===key);if(output)output.value=Number(input.value).toFixed(2);this.saveRotation();});
    this.rotationList.addEventListener("click",event=>{const button=event.target.closest("button[data-action][data-identity]");if(!button||!this.rotationList.contains(button))return;event.preventDefault();event.stopPropagation();const index=this.rotation.findIndex(item=>item.identity===button.dataset.identity);if(index<0)return;const action=button.dataset.action;if(action==="remove")this.rotation.splice(index,1);else if(action==="up"&&index>0)[this.rotation[index-1],this.rotation[index]]=[this.rotation[index],this.rotation[index-1]];else if(action==="down"&&index<this.rotation.length-1)[this.rotation[index+1],this.rotation[index]]=[this.rotation[index],this.rotation[index+1]];else return;this.saveRotation();this.renderRotation();});
    widgetRoot.querySelector("#addRotationVoiceBtn").addEventListener("click",()=>this.addSelectedToRotation());
    this.search.addEventListener("input",()=>this.render());this.select.addEventListener("change",()=>this.choose(this.select.value));
    try{if(typeof chrome!=="undefined"&&chrome.storage?.sync)chrome.storage.sync.get({ttsVoiceIdentity:""},result=>{if(result.ttsVoiceIdentity&&!this.userSelected){this.storedIdentity=result.ttsVoiceIdentity;this.load();}});}catch(_){}
  }
  identity(v){return v?v.voiceURI+"|"+v.name+"|"+v.lang:"";}
  clearRetry(){if(this.retryTimer!==null){clearTimeout(this.retryTimer);this.retryTimer=null;}}
  scheduleRetry(){
    if(this.retryTimer!==null||this.retryAttempt>=this.retryDelays.length)return;
    const delay=this.retryDelays[this.retryAttempt++];
    this.retryTimer=setTimeout(()=>{this.retryTimer=null;this.load();},delay);
  }
  refresh(){this.clearRetry();this.retryAttempt=0;this.load();}
  handleVoicesChanged(){this.clearRetry();this.retryAttempt=0;this.load();}
  load(){
    if(!("speechSynthesis" in window)){this.info.textContent="Trình duyệt không hỗ trợ SpeechSynthesis.";return;}
    let available=[];
    try{available=window.speechSynthesis.getVoices()||[];}catch(_){}
    if(!available.length){
      if(!this.voices.length){
        this.select.replaceChildren();const option=document.createElement("option");option.value="";option.textContent=this.retryAttempt>=this.retryDelays.length?"Chưa tìm thấy giọng đọc":"Đang tải danh sách giọng đọc...";this.select.append(option);
        this.info.textContent=this.retryAttempt>=this.retryDelays.length?"Chưa tải được danh sách giọng đọc. Hãy nhấn Làm mới.":"Đang chờ trình duyệt cung cấp danh sách giọng đọc...";
      }
      this.scheduleRetry();return;
    }
    // A non-empty list may still be incomplete: some browsers expose voices in stages.
    // Keep the bounded retry sequence alive so late-arriving voices can be discovered
    // even if the browser does not emit another voiceschanged event.
    const unique=new Map();available.forEach(voice=>{const key=this.identity(voice);if(key&&!unique.has(key))unique.set(key,voice);});
    this.voices=Array.from(unique.values());
    this.render();
    this.renderRotation();
    const currentIdentity=this.identity(this.selected);
    let chosen=null;
    if(!this.userSelected&&this.storedIdentity)chosen=this.voices.find(v=>this.identity(v)===this.storedIdentity)||null;
    if(!chosen&&currentIdentity)chosen=this.voices.find(v=>this.identity(v)===currentIdentity)||null;
    if(!chosen&&!this.hasInitialSelection){
      chosen=this.voices.find(v=>/^vi(?:-|$)/i.test(v.lang))||this.voices.find(v=>v.default)||this.voices[0]||null;
    }
    if(!chosen)chosen=this.voices.find(v=>v.default)||this.voices[0]||null;
    this.selected=chosen;
    this.hasInitialSelection=!!chosen||this.hasInitialSelection;
    this.syncSelection();
    if(chosen)this.updateInfo(chosen);
    else this.info.textContent="Đã tải "+this.voices.length+" giọng đọc. Hãy chọn giọng muốn dùng.";
    this.scheduleRetry();
  }
  render(){
    const query=this.search.value.trim().toLocaleLowerCase(),selectedIdentity=this.identity(this.selected);
    this.select.replaceChildren();
    this.voices.forEach(voice=>{
      if(query&&!((voice.name+" "+voice.lang).toLocaleLowerCase().includes(query)))return;
      const option=document.createElement("option");option.value=this.identity(voice);option.textContent=voice.name+" ("+voice.lang+")"+(voice.default?" - Mặc định":"");this.select.append(option);
    });
    if(!this.select.options.length){const option=document.createElement("option");option.value="";option.textContent="Không có kết quả";this.select.append(option);}
    this.select.value=selectedIdentity&&Array.from(this.select.options).some(option=>option.value===selectedIdentity)?selectedIdentity:"";
  }
  syncSelection(){
    const selectedIdentity=this.identity(this.selected);
    this.select.value=selectedIdentity&&Array.from(this.select.options).some(option=>option.value===selectedIdentity)?selectedIdentity:"";
  }
  updateInfo(voice){this.info.textContent="Đã chọn: "+voice.name+" | "+voice.lang+(voice.localService?" | Trên thiết bị":" | Dịch vụ");}
  saveRotation(){try{localStorage.setItem(this.rotationStorageKey,JSON.stringify(this.rotation));}catch(_){}}
  addSelectedToRotation(){const identity=this.select.value||this.identity(this.selected);if(!identity||!this.voices.some(voice=>this.identity(voice)===identity))return;if(this.rotation.some(item=>item.identity===identity)){this.info.textContent="Giọng này đã có trong danh sách luân phiên.";return;}const s=settings.value;this.rotation.push({identity,rate:Number(s.rate),pitch:Number(s.pitch),volume:Number(s.volume)});this.saveRotation();this.renderRotation();}
  renderRotation(){this.rotationList.replaceChildren();if(!this.rotation.length){const item=document.createElement("li");item.textContent="Chưa thêm giọng đọc nào.";this.rotationList.append(item);return;}this.rotation.forEach((entry,index)=>{const voice=this.voices.find(item=>this.identity(item)===entry.identity);if(!voice)return;const s=settings.value,li=document.createElement("li"),panel=document.createElement("div"),title=document.createElement("strong");panel.className="rotation-voice-settings";title.textContent="Giọng "+(index+1)+": "+voice.name+" ("+voice.lang+")";panel.append(title);[["volume","Âm lượng",0,1,0.05],["rate","Tốc độ",0.6,1.8,0.05],["pitch","Độ cao",0.5,2,0.05]].forEach(([key,label,min,max,step])=>{const row=document.createElement("label"),name=document.createElement("span"),input=document.createElement("input"),output=document.createElement("output");row.className="rotation-setting-row";name.textContent=label;input.type="range";input.min=String(min);input.max=String(max);input.step=String(step);input.value=String(entry[key]??s[key]);input.dataset.index=String(index);input.dataset.setting=key;output.value=Number(input.value).toFixed(2);output.dataset.index=String(index);output.dataset.setting=key;row.append(name,input,output);panel.append(row);});li.append(panel);[["up","↑"],["down","↓"],["remove","Xóa"]].forEach(([action,text])=>{const button=document.createElement("button");button.type="button";button.className="secondary";button.dataset.action=action;button.dataset.identity=entry.identity;button.textContent=text;button.title=action==="up"?"Chuyển lên":action==="down"?"Chuyển xuống":"Xóa giọng";button.disabled=(action==="up"&&index===0)||(action==="down"&&index===this.rotation.length-1);li.append(button);});this.rotationList.append(li);});}
  getRotationVoices(){return this.rotation.map(entry=>this.voices.find(voice=>this.identity(voice)===entry.identity)).filter(Boolean);}
  getRotationEntry(identity){return this.rotation.find(entry=>entry.identity===identity)||null;}
  choose(identity,persist=true){
    const voice=this.voices.find(item=>this.identity(item)===identity);if(!voice)return;
    this.selected=voice;this.hasInitialSelection=true;this.userSelected=true;this.syncSelection();this.updateInfo(voice);
    if(persist){this.storedIdentity=this.identity(voice);try{localStorage.setItem(this.storageKey,this.storedIdentity);}catch(_){}try{if(typeof chrome!=="undefined"&&chrome.storage?.sync)chrome.storage.sync.set({ttsVoiceIdentity:this.storedIdentity});}catch(_){}}
    this.onChange(voice);
  }
}

/* READER MANAGER */
class ReaderManager {
  constructor(){this.root=widgetRoot.querySelector("#ttsWidgetReader");this.content=widgetRoot.querySelector("#readerContent");this.source=null;this.blocks=[];this.active=-1;this.highlightStyleSnapshots=new WeakMap();}
  refreshContent(){
    // Re-resolve the selector every time: SPA frameworks can replace the
    // original main/article node without reloading the document.
    this.source=document.querySelector(config.contentSelector);
    if(!this.source){this.blocks=[];this.active=-1;return false;}
    const nextBlocks=[];
    const candidates=Array.from(this.source.querySelectorAll("p,h1,h2,h3,h4,h5,h6,li,blockquote,pre"));
    // Some dynamic pages keep duplicate/hidden renderings of the same list.
    // Track exact list-item text per list container to avoid enqueuing both copies.
    const seenListItems=new WeakMap();
    candidates.forEach(el=>{
      const style=window.getComputedStyle(el);
      if(style.display==="none"||style.visibility==="hidden"||el.getClientRects().length===0)return;
      if(!["LI","BLOCKQUOTE","PRE"].includes(el.tagName)&&el.closest("li,blockquote,pre"))return;
      if(el.tagName==="LI"&&el.parentElement?.closest("blockquote,pre"))return;
      let text;
      if(el.tagName==="LI"){
        const clone=el.cloneNode(true);
        clone.querySelectorAll("ul,ol").forEach(list=>list.remove());
        text=(clone.innerText||clone.textContent||"").trim();
        const list=el.parentElement;
        if(list){
          let seen=seenListItems.get(list);
          if(!seen){seen=new Set();seenListItems.set(list,seen);}
          const key=text.replace(/\s+/g," ").trim();
          if(key&&seen.has(key))return;
          if(key)seen.add(key);
        }
      }else{
        text=(el.innerText||el.textContent||"").trim();
      }
      if(text)nextBlocks.push({element:el,text});
    });
    this.blocks=nextBlocks;
    this.active=-1;
    return true;
  }
  open(){
    if(!this.refreshContent()){console.error("[TTSWidget] Không tìm thấy vùng nội dung:",config.contentSelector);return;}
    this.root.classList.add("open");
    widgetRoot.classList.add("reader-open");
    const launcher=widgetRoot.querySelector("#openReaderBtn");
    launcher?.style.setProperty("display","none","important");
    launcher?.style.setProperty("visibility","hidden","important");
    launcher?.style.setProperty("pointer-events","none","important");
    this.root.style.setProperty("display","block","important");
    this.root.style.setProperty("visibility","visible","important");
    widgetRoot.querySelector("#status").classList.remove("visible");
    mountReaderContextMenu();
  }
  close(){
    unmountReaderContextMenu();
    this.root.classList.remove("open");
    widgetRoot.classList.remove("reader-open");
    this.root.style.setProperty("display","none","important");
    const launcher=widgetRoot.querySelector("#openReaderBtn");
    launcher?.style.setProperty("display","inline-flex","important");
    launcher?.style.setProperty("visibility","visible","important");
    launcher?.style.setProperty("opacity","1","important");
    launcher?.style.setProperty("pointer-events","auto","important");
    widgetRoot.querySelector("#status").classList.remove("visible");
    this.clearHighlight();this.blocks=[];this.source=null;this.active=-1;
  }
  setActive(index,settings){if(index<0||index>=this.blocks.length)return;this.clearHighlight();this.active=index;const element=this.blocks[index].element;if(settings.value.highlight&&settings.value.sync){element.classList.add("tts-widget-reading-active");element.setAttribute("data-tts-widget-active","true");const properties=["background-color","background-image","color","outline","outline-offset","box-shadow","border-radius"];const snapshot={};properties.forEach(name=>{snapshot[name]={value:element.style.getPropertyValue(name),priority:element.style.getPropertyPriority(name)};});this.highlightStyleSnapshots.set(element,snapshot);element.style.setProperty("background-color",settings.value.highlightColor,"important");element.style.setProperty("background-image","linear-gradient("+settings.value.highlightColor+","+settings.value.highlightColor+")","important");element.style.setProperty("color",settings.value.textColor,"important");element.style.setProperty("outline","2px solid "+settings.value.borderColor,"important");element.style.setProperty("outline-offset","3px","important");element.style.setProperty("box-shadow","inset 0 0 0 1px "+settings.value.borderColor,"important");element.style.setProperty("border-radius","5px","important");}if(settings.value.sync&&element?.isConnected){const rect=element.getBoundingClientRect();const margin=120;const outsideViewport=rect.top<margin||rect.bottom>window.innerHeight-margin;if(outsideViewport){const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;element.scrollIntoView({behavior:reducedMotion?"auto":"smooth",block:"center",inline:"nearest"});}}}
  clearHighlight(){this.blocks.forEach(block=>{const element=block.element;element.classList.remove("tts-widget-reading-active");element.removeAttribute("data-tts-widget-active");const snapshot=this.highlightStyleSnapshots.get(element);if(snapshot){Object.entries(snapshot).forEach(([name,original])=>{if(original.value)element.style.setProperty(name,original.value,original.priority);else element.style.removeProperty(name);});this.highlightStyleSnapshots.delete(element);}});if(window.CSS?.highlights){try{window.CSS.highlights.delete("tts-widget-word");}catch(_){}}}
  getBlocks(){return this.blocks;}
}

/* HIGHLIGHT MANAGER */
class HighlightManager {
  constructor(reader,settings){this.reader=reader;this.settings=settings;this.boundarySupported=false;}
  paragraph(index){this.reader.setActive(index,this.settings);}
  word(index,charIndex,charLength,utteranceText){const s=this.settings.value,block=this.reader.blocks[index];if(!s.wordSync||!s.highlight||!block||!window.CSS?.highlights||typeof window.Highlight!=="function")return;
    try{window.CSS.highlights.delete("tts-widget-word");}catch(_){return;}
    const utterance=String(utteranceText||"");if(!utterance)return;
    const collapse=value=>String(value).replace(/[\\s\\u00a0]+/g," ").trim();
    const spoken=collapse(utterance);if(!spoken)return;
    const chars=[],positions=[],walker=document.createTreeWalker(block.element,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){const value=node.textContent||"";for(let i=0;i<value.length;i++){const ch=value[i];if(/[\\s\\u00a0]/.test(ch)){if(chars.length&&chars[chars.length-1]!==" "){chars.push(" ");positions.push({node,offset:i});}}else{chars.push(ch);positions.push({node,offset:i});}}}
    const source=chars.join(""),base=source.indexOf(spoken);if(base<0)return;
    const rawIndex=Math.max(0,Math.min(utterance.length,Number(charIndex)||0));
    const prefix=collapse(utterance.slice(0,rawIndex));
    const start=base+prefix.length;if(start>=positions.length)return;
    let length=Number(charLength)||0;
    if(length>0)length=collapse(utterance.slice(rawIndex,Math.min(utterance.length,rawIndex+length))).length;
    if(length<=0){length=1;while(start+length<positions.length&&chars[start+length]!==" ")length++;}
    const end=Math.min(positions.length,start+Math.max(1,length));const first=positions[start],last=positions[end-1];if(!first||!last)return;
    try{const range=document.createRange();range.setStart(first.node,first.offset);range.setEnd(last.node,last.offset+1);window.CSS.highlights.set("tts-widget-word",new window.Highlight(range));}catch(error){console.debug("[TTSWidget] Không thể tạo highlight từ:",error);}}
  applyColors(){const s=this.settings.value,style=highlightStyle;if(style)style.textContent="html body .tts-widget-reading-active,html body [data-tts-widget-active=\"true\"]{background-color:"+s.highlightColor+" !important;background-image:linear-gradient("+s.highlightColor+","+s.highlightColor+") !important;color:"+s.textColor+" !important;outline:2px solid "+s.borderColor+" !important;outline-offset:3px;box-shadow:inset 0 0 0 1px "+s.borderColor+" !important;border-radius:5px}::highlight(tts-widget-word){background-color:#ffbd59 !important;color:#241500 !important;text-decoration:underline;text-decoration-color:#e0a800}";}
}

/* SPEECH MANAGER */
class SpeechManager {
  constructor(reader,voices,settings,highlight){this.reader=reader;this.voices=voices;this.settings=settings;this.highlight=highlight;this.synth=window.speechSynthesis;this.queue=[];this.position=0;this.state="idle";this.session=0;this.current=null;this.currentStarted=false;this.currentCharIndex=0;this.backgroundInterrupted=false;this.onState=()=>{};}
  emit(message){widgetRoot.querySelector("#status").textContent=message;this.onState();}
  makeQueue(){
    this.queue=[];
    let paragraphVoiceIndex=0;
    this.reader.blocks.forEach((b,paragraph)=>{
      // Reader treats paragraphs, headings, list items and quotations as
      // separate readable blocks. Rotate once per block, not only for <p>,
      // so GPU rotation also works on pages built with lists or headings.
      const voiceRotationIndex=paragraphVoiceIndex++;
      // Code blocks are not prose: sentence punctuation such as "." in
      // console.log or file paths must not split them into misleading pieces.
      if(b.element&&b.element.tagName==="PRE"){
        const words=b.text.replace(/\s+/g," ").trim().split(" ");
        let part="";
        words.forEach(word=>{
          if(part&&part.length+word.length+1>220){
            this.queue.push({text:part,paragraph,voiceRotationIndex});
            part="";
          }
          part+=(part?" ":"")+word;
        });
        if(part)this.queue.push({text:part,paragraph,voiceRotationIndex});
        return;
      }
      const sentences=b.text.match(/[^.!?。！？]+[.!?。！？]?/g)||[b.text];
      let part="";
      sentences.forEach(sentence=>{
        if(part.length+sentence.length>220&&part){
          this.queue.push({text:part.trim(),paragraph,voiceRotationIndex});
          part="";
        }
        part+=sentence;
        if(part.length>=220){
          this.queue.push({text:part.trim(),paragraph,voiceRotationIndex});
          part="";
        }
      });
      if(part.trim())this.queue.push({text:part.trim(),paragraph,voiceRotationIndex});
    });
  }
  start(paragraph=0){widgetRoot.querySelector("#status").classList.add("visible");if(!this.reader.blocks.length){this.emit("Không có nội dung để đọc.");return;}this.stop(false);this.makeQueue();this.position=this.queue.findIndex(x=>x.paragraph>=paragraph);if(this.position<0)this.position=0;this.state="reading";const id=this.session;this.emit("Đang chuẩn bị đọc...");this.next(id);}
  next(id){if(id!==this.session||this.state!=="reading")return;if(this.position>=this.queue.length){this.state="ended";this.current=null;this.currentStarted=false;this.reader.clearHighlight();this.emit("Đã đọc xong.");return;}this.speakCurrent(id);}
  speakCurrent(id,startOffset=0){
    if(id!==this.session||this.state!=="reading")return;
    const item=this.queue[this.position];if(!item)return;
    const s=this.settings.value;
    const rotation=this.settings.value.voiceRotationEnabled?this.voices.rotation:[];
    const gpuRotation=this.settings.value.voiceRotationEnabled?gpuVoiceRotation:[];
    const gpuRotationEntry=gpuRotation.length&&item.voiceRotationIndex!==null&&item.voiceRotationIndex!==undefined?gpuRotation[item.voiceRotationIndex%gpuRotation.length]:null;
    const rotationEntry=rotation.length&&item.voiceRotationIndex!==null&&item.voiceRotationIndex!==undefined?rotation[item.voiceRotationIndex%rotation.length]:null;
    const voice=rotationEntry?this.voices.voices.find(candidate=>this.voices.identity(candidate)===rotationEntry.identity)||this.voices.selected:this.voices.selected;
    const voiceSettings=rotationEntry&&this.voices.voices.some(candidate=>this.voices.identity(candidate)===rotationEntry.identity)?rotationEntry:s;
    const speakBrowser=()=>{
      if(id!==this.session||this.state!=="reading")return;
      if(!isSpeechSynthesisSupported()){this.state="error";this.emit("Browser TTS không được hỗ trợ và VieNeu TTS chưa sẵn sàng.");return;}
      const utterance=new SpeechSynthesisUtterance(item.text.slice(startOffset));
      utterance.lang=voice?.lang||"vi-VN";if(voice)utterance.voice=voice;
      utterance.rate=Number(voiceSettings.rate??s.rate);utterance.pitch=Number(voiceSettings.pitch??s.pitch);utterance.volume=Number(voiceSettings.volume??s.volume);
      this.current=utterance;this.currentStarted=false;this.currentCharIndex=startOffset;this.backgroundInterrupted=false;
      utterance.onstart=()=>{if(id!==this.session||this.current!==utterance)return;this.currentStarted=true;this.highlight.paragraph(item.paragraph);this.emit("Đang đọc đoạn "+(item.paragraph+1)+"/"+this.reader.blocks.length);};
      utterance.onboundary=e=>{if(id!==this.session||this.current!==utterance)return;const boundaryName=String(e.name||"").toLowerCase();if(boundaryName!=="word"&&!(Number(e.charLength)>0))return;this.currentCharIndex=Math.max(this.currentCharIndex,startOffset+Number(e.charIndex||0)+Math.max(1,Number(e.charLength)||1));this.highlight.boundarySupported=true;this.highlight.word(item.paragraph,startOffset+e.charIndex,e.charLength,item.text);};
      utterance.onend=()=>{if(id!==this.session||this.current!==utterance||this.state!=="reading")return;this.current=null;this.currentStarted=false;this.position++;this.next(id);};
      utterance.onerror=e=>{if(id!==this.session||this.current!==utterance)return;if(e.error==="canceled"||e.error==="interrupted"){if(this.state==="reading")this.backgroundInterrupted=true;return;}this.state="error";this.current=null;this.currentStarted=false;this.emit("Lỗi đọc: "+e.error);};
      this.synth.speak(utterance);
    };
    if(!globalThis.VieNeuTTS){speakBrowser();return;}
    globalThis.VieNeuTTS.getConfig().then(cfg=>{
      if(id!==this.session||this.state!=="reading")return;
      if(cfg.engine==="browser"){speakBrowser();return;}
      const token={engine:"vieneu",item};this.current=token;this.currentStarted=true;this.currentCharIndex=0;
      this.highlight.paragraph(item.paragraph);this.emit("Đang tạo giọng VieNeu đoạn "+(item.paragraph+1)+"/"+this.reader.blocks.length+"...");
      const gpuVoice=gpuRotationEntry?.voice||cfg.voice;
      const gpuRate=Number(gpuRotationEntry?.rate??s.rate);
      const gpuVolume=Number(gpuRotationEntry?.volume??s.volume);
      globalThis.VieNeuTTS.speak(item.text,{engine:cfg.engine,voice:gpuVoice,rate:gpuRate,volume:gpuVolume}).then(()=>{
        if(id!==this.session||this.current!==token||this.state!=="reading")return;
        this.current=null;this.currentStarted=false;this.position++;this.next(id);
      }).catch(error=>{
        if(id!==this.session||this.current!==token)return;
        this.state="error";this.current=null;this.currentStarted=false;
        this.emit("VieNeu TTS: "+(error?.message||"Không tạo được âm thanh."));
      });
    }).catch(error=>{if(id===this.session){this.state="error";this.emit("Không đọc được cấu hình TTS: "+(error?.message||error));}});
  }
  recoverBackground(){
    if(this.state!=="reading"||!this.current)return;
    if(this.current.engine==="vieneu")return;
    if(this.synth?.paused){try{this.synth.resume();return;}catch(_){}}
    if(this.backgroundInterrupted||(this.currentStarted&&!this.synth?.speaking&&!this.synth?.pending)){
      this.speakCurrent(this.session);
      this.emit("Đã khôi phục phiên đọc sau khi chuyển cửa sổ.");
    }
  }
  pause(){if(this.state!=="reading")return;if(this.current?.engine==="vieneu")globalThis.VieNeuTTS?.pause();else this.synth.pause();this.state="paused";this.emit("Đã tạm dừng.");}
  resume(){if(this.state!=="paused")return;if(this.current?.engine==="vieneu"){this.state="reading";globalThis.VieNeuTTS?.resume();this.emit("Đang tiếp tục đọc.");return;}const offset=Math.min(this.currentCharIndex||0,this.queue[this.position]?.text.length||0);this.current=null;this.synth.cancel();this.backgroundInterrupted=false;this.state="reading";this.speakCurrent(this.session,offset);this.emit("Đang tiếp tục đọc.");}
  stop(show=true){this.session++;if("speechSynthesis"in window)this.synth.cancel();globalThis.VieNeuTTS?.cancel();this.state="idle";this.current=null;this.currentStarted=false;this.currentCharIndex=0;this.backgroundInterrupted=false;this.queue=[];this.position=0;this.reader.clearHighlight();if(show)this.emit("Đã dừng đọc.");}
  move(delta){if(!this.reader.blocks.length)return;const current=this.queue[this.position]?.paragraph??this.reader.active;let target=Math.max(0,Math.min(this.reader.blocks.length-1,(current<0?0:current)+delta));this.start(target);}
  test(){this.stop(false);const id=this.session;const s=this.settings.value;const selected=this.voices.selected;const voiceSettings=selected?(this.voices.getRotationEntry(this.voices.identity(selected))||s):s;const browserTest=()=>{if(!selected){this.emit("Vui lòng chọn giọng đọc.");return;}if(!isSpeechSynthesisSupported()){this.state="error";this.emit("Browser TTS không được hỗ trợ.");return;}const u=new SpeechSynthesisUtterance("Xin chào. Đây là phần thử nghiệm giọng đọc.");u.voice=selected;u.lang=u.voice.lang;u.rate=Number(voiceSettings.rate??s.rate);u.pitch=Number(voiceSettings.pitch??s.pitch);u.volume=Number(voiceSettings.volume??s.volume);u.onstart=()=>{if(id===this.session)this.emit("Đang thử giọng: "+u.voice.name);};u.onend=()=>{if(id===this.session)this.emit("Đã thử giọng xong.");};u.onerror=e=>{if(id===this.session)this.emit("Lỗi thử giọng: "+e.error);};this.synth.speak(u);this.state="testing";};if(!globalThis.VieNeuTTS){browserTest();return;}globalThis.VieNeuTTS.getConfig().then(cfg=>{if(cfg.engine==="browser"){browserTest();return;}this.state="testing";const selectedGpu=String(selectedGpuVoiceIds[0]||cfg.voice||"");this.emit("Đang thử giọng VieNeu...");globalThis.VieNeuTTS.speak("Xin chào. Đây là phần thử nghiệm giọng đọc.",{engine:cfg.engine,voice:selectedGpu,rate:s.rate,volume:s.volume}).then(()=>{if(id===this.session){this.state="ended";this.emit("Đã thử giọng VieNeu xong.");}}).catch(error=>{if(id===this.session){this.state="error";this.emit("Lỗi VieNeu: "+(error?.message||error));}});}).catch(error=>this.emit(error?.message||String(error)));}
}

/* TOOLBAR MANAGER */
class ToolbarManager {
  constructor(speech,reader){
    this.speech=speech;this.reader=reader;
    this.buttons={play:$("playBtn"),pause:$("pauseBtn"),stop:$("stopBtn"),prev:$("prevBtn"),next:$("nextBtn")};
  }
  update(){
    const state=this.speech.state,hasContent=this.reader.blocks.length>0;
    this.buttons.play.disabled=!hasContent||state==="reading"||state==="testing";
    const canResume=state==="paused";
    this.buttons.play.textContent=canResume?"⏵":"▶";
    this.buttons.play.title=canResume?"Tiếp tục":"Đọc";
    this.buttons.play.setAttribute("aria-label",canResume?"Tiếp tục đọc":"Đọc");
    this.buttons.pause.disabled=state!=="reading";
    this.buttons.stop.disabled=!["reading","paused","testing"].includes(state);
    this.buttons.prev.disabled=!hasContent||this.reader.active<=0;
    this.buttons.next.disabled=!hasContent||this.reader.active>=this.reader.blocks.length-1;
  }
}

/* SETTINGS APPLICATION */
const settings=new SettingsManager();
const reader=new ReaderManager();
const voices=new VoiceManager();
const highlight=new HighlightManager(reader,settings);
const speech=new SpeechManager(reader,voices,settings,highlight);

const $=id=>widgetRoot.querySelector("#"+id);
const settingTtsEngine=$("settingTtsEngine");
const settingGpuVoice=$("settingGpuVoice");
const settingGpuVoiceSearch=$("settingGpuVoiceSearch");
const browserVoiceSettings=$("browserVoiceSettings");
const gpuVoiceSettings=$("gpuVoiceSettings");
let gpuVoiceCatalog=[];
let selectedGpuVoiceIds=[];
let gpuVoiceRotation=[];
const gpuVoiceRotationList=$("gpuVoiceRotationList");
const settingGpuVoiceRotation=$("settingGpuVoiceRotation");
const gpuVoiceStatus=$("gpuVoiceStatus");
const refreshGpuVoicesBtn=$("refreshGpuVoicesBtn");

function normalizeLocalVoices(data){
  let source=data?.voices??data?.data?.voices??data?.items??data?.data??data;
  if(source&&!Array.isArray(source)&&typeof source==="object"){
    source=Object.entries(source).map(([key,value])=>typeof value==="string"?{id:key,name:value}:{id:key,...value});
  }
  if(!Array.isArray(source))return [];
  return source.map(item=>{
    if(typeof item==="string")return {id:item,name:item};
    const id=item?.voice??item?.id??item?.name??item?.voice_id??item?.speaker??item?.key;
    const name=item?.display_name??item?.label??item?.name??id;
    return id?{id:String(id),name:String(name),available:item?.available!==false}:null;
  }).filter(item=>item&&item.available);
}
function requestLocalVoices(engine){
  return new Promise((resolve,reject)=>{
    if(!globalThis.chrome?.runtime?.sendMessage)return reject(new Error("Extension runtime không khả dụng."));
    chrome.runtime.sendMessage({type:"VIENEU_TTS_VOICES",engine},response=>{
      const error=chrome.runtime.lastError;
      if(error)return reject(new Error(error.message));
      if(!response?.ok)return reject(new Error(response?.error||"Không tải được danh sách voice."));
      resolve(response.data);
    });
  });
}
function updateTtsEngineControls(engine){
  if(browserVoiceSettings)browserVoiceSettings.hidden=engine!=="browser";
  if(gpuVoiceSettings)gpuVoiceSettings.hidden=engine!=="vieneu-gpu";
}
async function saveTtsEngineConfig(){
  if(!globalThis.chrome?.storage?.sync)return;
  const engine=settingTtsEngine.value;
  const selected=engine==="vieneu-gpu"?Array.from(settingGpuVoice?.selectedOptions||[]).map(option=>option.value).filter(Boolean):[];
  const voice=selected[0]||"";
  await chrome.storage.sync.set({ttsEngine:engine,ttsLocalVoice:voice,ttsLocalVoices:selected});
}
function renderGpuVoiceOptions(){
  const query=String(settingGpuVoiceSearch?.value||"").trim().toLocaleLowerCase();
  const filtered=gpuVoiceCatalog.filter(voice=>(voice.name+" "+voice.id).toLocaleLowerCase().includes(query));
  settingGpuVoice.replaceChildren();
  if(!filtered.length){settingGpuVoice.add(new Option(query?"Không tìm thấy giọng đọc phù hợp":"API chưa công bố giọng đọc nào",""));}
  else{
    for(const voice of filtered)settingGpuVoice.add(new Option(voice.name===voice.id?voice.name:voice.name+" · "+voice.id,voice.id));
    for(const option of settingGpuVoice.options)option.selected=selectedGpuVoiceIds.includes(option.value);
  }
  selectedGpuVoiceIds=selectedGpuVoiceIds.filter(id=>gpuVoiceCatalog.some(voice=>voice.id===id));
  Array.from(settingGpuVoice.options).forEach(option=>{option.selected=selectedGpuVoiceIds.includes(option.value);});
  const hasSelection=selectedGpuVoiceIds.length>0;
  const testButton=$("testLocalVoiceBtn");if(testButton)testButton.disabled=!hasSelection;
  const addButton=$("addGpuRotationVoiceBtn");if(addButton)addButton.disabled=!hasSelection;
}
const GPU_ROTATION_STORAGE_KEY="ttsGpuVoiceRotation";
async function loadGpuVoiceRotation(){
  try{
    const stored=await chrome.storage.sync.get({[GPU_ROTATION_STORAGE_KEY]:[]});
    gpuVoiceRotation=Array.isArray(stored[GPU_ROTATION_STORAGE_KEY])?stored[GPU_ROTATION_STORAGE_KEY].filter(item=>item&&typeof item.voice==="string").map(item=>({voice:item.voice,rate:Number.isFinite(Number(item.rate))?Math.min(1.8,Math.max(.6,Number(item.rate))):1,volume:Number.isFinite(Number(item.volume))?Math.min(1,Math.max(0,Number(item.volume))):1})): [];
  }catch(_){gpuVoiceRotation=[];}
  renderGpuVoiceRotation();
}
async function saveGpuVoiceRotation(){await chrome.storage.sync.set({[GPU_ROTATION_STORAGE_KEY]:gpuVoiceRotation});}
function renderGpuVoiceRotation(){
  if(!gpuVoiceRotationList)return;
  gpuVoiceRotationList.replaceChildren();
  if(!gpuVoiceRotation.length){const li=document.createElement("li");li.textContent="Chưa thêm giọng đọc nào.";gpuVoiceRotationList.append(li);return;}
  gpuVoiceRotation.forEach((entry,index)=>{
    const voice=gpuVoiceCatalog.find(item=>item.id===entry.voice);
    const li=document.createElement("li"),panel=document.createElement("div"),title=document.createElement("strong");
    panel.className="rotation-voice-settings";title.textContent="Giọng "+(index+1)+": "+(voice?.name||entry.voice);panel.append(title);
    [["volume","Âm lượng",0,1,.05],["rate","Tốc độ",.6,1.8,.05]].forEach(([key,label,min,max,step])=>{
      const row=document.createElement("label"),name=document.createElement("span"),input=document.createElement("input"),output=document.createElement("output");
      row.className="rotation-setting-row";name.textContent=label;input.type="range";input.min=String(min);input.max=String(max);input.step=String(step);input.value=String(entry[key]);input.dataset.index=String(index);input.dataset.setting=key;output.value=Number(input.value).toFixed(2);output.dataset.index=String(index);output.dataset.setting=key;row.append(name,input,output);panel.append(row);
    });
    li.append(panel);
    [["up","↑"],["down","↓"],["remove","Xóa"]].forEach(([action,label])=>{const button=document.createElement("button");button.type="button";button.className="secondary";button.dataset.action=action;button.dataset.index=String(index);button.textContent=label;button.disabled=(action==="up"&&index===0)||(action==="down"&&index===gpuVoiceRotation.length-1);li.append(button);});
    gpuVoiceRotationList.append(li);
  });
}
async function addSelectedGpuVoiceToRotation(){
  const selected=[...selectedGpuVoiceIds];
  if(!selected.length){gpuVoiceStatus.textContent="Hãy chọn ít nhất một giọng trong danh sách GPU.";return;}
  const current=settings.value;let added=0,duplicates=0;
  selected.forEach(voice=>{if(gpuVoiceRotation.some(item=>item.voice===voice)){duplicates++;return;}gpuVoiceRotation.push({voice,rate:Number(current.rate)||1,volume:Number(current.volume??1)});added++;});
  await saveGpuVoiceRotation();renderGpuVoiceRotation();
  gpuVoiceStatus.textContent=added?"Đã thêm "+added+" giọng vào danh sách luân phiên."+(duplicates?" Bỏ qua "+duplicates+" giọng đã có.":""):"Các giọng đã chọn đều có trong danh sách luân phiên.";
}
gpuVoiceRotationList?.addEventListener("input",event=>{
  const input=event.target.closest("input[data-index][data-setting]");if(!input)return;
  const index=Number(input.dataset.index),key=input.dataset.setting;if(!gpuVoiceRotation[index]||!["rate","volume"].includes(key))return;
  gpuVoiceRotation[index][key]=Number(input.value);
  const output=Array.from(gpuVoiceRotationList.querySelectorAll("output[data-index][data-setting]")).find(node=>node.dataset.index===String(index)&&node.dataset.setting===key);
  if(output)output.value=Number(input.value).toFixed(2);
  saveGpuVoiceRotation().catch(error=>{gpuVoiceStatus.textContent=error?.message||"Không lưu được cài đặt giọng.";});
});
gpuVoiceRotationList?.addEventListener("click",event=>{
  const button=event.target.closest("button[data-action][data-index]");if(!button)return;
  const index=Number(button.dataset.index),action=button.dataset.action;if(!gpuVoiceRotation[index])return;
  if(action==="remove")gpuVoiceRotation.splice(index,1);
  else if(action==="up"&&index>0)[gpuVoiceRotation[index-1],gpuVoiceRotation[index]]=[gpuVoiceRotation[index],gpuVoiceRotation[index-1]];
  else if(action==="down"&&index<gpuVoiceRotation.length-1)[gpuVoiceRotation[index+1],gpuVoiceRotation[index]]=[gpuVoiceRotation[index],gpuVoiceRotation[index+1]];
  else return;
  saveGpuVoiceRotation().then(renderGpuVoiceRotation).catch(error=>{gpuVoiceStatus.textContent=error?.message||"Không lưu được danh sách giọng.";});
});
settingGpuVoiceRotation?.addEventListener("change",()=>{
  if($("settingVoiceRotation"))$("settingVoiceRotation").checked=settingGpuVoiceRotation.checked;
  settings.value.voiceRotationEnabled=settingGpuVoiceRotation.checked;settings.save();
});
$("settingVoiceRotation")?.addEventListener("change",()=>{if(settingGpuVoiceRotation)settingGpuVoiceRotation.checked=$("settingVoiceRotation").checked;});
async function loadGpuVoiceOptions(preferred=""){
  if(!settingGpuVoice||!gpuVoiceStatus)return;
  gpuVoiceStatus.textContent="Đang tải danh sách voice từ VieNeu GPU (8081)...";
  gpuVoiceStatus.className="voice-info engine-status";
  refreshGpuVoicesBtn.disabled=true;
  try{
    const data=await requestLocalVoices("vieneu-gpu");
    gpuVoiceCatalog=normalizeLocalVoices(data);
    if(!gpuVoiceCatalog.length){selectedGpuVoiceIds=[];renderGpuVoiceOptions();gpuVoiceStatus.textContent="API phản hồi nhưng chưa có giọng đọc nào được đăng ký. Kiểm tra cấu hình voice_presets của VieNeu GPU.";return;}
    const apiSelected=data?.selected_voice??data?.data?.selected_voice??"";
    const preferredIds=(Array.isArray(preferred)?preferred:[preferred]).map(id=>String(id||"")).filter(Boolean);
    selectedGpuVoiceIds=preferredIds.filter(id=>gpuVoiceCatalog.some(voice=>voice.id===id));
    if(!selectedGpuVoiceIds.length){const fallback=String(apiSelected||gpuVoiceCatalog[0].id);selectedGpuVoiceIds=[gpuVoiceCatalog.some(voice=>voice.id===fallback)?fallback:gpuVoiceCatalog[0].id];}
    renderGpuVoiceOptions();
    renderGpuVoiceRotation();
    await saveTtsEngineConfig();
    gpuVoiceStatus.textContent="Đã tải "+gpuVoiceCatalog.length+" giọng đọc GPU.";
  }catch(error){
    gpuVoiceCatalog=[];selectedGpuVoiceId="";
    settingGpuVoice.replaceChildren(new Option("Không tải được danh sách giọng đọc",""));
    gpuVoiceStatus.textContent="Lỗi tải giọng đọc GPU: "+(error?.message||String(error));
  }finally{refreshGpuVoicesBtn.disabled=false;}
}
async function initializeTtsEngineSettings(){
  if(!settingTtsEngine||!globalThis.chrome?.storage?.sync)return;
  const saved=await chrome.storage.sync.get({ttsEngine:"browser",ttsLocalVoice:"",ttsLocalVoices:[]});
  settingTtsEngine.value=["browser","vieneu-gpu"].includes(saved.ttsEngine)?saved.ttsEngine:"browser";
  updateTtsEngineControls(settingTtsEngine.value);
  await loadGpuVoiceRotation();
  if(settingTtsEngine.value==="vieneu-gpu")await loadGpuVoiceOptions(saved.ttsLocalVoices?.length?saved.ttsLocalVoices:(saved.ttsLocalVoice||""));
  if(settingGpuVoiceRotation)settingGpuVoiceRotation.checked=!!settings.value.voiceRotationEnabled;
}
settingTtsEngine?.addEventListener("change",async()=>{
  updateTtsEngineControls(settingTtsEngine.value);
  try{
    await saveTtsEngineConfig();
    if(settingTtsEngine.value==="vieneu-gpu"){
      const saved=await chrome.storage.sync.get({ttsLocalVoice:"",ttsLocalVoices:[]});
      await loadGpuVoiceOptions(saved.ttsLocalVoices?.length?saved.ttsLocalVoices:(saved.ttsLocalVoice||""));
    }
  }catch(error){gpuVoiceStatus.textContent=error?.message||"Không lưu được bộ máy giọng đọc.";}
});
settingGpuVoice?.addEventListener("change",()=>{const visibleIds=new Set(Array.from(settingGpuVoice.options).map(option=>option.value));const hiddenSelections=selectedGpuVoiceIds.filter(id=>!visibleIds.has(id));selectedGpuVoiceIds=[...hiddenSelections,...Array.from(settingGpuVoice.selectedOptions).map(option=>option.value).filter(Boolean)];const testButton=$("testLocalVoiceBtn"),addButton=$("addGpuRotationVoiceBtn");if(testButton)testButton.disabled=!selectedGpuVoiceIds.length;if(addButton)addButton.disabled=!selectedGpuVoiceIds.length;saveTtsEngineConfig().then(()=>{gpuVoiceStatus.textContent="Đã chọn "+selectedGpuVoiceIds.length+" giọng GPU.";}).catch(error=>{gpuVoiceStatus.textContent=error?.message||"Không lưu được giọng đọc GPU.";});});
settingGpuVoiceSearch?.addEventListener("input",renderGpuVoiceOptions);
$("addGpuRotationVoiceBtn")?.addEventListener("click",()=>addSelectedGpuVoiceToRotation().catch(error=>{gpuVoiceStatus.textContent=error?.message||"Không thêm được giọng đọc.";}));
refreshGpuVoicesBtn?.addEventListener("click",async()=>{
  const saved=await chrome.storage.sync.get({ttsLocalVoice:"",ttsLocalVoices:[]});
  await loadGpuVoiceOptions(selectedGpuVoiceIds.length?selectedGpuVoiceIds:(saved.ttsLocalVoices?.length?saved.ttsLocalVoices:(saved.ttsLocalVoice||"")));
});
initializeTtsEngineSettings().catch(error=>console.warn("[TTSWidget] Không tải được cấu hình engine:",error));

function isSpeechSynthesisSupported(){
  const synth=window.speechSynthesis;
  return typeof synth!=="undefined" && typeof window.SpeechSynthesisUtterance==="function" && typeof synth.speak==="function" && typeof synth.getVoices==="function";
}
function updateReaderAvailability(){
  const supported=isSpeechSynthesisSupported();
  const button=$("openReaderBtn");
  const accessibleLabel=supported?"Đọc nội dung này":"Đọc nội dung này [ không hỗ trợ ]";
  button.setAttribute("aria-label",accessibleLabel);
  button.dataset.speechApiSupported=String(supported);
  button.title=supported?accessibleLabel:"Trình duyệt này không hỗ trợ Web Speech API (SpeechSynthesis).";
}
function applyToolbarPosition(){
  const toolbarElement=$("readerToolbar");
  const isFooter=settings.value.toolbarPosition==="footer";
  if(isFooter)reader.root.append(toolbarElement);
  else reader.root.insertBefore(toolbarElement,reader.content);
  toolbarElement.classList.toggle("toolbar-bottom",isFooter);
  reader.root.classList.toggle("toolbar-at-footer",isFooter);
}
function applySettings(){applyToolbarPosition();applyAppearanceSettings();highlight.applyColors();syncSettingsForm();}
function applyAppearanceSettings(){const theme=settings.value.theme;const dark=theme==="dark"||(theme==="system"&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);widgetRoot.dataset.theme=dark?"dark":"light";widgetRoot.style.setProperty("--tts-ui-font-size",settings.value.fontSize+"px");}
function syncSettingsForm(){const s=settings.value;const map={settingRate:"rate",settingPitch:"pitch",settingVolume:"volume",settingHighlight:"highlight",settingWordSync:"wordSync",settingSync:"sync",settingBackgroundReading:"keepBackgroundReading",settingToolbarPosition:"toolbarPosition",settingVoiceRotation:"voiceRotationEnabled",settingHighlightColor:"highlightColor",settingTextColor:"textColor",settingBorderColor:"borderColor"};Object.entries(map).forEach(([id,key])=>{const el=$(id);if(el.type==="checkbox")el.checked=!!s[key];else el.value=s[key];});if(settingGpuVoiceRotation)settingGpuVoiceRotation.checked=!!s.voiceRotationEnabled;}
function readSettingsForm(){const s=settings.value;const map={settingRate:"rate",settingPitch:"pitch",settingVolume:"volume",settingHighlight:"highlight",settingWordSync:"wordSync",settingSync:"sync",settingBackgroundReading:"keepBackgroundReading",settingToolbarPosition:"toolbarPosition",settingVoiceRotation:"voiceRotationEnabled",settingHighlightColor:"highlightColor",settingTextColor:"textColor",settingBorderColor:"borderColor"};Object.entries(map).forEach(([id,key])=>{const el=$(id);s[key]=el.type==="checkbox"?el.checked:el.type==="range"?Number(el.value):el.value;});if(settingGpuVoiceRotation)settingGpuVoiceRotation.checked=!!s.voiceRotationEnabled;applySettings();settings.save();}
Object.keys({settingRate:1,settingPitch:1,settingVolume:1,settingHighlight:1,settingWordSync:1,settingSync:1,settingBackgroundReading:1,settingToolbarPosition:1,settingVoiceRotation:1,settingHighlightColor:1,settingTextColor:1,settingBorderColor:1}).forEach(id=>{const el=$(id);el.addEventListener(el.type==="checkbox"?"change":"input",readSettingsForm);});

$("openReaderBtn").addEventListener("click",()=>{speech.stop(false);reader.open();applySettings();toolbar.update();});
updateReaderAvailability();
$("closeBtn").addEventListener("click",()=>{speech.stop(false);reader.close();});
$("playBtn").addEventListener("click",()=>{if(speech.state==="paused")speech.resume();else speech.start(0);});
$("pauseBtn").addEventListener("click",()=>speech.pause());

$("stopBtn").addEventListener("click",()=>speech.stop());
$("prevBtn").addEventListener("click",()=>speech.move(-1));
$("nextBtn").addEventListener("click",()=>speech.move(1));
$("testVoiceBtn").addEventListener("click",()=>speech.test());
$("testLocalVoiceBtn").addEventListener("click",()=>speech.test());
$("refreshVoicesBtn").addEventListener("click",()=>voices.refresh());
$("settingsBtn").addEventListener("click",()=>{const panel=$("settingsPanel");panel.classList.toggle("open");if(panel.classList.contains("open"))voices.refresh();});
$("saveSettingsBtn").addEventListener("click",()=>{readSettingsForm();settings.save();$("status").textContent="Đã lưu cài đặt.";});
$("resetSettingsBtn").addEventListener("click",()=>{settings.reset();applySettings();$("status").textContent="Đã khôi phục cài đặt mặc định.";});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&reader.root.classList.contains("open")){speech.stop(false);reader.close();}});
const toolbar=new ToolbarManager(speech,reader);
let contentRefreshPending=false;
function refreshVisibleReaderContent(){
  if(!reader.root.classList.contains("open"))return;
  // Never mutate the active reading snapshot. Apply deferred DOM changes after
  // speech has stopped or completed; opening Reader also always takes a fresh snapshot.
  if(["reading","paused","testing"].includes(speech.state)){contentRefreshPending=true;return;}
  if(reader.refreshContent()){
    contentRefreshPending=false;
    toolbar.update();
    const status=$("status");
    status.textContent="Đã cập nhật nội dung trang. Bạn có thể nhấn Đọc để đọc nội dung mới.";
    status.classList.add("visible");
  }
}
speech.onState=()=>{
  toolbar.update();
  if(contentRefreshPending&&!["reading","paused","testing"].includes(speech.state)){
    refreshVisibleReaderContent();
  }
};

// Observe page mutations for ChatGPT/Gemini and other SPA websites. This only
// refreshes the Reader's content snapshot; it deliberately never starts speech.
let contentMutationTimer=null;
function mutationTouchesContent(mutation){
  const target=mutation.target&&mutation.target.nodeType===Node.ELEMENT_NODE
    ?mutation.target
    :mutation.target?.parentElement;
  if(!target||widgetRoot.contains(target))return false;
  const source=document.querySelector(config.contentSelector);
  if(source&&(target===source||source.contains(target)||target.contains(source)))return true;
  try{
    if(target.matches(config.contentSelector)||target.closest(config.contentSelector))return true;
    for(const node of [...mutation.addedNodes,...mutation.removedNodes]){
      if(node.nodeType!==Node.ELEMENT_NODE)continue;
      if(node.matches(config.contentSelector)||node.querySelector(config.contentSelector))return true;
    }
  }catch(_){}
  return false;
}
function scheduleContentRefresh(){
  // Throttle rather than debounce: continuous DOM mutations during AI
  // streaming must not keep resetting the timer and starve Reader refreshes.
  // Further mutations can schedule another refresh after this one completes.
  if(contentMutationTimer!==null)return;
  contentMutationTimer=setTimeout(()=>{
    contentMutationTimer=null;
    refreshVisibleReaderContent();
  },700);
}
const pageContentObserver=new MutationObserver(mutations=>{
  if(mutations.some(mutationTouchesContent))scheduleContentRefresh();
});
if(document.documentElement){
  pageContentObserver.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
}
window.addEventListener("popstate",scheduleContentRefresh);
window.addEventListener("hashchange",scheduleContentRefresh);
// Keep the speech session independent from window focus and tab visibility.
// Losing focus must never cancel or explicitly pause the current utterance.
function handleReaderFocusChange(){
  if(!settings.value.keepBackgroundReading||!reader.root.classList.contains("open"))return;
  if(document.visibilityState==="hidden"||!document.hasFocus()){
    if(speech.state==="reading")$("status").textContent="Đang chạy nền. Nếu Chrome ngắt utterance, widget sẽ thử khôi phục khi bạn quay lại.";
    return;
  }
  if(speech.state==="reading"){
    speech.recoverBackground();
    if(speech.state==="reading")$("status").textContent="Đang đọc. Đã kiểm tra và khôi phục phiên đọc nếu cần.";
  }
}
document.addEventListener("visibilitychange",handleReaderFocusChange);
window.addEventListener("blur",handleReaderFocusChange);
window.addEventListener("focus",handleReaderFocusChange);



/* CONTEXT MENU: exists only while Reader mode is open */
let readerContextMenu=null;
let contextReadTarget=null;
function hideReaderContextMenu(){if(readerContextMenu)readerContextMenu.classList.remove("open");contextReadTarget=null;}
function unmountReaderContextMenu(){
  hideReaderContextMenu();
  if(readerContextMenu){readerContextMenu.remove();readerContextMenu=null;}
}
function mountReaderContextMenu(){
  unmountReaderContextMenu();
  if(!reader.root.classList.contains("open"))return;
  readerContextMenu=document.createElement("div");
  readerContextMenu.className="reader-context-menu";
  readerContextMenu.id="readerContextMenu";
  readerContextMenu.setAttribute("role","menu");
  readerContextMenu.setAttribute("aria-label","Menu đọc văn bản");
  const action=document.createElement("button");
  action.type="button";action.id="readFromCursorBtn";action.setAttribute("role","menuitem");
  action.textContent="▶ Đọc từ đây";
  readerContextMenu.append(action);
  reader.root.append(readerContextMenu);
  action.addEventListener("click",()=>{
    const index=contextReadTarget;hideReaderContextMenu();
    if(!Number.isInteger(index)||index<0||!reader.root.classList.contains("open"))return;
    speech.start(index);
  });
}
function showReaderContextMenu(event,index){
  if(!reader.root.classList.contains("open")||!readerContextMenu)return;
  event.preventDefault();contextReadTarget=index;readerContextMenu.classList.add("open");
  const rect=readerContextMenu.getBoundingClientRect(),margin=8;
  readerContextMenu.style.left=Math.max(margin,Math.min(event.clientX,window.innerWidth-rect.width-margin))+"px";
  readerContextMenu.style.top=Math.max(margin,Math.min(event.clientY,window.innerHeight-rect.height-margin))+"px";
}
document.addEventListener("contextmenu",event=>{
  if(!reader.root.classList.contains("open")||!reader.source?.contains(event.target))return;
  const target=event.target.nodeType===Node.TEXT_NODE?event.target.parentElement:event.target;
  const index=reader.blocks.findIndex(block=>block.element===target||block.element.contains(target));
  if(index>=0)showReaderContextMenu(event,index);
});
document.addEventListener("pointerdown",event=>{if(readerContextMenu&&!readerContextMenu.contains(event.target))hideReaderContextMenu();});
document.addEventListener("keydown",event=>{if(event.key==="Escape")hideReaderContextMenu();});
window.addEventListener("resize",hideReaderContextMenu);
window.addEventListener("scroll",hideReaderContextMenu,true);

voices.onChange=()=>{};
applySettings();
if(window.matchMedia){const themeQuery=window.matchMedia("(prefers-color-scheme: dark)");const onSystemThemeChange=()=>{if(settings.value.theme==="system")applyAppearanceSettings();};if(typeof themeQuery.addEventListener==="function")themeQuery.addEventListener("change",onSystemThemeChange);else if(typeof themeQuery.addListener==="function")themeQuery.addListener(onSystemThemeChange);}
toolbar.update();
if("speechSynthesis"in window){
  const synth=window.speechSynthesis;
  if(typeof synth.addEventListener==="function")synth.addEventListener("voiceschanged",()=>voices.handleVoicesChanged());
  else{
    const previousHandler=synth.onvoiceschanged;
    synth.onvoiceschanged=function(event){if(typeof previousHandler==="function")previousHandler.call(this,event);voices.handleVoicesChanged();};
  }
  voices.refresh();
}
  initialized=true;
  return window.TTSWidget;
}
window.TTSWidget={init,applyAppearance:()=>{if(initialized)applyAppearanceSettings();},version:"1.0.0"};
const script=document.currentScript||document.querySelector("script[data-content-selector]");
const autoConfig={};
if(script&&script.dataset.contentSelector)autoConfig.contentSelector=script.dataset.contentSelector;
const run=()=>init(autoConfig);
if(script&&script.dataset.contentSelector){
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run,{once:true});
  else run();
}
})();
