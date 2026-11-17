export function registerOffline(){
  let ready=false,error='';
  function paint(){let banner=document.getElementById('offline-banner');if(!banner){banner=document.createElement('div');banner.id='offline-banner';document.querySelector('.shell')?.prepend(banner);}banner.className=`offline-banner ${navigator.onLine?'':'offline'}`;banner.textContent=!navigator.onLine?'오프라인 모드 · 저장된 영상·언어팩·공정 데이터를 사용합니다.':error||ready?'오프라인 준비 완료 · 이 브라우저에서 인터넷 없이 다시 열 수 있습니다.':'오프라인 사용 준비 중 · 최초 1회 온라인 연결이 필요합니다.';if(error)banner.textContent=error;}
  window.addEventListener('online',paint);window.addEventListener('offline',paint);
  new MutationObserver(()=>{if(!document.getElementById('offline-banner'))paint();}).observe(document.getElementById('app'),{childList:true});
  if(!('serviceWorker' in navigator)){error='이 브라우저는 오프라인 앱 저장을 지원하지 않습니다.';paint();return;}
  if(import.meta.env.DEV){error='개발 모드 · 오프라인 캐시는 프로덕션 빌드에서 활성화됩니다.';paint();return;}
  paint();
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,{scope:import.meta.env.BASE_URL}).then(()=>navigator.serviceWorker.ready).then(()=>{ready=true;paint();}).catch(()=>{error='오프라인 저장에 실패했습니다. 온라인 상태에서 새로고침해 주세요.';paint();});
}
