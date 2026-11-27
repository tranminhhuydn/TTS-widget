(function () {
"use strict";
const DARK_STYLE_ID="tts-widget-global-dark-mode";
const FONT_STYLE_ID="tts-widget-global-font-size";
const DARK_ATTRIBUTE="data-tts-widget-dark-mode";
const FONT_ATTRIBUTE="data-tts-widget-page-font";
const CONTROLLER_KEY="__ttsWidgetThemeController";
const darkCss=`
html[${DARK_ATTRIBUTE}="true"]{color-scheme:dark!important;background:#111827!important}
html[${DARK_ATTRIBUTE}="true"] body{color:#f3f4f6!important;background:#111827!important}
html[${DARK_ATTRIBUTE}="true"] body :not(.tts-widget-root):not(.tts-widget-root *){color:#f3f4f6!important;background-color:transparent!important;border-color:#4b5563!important;box-shadow:none!important}
html[${DARK_ATTRIBUTE}="true"] body a:not(.tts-widget-root a){color:#93c5fd!important}
html[${DARK_ATTRIBUTE}="true"] body input,html[${DARK_ATTRIBUTE}="true"] body textarea,html[${DARK_ATTRIBUTE}="true"] body select,html[${DARK_ATTRIBUTE}="true"] body button{color:#f9fafb!important;background:#263244!important;border-color:#64748b!important}
html[${DARK_ATTRIBUTE}="true"] body img,html[${DARK_ATTRIBUTE}="true"] body video,html[${DARK_ATTRIBUTE}="true"] body canvas,html[${DARK_ATTRIBUTE}="true"] body svg,html[${DARK_ATTRIBUTE}="true"] body iframe{filter:none!important}
`;
function apply(settings){
 const root=document.documentElement;if(!root)return;
 if(settings?.darkMode===true){
  root.setAttribute(DARK_ATTRIBUTE,"true");
  if(!document.getElementById(DARK_STYLE_ID)){const s=document.createElement("style");s.id=DARK_STYLE_ID;s.textContent=darkCss;(document.head||root).appendChild(s);}
 }else{root.removeAttribute(DARK_ATTRIBUTE);document.getElementById(DARK_STYLE_ID)?.remove();}
 const enabled=settings?.pageFontEnabled===true;
 const size=Math.min(24,Math.max(12,Number(settings?.pageFontSize)||16));
 const fontStyle=document.getElementById(FONT_STYLE_ID);
 if(!enabled){fontStyle?.remove();root.removeAttribute(FONT_ATTRIBUTE);}
 else{
  const s=fontStyle||document.createElement("style");
  s.id=FONT_STYLE_ID;
  s.textContent=`html[${FONT_ATTRIBUTE}="true"] body,html[${FONT_ATTRIBUTE}="true"] body :not(.tts-widget-root):not(.tts-widget-root *){font-size:${size}px!important}`;
  root.setAttribute(FONT_ATTRIBUTE,"true");(document.head||root).appendChild(s);
 }
}
const old=globalThis[CONTROLLER_KEY];
if(old?.listener&&globalThis.chrome?.storage?.onChanged)chrome.storage.onChanged.removeListener(old.listener);
globalThis.__ttsWidgetApplyTheme=apply;
const listener=(changes,area)=>{if(area!=="sync"||(!changes.darkMode&&!changes.pageFontSize&&!changes.pageFontEnabled))return;chrome.storage.sync.get({darkMode:false,pageFontEnabled:false,pageFontSize:16},apply);};
globalThis[CONTROLLER_KEY]={listener};
if(globalThis.chrome?.storage?.sync){chrome.storage.sync.get({darkMode:false,pageFontEnabled:false,pageFontSize:16},apply);chrome.storage.onChanged.addListener(listener);}
})();