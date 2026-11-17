export const BUILTIN_LANGUAGES=[{code:'ko',name:'한국어',dir:'ltr'},{code:'en',name:'English',dir:'ltr'},{code:'ur',name:'اردو',dir:'rtl'}];
export const FIELDS={title:'공정명',desc:'작업내용',warning:'주의사항'};
// Conservative exact-phrase glossary. Partial substitutions are intentionally not presented as translations.
export const GLOSSARY={
 '작업 준비 및 안전 점검':{en:'Preparation & safety check',ur:'تیاری اور حفاظتی جانچ'},
 '부품 투입 및 위치 정렬':{en:'Load & align components',ur:'پرزوں کی ترتیب'},
 '볼트 체결 및 토크 확인':{en:'Bolt fastening & torque check',ur:'بولٹ اور ٹارک کی جانچ'},
 '조립 상태 및 외관 검사':{en:'Assembly & visual inspection',ur:'اسمبلی کا معائنہ'},
 '완제품 배출 및 정리':{en:'Unload & clean workspace',ur:'تیار مصنوعات کی منتقلی'},
 '설비 초기화 및 마무리':{en:'Reset & finish',ur:'مشین کی صفائی'},
 '보호구를 착용하고 작업대와 공구의 이상 유무를 확인합니다.':{en:'Wear protective equipment. Check the workbench and tools for defects.',ur:'حفاظتی سامان پہنیں۔ میز اور اوزار کی جانچ کریں۔'},
 '부품의 방향을 확인한 후 지그의 기준선에 맞춰 투입합니다.':{en:'Check the component orientation and align it with the jig reference line.',ur:'پرزے کی سمت دیکھیں اور اسے جگ کی نشان زدہ لکیر کے مطابق رکھیں۔'},
 '전동 토크 렌치를 수직으로 유지하고 볼트를 순서대로 체결합니다.':{en:'Keep the torque wrench vertical and tighten the bolts in order.',ur:'ٹارک رینچ کو عمودی رکھیں اور بولٹ ترتیب سے کسیں۔'},
 '체결 부위의 유격과 제품 외관에 이상이 없는지 확인합니다.':{en:'Check the fastened joints for play and inspect the product appearance.',ur:'جوڑوں میں ڈھیلا پن اور مصنوعات کی ظاہری حالت کی جانچ کریں۔'},
 '완제품을 지정된 트레이에 놓고 작업대를 정리합니다.':{en:'Place the finished product in the designated tray and clean the workbench.',ur:'تیار مصنوعات مخصوص ٹرے میں رکھیں اور میز صاف کریں۔'},
 '설비를 초기 상태로 복귀시키고 작업 기록을 확인합니다.':{en:'Reset the equipment and check the work record.',ur:'مشین کو ابتدائی حالت میں لائیں اور کام کا ریکارڈ دیکھیں۔'},
 '작업 전 반드시 보호장갑을 착용하세요. 회전부에 손을 가까이 하지 마세요.':{en:'Wear protective gloves before starting. Keep hands away from rotating parts.',ur:'کام سے پہلے حفاظتی دستانے پہنیں۔ گھومتے حصوں سے ہاتھ دور رکھیں۔'},
 '보호장갑을 착용하세요.':{en:'Wear protective gloves.',ur:'حفاظتی دستانے پہنیں۔'},
 '부품을 확인합니다.':{en:'Check the components.',ur:'پرزوں کی جانچ کریں۔'},
 'PCB 장착':{en:'PCB installation',ur:'پی سی بی کی تنصیب'},
};
export const DEFAULT_WARNING='작업 전 반드시 보호장갑을 착용하세요. 회전부에 손을 가까이 하지 마세요.';
export function dictionaryTranslate(text,locale){
  if(!text.trim())return {text:'',status:'draft',missing:false};
  const exact=GLOSSARY[text.trim()]?.[locale];
  return exact?{text:exact,status:'draft',missing:false}:{text,status:'review',missing:true};
}
// An alternate self-hosted engine can implement this same {text,status,missing} contract.
export function generateDrafts(step,languages,engine=dictionaryTranslate){
  step.translations ||= {};
  for(const {code} of languages.filter(l=>l.code!=='ko')){
    const existing=step.translations[code]||{};
    const source={title:step.title||'',desc:step.desc||'',warning:step.warning||''};
    if(existing.source&&Object.keys(FIELDS).every(k=>existing.source[k]===source[k]))continue;
    step.translations[code]={...existing,source,draft:Object.fromEntries(Object.keys(FIELDS).map(k=>[k,engine(source[k],code)])),status:'draft'};
  }
}
export function approveTranslation(step,code,values,reviewer='김민수'){
  const pack=step.translations?.[code];if(!pack)throw Error('번역 초안을 먼저 생성하세요.');
  pack.published={...values};pack.draft=Object.fromEntries(Object.entries(values).map(([k,text])=>[k,{text,status:'approved',missing:false}]));pack.status='approved';pack.reviewer=reviewer;pack.reviewedAt=new Date().toISOString();
}
export function publishedText(step,locale,field){return locale==='ko'?(step[field]||''):(step.translations?.[locale]?.published?.[field]??step[field]??'');}
