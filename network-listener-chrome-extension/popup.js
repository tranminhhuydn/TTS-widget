const $ = id => document.getElementById(id);
let currentTabId=null,selectedId=null,currentItems=[];
async function send(type,extra={}){return chrome.runtime.sendMessage({type,tabId:currentTabId,...extra});}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function shortUrl(url){try{const u=new URL(url);return u.host+u.pathname.split("/").filter(Boolean).pop()||u.host;}catch{return url||"";}}
function formatSize(item){const n=item.bodySize??item.encodedDataLength??item.contentLength;if(n==null)return "—";if(n<1024)return n+" B";if(n<1024*1024)return (n/1024).toFixed(1)+" kB";return (n/1024/1024).toFixed(2)+" MB";}
function formatTime(item){return item.durationMs!=null?item.durationMs.toFixed(0)+" ms":item.finished?"—":"Pending";}
function setActive(active){$("stateBadge").textContent=active?"Đang lắng nghe":"Đã tắt";$("stateBadge").classList.toggle("active",active);$("toggleListen").textContent=active?"Dừng lắng nghe":"Bắt đầu lắng nghe";}
function renderList(){
  $("fileCount").textContent=String(currentItems.length);
  if(!currentItems.length){$("fileList").innerHTML='<tr><td colspan="6" class="empty">Chưa ghi nhận request nào.</td></tr>';return;}
  $("fileList").innerHTML=currentItems.map(item=>{
    const status=item.failed?"ERR":item.status??"Pending";
    const initiator=item.initiator||"Other";
    return `<tr data-id="${escapeHtml(item.id)}" class="${item.id===selectedId?"selected":""}">
      <td class="name-cell" title="${escapeHtml(item.url)}">${escapeHtml(item.name||shortUrl(item.url))}</td>
      <td class="${item.failed?"status-error":item.status>=200&&item.status<400?"status-ok":""}">${escapeHtml(status)}</td>
      <td title="${escapeHtml(item.mimeType)}">${escapeHtml(item.resourceType||item.mimeType||"Other")}</td>
      <td title="${escapeHtml(initiator)}">${escapeHtml(initiator.split("/").pop()||initiator)}</td>
      <td>${formatSize(item)}</td><td>${formatTime(item)}</td>
    </tr>`;
  }).join("");
  $("fileList").querySelectorAll("tr[data-id]").forEach(row=>row.addEventListener("click",()=>{
    selectedId=row.dataset.id;renderList();renderViewer(currentItems.find(x=>x.id===selectedId));
  }));
}
function renderViewer(item){
  if(!item){$("viewerType").textContent="Chưa chọn";$("viewer").innerHTML='<div class="empty">Chọn một request để xem nội dung response.</div>';return;}
  const metadata=`<div class="file-meta">
    <span class="key">Name / URL</span><span class="value">${escapeHtml(item.url)}</span>
    <span class="key">Status</span><span class="value">${escapeHtml(item.status)} ${escapeHtml(item.statusText)}</span>
    <span class="key">Type</span><span class="value">${escapeHtml(item.mimeType)} · ${escapeHtml(item.resourceType)}</span>
    <span class="key">Initiator</span><span class="value">${escapeHtml(item.initiator)}</span>
    <span class="key">Size / Time</span><span class="value">${formatSize(item)} · ${formatTime(item)}</span>
  </div>`;
  if(item.isText&&typeof item.bodyText==="string"){
    $("viewerType").textContent="Response · Source";
    $("viewer").innerHTML=metadata+`<pre class="text-content">${escapeHtml(item.bodyText)}</pre>`;
  }else if(item.bodyCaptured&&item.isText&&item.bodyTooLarge){
    $("viewerType").textContent="Text quá lớn";$("viewer").innerHTML=metadata+'<div class="binary-notice">Response là văn bản nhưng vượt giới hạn xem trước 500 KB.</div>';
  }else if(item.bodyCaptured&&item.isText===false){
    $("viewerType").textContent="Binary";$("viewer").innerHTML=metadata+'<div class="binary-notice">Đây là response nhị phân. Extension không giải mã hoặc hiển thị dữ liệu nhị phân.</div>';
  }else if(item.bodyError){
    $("viewerType").textContent="Không lấy được";$("viewer").innerHTML=metadata+`<div class="binary-notice">Không lấy được Response Body: ${escapeHtml(item.bodyError)}</div>`;
  }else{
    $("viewerType").textContent="Đang tải";$("viewer").innerHTML=metadata+'<div class="empty">Đang chờ response hoàn tất để lấy source.</div>';
  }
}
async function refresh(){const state=await send("GET_STATE");if(!state.ok)throw new Error(state.error);setActive(state.active);currentItems=state.items||[];if(selectedId&&!currentItems.some(x=>x.id===selectedId))selectedId=null;renderList();if(selectedId)renderViewer(currentItems.find(x=>x.id===selectedId));}
async function init(){const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab?.id){$("tabHost").textContent="Không xác định được tab";$("toggleListen").disabled=true;return;}currentTabId=tab.id;$("tabHost").textContent=tab.url||tab.title||"Tab hiện tại";try{await refresh();}catch(error){$("tabHost").textContent=error.message;}}
$("toggleListen").addEventListener("click",async()=>{$("toggleListen").disabled=true;try{const active=$("stateBadge").classList.contains("active");const result=await send(active?"STOP_LISTENING":"START_LISTENING");if(!result.ok)throw new Error(result.error);setActive(result.active);}catch(error){alert("Không thể thay đổi trạng thái Network Listener. "+error.message);}finally{$("toggleListen").disabled=false;}});
$("clearList").addEventListener("click",async()=>{await send("CLEAR_ITEMS");currentItems=[];selectedId=null;renderList();renderViewer(null);});
chrome.storage.onChanged.addListener((changes,area)=>{if(area==="session"&&changes["networkItems_"+currentTabId]){currentItems=changes["networkItems_"+currentTabId].newValue||[];renderList();if(selectedId)renderViewer(currentItems.find(x=>x.id===selectedId));}});
init();