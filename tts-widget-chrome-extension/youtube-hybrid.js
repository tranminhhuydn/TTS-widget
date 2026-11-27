/* YouTube subtitle narration runtime. No extra playback UI: YouTube controls the video. */
(function(global){
  "use strict";
  if(global.TTSYouTubeHybrid)return;
  const KEY="tts-widget-settings-v2";
  let engine=null,active=false,video=null,videoId="",sentences=[],utterance=null,volume=1,preferredVoice="";
  let status="idle",ready=Promise.resolve(false),navigationListenerAdded=false,storageListenerAdded=false;
  const readSettings=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch(_){return {}}};
  function getVoice(lang){
    const voices= speechSynthesis.getVoices();
    if(preferredVoice){
      const match=voices.find(v=>v.voiceURI+"|"+v.name+"|"+v.lang===preferredVoice);
      if(match)return match;
    }
    const prefix=String(lang||"").split("-")[0].toLowerCase();
    return voices.find(v=>v.lang.toLowerCase().startsWith(prefix))||voices.find(v=>v.lang.toLowerCase().startsWith("vi"))||voices.find(v=>v.default)||null;
  }
  function cancelSpeech(){try{speechSynthesis.cancel()}catch(_){} utterance=null;}
  function speakSentence(item){
    return new Promise((resolve,reject)=>{
      if(!active){resolve();return;}
      cancelSpeech();
      const settings=readSettings();
      const u=new SpeechSynthesisUtterance(item.text);
      const lang=currentTrack?.languageCode||"vi";
      const voice=getVoice(lang);
      if(voice){u.voice=voice;u.lang=voice.lang}else u.lang=lang;
      u.rate=Math.min(1.8,Math.max(.6,Number(settings.rate)||1));
      u.pitch=Math.min(2,Math.max(.5,Number(settings.pitch)||1));
      u.volume=Math.min(1,Math.max(0,Number(settings.volume??volume)));
      utterance=u;
      u.onend=()=>{if(utterance===u)utterance=null;resolve()};
      u.onerror=event=>{if(utterance===u)utterance=null;if(event.error==="canceled"||event.error==="interrupted")resolve();else reject(event)};
      speechSynthesis.speak(u);
    });
  }
  let currentTrack=null;
  function parsePlayerResponse(){
    const scripts=Array.from(document.scripts||[]);
    for(const script of scripts){
      const source=script.textContent||"";
      const marker="ytInitialPlayerResponse";
      const at=source.indexOf(marker);
      if(at<0)continue;
      const begin=source.indexOf("{",at);
      if(begin<0)continue;
      let depth=0,inString=false,escaped=false;
      for(let i=begin;i<source.length;i++){
        const ch=source[i];
        if(inString){if(escaped)escaped=false;else if(ch==="\\")escaped=true;else if(ch==='"')inString=false;continue;}
        if(ch==='"'){inString=true;continue;}
        if(ch==="{")depth++;
        if(ch==="}"&&--depth===0){try{return JSON.parse(source.slice(begin,i+1))}catch(_){break;}}
      }
    }
    try{return global.ytInitialPlayerResponse||null}catch(_){return null}
  }
  async function loadSubtitles(){
    const response=parsePlayerResponse();
    const tracks=response?.captions?.playerCaptionsTracklistRenderer?.captionTracks||[];
    if(!tracks.length)throw new Error("Video này không cung cấp phụ đề.");
    const wanted=(navigator.language||"vi").split("-")[0].toLowerCase();
    currentTrack=tracks.find(t=>String(t.languageCode||"").toLowerCase().startsWith(wanted))||
      tracks.find(t=>String(t.languageCode||"").toLowerCase().startsWith("vi"))||tracks[0];
    const url=new URL(currentTrack.baseUrl);
    url.searchParams.set("fmt","json3");
    const result=await fetch(url.href,{credentials:"include"});
    if(!result.ok)throw new Error("Không tải được phụ đề ("+result.status+").");
    const payload=await result.json();
    if(!global.TTSYouTubeSubtitleParser||!global.TTSYouTubeHybridSync)throw new Error("Thiếu module xử lý phụ đề.");
    sentences=global.TTSYouTubeSubtitleParser.toSentences(payload);
    if(!sentences.length)throw new Error("Phụ đề không có nội dung văn bản.");
    return sentences;
  }
  function currentVideoId(){try{return new URL(location.href).searchParams.get("v")||""}catch(_){return ""}}
  function ensureRoot(){
    let root=document.querySelector(".tts-widget-root");
    if(!root){root=document.createElement("div");root.className="tts-widget-root";root.innerHTML='<button id="stopBtn" type="button" hidden></button>';document.documentElement.append(root);}
    root.dataset.extensionActive="true";
    return root;
  }
  async function activate(){
    active=true;
    ensureRoot();
    video=document.querySelector("video.html5-main-video")||document.querySelector("video");
    if(!video)throw new Error("Chưa tìm thấy trình phát video YouTube.");
    const id=currentVideoId();
    if(id!==videoId||!sentences.length){
      if(engine)engine.destroy();
      cancelSpeech();
      videoId=id;
      await loadSubtitles();
      engine=new global.TTSYouTubeHybridSync({
        video,sentences,
        speak:speakSentence,cancel:cancelSpeech,
        pauseSpeech:()=>{try{speechSynthesis.pause()}catch(_){}},
        resumeSpeech:()=>{try{speechSynthesis.resume()}catch(_){}},
        onStatus:value=>{status=value;}
      });
    }
    engine.start(video.currentTime);
  }
  function deactivate(){
    active=false;
    if(engine)engine.stop();
    cancelSpeech();
    const root=document.querySelector(".tts-widget-root");
    if(root)root.dataset.extensionActive="false";
    status="stopped";
  }
  async function refresh(){
    if(!active)return;
    const id=currentVideoId();
    if(id!==videoId){try{await activate()}catch(error){console.warn("[TTS YouTube]",error.message)}}
  }
  function setVolume(value){
    volume=Math.min(1,Math.max(0,Number(value)||0));
    const settings=readSettings();settings.volume=volume;
    try{localStorage.setItem(KEY,JSON.stringify(settings))}catch(_){}
  }
  function init(){
    if(location.hostname!=="www.youtube.com"&&location.hostname!=="youtube.com")return false;
    const settings=readSettings();
    volume=Math.min(1,Math.max(0,Number(settings.volume??1)));
    try{
      if(typeof chrome!=="undefined"&&chrome.storage?.sync){
        chrome.storage.sync.get({ttsVolume:null,ttsVoiceIdentity:""},result=>{
          if(result.ttsVolume!==null)setVolume(result.ttsVolume);
          if(result.ttsVoiceIdentity)preferredVoice=result.ttsVoiceIdentity;
        });
        if(!storageListenerAdded){chrome.storage.onChanged.addListener((changes,area)=>{
          if(area!=="sync")return;
          if(changes.ttsVolume)setVolume(changes.ttsVolume.newValue);
          if(changes.ttsVoiceIdentity)preferredVoice=changes.ttsVoiceIdentity.newValue||"";
        });storageListenerAdded=true;}
      }
    }catch(_){}
    preferredVoice=localStorage.getItem("tts-widget-voice-v1")||preferredVoice;
    // Activation is controlled by the existing extension popup.
    active=true;
    ensureRoot();
    ready=activate().then(()=>true).catch(error=>{status="error";const root=document.querySelector(".tts-widget-root");if(root)root.dataset.extensionActive="false";console.warn("[TTS YouTube]",error.message);throw error;});
    if(!navigationListenerAdded){document.addEventListener("yt-navigate-finish",()=>{refresh()});navigationListenerAdded=true;}
    return true;
  }
  global.TTSYouTubeHybrid={init,activate,deactivate,stop:deactivate,setVolume,getStatus:()=>status,get ready(){return ready;}};
})(globalThis);
