import { mockStoryProvider, SAMPLE_CONTEXT } from './model.js';

const $=selector=>document.querySelector(selector);
function element(tag, text, className) { const el=document.createElement(tag); if(text!==undefined) el.textContent=text; if(className) el.className=className; return el; }
export function renderAttribution(parent, page) {
  parent.querySelector('.attribution')?.remove();
  const block=element('div',undefined,'attribution');
  block.append(element('small',page.origin==='mock'?'모의 AI 초안 · 교사 검토 후 반영':'교사 작성·편집'));
  if(page.childQuote) {
    const label=element('strong','아이의 실제 말 · 교사 입력');
    const quote=element('blockquote',page.childQuote);
    block.append(label,quote);
  }
  parent.append(block);
}
export function mountWorkflow(book,{persist,render,notify,selectPage,mediaElement,markDraft:onContentEdit}) {
  book.materials ||= []; book.teacherNotes ||= ''; book.childQuote ||= ''; book.status ||= 'draft';
  const wrapper=element('section',undefined,'workflow');
  wrapper.innerHTML=`<div class="context-line"><span>로컬 단일 사용자 · 비공개</span><span>${SAMPLE_CONTEXT.teacher} / ${SAMPLE_CONTEXT.classroom} / ${SAMPLE_CONTEXT.child}</span></div><div class="workflow-heading"><h3>이야기 소재 모으기</h3><label>작업 상태 <select id="book-status"><option value="draft">초안</option><option value="complete">완성 · 교사 확인</option></select></label></div><p class="workflow-help">가상 샘플로 먼저 실험해 보세요. 자료는 이 브라우저에 보관되며 외부 AI로 전송되지 않아요.</p><div class="record-grid"><label for="teacher-notes">놀이 기록 · 교사 메모<textarea id="teacher-notes" maxlength="2000" placeholder="예: 별이가 숲을 그렸어요. 친구와 함께 작은 집을 찾는 놀이를 했어요."></textarea></label><label for="child-quote">아이의 실제 말 <span>AI 창작과 별도 표시</span><textarea id="child-quote" maxlength="1000" placeholder="아이가 실제로 한 말을 교사가 그대로 적어 주세요."></textarea></label></div><div class="generation-actions"><button id="sample" class="button quiet">✧ 가상 샘플 넣기</button><label for="page-count">분량 <select id="page-count"><option>4</option><option selected>5</option><option>6</option></select> 페이지</label><button id="generate" class="button primary">이야기 초안 만들기</button></div><p class="mock-note">모의 AI 모드 · 정해진 예시 문장으로 초안을 제안해요. 실제 AI 생성이 아니며 비용은 없어요.</p><details id="originals"><summary>원본 자료 보관함 (${book.materials.length})</summary><p class="workflow-help">페이지에서 바꾸거나 빼도 원본은 보관돼요. 원본 삭제는 아래에서 별도로 할 수 있어요.</p><div id="material-list"></div></details><details><summary>캐릭터 이미지 제작 · 다음 단계</summary><p class="workflow-help">현재 원본 그림·사진 삽입만 지원해요. 사진 기반 캐릭터 생성은 아직 연결되지 않았어요. 향후 보호자 동의와 캐릭터 시트를 확인한 뒤 요청하고, 선생님이 결과를 검토해 반영하게 됩니다. 생성 이미지의 외형은 페이지마다 달라질 수 있어요.</p></details>`;
  $('.page-tabs').before(wrapper);
  $('#teacher-notes').value=book.teacherNotes; $('#child-quote').value=book.childQuote; $('#book-status').value=book.status;
  const markDraft=()=>onContentEdit(book);
  $('#teacher-notes').oninput=e=>{book.teacherNotes=e.target.value;markDraft();persist();};
  $('#child-quote').oninput=e=>{book.childQuote=e.target.value;markDraft();persist();};
  $('#book-status').onchange=e=>{book.status=e.target.value;persist();render();};
  const consent=element('div',undefined,'consent-controls');
  consent.innerHTML='<label for="material-kind">첨부 자료 종류 <select id="material-kind"><option value="drawing">아이의 그림</option><option value="photo">사진</option><option value="artwork">작품 사진</option></select></label><label><input id="identifiable" type="checkbox"> 아동을 식별할 수 있는 사진·영상이에요</label><label><input id="guardian-consent" type="checkbox"> 보호자의 수집·이용 동의를 확인했어요</label><small>식별 가능한 아동 자료는 동의 확인 후 첨부해 주세요. 원본 파일은 변형하지 않고 보관해요.</small>';
  $('.page-editor').before(consent);
  for(const material of book.materials) {
    const item=element('div',undefined,'original-item');
    item.append(mediaElement(material.media));
    const name=element('span',material.media.name);
    const place=element('button','이 페이지에 배치','button quiet');
    place.onclick=()=>{ const index=Number($('.page-tab.active').dataset.page); book.pages[index].media=structuredClone(material.media); markDraft();persist();render(); };
    const download=element('a','원본 저장','button quiet'); download.href=material.media.data; download.download=material.media.name;
    const remove=element('button','원본 삭제','button quiet danger');
    remove.onclick=()=>{if(!confirm('보관함에서 원본을 삭제할까요? 이미 페이지에 배치한 복사본은 남아요. 모든 자료를 지우려면 책 전체를 삭제하세요.')) return;book.materials=book.materials.filter(m=>m.id!==material.id);persist();render();};
    item.append(name,place,download,remove); $('#material-list').append(item);
  }
  $('#generate').onclick=async()=>{
    try {
      const pages=await mockStoryProvider.generate({notes:book.teacherNotes,quote:book.childQuote,count:Number($('#page-count').value)});
      const dialog=element('dialog',undefined,'draft-dialog'); dialog.setAttribute('aria-label','모의 AI 이야기 초안 검토');
      const heading=element('h2','이야기 초안을 검토해 주세요');
      const info=element('p','모의 AI 예시예요. 실제 경험과 다를 수 있어요. 반영하면 현재 페이지의 글과 배치가 교체돼요. 원본 보관함은 유지됩니다.');
      dialog.append(heading,info);
      pages.forEach((page,i)=>{const section=element('section');section.append(element('h3',`${i+1}페이지`),element('p',page.text));renderAttribution(section,page);dialog.append(section);});
      const cancel=element('button','취소','button quiet'); cancel.onclick=()=>dialog.close();
      const apply=element('button','검토했어요 · 책에 반영','button primary');
      apply.onclick=()=>{
        book.pages=pages; pages.forEach((page,i)=>{if(book.materials[i%Math.max(1,book.materials.length)]) page.media=structuredClone(book.materials[i%book.materials.length].media);});
        book.status='draft';selectPage(0);persist();dialog.close();render();notify('초안을 반영했어요. 각 페이지를 직접 수정해 주세요.');
      };
      dialog.append(cancel,apply);dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();
    } catch(error) {notify(error.message);}
  };
  $('#sample').onclick=async()=>{
    if((book.teacherNotes || book.childQuote || book.materials.length) && !confirm('샘플 메모와 아이의 말로 입력 내용을 바꿀까요? 기존 원본 자료는 유지돼요.')) return;
    try {
      const response=await fetch(new URL('../samples/imagination.svg', import.meta.url)); if(!response.ok) throw new Error();
      const blob=await response.blob(); const url=URL.createObjectURL(blob);
      const image=new Image();
      try {
        await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});
        const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;canvas.getContext('2d').drawImage(image,0,0);
        const media={type:'image',name:'가상샘플-상상숲.png',data:canvas.toDataURL('image/png')};
        if(book.materials.length>=100) return notify('원본 자료는 최대 100개까지 보관할 수 있어요.');
        book.materials.push({id:crypto.randomUUID(),kind:'drawing',identifiable:false,guardianConsent:false,media});
        book.pages[0].media=structuredClone(media);
      } finally {URL.revokeObjectURL(url);}
      book.teacherNotes='가상 어린이 별이가 숲과 작은 집을 그렸어요. 친구와 함께 집을 찾아가는 상상 놀이를 했어요.';
      book.childQuote='나무 뒤에 친구가 사는 집이 있어요!';book.author='샘플 선생님과 별이 (가상)';book.status='draft';
      await persist();render();notify('실제 아동 정보가 없는 가상 샘플을 넣었어요.');
    } catch {notify('샘플을 불러오지 못했어요. 다시 시도해 주세요.');}
  };
}

export async function printBook(book,mediaElement,notify) {
  document.querySelector('#print-book')?.remove();
  const print=element('section');print.id='print-book';
  const cover=element('article',undefined,'print-page cover');cover.append(element('h1',book.title||'제목 없는 이야기'),element('p',book.author||'작은 작가'),element('small','비공개 · 작은 이야기 공방'));print.append(cover);
  book.pages.forEach((page,i)=>{
    const section=element('article',undefined,'print-page');
    const content=element('div',undefined,'print-content');
    if(page.media?.type==='image') content.append(mediaElement(page.media));
    if(page.media?.type==='video') content.append(element('div',`동영상: ${page.media.name}\n영상은 책 JSON 파일에서 재생할 수 있어요.`,'print-video'));
    const text=element('div',undefined,'print-text');text.append(element('p',page.text));renderAttribution(text,page);content.append(text);
    section.append(content,element('small',`${i+1} / ${book.pages.length}`,'print-number'));print.append(section);
  });
  document.body.append(print);
  await Promise.all([...print.querySelectorAll('img')].map(img=>img.decode().catch(()=>{})));
  await document.fonts.ready;
  notify('인쇄 창에서 대상을 “PDF로 저장”으로 선택해 주세요. 동영상은 안내 문구로 표시돼요.');
  window.print();
}
