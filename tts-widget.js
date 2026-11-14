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
  widgetRoot.innerHTML='<button type="button" class="tts-widget-launcher" id="openReaderBtn"><span aria-hidden="true">🔊</span> <span id="openReaderLabel">Đọc nội dung này</span></button>'+"<div class=\"tts-widget-reader\" id=\"ttsWidgetReader\" aria-label=\"Cửa sổ đọc\">\n<div class=\"reader-toolbar\" id=\"readerToolbar\">\n<div class=\"toolbar-row\">\n<button class=\"danger\" id=\"closeBtn\" title=\"Đóng (Esc)\">✕</button>\n<button id=\"prevBtn\" title=\"Đoạn trước\">⏮</button>\n<button id=\"playBtn\" title=\"Đọc\">▶</button>\n<button id=\"pauseBtn\" title=\"Tạm dừng\">⏸</button>\n<button id=\"resumeBtn\" title=\"Tiếp tục\">⏵</button>\n<button class=\"danger\" id=\"stopBtn\" title=\"Dừng\">■</button>\n<button id=\"nextBtn\" title=\"Đoạn tiếp\">⏭</button>\n<button class=\"secondary\" id=\"settingsBtn\" title=\"Cài đặt\">⚙</button>\n</div>\n</div>\n<div class=\"settings-panel\" id=\"settingsPanel\">\n<div class=\"settings-grid\">\n<section class=\"setting-group\"><h3>Giao diện</h3>\n<label for=\"settingToolbarPosition\">Vị trí thanh điều khiển</label><select id=\"settingToolbarPosition\"><option value=\"header\">Header - Đầu trang</option><option value=\"footer\">Footer - Chân trang</option></select></label>\n<label><input type=\"checkbox\" id=\"settingBackgroundReading\" style=\"width:auto\" checked> Tiếp tục đọc khi chuyển tab hoặc cửa sổ mất tiêu điểm</label>\n</section>\n</section>\n<section class=\"setting-group\"><h3>Giọng đọc</h3>\n<div class=\"voice-panel\">\n<div class=\"voice-row\">\n<label for=\"voiceSelect\">Giọng đọc:</label><input id=\"voiceSearch\" placeholder=\"Lọc giọng đọc...\" aria-label=\"Tìm giọng đọc\" style=\"max-width:180px\">\n<select id=\"voiceSelect\"><option value=\"\">Đang tải danh sách giọng đọc...</option></select>\n<button class=\"secondary\" id=\"refreshVoicesBtn\">Làm mới</button>\n<button class=\"secondary\" id=\"testVoiceBtn\">Thử giọng</button>\n</div>\n<div class=\"voice-info\" id=\"voiceInfo\" aria-live=\"polite\">Đang tìm giọng đọc...</div>\n</div>\n<label for=\"settingRate\">Tốc độ đọc</label><input id=\"settingRate\" type=\"range\" min=\".6\" max=\"1.8\" step=\".05\" value=\"1\">\n<label for=\"settingPitch\">Cao độ</label><input id=\"settingPitch\" type=\"range\" min=\".5\" max=\"2\" step=\".05\" value=\"1\">\n<label for=\"settingVolume\">Âm lượng</label><input id=\"settingVolume\" type=\"range\" min=\"0\" max=\"1\" step=\".05\" value=\"1\">\n</section>\n<section class=\"setting-group\"><h3>Đồng bộ đọc</h3>\n<label><input type=\"checkbox\" id=\"settingSync\" style=\"width:auto\" checked> Theo dõi đoạn đang đọc</label>\n<label><input type=\"checkbox\" id=\"settingWordSync\" style=\"width:auto\" checked> Highlight từ nếu API hỗ trợ</label>\n<p style=\"font-size:12px\">Sự kiện ranh giới từ (onboundary) phụ thuộc giọng đọc và trình duyệt. Nếu không có sự kiện này, widget chỉ đánh dấu đoạn hiện tại.</p>\n</section>\n<section class=\"setting-group\"><h3>Highlight</h3>\n<label><input type=\"checkbox\" id=\"settingHighlight\" style=\"width:auto\" checked> Bật highlight đoạn</label>\n<label for=\"settingHighlightColor\">Màu nền highlight</label><input id=\"settingHighlightColor\" type=\"color\" value=\"#ffe58a\">\n<label for=\"settingTextColor\">Màu chữ highlight</label><input id=\"settingTextColor\" type=\"color\" value=\"#332600\">\n<label for=\"settingBorderColor\">Màu viền highlight</label><input id=\"settingBorderColor\" type=\"color\" value=\"#e0a800\">\n</section>\n</div>\n<div class=\"setting-actions\"><button class=\"secondary\" id=\"resetSettingsBtn\">Mặc định</button><button id=\"saveSettingsBtn\">Lưu cài đặt</button></div>\n</div>\n</div>\n<div class=\"reader-content\" id=\"readerContent\"></div>\n<div class=\"reader-status\" id=\"status\" aria-live=\"polite\">Sẵn sàng đọc</div>\n</div>";
  const style=document.createElement("style");
  style.id="tts-widget-styles";
  style.textContent="\n.tts-widget-root{font:16px/1.5 Arial,sans-serif;color:#263238}\n.tts-widget-root button{font:inherit;border:0;border-radius:7px;padding:9px 13px;background:#2463a6;color:#fff;cursor:pointer}\n.tts-widget-root button:hover:not(:disabled){filter:brightness(1.08)}\n.tts-widget-root button:disabled{opacity:.42;cursor:not-allowed}\n.tts-widget-root button.secondary{background:#64748b}\n.tts-widget-root button.danger{background:#b83a3a}\n.tts-widget-root button.active{outline:2px solid #fbbf24;outline-offset:2px}\n.tts-widget-root .tts-widget-launcher{appearance:none!important;-webkit-appearance:none!important;display:inline-flex!important;visibility:visible!important;opacity:1!important;position:fixed!important;right:16px!important;bottom:16px!important;left:auto!important;top:auto!important;z-index:2147483647!important;align-items:center!important;justify-content:center!important;gap:7px!important;margin:0!important;padding:10px 15px!important;border:0!important;border-radius:8px!important;background:#2463a6!important;color:#fff!important;font:600 15px/1.4 Arial,sans-serif!important;text-align:center!important;white-space:nowrap!important;box-shadow:0 2px 12px #0004!important;pointer-events:auto!important;cursor:pointer!important}\n.tts-widget-root .tts-widget-reader{display:none;position:static;pointer-events:none}\n.tts-widget-root .tts-widget-reader.open{display:block}\n.tts-widget-root .reader-toolbar{position:fixed;top:12px;left:12px;right:12px;z-index:2147483000;pointer-events:auto;background:#263b55;color:#fff;padding:10px 12px;border-radius:10px;box-shadow:0 2px 8px #0002}\n.tts-widget-root .reader-toolbar.toolbar-bottom{top:auto;bottom:12px}\n.tts-widget-root .tts-widget-reader .toolbar-row{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:8px}\n.tts-widget-root .reader-toolbar select,.tts-widget-root .reader-toolbar input{max-width:240px;padding:7px;border-radius:5px;border:1px solid #ccc;color:#222;background:#fff}\n.tts-widget-root .reader-content{display:none}\n.tts-widget-root .reader-status{position:fixed;right:16px;top:76px;z-index:2147483000;pointer-events:auto;background:#263b55;color:#fff;padding:5px 9px;border-radius:6px;font-size:12px;max-width:min(420px,calc(100vw - 32px))}\n.tts-widget-root .settings-panel{display:none;position:fixed;top:76px;right:12px;z-index:2147483000;pointer-events:auto;max-width:min(1000px,calc(100vw - 24px));margin:0;padding:14px;background:#fff;color:#263238;border-radius:9px;max-height:65vh;overflow:auto;box-shadow:0 8px 28px #0003}\n.tts-widget-root .settings-panel.open{display:block}\n.tts-widget-root .voice-panel{max-width:1000px;margin:10px auto 0;padding:10px 14px;background:#ffffff18;border-radius:8px}\n.tts-widget-root .voice-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:7px 0}\n.tts-widget-root .voice-row label{min-width:100px;font-size:14px}\n.tts-widget-root .voice-row select{flex:1;min-width:180px}\n.tts-widget-root .voice-info{font-size:12px;color:#dce5ef;margin-top:5px}\n.tts-widget-root .settings-panel .voice-panel{max-width:none;margin:0;padding:0;background:transparent}\n.tts-widget-root .settings-panel .voice-info{color:#475569}\n.tts-widget-root .settings-panel.open{display:block}\n.tts-widget-root .tts-widget-reader.toolbar-at-footer .reader-status{top:auto;bottom:76px}\n.tts-widget-root .settings-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}\n.tts-widget-root .setting-group{border:1px solid #dbe1e8;border-radius:8px;padding:12px}\n.tts-widget-root .setting-group h3{font-size:15px;margin:0 0 10px}\n.tts-widget-root .setting-group label{display:block;font-size:13px;margin:8px 0 4px}\n.tts-widget-root .setting-group input,.tts-widget-root .setting-group select{width:100%;padding:7px;border:1px solid #cbd5e1;border-radius:5px}\n.tts-widget-root .setting-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}\n .tts-widget-root .reader-context-menu{position:fixed;z-index:2147483001;display:none;pointer-events:auto;min-width:170px;padding:6px;background:#fff;color:#1f2937;border:1px solid #cbd5e1;border-radius:9px;box-shadow:0 8px 28px #0003}\n.tts-widget-root .reader-context-menu.open{display:block}\n.tts-widget-root .reader-context-menu button{display:block;width:100%;padding:9px 12px;text-align:left;background:transparent;color:#1f2937;border-radius:5px}\n.tts-widget-root .reader-context-menu button:hover{background:#eaf2fb;filter:none}\n@media(max-width:700px){.tts-widget-root .reader-content{margin-top:22px}.tts-widget-root .reader-toolbar select{max-width:100%}.tts-widget-root .voice-row label{min-width:78px}}\n"
  document.head.append(style);
  const highlightStyle=document.createElement("style");highlightStyle.id="tts-widget-highlight-colors";document.head.append(highlightStyle);
  document.body.append(widgetRoot);
  /* SETTINGS MANAGER */
class SettingsManager {
  constructor(){this.key="tts-widget-settings-v2";this.defaults={rate:1,pitch:1,volume:1,highlight:true,wordSync:true,sync:true,keepBackgroundReading:true,toolbarPosition:"header",highlightColor:"#ffe58a",textColor:"#332600",borderColor:"#e0a800"};this.value=this.load();}
  load(){try{const saved=JSON.parse(localStorage.getItem(this.key)||"{}");const value={...this.defaults,...(saved&&typeof saved==="object"&&!Array.isArray(saved)?saved:{})};
    ["theme","font","size","line","width","autoScroll","compact"].forEach(key=>delete value[key]);
    const number=(key,min,max)=>{const n=Number(value[key]);value[key]=Number.isFinite(n)?Math.min(max,Math.max(min,n)):this.defaults[key];};
    number("rate",0.6,1.8);number("pitch",0.5,2);number("volume",0,1);
    ["highlight","wordSync","sync","keepBackgroundReading"].forEach(key=>{value[key]=typeof value[key]==="boolean"?value[key]:this.defaults[key];});
    if(!["header","footer"].includes(value.toolbarPosition))value.toolbarPosition=this.defaults.toolbarPosition;
    ["highlightColor","textColor","borderColor"].forEach(key=>{if(typeof value[key]!=="string"||!/^#[0-9a-f]{6}$/i.test(value[key]))value[key]=this.defaults[key];});
    return value;
  }catch(_){return {...this.defaults};}}
  save(){try{localStorage.setItem(this.key,JSON.stringify(this.value));}catch(_){}}
  reset(){this.value={...this.defaults};this.save();}
}

/* VOICE MANAGER */
class VoiceManager {
  constructor(){this.voices=[];this.selected=null;this.select=widgetRoot.querySelector("#voiceSelect");this.search=widgetRoot.querySelector("#voiceSearch");this.info=widgetRoot.querySelector("#voiceInfo");this.storageKey="tts-widget-voice-v1";this.onChange=()=>{};this.search.addEventListener("input",()=>this.render());this.select.addEventListener("change",()=>this.choose(this.select.value));}
  identity(v){return v?v.voiceURI+"|"+v.name+"|"+v.lang:"";}
  load(){if(!("speechSynthesis" in window)){this.info.textContent="Trình duyệt không hỗ trợ SpeechSynthesis.";return;}
    const previous=this.identity(this.selected)||localStorage.getItem(this.storageKey)||"";
    this.voices=window.speechSynthesis.getVoices()||[];
    if(!this.voices.length){this.select.innerHTML='<option value="">Chưa tìm thấy giọng đọc</option>';this.info.textContent="Danh sách giọng chưa sẵn sàng. Hãy thử làm mới.";return;}
    this.render();
    let index=this.voices.findIndex(v=>this.identity(v)===previous);
    if(index<0)index=this.voices.findIndex(v=>/^vi(-|_)/i.test(v.lang));
    if(index<0)index=this.voices.findIndex(v=>v.default);
    if(index<0)index=0;
    this.choose(String(index),false);
  }
  render(){const q=this.search.value.trim().toLocaleLowerCase();const old=this.select.value;this.select.replaceChildren();
    this.voices.forEach((v,i)=>{if(q&&!((v.name+" "+v.lang).toLocaleLowerCase().includes(q)))return;const o=document.createElement("option");o.value=String(i);o.textContent=v.name+" ("+v.lang+")"+(v.default?" - Mặc định":"");this.select.append(o);});
    if(old&&this.select.querySelector('option[value="'+old+'"]'))this.select.value=old;
    if(!this.select.options.length){const o=document.createElement("option");o.value="";o.textContent="Không có kết quả";this.select.append(o);}
  }
  choose(index,persist=true){const v=this.voices[Number(index)];if(!v)return;this.selected=v;this.select.value=String(this.voices.indexOf(v));this.info.textContent="Đã chọn: "+v.name+" | "+v.lang+(v.localService?" | Trên thiết bị":" | Dịch vụ");if(persist){try{localStorage.setItem(this.storageKey,this.identity(v));}catch(_){}}this.onChange(v);}
}

/* READER MANAGER */
class ReaderManager {
  constructor(){this.root=widgetRoot.querySelector("#ttsWidgetReader");this.content=widgetRoot.querySelector("#readerContent");this.source=null;this.blocks=[];this.active=-1;}
  open(){this.source=document.querySelector(config.contentSelector);if(!this.source){console.error("[TTSWidget] Không tìm thấy vùng nội dung:",config.contentSelector);return;}
    this.blocks=[];this.source.querySelectorAll("p,h1,h2,h3,h4,h5,h6,li,blockquote").forEach(el=>{const text=(el.innerText||el.textContent||"").trim();if(text)this.blocks.push({element:el,text});});
    this.active=-1;this.root.classList.add("open");mountReaderContextMenu();}
  close(){unmountReaderContextMenu();this.root.classList.remove("open");this.clearHighlight();this.blocks=[];this.source=null;this.active=-1;}
  setActive(index,settings){if(index<0||index>=this.blocks.length)return;this.clearHighlight();this.active=index;if(settings.value.highlight&&settings.value.sync){this.blocks[index].element.classList.add("tts-widget-reading-active");this.blocks[index].element.setAttribute("data-tts-widget-active","true");}}
  clearHighlight(){this.blocks.forEach(block=>{block.element.classList.remove("tts-widget-reading-active");block.element.removeAttribute("data-tts-widget-active");});if(window.CSS&&CSS.highlights)CSS.highlights.delete("tts-widget-word");}
  getBlocks(){return this.blocks;}
}

/* HIGHLIGHT MANAGER */
class HighlightManager {
  constructor(reader,settings){this.reader=reader;this.settings=settings;this.boundarySupported=false;}
  paragraph(index){this.reader.setActive(index,this.settings);}
  word(index,charIndex,charLength,utteranceText){const s=this.settings.value,block=this.reader.blocks[index];if(!s.wordSync||!s.highlight||!block||!window.CSS||!CSS.highlights||typeof Highlight!=="function")return;
    CSS.highlights.delete("tts-widget-word");
    const spoken=(utteranceText||"").replace(/\\s+/g," ").trim();if(!spoken)return;
    const chars=[],positions=[],walker=document.createTreeWalker(block.element,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){const value=node.textContent||"";for(let i=0;i<value.length;i++){const ch=value[i];if(/\\s/.test(ch)){if(chars.length&&chars[chars.length-1]!==" "){chars.push(" ");positions.push({node,offset:i});}}else{chars.push(ch);positions.push({node,offset:i});}}}
    const source=chars.join(" "),base=source.indexOf(spoken);if(base<0)return;
    const start=base+Math.max(0,Number(charIndex)||0);if(start>=positions.length)return;
    let length=Number(charLength)||0;if(length<=0){length=1;while(start+length<positions.length&&positions[start+length]!==" ")length++;}
    const end=Math.min(positions.length,start+Math.max(1,length));const first=positions[start],last=positions[end-1];if(!first||!last)return;
    const range=document.createRange();range.setStart(first.node,first.offset);range.setEnd(last.node,last.offset+1);CSS.highlights.set("tts-widget-word",new Highlight(range));}
  applyColors(){const s=this.settings.value,style=widgetRoot.querySelector("#tts-widget-highlight-colors");if(style)style.textContent="html body .tts-widget-reading-active,html body [data-tts-widget-active=\"true\"]{background-color:"+s.highlightColor+" !important;background-image:linear-gradient("+s.highlightColor+","+s.highlightColor+") !important;color:"+s.textColor+" !important;outline:2px solid "+s.borderColor+" !important;outline-offset:3px;box-shadow:inset 0 0 0 1px "+s.borderColor+" !important;border-radius:5px}::highlight(tts-widget-word){background-color:#ffbd59 !important;color:#241500 !important;text-decoration:underline;text-decoration-color:#e0a800}";}
}

/* SPEECH MANAGER */
class SpeechManager {
  constructor(reader,voices,settings,highlight){this.reader=reader;this.voices=voices;this.settings=settings;this.highlight=highlight;this.synth=window.speechSynthesis;this.queue=[];this.position=0;this.state="idle";this.session=0;this.current=null;this.currentStarted=false;this.backgroundInterrupted=false;this.onState=()=>{};}
  emit(message){widgetRoot.querySelector("#status").textContent=message;this.onState();}
  makeQueue(){this.queue=[];this.reader.blocks.forEach((b,paragraph)=>{const sentences=b.text.match(/[^.!?。！？]+[.!?。！？]?/g)||[b.text];let part="";sentences.forEach(sentence=>{if(part.length+sentence.length>220&&part){this.queue.push({text:part.trim(),paragraph});part="";}part+=sentence;if(part.length>=220){this.queue.push({text:part.trim(),paragraph});part="";}});if(part.trim())this.queue.push({text:part.trim(),paragraph});});}
  start(paragraph=0){if(!isSpeechSynthesisSupported()){this.emit("Trình duyệt không hỗ trợ Web Speech API (SpeechSynthesis).");return;}if(!this.reader.blocks.length){this.emit("Không có nội dung để đọc.");return;}this.stop(false);this.makeQueue();this.position=this.queue.findIndex(x=>x.paragraph>=paragraph);if(this.position<0)this.position=0;this.state="reading";const id=this.session;this.emit("Đang chuẩn bị đọc...");this.next(id);}
  next(id){if(id!==this.session||this.state!=="reading")return;if(this.position>=this.queue.length){this.state="ended";this.current=null;this.currentStarted=false;this.reader.clearHighlight();this.emit("Đã đọc xong.");return;}this.speakCurrent(id);}
  speakCurrent(id){
    if(id!==this.session||this.state!=="reading")return;
    const item=this.queue[this.position];if(!item)return;
    const utterance=new SpeechSynthesisUtterance(item.text);const s=this.settings.value;
    utterance.lang=this.voices.selected?.lang||"vi-VN";if(this.voices.selected)utterance.voice=this.voices.selected;
    utterance.rate=Number(s.rate);utterance.pitch=Number(s.pitch);utterance.volume=Number(s.volume);
    this.current=utterance;this.currentStarted=false;this.backgroundInterrupted=false;
    // Cập nhật tiến trình khi utterance bắt đầu; setActive tiếp tục đồng bộ mỗi khi đổi đoạn.
    utterance.onstart=()=>{if(id!==this.session)return;this.currentStarted=true;this.highlight.paragraph(item.paragraph);this.emit("Đang đọc đoạn "+(item.paragraph+1)+"/"+this.reader.blocks.length);};
    utterance.onboundary=e=>{if(id!==this.session||e.name!=="word")return;this.highlight.boundarySupported=true;this.highlight.word(item.paragraph,e.charIndex,e.charLength,item.text);};
    utterance.onend=()=>{if(id!==this.session||this.state!=="reading")return;this.current=null;this.currentStarted=false;this.position++;this.next(id);};
    utterance.onerror=e=>{
      if(id!==this.session)return;
      if(e.error==="canceled"||e.error==="interrupted"){if(this.state==="reading")this.backgroundInterrupted=true;return;}
      this.state="error";this.current=null;this.currentStarted=false;this.emit("Lỗi đọc: "+e.error);
    };
    this.synth.speak(utterance);
  }
  recoverBackground(){
    if(this.state!=="reading"||!this.current)return;
    if(this.synth?.paused){try{this.synth.resume();return;}catch(_){}}
    if(this.backgroundInterrupted||(this.currentStarted&&!this.synth?.speaking&&!this.synth?.pending)){
      this.speakCurrent(this.session);
      this.emit("Đã khôi phục phiên đọc sau khi chuyển cửa sổ.");
    }
  }
  pause(){if(this.state!=="reading")return;this.synth.pause();this.state="paused";this.emit("Đã tạm dừng.");}
  resume(){if(this.state!=="paused")return;this.synth.resume();this.state="reading";this.emit("Đang tiếp tục đọc.");}
  stop(show=true){this.session++;if("speechSynthesis"in window)this.synth.cancel();this.state="idle";this.current=null;this.currentStarted=false;this.backgroundInterrupted=false;this.queue=[];this.position=0;this.reader.clearHighlight();if(show)this.emit("Đã dừng đọc.");}
  move(delta){if(!this.reader.blocks.length)return;const current=this.queue[this.position]?.paragraph??this.reader.active;let target=Math.max(0,Math.min(this.reader.blocks.length-1,(current<0?0:current)+delta));this.start(target);}
  test(){if(!this.voices.selected){this.emit("Vui lòng chọn giọng đọc.");return;}this.stop(false);const id=this.session;const u=new SpeechSynthesisUtterance("Xin chào. Đây là phần thử nghiệm giọng đọc.");const s=this.settings.value;u.voice=this.voices.selected;u.lang=u.voice.lang;u.rate=Number(s.rate);u.pitch=Number(s.pitch);u.volume=Number(s.volume);u.onstart=()=>{if(id===this.session)this.emit("Đang thử giọng: "+u.voice.name);};u.onend=()=>{if(id===this.session)this.emit("Đã thử giọng xong.");};u.onerror=e=>{if(id===this.session)this.emit("Lỗi thử giọng: "+e.error);};this.synth.speak(u);this.state="testing";}
}

/* TOOLBAR MANAGER */
class ToolbarManager {
  constructor(speech,reader){
    this.speech=speech;this.reader=reader;
    this.buttons={play:$("playBtn"),pause:$("pauseBtn"),resume:$("resumeBtn"),stop:$("stopBtn"),prev:$("prevBtn"),next:$("nextBtn")};
  }
  update(){
    const state=this.speech.state,hasContent=this.reader.blocks.length>0;
    this.buttons.play.disabled=!hasContent;
    this.buttons.pause.disabled=state!=="reading";
    this.buttons.resume.disabled=state!=="paused";
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
function isSpeechSynthesisSupported(){
  const synth=window.speechSynthesis;
  return typeof synth!=="undefined" && typeof window.SpeechSynthesisUtterance==="function" && typeof synth.speak==="function" && typeof synth.getVoices==="function";
}
function updateReaderAvailability(){
  const supported=isSpeechSynthesisSupported();
  const button=$("openReaderBtn");
  const label=$("openReaderLabel");
  label.textContent=supported?"Đọc nội dung này":"Đọc nội dung này [ không hỗ trợ ]";
  button.setAttribute("aria-label",label.textContent);
  button.dataset.speechApiSupported=String(supported);
  button.title=supported?"Đọc nội dung trong vùng đã chọn":"Trình duyệt này không hỗ trợ Web Speech API (SpeechSynthesis).";
}
function applyToolbarPosition(){
  const toolbarElement=$("readerToolbar");
  const isFooter=settings.value.toolbarPosition==="footer";
  if(isFooter)reader.root.append(toolbarElement);
  else reader.root.insertBefore(toolbarElement,reader.content);
  toolbarElement.classList.toggle("toolbar-bottom",isFooter);
  reader.root.classList.toggle("toolbar-at-footer",isFooter);
}
function applySettings(){applyToolbarPosition();highlight.applyColors();syncSettingsForm();}
function syncSettingsForm(){const s=settings.value;const map={settingRate:"rate",settingPitch:"pitch",settingVolume:"volume",settingHighlight:"highlight",settingWordSync:"wordSync",settingSync:"sync",settingBackgroundReading:"keepBackgroundReading",settingToolbarPosition:"toolbarPosition",settingHighlightColor:"highlightColor",settingTextColor:"textColor",settingBorderColor:"borderColor"};Object.entries(map).forEach(([id,key])=>{const el=$(id);if(el.type==="checkbox")el.checked=!!s[key];else el.value=s[key];});}
function readSettingsForm(){const s=settings.value;const map={settingRate:"rate",settingPitch:"pitch",settingVolume:"volume",settingHighlight:"highlight",settingWordSync:"wordSync",settingSync:"sync",settingBackgroundReading:"keepBackgroundReading",settingToolbarPosition:"toolbarPosition",settingHighlightColor:"highlightColor",settingTextColor:"textColor",settingBorderColor:"borderColor"};Object.entries(map).forEach(([id,key])=>{const el=$(id);s[key]=el.type==="checkbox"?el.checked:el.type==="range"?Number(el.value):el.value;});applySettings();settings.save();}
Object.keys({settingRate:1,settingPitch:1,settingVolume:1,settingHighlight:1,settingWordSync:1,settingSync:1,settingBackgroundReading:1,settingToolbarPosition:1,settingHighlightColor:1,settingTextColor:1,settingBorderColor:1}).forEach(id=>$(id).addEventListener("input",readSettingsForm));

$("openReaderBtn").addEventListener("click",()=>{speech.stop(false);reader.open();applySettings();toolbar.update();});
updateReaderAvailability();
$("closeBtn").addEventListener("click",()=>{speech.stop(false);reader.close();});
$("playBtn").addEventListener("click",()=>speech.start(0));
$("pauseBtn").addEventListener("click",()=>speech.pause());
$("resumeBtn").addEventListener("click",()=>speech.resume());
$("stopBtn").addEventListener("click",()=>speech.stop());
$("prevBtn").addEventListener("click",()=>speech.move(-1));
$("nextBtn").addEventListener("click",()=>speech.move(1));
$("testVoiceBtn").addEventListener("click",()=>speech.test());
$("refreshVoicesBtn").addEventListener("click",()=>voices.load());
$("settingsBtn").addEventListener("click",()=> $("settingsPanel").classList.toggle("open"));
$("saveSettingsBtn").addEventListener("click",()=>{readSettingsForm();settings.save();$("status").textContent="Đã lưu cài đặt.";});
$("resetSettingsBtn").addEventListener("click",()=>{settings.reset();applySettings();$("status").textContent="Đã khôi phục cài đặt mặc định.";});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&reader.root.classList.contains("open")){speech.stop(false);reader.close();}});
const toolbar=new ToolbarManager(speech,reader);
speech.onState=()=>toolbar.update();
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
toolbar.update();
if("speechSynthesis"in window){window.speechSynthesis.addEventListener?.("voiceschanged",()=>voices.load());voices.load();setTimeout(()=>voices.load(),500);}
  initialized=true;
  return window.TTSWidget;
}
window.TTSWidget={init,version:"1.0.0"};
const script=document.currentScript||document.querySelector("script[data-content-selector]");
const autoConfig={};
if(script&&script.dataset.contentSelector)autoConfig.contentSelector=script.dataset.contentSelector;
const run=()=>init(autoConfig);
if(script&&script.dataset.contentSelector){
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run,{once:true});
  else run();
}
})();
