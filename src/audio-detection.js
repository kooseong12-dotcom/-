// Local energy-based segmentation. Confidence describes boundary clarity, not speech recognition.
export function detectSegments(channels, sampleRate, {frameSeconds=.02, minSeconds=.4, silenceSeconds=.3}={}) {
  if(!channels.length || !channels[0].length || sampleRate<=0) return {segments:[],waveform:[],duration:0};
  const length=channels[0].length, frame=Math.max(1,Math.round(sampleRate*frameSeconds));
  const energies=[];
  for(let offset=0;offset<length;offset+=frame){
    let energy=0;
    for(const channel of channels){let sum=0;for(let j=offset;j<Math.min(offset+frame,length);j++)sum+=channel[j]*channel[j];energy=Math.max(energy,Math.sqrt(sum/Math.min(frame,length-offset)));}
    energies.push(energy);
  }
  const sorted=[...energies].sort((a,b)=>a-b),floor=sorted[Math.floor(sorted.length*.2)]||0, peak=sorted[Math.floor(sorted.length*.95)]||0;
  const duration=length/sampleRate, threshold=Math.max(.008,Math.min(peak*.45, floor*2.5));
  const waveform=Array.from({length:Math.min(600,energies.length)},(_,i)=>Math.max(...energies.slice(Math.floor(i*energies.length/Math.min(600,energies.length)),Math.max(1,Math.floor((i+1)*energies.length/Math.min(600,energies.length))))));
  if(peak<.008)return {segments:[],waveform,duration,warning:'음량이 매우 작거나 무음입니다. 수동으로 구간을 추가하세요.'};
  const gap=Math.ceil(silenceSeconds/frameSeconds), ranges=[];let start=-1,last=-1;
  for(let i=0;i<=energies.length+gap;i++){
    if(i<energies.length&&energies[i]>threshold){if(start<0)start=i;last=i;}
    else if(start>=0&&i-last>gap){if((last-start+1)*frameSeconds>=minSeconds)ranges.push([start,last+1]);start=-1;}
  }
  const lowContrast=peak/Math.max(floor,.0001)<3;
  const segments=ranges.map(([a,b],i)=>{
    const active=energies.slice(a,b), mean=active.reduce((s,v)=>s+v,0)/active.length;
    const boundary=(a>0?energies[a-1]:floor)+(b<energies.length?energies[b]:floor);
    const clear=!lowContrast&&mean>threshold*1.5&&boundary/2<threshold&&a>0&&b<energies.length;
    return {id:`detected-${i}`,start:Math.max(0,Math.round((a*frameSeconds-.1)*10)/10),end:Math.min(Math.floor(duration*10)/10,Math.round((b*frameSeconds+.1)*10)/10),confidence:clear?'high':'review',reason:clear?'음량 대비와 양쪽 무음 경계가 뚜렷함':'배경 소음·연속음 또는 경계 불명확 — 직접 확인 필요'};
  }).filter(s=>s.end>s.start);
  return {segments,waveform,duration,warning:lowContrast?'연속 소음이 감지되었습니다. 음성 여부를 직접 검토하세요.': '기계음·음악도 후보로 감지될 수 있습니다. 프리뷰로 확인한 뒤 승인하세요.'};
}
export async function analyzeVideoAudio(file) {
  if(file.size>200*1024*1024)throw Error('브라우저 메모리 보호를 위해 200MB 이하 영상으로 분석하세요. 큰 영상은 구간을 나눠 주세요.');
  const Context=globalThis.AudioContext||globalThis.webkitAudioContext;
  if(!Context)throw Error('이 브라우저는 Web Audio API를 지원하지 않습니다.');
  const context=new Context();
  try{
    const buffer=await context.decodeAudioData(await file.arrayBuffer());
    // Yield before the CPU analysis so the loading state can paint.
    await new Promise(resolve=>setTimeout(resolve,20));
    return detectSegments(Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i)),buffer.sampleRate);
  } catch(e){if(e.message.includes('200MB'))throw e;throw Error('오디오를 디코딩할 수 없습니다. 오디오 트랙이 있는 MP4(H.264/AAC) 또는 WAV를 사용하거나 수동으로 구간을 추가하세요.');}
  finally{await context.close();}
}
export function validateSegments(segments,duration){
  const sorted=[...segments].sort((a,b)=>a.start-b.start);
  if(sorted.some(s=>!Number.isFinite(s.start)||!Number.isFinite(s.end)||s.start<0||s.end<=s.start||s.end>duration+.001))return '시작·종료는 영상 길이 안에 있어야 하며 종료가 시작보다 커야 합니다.';
  if(sorted.some((s,i)=>i>0&&s.start<sorted[i-1].end))return '구간이 겹칩니다. 경계를 조정하세요.';
  return '';
}
