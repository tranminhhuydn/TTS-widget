(() => {
  if (window.__ttsSubtitleYouTubeLoaded) return;
  window.__ttsSubtitleYouTubeLoaded=true;
  const DEFAULTS={enabled:false,engine:"browser",vieneuVoice:"Pham Tuyen",vieneuVoices:["Pham Tuyen"],rate:1,volume:1,voiceURI:"",voiceURIs:[],rotateVoices:false,autoLanguage:true,readingMode:"story",textFilters:{enabled:true,rules:[{id:"default-music",enabled:true,pattern:"\\[(?:âm nhạc|nhạc nền|tiếng vỗ tay|music|background music|laughter|applause)\\]",replacement:"",flags:"gi"}]}};
  const isVieNeuEngine=value=>value==="vieneu"||value==="vieneu-gpu";
  let settings={...DEFAULTS},enabled=false,video=null,engine=null,sentences=[],track=null,utterance=null,activeAudio=null,activeAudioUrl=null,activeAudioResolve=null,rotationIndex=0,status="idle",loadToken=0;
  let capturedTimedtext=null,editorCues=[],editorVideoId=null,editorCustomActive=false,subtitleOverlay=null;
  const editorKey=id=>"ttsSubtitleEditor:v1:"+id;
  const currentVideoId=()=>new URL(location.href).searchParams.get("v")||"";
  function readEditorDocument(id){return new Promise(resolve=>chrome.storage.local.get(editorKey(id),data=>resolve(data[editorKey(id)]||null)));}
  function normalizeEditorCues(cues){return(Array.isArray(cues)?cues:[]).map((cue,index)=>({id:String(cue.id||"cue-"+index),text:String(cue.text||"").trim(),startTime:Math.max(0,Number(cue.startTime)||0),endTime:Math.max(0,Number(cue.endTime)||0),voice:String(cue.voice||""),voiceEngine:String(cue.voiceEngine||"")})).filter(cue=>cue.text&&Number.isFinite(cue.startTime)&&Number.isFinite(cue.endTime)&&cue.endTime>cue.startTime).sort((a,b)=>a.startTime-b.startTime).map((cue,index)=>({...cue,id:String(index+1)}));}
  function renderSubtitleOverlay(){if(!subtitleOverlay||!video)return;if(!enabled||!editorCustomActive){subtitleOverlay.textContent="";subtitleOverlay.classList.remove("is-visible");return;}const now=video.currentTime||0;const cue=editorCues.find(item=>Number(item.startTime)<=now&&Number(item.endTime)>=now);subtitleOverlay.textContent=cue?.text||"";subtitleOverlay.classList.toggle("is-visible",!!cue?.text);}
  function ensureSubtitleOverlay(){if(!video)return;const player=video.closest(".html5-video-player")||video.parentElement;if(!player)return;if(subtitleOverlay?.parentElement!==player){subtitleOverlay?.remove();subtitleOverlay=document.createElement("div");subtitleOverlay.id="tts-subtitle-editor-overlay";subtitleOverlay.setAttribute("aria-live","off");player.append(subtitleOverlay);}video.removeEventListener("timeupdate",renderSubtitleOverlay);video.addEventListener("timeupdate",renderSubtitleOverlay);video.removeEventListener("seeked",renderSubtitleOverlay);video.addEventListener("seeked",renderSubtitleOverlay);renderSubtitleOverlay();}
  function clearSubtitleOverlay(){if(video){video.removeEventListener("timeupdate",renderSubtitleOverlay);video.removeEventListener("seeked",renderSubtitleOverlay);}subtitleOverlay?.remove();subtitleOverlay=null;}
  async function getEditorData(){const id=currentVideoId();if(!id)throw Error("Không xác định được video YouTube hiện tại.");const saved=await readEditorDocument(id);if(saved&&Array.isArray(saved.cues))return{videoId:id,title:document.title.replace(/ - YouTube$/,""),cues:saved.cues,custom:true,currentTime:video?.currentTime||0};let payload=capturedTimedtext?.pageVideoId===id?capturedTimedtext.payload:null;if(!payload){window.postMessage({source:"tts-subtitle-content",type:"GET_TIMEDTEXT_CACHE"},location.origin);const captured=await waitForTimedtext(track?.languageCode||"",loadToken);payload=captured.payload;}const cues=window.TTSSubtitleParser.parse(payload).map((cue,index)=>({id:String(index+1),text:cue.text,startTime:cue.start,endTime:cue.end}));if(!cues.length)throw Error("Không tìm thấy phụ đề gốc. Hãy bật CC trên YouTube rồi tải lại Editor.");return{videoId:id,title:document.title.replace(/ - YouTube$/,""),cues,custom:false,currentTime:video?.currentTime||0};}
  window.addEventListener("message",event=>{
    const data=event.data;
    if(event.source!==window||event.origin!==location.origin||data?.source!=="tts-subtitle-network"||data.type!=="TIMEDTEXT_RESPONSE")return;
    try{
      const url=new URL(data.url,location.href),id=new URL(location.href).searchParams.get("v");
      if(!id||data.pageVideoId!==id||(url.searchParams.get("v")&&url.searchParams.get("v")!==id))return;
      const payload=window.TTSSubtitleParser.parseText(data.body);
      if(Array.isArray(payload?.events)&&payload.events.length)capturedTimedtext={url:data.url,payload,pageVideoId:data.pageVideoId};
    }catch(error){console.warn("[TTS Subtitle] Không đọc được response timedtext:",error.message);}
  });
  // Yêu cầu Network Listener phát lại JSON3 nếu YouTube đã tải phụ đề trước document_idle.
  window.postMessage({source:"tts-subtitle-content",type:"GET_TIMEDTEXT_CACHE"},location.origin);
  let pronunciationEntries={},pronunciationLookup={},pronunciationPattern=null,pronunciationLoadPromise=null;
  function loadPronunciationDictionary(){
    if(pronunciationLoadPromise)return pronunciationLoadPromise;
    pronunciationLoadPromise=new Promise(resolve=>{
      chrome.runtime.sendMessage({target:"tts-pronunciation",type:"GET_DICTIONARY"},response=>{
        if(chrome.runtime.lastError||!response?.ok||!response.data?.entries){resolve(false);return;}
        pronunciationEntries=response.data.entries;
        pronunciationLookup=Object.fromEntries(Object.entries(pronunciationEntries).map(([key,value])=>[key.toLocaleLowerCase(),value]));
        const keys=Object.keys(pronunciationEntries).sort((a,b)=>b.length-a.length);
        if(keys.length){
          const special=[".", "*", "+", "?", "^", "$", "{", "}", "(", ")", "|", "[", "]", String.fromCharCode(92)];
        const slash=String.fromCharCode(92);
        const escaped=keys.map(key=>key.split("").map(char=>special.includes(char)?slash+char:char).join(""));
          pronunciationPattern=new RegExp("(^|[^\\p{L}\\p{N}])("+escaped.join("|")+")(?=$|[^\\p{L}\\p{N}])","giu");
        }
        console.info("[TTS Subtitle] Đã nạp từ điển phát âm:",response.data.count||keys.length,"mục");
        resolve(true);
      });
    });
    return pronunciationLoadPromise;
  }
  function pronunciationText(text){
    const source=String(text||"");
    if(!pronunciationPattern)return source;
    pronunciationPattern.lastIndex=0;
    return source.replace(pronunciationPattern,(match,prefix,term)=>prefix+(pronunciationLookup[term.toLocaleLowerCase()]||term));
  }
  function applyTextFilters(value){
    let result=String(value||"");
    const config=settings.textFilters||DEFAULTS.textFilters;
    if(config.enabled===false||!Array.isArray(config.rules))return result;
    for(const rule of config.rules.slice(0,30)){
      if(!rule||rule.enabled===false||!rule.pattern)continue;
      try{
        if(String(rule.pattern).length>300)continue;
        const flags=String(rule.flags||"g").replace(/[^dgimsuvy]/g,"").slice(0,8);
        result=result.replace(new RegExp(rule.pattern,flags),String(rule.replacement??""));
      }catch(error){console.warn("[TTS Subtitle] Regex không hợp lệ:",error.message);}
    }
    return result.replace(/[ \t]{2,}/g," ").replace(/\s+([,.;!?])/g,"$1").trim();
  }
  const norm=s=>String(s||"").replace(/\s+/g," ").trim();
  function language(text,trackLang){if(trackLang)return trackLang;if(/[\u3040-\u30ff]/.test(text))return"ja";if(/[\u4e00-\u9fff]/.test(text))return"zh";if(/[\uac00-\ud7af]/.test(text))return"ko";if(/[\u0100-\u017f]/.test(text))return"vi";if(/[\u0400-\u04ff]/.test(text))return"ru";return"en";}
  function voices(){return speechSynthesis.getVoices();}
  function chooseVoice(text,lang,voiceOverride=""){
    const all=voices();if(voiceOverride){const exact=all.find(v=>v.voiceURI===voiceOverride||v.name===voiceOverride);if(exact)return exact;}
    const code=(settings.autoLanguage?language(text,lang):"").toLowerCase();
    const selected=(settings.voiceURIs||[]).map(id=>all.find(v=>v.voiceURI===id)).filter(Boolean);
    const matches=list=>list.filter(v=>v.lang.toLowerCase()===code||v.lang.toLowerCase().startsWith(code+"-"));
    if(settings.rotateVoices&&selected.length){const pool=settings.autoLanguage&&matches(selected).length?matches(selected):selected;const v=pool[rotationIndex%pool.length];rotationIndex++;return v;}
    // Ưu tiên giọng người dùng đã chọn; autoLanguage chỉ lọc theo ngôn ngữ,
    // không được tự ý thay thế giọng Google bằng giọng khác cùng ngôn ngữ.
    if(selected.length){
      const preferred=settings.autoLanguage?matches(selected):selected;
      if(preferred.length)return preferred[0];
    }
    if(settings.autoLanguage){const v=all.find(v=>v.lang.toLowerCase()===code)||all.find(v=>v.lang.toLowerCase().startsWith(code+"-"));if(v)return v;}
    return all.find(v=>v.voiceURI===settings.voiceURI)||selected[0]||null;
  }
  const audioCache=new Map(),audioPending=new Map(),audioFailures=new Map(),synthesisQueue=[];
  let synthesisRunning=false,preloadGeneration=0,lastError="";
  const CACHE_LIMIT=24;
  function cancel(){
    try{speechSynthesis.cancel();}catch(_){}
    utterance=null;
    if(activeAudio){activeAudio.onended=null;activeAudio.onerror=null;activeAudio.pause();activeAudio.src="";activeAudio=null;}
    if(activeAudioUrl){URL.revokeObjectURL(activeAudioUrl);activeAudioUrl=null;}
    if(activeAudioResolve){const resolve=activeAudioResolve;activeAudioResolve=null;resolve();}
  }
  function resetPreload(){
    preloadGeneration++;
    for(const task of synthesisQueue){audioPending.delete(task.item.id);task.reject(Error("Đã hủy hàng đợi audio cũ."));}
    synthesisQueue.length=0;
    audioPending.clear();
    audioFailures.clear();
  }
  function selectedVieNeuVoice(voiceOverride="") {
    if(voiceOverride)return String(voiceOverride);
    if (settings.engine === "vieneu") return "Pham Tuyen";
    const selected = Array.isArray(settings.vieneuVoices) && settings.vieneuVoices.length
      ? settings.vieneuVoices
      : [settings.vieneuVoice || "Pham Tuyen"];
    const voice = selected[rotationIndex % selected.length];
    if (selected.length > 1) rotationIndex++;
    return voice;
  }
  async function synthesizeBlob(item){
    const text=applyTextFilters(item.text);
    if(!text)return null;
    await loadPronunciationDictionary();
    const voice = selectedVieNeuVoice(item.voiceEngine===settings.engine?item.voice:"");
    return new Promise((resolve,reject)=>{
      chrome.runtime.sendMessage({target:"vieneu-local-tts",type:"SYNTHESIZE",engine:settings.engine,text:pronunciationText(text),voice},response=>{
        const runtimeError=chrome.runtime.lastError;
        if(runtimeError){reject(Error("Không kết nối được VieNeu Local API: "+runtimeError.message));return;}
        if(!response?.ok){reject(Error(response?.error||"VieNeu không trả về âm thanh."));return;}
        try{
          const binary=atob(response.audioBase64),bytes=new Uint8Array(binary.length);
          for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
          resolve(new Blob([bytes],{type:response.mimeType||"audio/wav"}));
        }catch(error){reject(error);}
      });
    });
  }
  async function pumpSynthesisQueue(){
    if(synthesisRunning)return;
    synthesisRunning=true;
    while(synthesisQueue.length){
      const task=synthesisQueue.shift();
      try{
        const blob=await synthesizeBlob(task.item);
        if(task.generation===preloadGeneration){
          audioCache.set(task.item.id,blob);
          lastError="";
          while(audioCache.size>CACHE_LIMIT)audioCache.delete(audioCache.keys().next().value);
        }
        if(audioPending.get(task.item.id)===task.promise)audioPending.delete(task.item.id);
        task.resolve(blob);
      }catch(error){
        if(audioPending.get(task.item.id)===task.promise)audioPending.delete(task.item.id);
        if(task.generation===preloadGeneration)audioFailures.set(task.item.id,error);
        task.reject(error);
      }
    }
    synthesisRunning=false;
  }
  function prepare(item){
    if(!isVieNeuEngine(settings.engine))return Promise.resolve(null);
    const filteredText=applyTextFilters(item.text);
    if(!filteredText)return Promise.resolve(null);
    item={...item,text:filteredText};
    if(audioCache.has(item.id))return Promise.resolve(audioCache.get(item.id));
    if(audioFailures.has(item.id))return Promise.reject(audioFailures.get(item.id));
    if(audioPending.has(item.id))return audioPending.get(item.id);
    const generation=preloadGeneration;
    let resolveTask,rejectTask;
    const promise=new Promise((resolve,reject)=>{resolveTask=resolve;rejectTask=reject;});
    synthesisQueue.push({item,generation,promise,resolve:resolveTask,reject:rejectTask});
    audioPending.set(item.id,promise);
    pumpSynthesisQueue();
    return promise;
  }
  function playVieNeu(item){
    return prepare(item).then(blob=>new Promise((resolve,reject)=>{
      if(!blob){reject(Error("Audio VieNeu chưa sẵn sàng."));return;}
      const url=URL.createObjectURL(blob),audio=new Audio(url);
      activeAudio=audio;activeAudioUrl=url;
      audio.volume=Math.max(0,Math.min(1,Number(settings.volume)||0));
      audio.playbackRate=Math.max(.5,Math.min(2,Number(settings.rate)||1));
      const cleanup=()=>{if(activeAudio===audio)activeAudio=null;if(activeAudioUrl===url){URL.revokeObjectURL(url);activeAudioUrl=null;}if(activeAudioResolve===finish)activeAudioResolve=null;};
      const finish=()=>{cleanup();resolve();};
      activeAudioResolve=finish;
      audio.onended=finish;
      audio.onerror=()=>{cleanup();reject(Error("Không phát được WAV do VieNeu trả về."));};
      audio.play().catch(error=>{cleanup();reject(Error("Trình duyệt không phát được âm thanh VieNeu: "+error.message));});
    }));
  }
  async function speak(item){const filteredText=applyTextFilters(item.text);if(!filteredText)return;item={...item,text:filteredText};await loadPronunciationDictionary();if(isVieNeuEngine(settings.engine))return playVieNeu(item);return new Promise((resolve,reject)=>{
    // Chrome đôi khi bỏ lệnh speak ngay sau cancel(), đặc biệt với giọng đọc mạng.
    cancel();
    const spokenText=pronunciationText(item.text);
    const u=new SpeechSynthesisUtterance(spokenText),v=chooseVoice(spokenText,track?.languageCode||"",item.voiceEngine===settings.engine?item.voice:"");
    if(v){u.voice=v;u.lang=v.lang;}else u.lang=language(item.text,track?.languageCode);
    u.rate=Math.max(.5,Math.min(2,Number(settings.rate)||1));u.volume=Math.max(0,Math.min(1,Number(settings.volume)||0));
    utterance=u;
    u.onend=()=>{if(utterance===u)utterance=null;resolve();};
    u.onerror=event=>{
      if(utterance===u)utterance=null;
      console.warn("[TTS Subtitle] Lỗi SpeechSynthesis:",event.error||event.type,"Voice:",v?.name||"mặc định", "Language:",u.lang);
      reject(Error("Giọng đọc không phát được: "+(event.error||event.type||"speech error")));
    };
    setTimeout(()=>{
      if(utterance!==u){resolve();return;}
      try{speechSynthesis.speak(u);}catch(error){if(utterance===u)utterance=null;reject(error);}
    },80);
  });}
  function playerResponse(){
    if(window.ytInitialPlayerResponse)return window.ytInitialPlayerResponse;
    for(const s of document.scripts){const t=s.textContent||"",p=t.indexOf("ytInitialPlayerResponse");if(p<0)continue;const b=t.indexOf("{",p);if(b<0)continue;let d=0,q=false,e=false;
      for(let i=b;i<t.length;i++){const c=t[i];if(q){if(e)e=false;else if(c==="\\")e=true;else if(c==='"')q=false;continue;}if(c==='"'){q=true;continue;}if(c==="{")d++;else if(c==="}"&&--d===0){try{return JSON.parse(t.slice(b,i+1));}catch(_){break;}}}}
    return null;
  }
  function waitForTimedtext(expectedLang,token){
    return new Promise((resolve,reject)=>{
      const started=Date.now();
      const cleanup=()=>{clearInterval(timer);window.removeEventListener("message",onMessage);};
      const check=()=>{
        if(token!==loadToken){cleanup();reject(Error("Đã hủy yêu cầu tải phụ đề."));return;}
        if(capturedTimedtext){
          let lang="";try{lang=new URL(capturedTimedtext.url).searchParams.get("lang")||"";}catch(_){}
          if(!expectedLang||!lang||lang===expectedLang){const result=capturedTimedtext;cleanup();resolve(result);return;}
        }
        if(Date.now()-started>=15000){cleanup();reject(Error("Chưa bắt được phản hồi /api/timedtext. Hãy bật phụ đề (CC) trên YouTube, đợi phụ đề xuất hiện rồi thử bật TTS lại."));}
      };
      const onMessage=event=>{
        const data=event.data;
        if(event.source!==window||event.origin!==location.origin||data?.source!=="tts-subtitle-network"||data.type!=="TIMEDTEXT_RESPONSE")return;
        try{
          const url=new URL(data.url,location.href),id=new URL(location.href).searchParams.get("v");
          if(!id||data.pageVideoId!==id||(url.searchParams.get("v")&&url.searchParams.get("v")!==id))return;
          const payload=window.TTSSubtitleParser.parseText(data.body);
          if(Array.isArray(payload?.events)&&payload.events.length)capturedTimedtext={url:data.url,payload,pageVideoId:data.pageVideoId};
        }catch(error){console.warn("[TTS Subtitle] Response timedtext không hợp lệ:",error.message);}
        check();
      };
      const timer=setInterval(check,150);
      window.addEventListener("message",onMessage);
      check();
    });
  }
  function buildStorySentences(cues){
    const groups=[];
    for(const cue of cues){const voice=cue.voiceEngine===settings.engine?String(cue.voice||""):"";const previous=groups[groups.length-1];if(previous&&previous.voice===voice)previous.cues.push(cue);else groups.push({voice,cues:[cue]});}
    const result=[];let sequence=0;
    for(const group of groups){const parsed=window.TTSSubtitleParser.toSentencesFromCues(group.cues);for(const sentence of parsed)result.push({...sentence,id:String(++sequence),voice:group.voice,voiceEngine:group.voice?settings.engine:""});}
    return result;
  }
  async function load(){
    const tracks=playerResponse()?.captions?.playerCaptionsTracklistRenderer?.captionTracks||[];
    const preferred=(navigator.language||"vi").split("-")[0].toLowerCase();
    track=tracks.find(t=>t.languageCode?.toLowerCase().startsWith(preferred))||tracks.find(t=>t.languageCode?.toLowerCase().startsWith("vi"))||tracks[0]||null;
    const id=currentVideoId(),saved=await readEditorDocument(id);let cues;if(id!==currentVideoId())return[];
    editorCustomActive=!!(saved&&Array.isArray(saved.cues));
    if(editorCustomActive)cues=normalizeEditorCues(saved.cues);else{const captured=await waitForTimedtext(track?.languageCode||"",loadToken);cues=window.TTSSubtitleParser.parse(captured.payload).map((cue,index)=>({id:String(index+1),text:cue.text,startTime:cue.start,endTime:cue.end}));}
    if(!cues.length)throw Error("Không tìm thấy nội dung phụ đề để đọc.");editorCues=cues;editorVideoId=id;
    const parsed=settings.readingMode==="original"?cues.map((cue,index)=>({...cue,id:String(index+1),voice:cue.voiceEngine===settings.engine?cue.voice:"",voiceEngine:cue.voiceEngine===settings.engine?settings.engine:""})):buildStorySentences(cues);
    if(!parsed.length)throw Error("Không tìm thấy câu phụ đề hợp lệ.");return parsed;
  }
  async function activate(){
    const token=++loadToken;
    capturedTimedtext=null;
    window.postMessage({source:"tts-subtitle-content",type:"GET_TIMEDTEXT_CACHE"},location.origin);
    video=document.querySelector("video.html5-main-video")||document.querySelector("video");
    if(!video)throw Error("Không tìm thấy video YouTube.");
    if(editorVideoId&&editorVideoId!==currentVideoId()){editorCues=[];editorVideoId=null;editorCustomActive=false;clearSubtitleOverlay();}
    ensureSubtitleOverlay();
    status="loading";lastError="";const next=await load();if(token!==loadToken)return;
    if(settings.engine==="browser"){
      await new Promise((resolve,reject)=>{
        chrome.runtime.sendMessage({target:"tts-subtitle-youtube",type:"TTS_CLAIM"},response=>{
          const runtimeError=chrome.runtime.lastError;
          if(runtimeError){reject(Error("Không điều phối được Google TTS giữa các tab: "+runtimeError.message));return;}
          if(!response?.ok){reject(Error(response?.error||"Không nhận được quyền sử dụng Google TTS."));return;}
          resolve();
        });
      });
      if(token!==loadToken)return;
    }
    if(engine)engine.destroy();resetPreload();audioCache.clear();sentences=next;
    engine=new window.TTSSubtitleHybridSync({video,sentences,speak,prepare,cancel,resetPreload,pauseSpeech:()=>{if(activeAudio)activeAudio.pause();speechSynthesis.pause();},resumeSpeech:()=>{if(activeAudio)activeAudio.play().catch(()=>{});speechSynthesis.resume();},onStatus:s=>status=s,onError:e=>{status="error";lastError=e.message;console.warn("[TTS Subtitle] VieNeu:",e.message);}});
    enabled=true;chrome.storage.local.set({enabled:true});ensureSubtitleOverlay();renderSubtitleOverlay();engine.start(video.currentTime);status="reading";
  }
  function deactivate(persist=true){enabled=false;loadToken++;if(engine)engine.stop();resetPreload();audioCache.clear();cancel();if(subtitleOverlay)subtitleOverlay.classList.remove("is-visible");status="stopped";chrome.runtime.sendMessage({target:"tts-subtitle-youtube",type:"TTS_RELEASE"},()=>void chrome.runtime.lastError);if(persist)chrome.storage.local.set({enabled:false});}
  function response(){return{lastError,preloadedAudio:audioCache.size,pendingAudio:audioPending.size,enabled,engine:settings.engine,vieneuVoice:settings.vieneuVoice,vieneuVoices:settings.vieneuVoices,rate:settings.rate,volume:settings.volume,voiceURI:settings.voiceURI,voiceURIs:settings.voiceURIs,rotateVoices:settings.rotateVoices,autoLanguage:settings.autoLanguage,readingMode:settings.readingMode,status,voices:voices().map(v=>({name:v.name,lang:v.lang,voiceURI:v.voiceURI}))};}
  chrome.runtime.onMessage.addListener((m,s,send)=>{
    if(m?.target!=="tts-subtitle-youtube")return;
    if(m.type==="TTS_PREEMPT"){deactivate(false);send({stopped:true,reason:"another-tab"});return;}
    if(m.type==="GET_STATE"){const currentVideo=document.querySelector("video.html5-main-video")||document.querySelector("video");send({...response(),videoId:currentVideoId(),videoTitle:document.title.replace(/ - YouTube$/,""),currentTime:currentVideo?.currentTime||0,videoPaused:currentVideo?.paused??true});return;}
    if(m.type==="GET_EDITOR_DATA"){getEditorData().then(data=>send(data)).catch(error=>send({error:error.message,videoId:currentVideoId()}));return true;}
    if(m.type==="SEEK_TO_TIME"){const targetVideo=document.querySelector("video.html5-main-video")||document.querySelector("video");if(!targetVideo){send({error:"Không tìm thấy video."});return;}targetVideo.pause();targetVideo.currentTime=Math.max(0,Number(m.value)||0);targetVideo.pause();send({ok:true,currentTime:targetVideo.currentTime,videoPaused:targetVideo.paused});return;}
    if(m.type==="PAUSE_VIDEO"){const targetVideo=document.querySelector("video.html5-main-video")||document.querySelector("video");if(!targetVideo){send({error:"Không tìm thấy video."});return;}targetVideo.pause();send({ok:true,videoPaused:true,currentTime:targetVideo.currentTime});return;}
    if(m.type==="SAVE_EDITOR_DATA"){const id=currentVideoId();if(!id||m.videoId!==id){send({error:"Video đã thay đổi. Hãy tải lại Editor trước khi lưu."});return;}const cues=normalizeEditorCues(m.cues);if(!cues.length){send({error:"Bản biên tập cần có ít nhất một đoạn phụ đề hợp lệ."});return;}const key=editorKey(id),doc={version:2,videoId:id,updatedAt:Date.now(),cues};chrome.storage.local.set({[key]:doc},()=>{if(chrome.runtime.lastError){send({error:"Không lưu được: "+chrome.runtime.lastError.message});return;}editorCues=cues;editorVideoId=id;editorCustomActive=true;ensureSubtitleOverlay();renderSubtitleOverlay();if(enabled)activate().then(()=>send({ok:true,cues})).catch(error=>send({error:error.message}));else send({ok:true,cues});});return true;}
    if(m.type==="RESET_EDITOR_DATA"){const id=currentVideoId();if(!id||m.videoId!==id){send({error:"Video đã thay đổi. Hãy tải lại Editor."});return;}chrome.storage.local.remove(editorKey(id),()=>{if(chrome.runtime.lastError){send({error:chrome.runtime.lastError.message});return;}editorCues=[];editorVideoId=null;editorCustomActive=false;if(enabled)activate().then(()=>send({ok:true})).catch(error=>send({error:error.message}));else{clearSubtitleOverlay();send({ok:true});}});return true;}
    if(m.type==="SET_ENABLED"){if(m.value)activate().then(()=>send({enabled:true})).catch(e=>{status="error";send({error:e.message});});else{deactivate();send({enabled:false});}return true;}
    if(m.type==="STOP"){deactivate();send({stopped:true});return;}
    if(m.type==="SET_ENGINE"){
      if(!["browser","vieneu","vieneu-gpu"].includes(m.value)){send({error:"TTS engine không hợp lệ."});return;}
      if(settings.engine==="browser"&&m.value!=="browser")chrome.runtime.sendMessage({target:"tts-subtitle-youtube",type:"TTS_RELEASE"},()=>void chrome.runtime.lastError);
      settings.engine=m.value;lastError="";resetPreload();audioCache.clear();chrome.storage.local.set({engine:settings.engine});
      if(enabled)activate().then(()=>send({engine:settings.engine})).catch(e=>send({error:e.message}));else send({engine:settings.engine});
      return true;
    }
    if(m.type==="SET_VIENEU_VOICES"){
      const selected = Array.isArray(m.value) ? [...new Set(m.value.map(v => String(v).trim()).filter(Boolean))] : [];
      if (!selected.length) { send({error:"Hãy chọn ít nhất một giọng VieNeu."}); return; }
      settings.vieneuVoices = selected;
      settings.vieneuVoice = selected[0];
      rotationIndex = 0; lastError = ""; resetPreload(); audioCache.clear();
      chrome.storage.local.set({vieneuVoices:selected,vieneuVoice:selected[0]});
      if (enabled && isVieNeuEngine(settings.engine)) activate().then(()=>send({vieneuVoices:selected})).catch(error=>send({error:error.message}));
      else send({vieneuVoices:selected});
      return true;
    }
    if(m.type==="SET_VIENEU_VOICE"){
      const voice=String(m.value||"Pham Tuyen").trim()||"Pham Tuyen";
      settings.vieneuVoice=voice;settings.vieneuVoices=[voice];
      lastError="";resetPreload();audioCache.clear();chrome.storage.local.set({vieneuVoice:voice,vieneuVoices:[voice]});send({vieneuVoice:voice,vieneuVoices:[voice]});return;
    }
    if(m.type==="SET_READING_MODE"){
      if(!["original","story"].includes(m.value)){send({error:"Kiểu đọc không hợp lệ."});return;}
      const wasEnabled=enabled;
      settings.readingMode=m.value;
      chrome.storage.local.set({readingMode:settings.readingMode});
      if(wasEnabled)activate().then(()=>send({readingMode:settings.readingMode,enabled:true})).catch(e=>send({error:e.message}));
      else send({readingMode:settings.readingMode,enabled:false});
      return true;
    }
    const key={SET_RATE:"rate",SET_VOLUME:"volume",SET_VOICES:"voiceURIs",SET_ROTATE:"rotateVoices",SET_AUTO_LANGUAGE:"autoLanguage"}[m.type];
    if(key){settings[key]=m.value;if(key==="rate")settings.rate=Math.max(.5,Math.min(2,Number(m.value)||1));if(key==="volume")settings.volume=Math.max(0,Math.min(1,Number(m.value)||0));if(key==="voiceURIs")rotationIndex=0;chrome.storage.local.set({[key]:settings[key]});if(engine&&key==="volume"&&utterance){}send({[key]:settings[key]});}
    return true;
  });
  chrome.storage.onChanged.addListener((changes,area)=>{
    if(area!=="local"||!changes.textFilters)return;
    settings.textFilters=changes.textFilters.newValue||DEFAULTS.textFilters;
    if(enabled){
      resetPreload();audioCache.clear();
      activate().catch(error=>{status="error";lastError=error.message;console.warn("[TTS Subtitle] Không áp dụng được bộ lọc mới:",error.message);});
    }
  });
  speechSynthesis.onvoiceschanged=()=>{};
  chrome.storage.local.get(DEFAULTS,stored=>{settings={...DEFAULTS,...stored};if(!Array.isArray(settings.vieneuVoices)||!settings.vieneuVoices.length)settings.vieneuVoices=[settings.vieneuVoice||"Pham Tuyen"];enabled=false;});
  document.addEventListener("yt-navigate-start",()=>{
    if(!enabled)return;
    loadToken++;
    capturedTimedtext=null;
    if(engine){engine.destroy();engine=null;}
    resetPreload();audioCache.clear();cancel();sentences=[];track=null;clearSubtitleOverlay();video=null;editorCues=[];editorVideoId=null;editorCustomActive=false;
    status="loading";
  });
  document.addEventListener("yt-navigate-finish",()=>{
    if(enabled)activate().catch(e=>{if(status!=="stopped"){status="error";lastError=e.message;console.warn("[TTS Subtitle]",e.message);}});
  });
})();