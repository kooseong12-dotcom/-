export function containRect(width,height,videoWidth,videoHeight){
  if(!videoWidth||!videoHeight)return {x:0,y:0,width,height};
  const scale=Math.min(width/videoWidth,height/videoHeight),w=videoWidth*scale,h=videoHeight*scale;
  return {x:(width-w)/2,y:(height-h)/2,width:w,height:h};
}
export function validMask(mask){return ['x','y','width','height'].every(k=>Number.isFinite(mask[k]))&&mask.x>=0&&mask.y>=0&&mask.width>0&&mask.height>0&&mask.x+mask.width<=100.001&&mask.y+mask.height<=100.001;}
export function enforceMuted(video){
  if(!video)return;
  const lock=()=>{if(!video.muted)video.muted=true;if(video.volume!==0)video.volume=0;};
  video.controls=false;video.defaultMuted=true;lock();video.onvolumechange=lock;
}
export function paintMasks(layer,masks){
  layer.replaceChildren();
  for(const mask of masks.filter(validMask)){
    const el=document.createElement('div');el.className=`video-mask ${mask.mode==='blur'?'blur':'opaque'}`;
    Object.assign(el.style,{left:`${mask.x}%`,top:`${mask.y}%`,width:`${mask.width}%`,height:`${mask.height}%`});layer.append(el);
  }
}
export function attachMasks(video,masks){
  const parent=video.parentElement,layer=document.createElement('div');layer.className='video-mask-layer';layer.setAttribute('aria-hidden','true');parent.append(layer);paintMasks(layer,masks||[]);
  const update=()=>{const rect=containRect(parent.clientWidth,parent.clientHeight,video.videoWidth,video.videoHeight);Object.assign(layer.style,{left:`${rect.x}px`,top:`${rect.y}px`,width:`${rect.width}px`,height:`${rect.height}px`});};
  const observer=new ResizeObserver(update);observer.observe(parent);video.addEventListener('loadedmetadata',update);update();
  const dispose=()=>{observer.disconnect();video.removeEventListener('loadedmetadata',update);layer.remove();};video.__disposeMasks=dispose;return dispose;
}
export function previewControls(video,container){
  enforceMuted(video);
  const controls=document.createElement('div');controls.className='preview-controls';
  controls.innerHTML='<button class="btn" type="button">재생 / 일시정지</button><input type="range" aria-label="프리뷰 재생 위치" min="0" step="0.1" value="0"><span>00:00</span>';
  container.append(controls);const slider=controls.querySelector('input'),label=controls.querySelector('span');
  controls.querySelector('button').onclick=()=>video.paused?video.play().catch(()=>{}):video.pause();
  slider.oninput=()=>video.currentTime=+slider.value;
  video.addEventListener('loadedmetadata',()=>slider.max=video.duration);
  video.addEventListener('timeupdate',()=>{slider.value=video.currentTime;label.textContent=`${video.currentTime.toFixed(1)} / ${(video.duration||0).toFixed(1)}초`;});
}
export function openMaskEditor(step,{modal,closeModal,save,render,record,toast,esc}){
  let draft=structuredClone(step.videoMasks||[]),drag=null;
  modal('영상 화면 가림 설정',`<p class="feature-note">영상 위에서 드래그해 가릴 영역을 지정하세요. 원본 파일은 변경되지 않으며 플레이어에만 적용됩니다. 중요한 작업 동작이나 안전 정보를 가리지 않도록 확인하세요.</p>${step.video?`<div class="mask-preview-surface"><video id="mask-preview" src="${esc(step.video)}" playsinline muted></video><div id="mask-draw-layer"></div></div><div id="mask-preview-controls"></div>`:'<p class="feature-note">실제 영상을 연결하면 드래그로 영역을 지정할 수 있습니다.</p>'}<button class="btn" id="add-mask">+ 가림 영역 추가</button><div id="mask-list"></div><p class="feature-note">정밀한 제거·크롭이 필요한 경우 영상 편집기에서 수정한 파일을 다시 등록하세요. 저장 전 변경은 임시 상태입니다.</p><p id="mask-error" role="alert"></p><button class="btn primary modal-submit" id="save-masks">변경사항 저장</button>`,true);
  const list=document.getElementById('mask-list'),video=document.getElementById('mask-preview'),layer=document.getElementById('mask-draw-layer');
  function resize(){if(!video)return;const parent=video.parentElement,r=containRect(parent.clientWidth,parent.clientHeight,video.videoWidth,video.videoHeight);Object.assign(layer.style,{left:`${r.x}px`,top:`${r.y}px`,width:`${r.width}px`,height:`${r.height}px`});}
  function draw(){if(!list.isConnected)return;list.innerHTML=draft.map((m,i)=>`<article class="mask-row"><b>영역 ${i+1}</b>${[['x','가로 위치'],['y','세로 위치'],['width','너비'],['height','높이']].map(([k,l])=>`<label>${l} (%)<input class="field" type="number" min="0" max="100" step="0.1" value="${m[k]}" data-mask-index="${i}" data-mask-key="${k}"></label>`).join('')}<label>처리<select class="field" data-mask-index="${i}" data-mask-key="mode"><option value="opaque" ${m.mode!=='blur'?'selected':''}>가림</option><option value="blur" ${m.mode==='blur'?'selected':''}>블러</option></select></label><button class="text-btn danger" data-delete-mask="${i}">삭제</button></article>`).join('')||'<p class="feature-note">저장된 가림 영역 없음</p>';
    list.querySelectorAll('[data-mask-key]').forEach(el=>el.onchange=()=>{draft[+el.dataset.maskIndex][el.dataset.maskKey]=el.dataset.maskKey==='mode'?el.value:+el.value;queueMicrotask(draw);});list.querySelectorAll('[data-delete-mask]').forEach(el=>el.onclick=()=>{draft.splice(+el.dataset.deleteMask,1);draw();});if(layer)paintMasks(layer,draft);document.getElementById('mask-error').textContent=draft.every(validMask)?'':'영역은 화면 안에 있어야 하며 너비·높이가 0보다 커야 합니다.';
  }
  if(video){previewControls(video,document.getElementById('mask-preview-controls'));video.onloadedmetadata=resize;const resizeObserver=new ResizeObserver(()=>{if(!list.isConnected){resizeObserver.disconnect();return;}resize();});resizeObserver.observe(video.parentElement);video.__disposeMasks=()=>resizeObserver.disconnect();resize();
    layer.onpointerdown=e=>{e.preventDefault();const rect=layer.getBoundingClientRect();drag={x:Math.max(0,Math.min(100,(e.clientX-rect.left)/rect.width*100)),y:Math.max(0,Math.min(100,(e.clientY-rect.top)/rect.height*100)),index:draft.length};draft.push({x:drag.x,y:drag.y,width:.1,height:.1,mode:'opaque'});layer.setPointerCapture(e.pointerId);};
    layer.onpointermove=e=>{if(!drag)return;const rect=layer.getBoundingClientRect(),x=Math.max(0,Math.min(100,(e.clientX-rect.left)/rect.width*100)),y=Math.max(0,Math.min(100,(e.clientY-rect.top)/rect.height*100));Object.assign(draft[drag.index],{x:+Math.min(x,drag.x).toFixed(1),y:+Math.min(y,drag.y).toFixed(1),width:+Math.abs(x-drag.x).toFixed(1),height:+Math.abs(y-drag.y).toFixed(1)});draw();};
    layer.onpointerup=layer.onpointercancel=()=>{drag=null;draw();};
  }
  document.getElementById('add-mask').onclick=()=>{draft.push({x:75,y:0,width:25,height:12,mode:'opaque'});draw();};
  document.getElementById('save-masks').onclick=()=>{if(!draft.every(validMask)){draw();return;}const before=JSON.stringify(step.videoMasks||[]);step.videoMasks=structuredClone(draft);record('영상 가림 설정 변경',before,JSON.stringify(draft));save();closeModal();render();toast('영상 가림 영역을 저장했습니다. 원본 파일은 유지됩니다.');};draw();
}
