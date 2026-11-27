(() => {
  "use strict";
  if (window.__ttsTimedtextNetworkListener) return;
  window.__ttsTimedtextNetworkListener = true;
  const isTimedtext = value => { try { const u=new URL(value,location.href); return u.hostname==="www.youtube.com"&&u.pathname==="/api/timedtext"; } catch (_) { return false; } };
  const publish = (url,body) => {
    if(!isTimedtext(url)||typeof body!=="string"||!body.trim()||body.length>8*1024*1024)return;
    window.postMessage({source:"tts-subtitle-network",type:"TIMEDTEXT_RESPONSE",url:String(url),body},location.origin);
  };
  const originalFetch=window.fetch;
  window.fetch=function(...args){
    const requestUrl=args[0] instanceof Request?args[0].url:String(args[0]);
    return originalFetch.apply(this,args).then(response=>{
      if(isTimedtext(requestUrl))response.clone().text().then(body=>publish(response.url||requestUrl,body)).catch(()=>{});
      return response;
    });
  };
  const originalOpen=XMLHttpRequest.prototype.open,originalSend=XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open=function(method,url,...rest){this.__ttsTimedtextUrl=String(url);return originalOpen.call(this,method,url,...rest);};
  XMLHttpRequest.prototype.send=function(...args){
    if(isTimedtext(this.__ttsTimedtextUrl))this.addEventListener("load",()=>{try{if(!this.responseType||this.responseType==="text")publish(this.responseURL||this.__ttsTimedtextUrl,this.responseText);}catch(_){}},{once:true});
    return originalSend.apply(this,args);
  };
})();