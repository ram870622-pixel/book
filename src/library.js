import { createBook, createPage } from './model.js';

export const TOPICS = ['자연과 모험', '마음과 감정', '친구와 가족', '상상과 발견'];
const palette = ['#456b76','#b76f57','#6c8053','#b48a42','#6d6289','#438080','#ac655f','#657b93','#a38062','#6a865d'];
const tales = [
  ['작은 씨앗의 긴 여행','자연과 모험','바람을 타고 떠난 씨앗이 자기만의 자리를 찾아요.',['작은 씨앗 하나가 바람의 손을 잡았어요. “우리, 어디로 가는 걸까?”','씨앗은 강물과 언덕을 지나갔어요. 낯선 곳마다 새로운 친구가 기다리고 있었지요.','비가 내리자 씨앗은 포근한 흙 속으로 쏙 들어갔어요. 처음으로 편안한 마음이 들었어요.','햇살이 찾아온 아침, 작은 싹이 고개를 들었어요. 긴 여행의 끝에서 새로운 이야기가 시작됐답니다.']],
  ['오늘의 마음은 무슨 색?','마음과 감정','다양한 마음을 색깔로 만나보는 이야기예요.',['아침에 눈을 뜬 꼬마의 마음은 흐린 하늘처럼 회색이었어요.','친구가 건넨 다정한 인사에 마음 한쪽이 노란색으로 물들었어요.','놀이가 뜻대로 되지 않자 빨간 마음이 올라왔어요. 꼬마는 천천히 숨을 쉬었지요.','집에 돌아온 꼬마가 말했어요. “내 마음에는 많은 색이 살아. 모든 색이 나에게 필요해.”']],
  ['달빛을 모으는 고양이','상상과 발견','밤마다 작은 빛을 모으는 고양이를 따라가요.',['지붕 위 고양이는 밤하늘을 바라보았어요. 반짝이는 달빛 한 조각이 발끝에 내려앉았지요.','고양이는 빈 주머니에 달빛을 모았어요. 오늘은 아주 특별한 일을 하고 싶었거든요.','어두운 골목에서 길을 잃은 작은 새를 만났어요. 고양이는 주머니를 살짝 열었어요.','따뜻한 빛이 집으로 가는 길을 비췄어요. 나눈 달빛은 더 환하게 빛났답니다.']],
  ['모두를 위한 커다란 우산','친구와 가족','조금씩 자리를 내어주며 함께 걷는 친구들이에요.',['토끼가 커다란 우산을 펼쳤어요. 빗방울이 톡톡, 즐거운 노래를 불렀지요.','젖은 귀를 흔드는 강아지가 다가왔어요. 토끼는 한 걸음 옆으로 비켜주었어요.','작은 새와 다람쥐도 우산 아래로 왔어요. 친구들은 발걸음을 맞춰 천천히 걸었지요.','비가 그쳤지만 아무도 서둘러 떠나지 않았어요. 함께 걷는 길이 참 좋았거든요.']],
  ['겁쟁이 파도의 첫 모험','자연과 모험','작은 용기로 새로운 세상을 만나보아요.',['작은 파도는 먼바다가 무서웠어요. 매일 익숙한 바위 곁에만 머물렀지요.','어느 날 바람이 속삭였어요. “아주 조금만 더 가볼래? 내가 곁에 있을게.”','파도는 반짝이는 물고기와 산호 정원을 만났어요. 두근거리던 마음이 설렘으로 바뀌었지요.','집으로 돌아온 파도는 조금 더 씩씩해졌어요. 내일은 또 한 걸음 나아갈 거예요.']],
  ['느려도 괜찮아, 달팽이야','마음과 감정','자신의 속도로 세상을 발견하는 달팽이 이야기예요.',['달팽이는 친구들보다 항상 늦게 도착했어요. “나는 왜 이렇게 느릴까?”','천천히 걷던 달팽이는 풀잎 아래 반짝이는 이슬을 발견했어요.','서둘러 가던 친구들은 보지 못한 작은 무지개였어요. 달팽이는 모두를 불렀지요.','친구들은 나란히 앉아 무지개를 바라보았어요. 느리게 가서 만나는 아름다움도 있답니다.']],
  ['할머니의 주머니 정원','친구와 가족','작은 주머니 안에 담긴 커다란 사랑이에요.',['할머니의 앞치마에는 커다란 주머니가 있었어요. 그 속에서는 늘 재미있는 것이 나왔지요.','오늘은 작은 꽃씨와 동그란 조약돌이 나왔어요. 우리는 함께 화분을 꾸몄어요.','꽃을 기다리는 동안 할머니는 어린 시절 이야기를 들려주셨어요. 매일 조금씩 마음도 자랐어요.','첫 꽃이 피던 날, 나는 알았어요. 할머니의 진짜 정원은 우리와 함께하는 시간이었어요.']],
  ['내 양말 속 작은 우주','상상과 발견','잃어버린 양말을 찾다가 우주 여행을 떠나요.',['분명 침대 밑에 있던 양말 한 짝이 사라졌어요. 대신 반짝이는 작은 문이 보였지요.','문을 열자 양말 행성이 나타났어요. 줄무늬 양말들이 꼬리를 흔들며 날아다녔어요.','나는 짝을 잃은 양말을 찾아 서로를 소개했어요. 서로 다른 무늬도 멋진 친구가 되었지요.','다시 방으로 돌아오니 양말 두 짝이 나란히 놓여 있었어요. 오늘은 조금 다른 색으로 신어볼까요?']],
  ['바람에게 보내는 편지','자연과 모험','자연 속에서 마음을 전하는 방법을 찾아요.',['나는 바람에게 고마운 말을 전하고 싶었어요. 더운 날 시원한 그늘을 가져다주었거든요.','종이 위에 커다란 나무와 웃는 얼굴을 그렸어요. 글자를 몰라도 괜찮았어요.','편지는 날아가지 않게 창가에 걸어두었어요. 바람이 살랑, 그림을 읽고 지나갔지요.','나뭇잎들이 사각사각 인사를 했어요. 바람에게 답장이 왔나 봐요.']],
  ['별 하나를 빌려줄게','친구와 가족','친구의 어두운 밤에 작은 빛이 되어주는 이야기예요.',['곰돌이는 잠이 오지 않았어요. 오늘 친구와 다툰 일이 자꾸 생각났거든요.','창문 밖에서 친구가 불렀어요. 손에는 별 모양으로 오린 종이가 들려 있었지요.','“네 방에 별 하나를 빌려줄게.” 둘은 나란히 앉아 오늘의 마음을 이야기했어요.','곰돌이 방에 작은 별이 걸렸어요. 화해한 마음도 밤새 반짝반짝 빛났답니다.']]
];
export const SAMPLE_BOOKS = tales.map(([title,topic,description,texts],index)=>({id:'sample-'+index,title,topic,description,texts,author:'공방의 가상 이야기',sample:true,status:'complete',updatedAt:-index,pages:texts.map(text=>({text}))}));

export function filterLibrary(books,{query='',kind='all',topic='all',sort='recent'}={}) {
  const q=query.trim().toLocaleLowerCase('ko');
  return books.filter(book=>{
    if(kind==='mine' && book.sample || kind==='sample' && !book.sample)return false;
    if(topic!=='all' && (book.topic||'상상과 발견')!==topic)return false;
    const haystack=[book.title,book.author,book.topic,...(book.pages||[]).map(p=>p.text)].join(' ').toLocaleLowerCase('ko');
    return !q || haystack.includes(q);
  }).sort((a,b)=>sort==='title'?a.title.localeCompare(b.title,'ko'):(b.updatedAt||0)-(a.updatedAt||0));
}
function illustration(topic,index) {
  const canvas=document.createElement('canvas');canvas.width=900;canvas.height=650;const c=canvas.getContext('2d');
  const night=index===2 || index===7 || index===9;
  c.fillStyle=night?'#293e61':index===4?'#dfece9':'#f4ecd8';c.fillRect(0,0,900,650);
  const circle=(x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
  circle(690,130,66,night?'#ead8a3':'#e8bb69');
  if(night){for(let i=0;i<25;i++)circle(35+(i*127)%830,35+(i*73)%360,2+i%3,'#f8e6b4');}
  c.fillStyle=night?'#435d69':index===4?'#7ba8ac':'#bdcda1';c.beginPath();c.moveTo(0,470);c.bezierCurveTo(190,320,350,500,550,410);c.bezierCurveTo(700,340,800,410,900,370);c.lineTo(900,650);c.lineTo(0,650);c.fill();
  c.fillStyle=night?'#314c50':index===4?'#4d818e':'#91ad84';c.beginPath();c.moveTo(0,560);c.bezierCurveTo(290,400,530,610,900,470);c.lineTo(900,650);c.lineTo(0,650);c.fill();
  if(index===4){for(let i=0;i<5;i++){c.strokeStyle='#bad2ce';c.lineWidth=3;c.beginPath();c.arc(120+i*175,480+i%2*40,60,Math.PI,0);c.stroke();}c.fillStyle='#e8b47f';c.beginPath();c.ellipse(440,390,55,27,0,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(395,390);c.lineTo(365,365);c.lineTo(365,415);c.fill();circle(466,384,4,'#344c53');}
  else {
    for(const [x,y,size] of [[150,400,1.1],[735,400,.9],[250,330,.7]]){c.fillStyle=night?'#2c4446':'#78956b';c.beginPath();c.moveTo(x,y-size*190);c.lineTo(x-size*80,y);c.lineTo(x+size*80,y);c.fill();c.fillStyle='#8b7359';c.fillRect(x-9,y,18,90);}
    if(index===1 || index===5){for(let i=0;i<5;i++)circle(370+i*38,360-Math.sin(i/4*Math.PI)*100,45,['#b56e68','#d8ad67','#8da976','#749da4','#9f8ead'][i]);}
    else {c.fillStyle='#f3dbad';c.fillRect(370,350,170,150);c.fillStyle=index%2?'#b8846a':'#bf8070';c.beginPath();c.moveTo(345,360);c.lineTo(455,260);c.lineTo(565,360);c.fill();c.fillStyle='#a7835d';c.fillRect(443,420,45,80);c.fillStyle='#a4bdba';c.fillRect(392,390,34,35);}
  }
  for(let i=0;i<9;i++){circle(70+(i*101)%790,560+(i*17)%60,5,['#f3d28b','#eee6cf','#c8aa96'][i%3]);}
  return canvas.toDataURL('image/png');
}
const cache=new Map();
export function sampleBook(id) {
  if(cache.has(id))return cache.get(id);
  const metadata=SAMPLE_BOOKS.find(b=>b.id===id);if(!metadata)return null;
  const index=SAMPLE_BOOKS.indexOf(metadata);const media={type:'image',name:'공방-가상그림-'+index+'.png',data:illustration(metadata.topic,index)};
  const book={...createBook(),...metadata,privacy:'private',pages:metadata.texts.map(text=>({...createPage(),text,media:{...media},origin:'teacher'})),materials:[{id:crypto.randomUUID(),kind:'drawing',identifiable:false,guardianConsent:false,media}]};
  cache.set(id,book);return book;
}
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountLibrary({getBooks,onRead,onEdit,onCreate,mediaElement}) {
  const $=s=>document.querySelector(s);const state={query:'',kind:'all',topic:'all',sort:'recent'};
  const allBooks=()=>[...getBooks().map(b=>({...b,sample:false})),...SAMPLE_BOOKS];
  function detail(book) {
    const full=book.sample?sampleBook(book.id):getBooks().find(b=>b.id===book.id);if(!full)return;
    const color=palette[(book.sample?SAMPLE_BOOKS.findIndex(b=>b.id===book.id):allBooks().findIndex(b=>b.id===book.id))%palette.length];
    $('#detail-content').innerHTML=`<div class="detail-cover" style="--book-color:${color}"><span class="cover-series">LITTLE STORY COLLECTION</span><h2>${escape(book.title||'제목 없는 이야기')}</h2><div id="detail-art"></div><span class="cover-author">${escape(book.author||'작은 작가님')}</span></div><div class="detail-info"><span class="eyebrow">${book.sample?'공방에서 준비한 가상 샘플':'이 브라우저에 보관된 나의 책'}</span><h2>${escape(book.title||'제목 없는 이야기')}</h2><span class="topic-tag">${escape(book.topic||'상상과 발견')}</span><p>${escape(book.description || book.pages.find(p=>p.text)?.text.slice(0,140) || '작은 상상들이 한 권의 이야기로 자라고 있어요.')}</p><dl><div><dt>글·그림</dt><dd>${escape(book.author||'작은 작가님')}</dd></div><div><dt>페이지</dt><dd>${book.pages.length}페이지</dd></div><div><dt>보관 상태</dt><dd>${book.sample?'샘플 · 가상 이야기':book.status==='complete'?'완성 · 비공개':'초안 · 비공개'}</dd></div></dl><div class="detail-actions"><button id="detail-read" class="button primary">책 펼쳐 읽기 <span>→</span></button><button id="detail-edit" class="button outline">${book.sample?'이 책으로 만들어보기':'이야기 계속 만들기'}</button></div><small>${book.sample?'직접 만든 예시 이야기와 가상 그림이에요. 내 책으로 복사해 자유롭게 바꿀 수 있어요.':'내보내기로 백업하면 다른 브라우저에서도 다시 열 수 있어요.'}</small></div>`;
    const image=full.pages.find(p=>p.media?.type==='image')?.media;if(image)$('#detail-art').append(mediaElement(image));else $('#detail-art').textContent='✦';
    $('#detail-read').onclick=()=>{$('#book-detail').close();onRead(full);};
    $('#detail-edit').onclick=()=>{$('#book-detail').close();onEdit(full,Boolean(book.sample));};
    $('#book-detail').showModal();
  }
  function render() {
    const all=allBooks();const visible=filterLibrary(all,state);
    $('#mine-count').textContent=getBooks().length;$('#library-total').textContent=`${all.length}권의 작은 이야기`;
    $('#search-result').textContent=`${visible.length}권${state.query?'의 검색 결과':''}`;
    const bookcase=$('#bookcase');bookcase.replaceChildren();
    if(!visible.length){bookcase.innerHTML=`<div class="no-results"><span>⌕</span><h3>${state.kind==='mine'&&!getBooks().length?'책장의 첫 주인공을 기다려요':'아직 이 이야기는 없네요'}</h3><p>${state.kind==='mine'&&!getBooks().length?'그림 한 장과 함께 나만의 동화책을 만들어 보세요.':'다른 검색어나 주제를 선택해 보세요.'}</p><button id="reset-search" class="button outline">${state.kind==='mine'&&!getBooks().length?'첫 동화책 만들기':'모든 이야기 보기'}</button></div>`;$('#reset-search').onclick=()=>{if(state.kind==='mine'&&!getBooks().length)onCreate();else{state.query='';state.topic='all';state.kind='all';$('#book-search').value='';$('#topic-filter').value='all';syncFilters();render();}};return;}
    const note=document.createElement('div');note.className='bookcase-heading';note.innerHTML='<span>THE LITTLE STORY LIBRARY</span><span>한 권 한 권, 상상이 자라는 자리</span>';bookcase.append(note);
    const rows=[];for(let i=0;i<visible.length;i+=6)rows.push(visible.slice(i,i+6));
    rows.forEach((row,index)=>{
      const shelf=document.createElement('div');shelf.className='shelf-row';const list=document.createElement('ul');list.className='shelf-books';list.setAttribute('aria-label',`${index+1}번째 선반`);
      row.forEach(book=>{
        const originalIndex=all.findIndex(b=>b.id===book.id);const color=palette[originalIndex%palette.length];
        const item=document.createElement('li');item.className='shelf-book';item.style.setProperty('--book-color',color);item.style.setProperty('--book-height',(192+(originalIndex*17)%39)+'px');
        item.innerHTML=`<button class="book-spine" aria-label="${escape(book.title||'제목 없는 이야기')} · ${book.sample?'샘플 책':'내가 만든 책'}"><span class="spine-seal">${book.sample?'STORY':'MY BOOK'}</span><strong>${escape(book.title||'제목 없는 이야기')}</strong><span class="spine-bottom">✦</span></button><span class="book-peek" aria-hidden="true"><strong>${escape(book.title||'제목 없는 이야기')}</strong><small>${escape(book.topic||'상상과 발견')} · ${book.pages.length}페이지</small><span>책 펼쳐보기 ↗</span></span>`;
        item.querySelector('button').onclick=()=>detail(book);list.append(item);
      });
      shelf.append(list);const label=document.createElement('span');label.className='shelf-number';label.textContent=String(index+1).padStart(2,'0');shelf.append(label);bookcase.append(shelf);
    });
    const base=document.createElement('div');base.className='bookcase-base';base.innerHTML='<span>작은 이야기가 모여, 커다란 세상이 됩니다.</span><span>✧</span>';bookcase.append(base);
  }
  function syncFilters(){document.querySelectorAll('[data-filter]').forEach(button=>{const active=button.dataset.filter===state.kind;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});}
  $('#book-search').oninput=e=>{state.query=e.target.value;render();};
  $('#topic-filter').onchange=e=>{state.topic=e.target.value;render();};$('#book-sort').onchange=e=>{state.sort=e.target.value;render();};
  document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{state.kind=button.dataset.filter;syncFilters();render();});
  $('#close-detail').onclick=()=>$('#book-detail').close();
  return {render};
}
