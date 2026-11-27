(() => {
  "use strict";
  class HybridSync {
    constructor({video,sentences,speak,prepare,cancel,resetPreload,pauseSpeech,resumeSpeech,onStatus,onError}) {
      Object.assign(this,{video,sentences,speak,prepare,cancel,resetPreload,pauseSpeech,resumeSpeech,onStatus,onError});
      this.index=0;this.active=false;this.waiting=false;this.speaking=false;this.session=0;this.timer=null;
      this.preparing=new Set();this.preloadAhead=10;
      this.onPlay=()=>this.resume();this.onPause=()=>this.pause();this.onSeeking=()=>this.seek();
      this.onSeeked=()=>{this.waiting=this.video.paused;if(!this.waiting){this.preload();this.tick();}};
      this.onRate=()=>this.tick();
      video.addEventListener("play",this.onPlay);video.addEventListener("pause",this.onPause);
      video.addEventListener("ended",this.onPause);video.addEventListener("seeking",this.onSeeking);
      video.addEventListener("seeked",this.onSeeked);video.addEventListener("ratechange",this.onRate);
    }
    findIndex(t){const i=this.sentences.findIndex(s=>s.endTime>=t-.25);return i<0?this.sentences.length:i;}
    preload(){
      if(!this.active||!this.prepare)return;
      const end=Math.min(this.sentences.length,this.index+this.preloadAhead);
      for(let i=this.index;i<end;i++){
        const item=this.sentences[i];
        if(this.preparing.has(item.id))continue;
        this.preparing.add(item.id);
        Promise.resolve(this.prepare(item)).catch(error=>{
          if(this.active&&error?.message!=="Đã hủy hàng đợi audio cũ.")this.onError?.(error,item);
        }).finally(()=>this.preparing.delete(item.id));
      }
    }
    start(t){
      this.stop(false);this.active=true;this.session++;this.index=this.findIndex(t);
      this.preload();this.tick();this.timer=setInterval(()=>{this.preload();this.tick();},200);
    }
    pause(){if(this.active){this.pauseSpeech();this.onStatus("paused");}}
    resume(){if(this.active){this.waiting=false;this.resumeSpeech();this.preload();this.tick();}}
    seek(){
      if(!this.active)return;
      this.session++;this.cancel();this.resetPreload?.();this.preparing.clear();
      this.speaking=false;this.index=this.findIndex(this.video.currentTime);this.waiting=true;this.onStatus("resync");
    }
    tick(){
      if(!this.active)return;
      this.preload();
      if(this.waiting||this.speaking||this.video.paused||this.video.ended)return;
      const now=this.video.currentTime;
      while(this.index<this.sentences.length&&this.sentences[this.index].endTime<now-8)this.index++;
      const item=this.sentences[this.index];if(!item){if(this.index>=this.sentences.length)this.onStatus("ended");return;}
      if(now+1.5<item.startTime)return;
      if(now-item.startTime>8){this.index=this.findIndex(now);if(this.index>=this.sentences.length)return;this.preload();}
      const index=this.index,session=this.session;this.speaking=true;this.onStatus("reading");
      Promise.resolve(this.speak(this.sentences[index])).then(()=>this.finish(index,session),error=>{
        this.onError?.(error,this.sentences[index]);this.finish(index,session);
      });
    }
    finish(index,session){
      if(!this.active||session!==this.session)return;
      this.index=Math.max(this.index,index+1);this.speaking=false;this.preload();this.tick();
    }
    stop(notify=true){
      this.active=false;this.waiting=false;this.speaking=false;this.session++;
      clearInterval(this.timer);this.timer=null;this.cancel();this.resetPreload?.();this.preparing.clear();
      if(notify)this.onStatus("stopped");
    }
    destroy(){
      this.stop(false);this.video.removeEventListener("play",this.onPlay);this.video.removeEventListener("pause",this.onPause);
      this.video.removeEventListener("ended",this.onPause);this.video.removeEventListener("seeking",this.onSeeking);
      this.video.removeEventListener("seeked",this.onSeeked);this.video.removeEventListener("ratechange",this.onRate);
    }
  }
  window.TTSSubtitleHybridSync=HybridSync;
})();