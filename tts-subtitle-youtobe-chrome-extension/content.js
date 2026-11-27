(() => {
  if (window.__ttsSubtitleYouTubeLoaded) return;
  window.__ttsSubtitleYouTubeLoaded=true;
  const DEFAULTS={enabled:false,engine:"browser",vieneuVoice:"Pham Tuyen",rate:1,volume:1,voiceURI:"",voiceURIs:[],rotateVoices:false,autoLanguage:true,readingMode:"story"};
  let settings={...DEFAULTS},enabled=false,video=null,engine=null,sentences=[],track=null,utterance=null,activeAudio=null,activeAudioUrl=null,activeAudioResolve=null,rotationIndex=0,status="idle",loadToken=0;
  let capturedTimedtext=null;
  window.addEventListener("message",event=>{
    const data=event.data;
    if(event.source!==window||event.origin!==location.origin||data?.source!=="tts-subtitle-network"||data.type!=="TIMEDTEXT_RESPONSE")return;
    try{
      const url=new URL(data.url,location.href),id=new URL(location.href).searchParams.get("v");
      if(url.searchParams.get("v")&&url.searchParams.get("v")!==id)return;
      const payload=window.TTSSubtitleParser.parseText(data.body);
      if(Array.isArray(payload?.events)&&payload.events.length)capturedTimedtext={url:data.url,payload};
    }catch(error){console.warn("[TTS Subtitle] Không đọc được response timedtext:",error.message);}
  });
  // Yêu cầu Network Listener phát lại JSON3 nếu YouTube đã tải phụ đề trước document_idle.
  window.postMessage({source:"tts-subtitle-content",type:"GET_TIMEDTEXT_CACHE"},location.origin);
  const norm=s=>String(s||"").replace(/\s+/g," ").trim();
  function language(text,trackLang){if(trackLang)return trackLang;if(/[\u3040-\u30ff]/.test(text))return"ja";if(/[\u4e00-\u9fff]/.test(text))return"zh";if(/[\uac00-\ud7af]/.test(text))return"ko";if(/[\u0100-\u017f]/.test(text))return"vi";if(/[\u0400-\u04ff]/.test(text))return"ru";return"en";}
  function voices(){return speechSynthesis.getVoices();}
  function chooseVoice(text,lang){
    const all=voices(),code=(settings.autoLanguage?language(text,lang):"").toLowerCase();
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
  function synthesizeBlob(text){
    return new Promise((resolve,reject)=>{
      chrome.runtime.sendMessage({target:"vieneu-local-tts",type:"SYNTHESIZE",text,voice:settings.vieneuVoice||"Pham Tuyen"},response=>{
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
        const blob=await synthesizeBlob(task.item.text);
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
    if(settings.engine!=="vieneu")return Promise.resolve(null);
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
  function speak(item){if(settings.engine==="vieneu")return playVieNeu(item);return new Promise((resolve,reject)=>{
    // Chrome đôi khi bỏ lệnh speak ngay sau cancel(), đặc biệt với giọng đọc mạng.
    cancel();
    const u=new SpeechSynthesisUtterance(item.text),v=chooseVoice(item.text,track?.languageCode||"");
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
          if(url.searchParams.get("v")&&url.searchParams.get("v")!==id)return;
          const payload=window.TTSSubtitleParser.parseText(data.body);
          if(Array.isArray(payload?.events)&&payload.events.length)capturedTimedtext={url:data.url,payload};
        }catch(error){console.warn("[TTS Subtitle] Response timedtext không hợp lệ:",error.message);}
        check();
      };
      const timer=setInterval(check,150);
      window.addEventListener("message",onMessage);
      check();
    });
  }
  async function load(){
    const tracks=playerResponse()?.captions?.playerCaptionsTracklistRenderer?.captionTracks||[];
    const preferred=(navigator.language||"vi").split("-")[0].toLowerCase();
    track=tracks.find(t=>t.languageCode?.toLowerCase().startsWith(preferred))||tracks.find(t=>t.languageCode?.toLowerCase().startsWith("vi"))||tracks[0]||null;
    const captured=await waitForTimedtext(track?.languageCode||"",loadToken);
    const parsed=settings.readingMode==="original"
      ? window.TTSSubtitleParser.parse(captured.payload).map((cue,id)=>({id,text:cue.text,startTime:cue.start,endTime:cue.end}))
      : window.TTSSubtitleParser.toSentences(captured.payload);
    if(!parsed.length)throw Error("Network Listener đã bắt được timedtext nhưng không tìm thấy câu phụ đề JSON3.");
    return parsed;
  }
  async function activate(){
    const token=++loadToken;video=document.querySelector("video.html5-main-video")||document.querySelector("video");
    if(!video)throw Error("Không tìm thấy video YouTube.");
    status="loading";lastError="";const next=await load();if(token!==loadToken)return;
    if(engine)engine.destroy();resetPreload();audioCache.clear();sentences=next;
    engine=new window.TTSSubtitleHybridSync({video,sentences,speak,prepare,cancel,resetPreload,pauseSpeech:()=>{if(activeAudio)activeAudio.pause();speechSynthesis.pause();},resumeSpeech:()=>{if(activeAudio)activeAudio.play().catch(()=>{});speechSynthesis.resume();},onStatus:s=>status=s,onError:e=>{status="error";lastError=e.message;console.warn("[TTS Subtitle] VieNeu:",e.message);}});
    enabled=true;chrome.storage.local.set({enabled:true});engine.start(video.currentTime);status="reading";
  }
  function deactivate(){enabled=false;loadToken++;if(engine)engine.stop();resetPreload();audioCache.clear();cancel();status="stopped";chrome.storage.local.set({enabled:false});}
  function response(){return{lastError,preloadedAudio:audioCache.size,pendingAudio:audioPending.size,enabled,engine:settings.engine,vieneuVoice:settings.vieneuVoice,rate:settings.rate,volume:settings.volume,voiceURI:settings.voiceURI,voiceURIs:settings.voiceURIs,rotateVoices:settings.rotateVoices,autoLanguage:settings.autoLanguage,readingMode:settings.readingMode,status,voices:voices().map(v=>({name:v.name,lang:v.lang,voiceURI:v.voiceURI}))};}
  chrome.runtime.onMessage.addListener((m,s,send)=>{
    if(m?.target!=="tts-subtitle-youtube")return;
    if(m.type==="GET_STATE"){send(response());return;}
    if(m.type==="SET_ENABLED"){if(m.value)activate().then(()=>send({enabled:true})).catch(e=>{status="error";send({error:e.message});});else{deactivate();send({enabled:false});}return true;}
    if(m.type==="STOP"){deactivate();send({stopped:true});return;}
    if(m.type==="SET_ENGINE"){
      if(!["browser","vieneu"].includes(m.value)){send({error:"TTS engine không hợp lệ."});return;}
      settings.engine=m.value;lastError="";resetPreload();audioCache.clear();chrome.storage.local.set({engine:settings.engine});
      if(enabled)activate().then(()=>send({engine:settings.engine})).catch(e=>send({error:e.message}));else send({engine:settings.engine});
      return true;
    }
    if(m.type==="SET_VIENEU_VOICE"){
      settings.vieneuVoice=String(m.value||"Pham Tuyen").trim()||"Pham Tuyen";
      lastError="";resetPreload();audioCache.clear();chrome.storage.local.set({vieneuVoice:settings.vieneuVoice});send({vieneuVoice:settings.vieneuVoice});return;
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
  speechSynthesis.onvoiceschanged=()=>{};
  chrome.storage.local.get(DEFAULTS,stored=>{settings={...DEFAULTS,...stored};enabled=false;});
  document.addEventListener("yt-navigate-finish",()=>{if(enabled)activate().catch(e=>{status="error";console.warn("[TTS Subtitle]",e.message);});});
})();