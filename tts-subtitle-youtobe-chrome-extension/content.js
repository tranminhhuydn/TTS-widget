(() => {
  if (window.__ttsSubtitleYouTubeLoaded) return;
  window.__ttsSubtitleYouTubeLoaded=true;
  const DEFAULTS={enabled:false,rate:1,volume:1,voiceURI:"",voiceURIs:[],rotateVoices:false,autoLanguage:true};
  let settings={...DEFAULTS},enabled=false,video=null,engine=null,sentences=[],track=null,utterance=null,rotationIndex=0,status="idle",loadToken=0;
  const norm=s=>String(s||"").replace(/\s+/g," ").trim();
  function language(text,trackLang){if(trackLang)return trackLang;if(/[\u3040-\u30ff]/.test(text))return"ja";if(/[\u4e00-\u9fff]/.test(text))return"zh";if(/[\uac00-\ud7af]/.test(text))return"ko";if(/[\u0100-\u017f]/.test(text))return"vi";if(/[\u0400-\u04ff]/.test(text))return"ru";return"en";}
  function voices(){return speechSynthesis.getVoices();}
  function chooseVoice(text,lang){
    const all=voices(),code=(settings.autoLanguage?language(text,lang):"").toLowerCase();
    const selected=(settings.voiceURIs||[]).map(id=>all.find(v=>v.voiceURI===id)).filter(Boolean);
    const matches=list=>list.filter(v=>v.lang.toLowerCase()===code||v.lang.toLowerCase().startsWith(code+"-"));
    if(settings.rotateVoices&&selected.length){const pool=settings.autoLanguage&&matches(selected).length?matches(selected):selected;const v=pool[rotationIndex%pool.length];rotationIndex++;return v;}
    if(settings.autoLanguage){const v=all.find(v=>v.lang.toLowerCase()===code)||all.find(v=>v.lang.toLowerCase().startsWith(code+"-"));if(v)return v;}
    return all.find(v=>v.voiceURI===settings.voiceURI)||selected[0]||null;
  }
  function cancel(){try{speechSynthesis.cancel();}catch(_){}utterance=null;}
  function speak(item){return new Promise(resolve=>{
    cancel();const u=new SpeechSynthesisUtterance(item.text),v=chooseVoice(item.text,track?.languageCode||"");
    if(v){u.voice=v;u.lang=v.lang;}else u.lang=language(item.text,track?.languageCode);
    u.rate=Math.max(.5,Math.min(2,Number(settings.rate)||1));u.volume=Math.max(0,Math.min(1,Number(settings.volume)||0));
    utterance=u;u.onend=u.onerror=()=>{if(utterance===u)utterance=null;resolve();};speechSynthesis.speak(u);
  });}
  function playerResponse(){
    if(window.ytInitialPlayerResponse)return window.ytInitialPlayerResponse;
    for(const s of document.scripts){const t=s.textContent||"",p=t.indexOf("ytInitialPlayerResponse");if(p<0)continue;const b=t.indexOf("{",p);if(b<0)continue;let d=0,q=false,e=false;
      for(let i=b;i<t.length;i++){const c=t[i];if(q){if(e)e=false;else if(c==="\\")e=true;else if(c==='"')q=false;continue;}if(c==='"'){q=true;continue;}if(c==="{")d++;else if(c==="}"&&--d===0){try{return JSON.parse(t.slice(b,i+1));}catch(_){break;}}}}
    return null;
  }
  async function load(){
    const tracks=playerResponse()?.captions?.playerCaptionsTracklistRenderer?.captionTracks||[];
    if(!tracks.length)throw Error("Video không cung cấp phụ đề có thể tải.");
    const preferred=(navigator.language||"vi").split("-")[0].toLowerCase();
    track=tracks.find(t=>t.languageCode?.toLowerCase().startsWith(preferred))||tracks.find(t=>t.languageCode?.toLowerCase().startsWith("vi"))||tracks[0];
    const url=new URL(track.baseUrl);url.searchParams.set("fmt","json3");
    const response=await fetch(url.href,{credentials:"include"});if(!response.ok)throw Error("Không tải được phụ đề: "+response.status);
    const parsed=window.TTSSubtitleParser.toSentences(await response.json());if(!parsed.length)throw Error("Phụ đề không có câu thoại.");
    return parsed;
  }
  async function activate(){
    const token=++loadToken;video=document.querySelector("video.html5-main-video")||document.querySelector("video");
    if(!video)throw Error("Không tìm thấy video YouTube.");
    status="loading";const next=await load();if(token!==loadToken)return;
    if(engine)engine.destroy();sentences=next;
    engine=new window.TTSSubtitleHybridSync({video,sentences,speak,cancel,pauseSpeech:()=>speechSynthesis.pause(),resumeSpeech:()=>speechSynthesis.resume(),onStatus:s=>status=s});
    enabled=true;chrome.storage.local.set({enabled:true});engine.start(video.currentTime);status="reading";
  }
  function deactivate(){enabled=false;loadToken++;if(engine)engine.stop();cancel();status="stopped";chrome.storage.local.set({enabled:false});}
  function response(){return{enabled,rate:settings.rate,volume:settings.volume,voiceURI:settings.voiceURI,voiceURIs:settings.voiceURIs,rotateVoices:settings.rotateVoices,autoLanguage:settings.autoLanguage,status,voices:voices().map(v=>({name:v.name,lang:v.lang,voiceURI:v.voiceURI}))};}
  chrome.runtime.onMessage.addListener((m,s,send)=>{
    if(m?.target!=="tts-subtitle-youtube")return;
    if(m.type==="GET_STATE"){send(response());return;}
    if(m.type==="SET_ENABLED"){if(m.value)activate().then(()=>send({enabled:true})).catch(e=>{status="error";send({error:e.message});});else{deactivate();send({enabled:false});}return true;}
    if(m.type==="STOP"){deactivate();send({stopped:true});return;}
    const key={SET_RATE:"rate",SET_VOLUME:"volume",SET_VOICES:"voiceURIs",SET_ROTATE:"rotateVoices",SET_AUTO_LANGUAGE:"autoLanguage"}[m.type];
    if(key){settings[key]=m.value;if(key==="rate")settings.rate=Math.max(.5,Math.min(2,Number(m.value)||1));if(key==="volume")settings.volume=Math.max(0,Math.min(1,Number(m.value)||0));if(key==="voiceURIs")rotationIndex=0;chrome.storage.local.set({[key]:settings[key]});if(engine&&key==="volume"&&utterance){}send({[key]:settings[key]});}
    return true;
  });
  speechSynthesis.onvoiceschanged=()=>{};
  chrome.storage.local.get(DEFAULTS,stored=>{settings={...DEFAULTS,...stored};enabled=false;});
  document.addEventListener("yt-navigate-finish",()=>{if(enabled)activate().catch(e=>{status="error";console.warn("[TTS Subtitle]",e.message);});});
})();