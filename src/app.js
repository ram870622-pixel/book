import { mountWorkflow, printBook, renderAttribution } from './workflow.js';
import { createBook, createPage, movePage, validateBook, MAX_MEDIA_BYTES, MAX_IMPORT_BYTES } from './model.js';
import { loadBooks, saveBook, deleteBook } from './storage.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let books = [], activeId = null, pageIndex = 0, readerIndex = 0, timer, saveQueue = Promise.resolve(), storageFailed = false, pendingSaves = 0;
const current = () => books.find(b => b.id === activeId);
function markDraft(book = current()) {
  if(!book) return;
  book.status='draft';
  if(current()===book && $('#book-status')) $('#book-status').value='draft';
  renderShelf();
}
function notify(message) { $('#status').textContent = message; $('#status').classList.add('visible'); clearTimeout(timer); timer = setTimeout(() => $('#status').classList.remove('visible'), 5000); }
function persist(book = current()) {
  if (!book) return Promise.resolve(false);
  book.updatedAt = Date.now();
  const snapshot = structuredClone(book);
  pendingSaves++; updateSaveState();
  const task = saveQueue.then(() => saveBook(snapshot));
  saveQueue = task.catch(() => {});
  return task.then(() => { pendingSaves--; storageFailed = false; updateSaveState(); return true; }, () => { pendingSaves--; storageFailed = true; updateSaveState(); notify('저장 공간에 접근할 수 없어요. 책을 내보내 안전하게 보관해 주세요.'); return false; });
}
function updateSaveState() { const el = $('#save-state'); if(el) el.textContent = storageFailed ? '● 저장 실패 · 파일로 내보내 주세요' : pendingSaves ? '● 저장 중…' : '● 이 브라우저에 저장됨'; }
function renderShelf() {
  $('#book-count').textContent = books.length;
  $('#books').innerHTML = books.map(b => `<button class="book-item ${b.id === activeId ? 'selected' : ''}" data-book="${b.id}"><span class="mini-book">✦</span><span><strong>${escape(b.title || '제목 없는 이야기')}</strong><small>${b.pages.length}페이지 · ${b.status==='complete'?'완성':'초안'} · 비공개</small></span></button>`).join('') || '<p class="shelf-empty">첫 번째 이야기를<br>만들어 보세요.</p>';
  document.querySelectorAll('[data-book]').forEach(el => el.onclick = () => { activeId = el.dataset.book; pageIndex = 0; render(); });
}
function mediaElement(media, className = '') {
  const el = document.createElement(media.type === 'video' ? 'video' : 'img');
  el.src = media.data; el.className = className;
  if (media.type === 'video') { el.controls = true; el.playsInline = true; el.preload = 'metadata'; }
  else el.alt = media.name || '아이의 작품';
  return el;
}
function render() {
  renderShelf();
  const book = current();
  if (!book) { $('#editor').innerHTML = '<div class="empty"><div class="empty-art">✧</div><span class="eyebrow">ONCE UPON A LITTLE TIME</span><h2>어떤 이야기가 기다리고 있을까요?</h2><p>아이의 그림 한 장에서 시작해 보세요.</p><button id="first-book" class="button primary">＋ 첫 동화책 만들기</button></div>'; $('#first-book').onclick = newBook; return; }
  const page = book.pages[pageIndex];
  $('#editor').innerHTML = `<div class="editor-toolbar"><span id="save-state" class="saved"></span><div><button id="pdf" class="button quiet">PDF 저장</button><button id="export" class="button quiet">↓ 내보내기</button><button id="read" class="button dark">▷ 책 읽기</button></div></div><div class="book-meta"><label class="sr-only" for="title">책 제목</label><input id="title" maxlength="100" placeholder="동화책 제목" value="${escape(book.title)}"><label for="author">글·그림 <input id="author" maxlength="60" placeholder="작은 작가님의 이름" value="${escape(book.author)}"></label></div><div class="page-tabs" aria-label="페이지 선택">${book.pages.map((p,i) => `<button class="page-tab ${i===pageIndex?'active':''}" data-page="${i}" aria-label="${i+1}페이지" ${i===pageIndex?'aria-current="page"':''}>${String(i+1).padStart(2,'0')}</button>`).join('')}<button id="add-page" class="page-tab add" aria-label="페이지 추가">＋</button></div><div class="page-editor"><div id="media-area" class="media-area ${page.media?'has-media':''}"></div><div class="writing"><span class="eyebrow">PAGE ${String(pageIndex+1).padStart(2,'0')}</span><h3>이 장면에는 어떤 이야기가 있나요?</h3><label for="page-text" class="sr-only">페이지 이야기</label><textarea id="page-text" maxlength="3000" placeholder="옛날 옛적, 작은 숲속에…\n\n아이와 함께 이야기를 채워 보세요.">${escape(page.text)}</textarea><span id="char-count" class="char-count">${page.text.length} / 3,000</span></div></div><div class="page-actions"><div><button id="move-left" class="button quiet" ${pageIndex===0?'disabled':''}>← 앞으로</button><button id="move-right" class="button quiet" ${pageIndex===book.pages.length-1?'disabled':''}>뒤로 →</button></div><span>${pageIndex+1} / ${book.pages.length} 페이지</span><button id="delete-page" class="button quiet danger" ${book.pages.length===1?'disabled':''}>페이지 삭제</button></div><div class="editor-bottom"><span>✧ 정답 없는 이야기, 마음껏 상상해요.</span><button id="delete-book" class="text-button">이 책 삭제</button></div><input id="media-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/ogg" hidden>`;
  updateSaveState(); renderMedia(page);
  mountWorkflow(book, { persist, render, notify, markDraft, selectPage: index => { pageIndex=index; }, mediaElement });
  renderAttribution($('.writing'), page);
  $('#pdf').onclick=()=>printBook(book,mediaElement,notify);
  $('#title').oninput = event => { book.title = event.target.value; markDraft(); persist(); renderShelf(); };
  $('#author').oninput = event => { book.author = event.target.value; markDraft(); persist(); renderShelf(); };
  $('#page-text').oninput = event => { page.text = event.target.value; page.origin='teacher'; markDraft(); renderAttribution($('.writing'),page); $('#char-count').textContent = `${page.text.length} / 3,000`; persist(); };
  document.querySelectorAll('[data-page]').forEach(el => el.onclick = () => { pageIndex = Number(el.dataset.page); render(); });
  $('#add-page').onclick = () => { if(book.pages.length>=100) return notify('한 권에 최대 100페이지까지 만들 수 있어요.'); book.pages.push(createPage()); pageIndex = book.pages.length-1; markDraft(); persist(); render(); };
  for (const [id, dir] of [['move-left',-1],['move-right',1]]) $('#'+id).onclick = () => { book.pages = movePage(book.pages,pageIndex,dir); pageIndex += dir; markDraft(); persist(); render(); };
  $('#delete-page').onclick = () => { if(!confirm('이 페이지의 그림과 이야기를 삭제할까요?')) return; book.pages.splice(pageIndex,1); pageIndex = Math.min(pageIndex,book.pages.length-1); markDraft(); persist(); render(); };
  $('#delete-book').onclick = async () => {
    if (!confirm('이 동화책을 삭제할까요? 내보낸 파일이 없으면 복구할 수 없어요.')) return;
    try { await saveQueue; await deleteBook(book.id); books = books.filter(b=>b.id!==book.id); activeId = books[0]?.id; pageIndex=0; render(); } catch { notify('책을 삭제하지 못했어요. 다시 시도해 주세요.'); }
  };
  $('#media-file').onchange = event => attach(event.target.files[0], book, page);
  $('#export').onclick = exportBook;
  $('#read').onclick = () => { readerIndex = 0; renderReader(); $('#reader').showModal(); };
}
function renderMedia(page) {
  const area = $('#media-area'); area.replaceChildren();
  if (page.media) {
    area.append(mediaElement(page.media));
    const tools = document.createElement('div'); tools.className='media-tools';
    const replace=document.createElement('button'); replace.className='button quiet'; replace.textContent='작품 바꾸기'; replace.onclick=()=>$('#media-file').click();
    const remove=document.createElement('button'); remove.className='button quiet'; remove.textContent='첨부 삭제'; remove.onclick=()=>{ page.media=null; markDraft(); persist(); renderMedia(page); };
    tools.append(replace,remove); area.append(tools);
  } else {
    area.innerHTML='<button class="upload-button"><span class="upload-icon">＋</span><strong>작은 작품을 담아 주세요</strong><span>그림이나 사진, 짧은 동영상</span><small>클릭하거나 파일을 여기에 놓아 주세요<br>JPG · PNG · WebP · GIF · MP4 · WebM · OGG / 최대 20MB</small></button>';
    area.querySelector('button').onclick=()=>$('#media-file').click();
  }
  area.ondragover=e=>{ e.preventDefault(); area.classList.add('dragging'); };
  area.ondragleave=()=>area.classList.remove('dragging');
  area.ondrop=e=>{ e.preventDefault(); area.classList.remove('dragging'); attach(e.dataTransfer.files[0],current(),page); };
}
async function attach(file,book,page) {
  if(!file) return;
  const kind=$('#material-kind').value;
  const identifiable=$('#identifiable').checked;
  const guardianConsent=$('#guardian-consent').checked;
  if(identifiable && !guardianConsent) return notify('식별 가능한 아동 사진·영상은 보호자 동의 확인 후 첨부해 주세요.');
  if((book.materials||[]).length>=100) return notify('원본 자료는 책당 최대 100개까지 보관할 수 있어요.');
  if(!['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm','video/ogg'].includes(file.type)) return notify('지원하는 그림·사진·동영상 파일을 선택해 주세요.');
  if(file.size>MAX_MEDIA_BYTES) return notify('20MB 이하 파일을 선택해 주세요. 동영상은 짧게 잘라서 올려 주세요.');
  try {
    const data = await new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=()=>reject(reader.error); reader.readAsDataURL(file); });
    if(!books.includes(book) || !book.pages.includes(page)) return;
    page.media={type:file.type.startsWith('video/')?'video':'image',name:file.name.slice(0,255),data};
    book.materials ||= [];
    book.materials.push({id:crypto.randomUUID(),kind:file.type.startsWith('video/')?'video':kind,identifiable,guardianConsent,media:structuredClone(page.media)});
    book.status='draft';
    const saved = await persist(book);
    if (current()===book && book.pages[pageIndex]===page) render();
    if(saved) notify('작품을 페이지에 담았어요.');
  } catch { notify('파일을 읽지 못했어요. 다른 파일을 선택해 주세요.'); }
}
async function newBook() { const book=createBook(); books.unshift(book); activeId=book.id; pageIndex=0; render(); await persist(book); $('#title')?.focus(); }
function exportBook() {
  const book=current();
  const blob=new Blob([JSON.stringify({format:'little-storybook',version:1,book})],{type:'application/json'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=(book.title||'나의 동화책').replace(/[\\/:*?"<>|]/g,'_')+'.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  notify('그림과 동영상을 포함한 책 파일을 내보냈어요.');
}
function renderReader() {
  const book=current(), page=book.pages[readerIndex];
  $('#reader-title').textContent=book.title || '제목 없는 이야기';
  const content=$('#reader-content'); content.replaceChildren();
  const art=document.createElement('div'); art.className='reader-art'; if(page.media) art.append(mediaElement(page.media)); else { art.textContent='✧'; art.classList.add('no-art'); }
  const text=document.createElement('div'); text.className='reader-text';
  const author=document.createElement('small'); author.textContent=book.author ? `글·그림 ${book.author}` : '우리 가족의 작은 이야기';
  const paragraph=document.createElement('p'); paragraph.textContent=page.text || '아직 이야기가 쓰이지 않은 페이지예요.'; text.append(author,paragraph); renderAttribution(text,page); content.append(art,text);
  $('#reader-counter').textContent=`${readerIndex+1} / ${book.pages.length}`;
  $('#prev').disabled=readerIndex===0; $('#next').disabled=readerIndex===book.pages.length-1;
}
$('#new-book').onclick=newBook;
$('#home-create').onclick=newBook;
$('#home-read').onclick=()=>{ if(!current()) return notify('책을 먼저 만들어 주세요.'); readerIndex=0; renderReader(); $('#reader').showModal(); };
$('#import').onclick=()=>$('#import-file').click();
$('#import-file').onchange=async event=>{
  const file=event.target.files[0]; event.target.value=''; if(!file) return;
  if(file.size>MAX_IMPORT_BYTES) return notify('가져올 수 있는 책 파일은 최대 100MB예요.');
  try { const book=validateBook(JSON.parse(await file.text())); books.unshift(book); activeId=book.id; pageIndex=0; render(); if(await persist(book)) notify('동화책을 가져왔어요.'); }
  catch(error) { notify(error instanceof SyntaxError ? '올바른 책 JSON 파일을 선택해 주세요.' : error.message); }
};
$('#close-reader').onclick=()=>$('#reader').close();
$('#reader').addEventListener('close',()=>{ $('#reader-content').querySelectorAll('video').forEach(v=>v.pause()); });
$('#prev').onclick=()=>{ if(readerIndex>0) {readerIndex--;renderReader();} };
$('#next').onclick=()=>{ if(readerIndex<current().pages.length-1) {readerIndex++;renderReader();} };
$('#reader').addEventListener('keydown',event=>{ if(event.target.tagName==='VIDEO') return; if(event.key==='ArrowLeft') $('#prev').click(); if(event.key==='ArrowRight') $('#next').click(); });
try { books=(await loadBooks()).sort((a,b)=>b.updatedAt-a.updatedAt); activeId=books[0]?.id; render(); }
catch { storageFailed=true; render(); notify('브라우저 저장소를 사용할 수 없어요. 작업 후 반드시 책을 내보내 주세요.'); }
