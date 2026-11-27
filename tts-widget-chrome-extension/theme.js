(function () {
"use strict";
if (globalThis.__ttsWidgetThemeInstalled) return;
globalThis.__ttsWidgetThemeInstalled = true;
const DARK_STYLE_ID="tts-widget-global-dark-mode", FONT_STYLE_ID="tts-widget-global-font-size", DARK_ATTRIBUTE="data-tts-widget-dark-mode";
const darkCss=`
html[${DARK_ATTRIBUTE}="true"]{color-scheme:dark!important;background:#111827!important}
html[${DARK_ATTRIBUTE}="true"] body{color:#e5e7eb!important;background-color:#111827!important}
html[${DARK_ATTRIBUTE}="true"] body :not(.tts-widget-root):not(.tts-widget-root *){color:#e5e7eb!important;border-color:#374151!important}
html[${DARK_ATTRIBUTE}="true"] body :is(main,article,section,nav,header,footer,aside,[role="main"],[role="dialog"]){background-color:#111827!important}
html[${DARK_ATTRIBUTE}="true"] body a{color:#93c5fd!important}
html[${DARK_ATTRIBUTE}="true"] body input,html[${DARK_ATTRIBUTE}="true"] body textarea,html[${DARK_ATTRIBUTE}="true"] body select,html[${DARK_ATTRIBUTE}="true"] body button{color:#f3f4f6!important;background-color:#1f2937!important;border-color:#4b5563!important}
`;
function apply(settings){
 const root=document.documentElement;if(!root)return;
 document.getElementById("tts-widget-page-appearance")?.remove();
 root.removeAttribute("data-tts-widget-page-theme");root.style.removeProperty("--tts-widget-page-font-size");
 const darkStyle=document.getElementById(DARK_STYLE_ID);
 if(settings.darkMode===true){root.setAttribute(DARK_ATTRIBUTE,"true");if(!darkStyle){const style=document.createElement("style");style.id=DARK_STYLE_ID;style.textContent=darkCss;(root.head||root).appendChild(style);}}
 else{root.removeAttribute(DARK_ATTRIBUTE);darkStyle?.remove();}
 const fontSize=Math.min(24,Math.max(12,Number(settings.pageFontSize)||16));
 const fontStyle=document.getElementById(FONT_STYLE_ID);
 if(fontSize===16){fontStyle?.remove();root.removeAttribute("data-tts-widget-page-font");}
 else{const style=fontStyle||document.createElement("style");style.id=FONT_STYLE_ID;style.textContent=`html[data-tts-widget-page-font="true"] body,html[data-tts-widget-page-font="true"] body :not(.tts-widget-root):not(.tts-widget-root *){font-size:${fontSize}px!important}`;root.setAttribute("data-tts-widget-page-font","true");(root.head||root).appendChild(style);}
}
if(typeof chrome!=="undefined"&&chrome.storage?.sync){
 chrome.storage.sync.get({darkMode:false,pageFontSize:16},apply);
 chrome.storage.onChanged.addListener((changes,area)=>{if(area!=="sync"||(!changes.darkMode&&!changes.pageFontSize))return;chrome.storage.sync.get({darkMode:false,pageFontSize:16},apply);});
}
})();