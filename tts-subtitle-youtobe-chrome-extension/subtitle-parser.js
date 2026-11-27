(() => {
  "use strict";
  const clean = value => String(value || "").replace(/\u200b/g, "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  function parseText(raw) {
    let text=String(raw ?? "").replace(/^\uFEFF/, "").trim();
    // Một số endpoint YouTube có tiền tố chống JSON hijacking.
    text=text.replace(/^\)\]}'?,?\s*/, "");
    const value=JSON.parse(text);
    // Chấp nhận cả trường hợp JSON được bọc trong một thuộc tính.
    if(value && !Array.isArray(value.events)){
      for(const key of ["transcript","data","response"]){
        if(value[key] && Array.isArray(value[key].events)) return value[key];
      }
    }
    return value;
  }
  function parse(payload) {
    return (payload?.events || []).filter(e => Array.isArray(e.segs) && Number.isFinite(Number(e.tStartMs)))
      .map(e => ({ text: clean(e.segs.map(s => s?.utf8 || "").join("")), start: Number(e.tStartMs)/1000, end: (Number(e.tStartMs)+Number(e.dDurationMs||0))/1000 }))
      .filter(e => e.text).sort((a,b) => a.start-b.start);
  }
  function toSentences(payload) {
    const events=parse(payload); let text="", spans=[];
    for(const e of events){
      const separator=text && !/[\s([{“‘\-–—]$/.test(text) && !/^[,.;:!?%)\]}”’]/.test(e.text) ? " " : "";
      text+=separator; const start=text.length; text+=e.text; spans.push({start,end:text.length,time:e.start,endTime:e.end});
    }
    const ranges=[]; let begin=0;
    for(let i=0;i<text.length;i++){
      if(".!?。！？".includes(text[i]) && (!text[i+1] || /\s/.test(text[i+1]))){
        const value=text.slice(begin,i+1).trim(); if(value) ranges.push({start:begin,end:i+1,text:value});
        begin=i+1; while(/\s/.test(text[begin]||""))begin++;
      }
    }
    const tail=text.slice(begin).trim(); if(tail)ranges.push({start:begin,end:text.length,text:tail});
    const timeAt=(pos,end)=>{const s=spans.find(x=>end?x.end>=pos:x.end>pos)||spans[spans.length-1]; if(!s)return 0; const ratio=Math.max(0,Math.min(1,(pos-s.start)/Math.max(1,s.end-s.start)));return s.time+(s.endTime-s.time)*ratio;};
    return ranges.map((r,id)=>({id,text:r.text,startTime:timeAt(r.start,false),endTime:timeAt(r.end,true)}));
  }
  window.TTSSubtitleParser={parseText,parse,toSentences};
})();