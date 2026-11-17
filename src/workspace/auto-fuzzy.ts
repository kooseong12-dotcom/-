import type {Step,FuzzySegment} from './model';
export function assignCandidates(steps:Step[],candidates:{start:number;end:number;confidence?:string}[]){
 const assignments:Record<string,FuzzySegment[]>={};const unassigned:typeof candidates=[];
 for(const candidate of candidates){let assigned=false;for(const step of steps){const start=Math.max(candidate.start,step.startTime),end=Math.min(candidate.end,step.endTime);if(end-start<.1)continue;assigned=true;const clipped=start!==candidate.start||end!==candidate.end;const segment:FuzzySegment={id:crypto.randomUUID(),partIds:[...step.partIds],description:step.description,name:`${step.title} · 설명 ${(assignments[step.id]?.length||0)+1}`,sourceStart:+(start-step.startTime).toFixed(1),sourceEnd:+(end-step.startTime).toFixed(1),confidence:clipped?'review':candidate.confidence,languagePacks:{ko:{start:0,end:+(end-start).toFixed(1),subtitle:step.description,tts:true,locale:'ko'}}};(assignments[step.id]||=[]).push(segment);}if(!assigned)unassigned.push(candidate);}
 return {assignments,unassigned};
}
