/* Hybrid synchronization engine for YouTube narration. */
(function(global){
  "use strict";
  class HybridSyncEngine{
    constructor(options){
      this.video=options.video;
      this.sentences=options.sentences||[];
      this.speak=options.speak;
      this.cancel=options.cancel||(()=>{});
      this.pauseSpeech=options.pauseSpeech||(()=>{});
      this.resumeSpeech=options.resumeSpeech||(()=>{});
      this.speaking=false;
      this.onStatus=options.onStatus||(()=>{});
      this.tolerance=Number(options.tolerance)||2;
      this.resyncThreshold=Number(options.resyncThreshold)||8;
      this.index=0;
      this.active=false;
      this.waiting=false;
      this.timer=null;
      this.session=0;
      this.onPlay=()=>this.resume();
      this.onPause=()=>this.pause();
      this.onSeek=()=>this.seek();
      this.onSeeked=()=>{this.waiting=this.video.paused;if(!this.waiting)this.tick();};
      this.onRate=()=>this.tick();
      this.video.addEventListener("play",this.onPlay);
      this.video.addEventListener("pause",this.onPause);
      this.video.addEventListener("seeking",this.onSeek);
      this.video.addEventListener("seeked",this.onSeeked);
      this.video.addEventListener("ratechange",this.onRate);
      this.video.addEventListener("ended",this.onPause);
    }
    start(fromTime){
      this.stop(false);
      this.active=true;
      this.session++;
      this.index=this.findIndex(Number.isFinite(fromTime)?fromTime:this.video.currentTime);
      this.tick();
      this.timer=setInterval(()=>this.tick(),250);
    }
    findIndex(time){
      let i=this.sentences.findIndex(item=>item.endTime>=time-0.25);
      return i<0?this.sentences.length:i;
    }
    pause(){
      if(!this.active)return;
      this.pauseSpeech();
      this.onStatus("paused");
    }
    resume(){
      if(!this.active)return;
      this.waiting=false;
      this.resumeSpeech();
      this.tick();
    }
    seek(){
      if(!this.active)return;
      this.session++;
      this.cancel();
      this.speaking=false;
      this.index=this.findIndex(this.video.currentTime);
      this.waiting=true;
      this.onStatus("resync");
    }
    tick(){
      if(!this.active||this.waiting||this.speaking||this.video.paused||this.video.ended)return;
      const now=this.video.currentTime;
      if(this.index>=this.sentences.length){this.onStatus("ended");return;}
      let item=this.sentences[this.index];
      while(item && item.endTime<now-this.resyncThreshold){
        this.index++;
        item=this.sentences[this.index];
      }
      if(!item)return;
      if(now+this.tolerance<item.startTime)return;
      if(now-item.startTime>this.resyncThreshold && !this.video.seeking){
        this.index=this.findIndex(now);
        item=this.sentences[this.index];
        if(!item)return;
      }
      const currentIndex=this.index;
      const token=this.session;
      this.speaking=true;
      this.onStatus("reading");
      Promise.resolve(this.speak(item)).then(()=>{
        if(!this.active||token!==this.session)return;
        this.index=Math.max(this.index,currentIndex+1);
        this.speaking=false;
        this.tick();
      }).catch(()=>{
        if(!this.active||token!==this.session)return;
        this.index=currentIndex+1;
        this.speaking=false;
        this.tick();
      });
    }
    stop(notify=true){
      this.active=false;
      this.waiting=false;
      this.speaking=false;
      this.session++;
      if(this.timer)clearInterval(this.timer);
      this.timer=null;
      this.cancel();
      if(notify)this.onStatus("stopped");
    }
    destroy(){
      this.stop(false);
      this.video.removeEventListener("play",this.onPlay);
      this.video.removeEventListener("pause",this.onPause);
      this.video.removeEventListener("seeking",this.onSeek);
      this.video.removeEventListener("seeked",this.onSeeked);
      this.video.removeEventListener("ratechange",this.onRate);
      this.video.removeEventListener("ended",this.onPause);
    }
  }
  global.TTSYouTubeHybridSync=HybridSyncEngine;
})(globalThis);
