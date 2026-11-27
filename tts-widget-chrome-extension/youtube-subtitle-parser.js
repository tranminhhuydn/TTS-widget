/* YouTube JSON3 subtitle parser and sentence merger. */
(function(global){
  "use strict";
  function normalizeText(value){
    return String(value||"").replace(/\u200b/g,"").replace(/\r/g,"").replace(/\n+/g," ").replace(/\s+/g," ").trim();
  }
  function parseJSON3(payload){
    const events=Array.isArray(payload?.events)?payload.events:[];
    const fragments=[];
    for(const event of events){
      if(!Array.isArray(event.segs)||!Number.isFinite(Number(event.tStartMs))) continue;
      const text=normalizeText(event.segs.map(seg=>seg?.utf8||"").join(""));
      if(!text) continue;
      const start=Math.max(0,Number(event.tStartMs)/1000);
      const duration=Math.max(0,Number(event.dDurationMs)||0)/1000;
      fragments.push({text,startTime:start,endTime:start+duration});
    }
    fragments.sort((a,b)=>a.startTime-b.startTime);
    return fragments;
  }
  function mergeFragments(fragments){
    let text="";
    const spans=[];
    for(const fragment of fragments){
      const part=normalizeText(fragment.text);
      if(!part) continue;
      const separator=text && !/[\s([{“‘\-–—]$/.test(text) && !/^[,.;:!?%)\]}”’]/.test(part) ? " " : "";
      if(separator) text+=" ";
      const start=text.length;
      text+=part;
      spans.push({start,end:text.length,startTime:fragment.startTime,endTime:fragment.endTime});
    }
    return {text:text.replace(/\s+([,.;:!?])/g,"$1"),spans};
  }
  function sentenceRanges(text){
    const ranges=[];
    let start=0;
    for(let i=0;i<text.length;i++){
      const ch=text[i];
      const terminal=".!?。！？".includes(ch);
      const newline=ch==="\n";
      const next=text[i+1]||"";
      const boundary=terminal && (!next || /\s/.test(next)) || newline;
      if(boundary){
        let end=i+1;
        while(end<text.length && /\s/.test(text[end])) end++;
        const value=text.slice(start,end).trim();
        if(value) ranges.push({start,end: i+1,text:value});
        start=end;i=end-1;
      }
    }
    const tail=text.slice(start).trim();
    if(tail) ranges.push({start,end:text.length,text:tail});
    return ranges;
  }
  function toSentences(payload){
    const fragments=parseJSON3(payload);
    const merged=mergeFragments(fragments);
    const timeAt=(position,isEnd)=>{
      const span=merged.spans.find(item=>isEnd?item.end>=position:item.end>position);
      if(!span)return merged.spans.length?merged.spans[merged.spans.length-1].endTime:0;
      const length=Math.max(1,span.end-span.start);
      const offset=Math.min(length,Math.max(0,position-span.start+(isEnd?1:0)));
      const ratio=offset/length;
      return span.startTime+(span.endTime-span.startTime)*ratio;
    };
    return sentenceRanges(merged.text).map((range,index)=>({
      id:index,
      text:range.text,
      startTime:timeAt(range.start,false),
      endTime:timeAt(Math.max(range.start,range.end-1),true)
    })).filter(item=>item.text);
  }
  global.TTSYouTubeSubtitleParser={parseJSON3,mergeFragments,sentenceRanges,toSentences};
})(globalThis);
