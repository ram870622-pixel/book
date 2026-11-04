import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

let server,browser,url,temporary;
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS9sAAAAASUVORK5CYII=','base64');
before(async()=>{
  temporary=await mkdtemp(join(tmpdir(),'storybook-e2e-'));
  server=spawn(process.execPath,['server.js'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
  const port=await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(new Error('Development server did not start')),10000);
    server.stdout.on('data',data=>{const match=/port (\d+)/.exec(String(data));if(match){clearTimeout(timeout);resolve(match[1]);}});
    server.on('exit',code=>{clearTimeout(timeout);reject(new Error(`Server exited ${code}`));});
  });
  url=`http://127.0.0.1:${port}`;
  browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE || (existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
});
after(async()=>{await browser?.close();if(server && server.exitCode===null){server.kill();await once(server,'exit');}if(temporary)await rm(temporary,{recursive:true,force:true});});

async function start(viewport) {
  const context=await browser.newContext({viewport:viewport||{width:1280,height:900},acceptDownloads:true});
  const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.locator('#home-create').click();
  return {page,context,errors};
}
async function waitForText(page,selector,text){await page.waitForFunction(({selector,text})=>document.querySelector(selector)?.textContent.includes(text),{selector,text});}
async function downloadBook(page) {
  const download=page.waitForEvent('download');await page.locator('#export').click();
  const file=await download;const path=join(temporary,crypto.randomUUID()+'.json');await file.saveAs(path);
  return {path,book:JSON.parse(await readFile(path,'utf8')).book};
}
test('teacher workflow: mock review, original preservation, editing, reorder, backup and restore',async()=>{
  const {page,context,errors}=await start();
  await page.locator('#sample').click();await waitForText(page,'#originals','(1)');
  const original=(await downloadBook(page)).book.materials[0].media.data;
  await page.locator('#generate').click();await page.getByRole('button',{name:'취소',exact:true}).click();
  assert.equal(await page.locator('[data-page]').count(),1,'cancel leaves existing pages intact');
  await page.locator('#page-count').selectOption('6');await page.locator('#generate').click();
  assert.equal(await page.locator('[data-page]').count(),1,'draft does not apply until reviewed');
  await page.getByRole('button',{name:'검토했어요 · 책에 반영'}).click();assert.equal(await page.locator('[data-page]').count(),6);
  assert.match(await page.locator('.writing .attribution').innerText(),/아이의 실제 말/);
  await page.locator('#title').fill('별이의 상상 숲');await page.locator('#page-text').fill('선생님이 고친 첫 장 이야기');
  assert.match(await page.locator('.writing .attribution').innerText(),/교사 작성·편집/);
  await page.locator('#move-right').click();assert.equal(await page.locator('#page-text').inputValue(),'선생님이 고친 첫 장 이야기');
  await page.getByRole('button',{name:'첨부 삭제',exact:true}).click();
  assert.equal((await downloadBook(page)).book.materials[0].media.data,original,'removing placement preserves exact original bytes');
  await page.locator('#book-status').selectOption('complete');
  const backup=await downloadBook(page);assert.equal(backup.book.status,'complete');assert.equal(backup.book.privacy,'private');
  await page.waitForFunction(()=>new Promise(resolve=>{const open=indexedDB.open('little-story-studio',1);open.onsuccess=()=>{const req=open.result.transaction('books').objectStore('books').getAll();req.onsuccess=()=>{open.result.close();resolve(req.result.some(b=>b.title==='별이의 상상 숲' && b.status==='complete'));};};}));
  await page.reload();await page.locator('#title').waitFor();assert.equal(await page.locator('#title').inputValue(),'별이의 상상 숲');
  await page.locator('#read').click();assert.match(await page.locator('#reader-counter').innerText(),/1 \/ 6/);
  await page.locator('#next').click();assert.match(await page.locator('#reader-content').innerText(),/선생님이 고친 첫 장 이야기/);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#reader').isVisible(),false);
  await page.locator('#import-file').setInputFiles(backup.path);await waitForText(page,'#book-count','2');
  const imported=await downloadBook(page);assert.notEqual(imported.book.id,backup.book.id);assert.equal(imported.book.materials[0].media.data,original);
  await page.locator('#delete-book').click({noWaitAfter:true});
  // Native confirm is dismissed by Playwright unless a handler accepts it.
  assert.equal(await page.locator('[data-book]').count(),2);
  page.once('dialog',dialog=>dialog.accept());await page.locator('#delete-book').click();await waitForText(page,'#book-count','1');
  assert.deepEqual(errors,[]);await context.close();
});
test('uploads require consent for identifiable media, reject unsupported files, preserve original bytes',async()=>{
  const {page,context,errors}=await start();
  await page.locator('#identifiable').check();
  await page.locator('#media-file').setInputFiles({name:'가상사진.png',mimeType:'image/png',buffer:png});
  await waitForText(page,'#status','보호자 동의');assert.equal(await page.locator('.media-area img').count(),0);
  await page.locator('#guardian-consent').check();await page.locator('#material-kind').selectOption('photo');
  await page.locator('#media-file').setInputFiles({name:'가상사진.png',mimeType:'image/png',buffer:png});await page.locator('.media-area img').waitFor();
  const backup=await downloadBook(page);assert.equal(backup.book.materials[0].guardianConsent,true);
  assert.equal(backup.book.materials[0].media.data,'data:image/png;base64,'+png.toString('base64'));
  await page.locator('#media-file').setInputFiles({name:'bad.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')});
  await waitForText(page,'#status','지원하는');assert.equal((await downloadBook(page)).book.materials.length,1);
  assert.deepEqual(errors,[]);await context.close();
});
test('mobile storyboard and malformed imports do not break the editor',async()=>{
  const {page,context,errors}=await start({width:390,height:844});
  await page.locator('#title').fill('<img src=x onerror=alert(1)>');
  await page.locator('#add-page').click();await page.locator('#page-text').fill('모바일에서 쓴 이야기');
  assert.equal(await page.locator('[data-page]').count(),2);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('#import-file').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{broken')});
  await waitForText(page,'#status','올바른 책 JSON');assert.equal(await page.locator('[data-book]').count(),1);
  await page.locator('#read').click();await page.locator('#next').click();assert.match(await page.locator('#reader-content').innerText(),/모바일에서 쓴 이야기/);
  assert.deepEqual(errors,[]);await context.close();
});
test('short video uploads, plays in the reader and exports with a PDF placeholder',async()=>{
  const {page,context,errors}=await start();
  const data=await page.evaluate(async()=>{
    const canvas=document.createElement('canvas');canvas.width=160;canvas.height=120;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#8ca573';ctx.fillRect(0,0,160,120);
    const stream=canvas.captureStream(10);const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8'});
    const chunks=[];recorder.ondataavailable=event=>chunks.push(event.data);
    const done=new Promise(resolve=>{recorder.onstop=resolve;});recorder.start();
    await new Promise(resolve=>setTimeout(resolve,500));recorder.stop();await done;stream.getTracks().forEach(track=>track.stop());
    return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));});
  });
  await page.locator('#media-file').setInputFiles({name:'가상놀이영상.webm',mimeType:'video/webm',buffer:Buffer.from(data.split(',')[1],'base64')});
  await page.locator('.media-area video').waitFor();await page.locator('#read').click();
  await page.locator('#reader-content video').evaluate(async video=>{video.muted=true;await video.play();});
  await page.waitForFunction(()=>document.querySelector('#reader-content video').currentTime>0);
  await page.locator('#close-reader').click();assert.equal(await page.locator('#reader-content video').evaluate(video=>video.paused),true);
  const backup=await downloadBook(page);assert.equal(backup.book.pages[0].media.type,'video');assert.equal(backup.book.materials[0].media.data,data);
  await page.evaluate(()=>{window.print=()=>{};});await page.locator('#pdf').click();await page.locator('.print-video').waitFor({state:'attached'});
  assert.match(await page.locator('.print-video').textContent(),/가상놀이영상.webm/);
  assert.deepEqual(errors,[]);await context.close();
});
test('PDF print layout contains Korean, original images and one page per short story scene',async()=>{
  const {page,context,errors}=await start();
  await page.locator('#sample').click();await waitForText(page,'#originals','(1)');await page.locator('#generate').click();await page.getByRole('button',{name:'검토했어요 · 책에 반영'}).click();
  await page.evaluate(()=>{window.print=()=>{};});await page.locator('#pdf').click();await page.locator('#print-book .print-page').first().waitFor({state:'attached'});
  await page.waitForFunction(()=>[...document.querySelectorAll('#print-book img')].every(img=>img.complete && img.naturalWidth>0));
  const pdf=await page.pdf({preferCSSPageSize:true,printBackground:true});assert.ok(pdf.length>10000);assert.equal(pdf.subarray(0,5).toString(),'%PDF-');
  assert.equal(await page.locator('#print-book .print-page').count(),6);assert.equal(await page.locator('#print-book img').count(),5);
  assert.match(await page.locator('#print-book').textContent(),/아이의 실제 말/);
  const response=await page.request.get(url+'/.git/config');assert.equal(response.status(),404);
  assert.deepEqual(errors,[]);await context.close();
});
test('static project hosting under /book/ loads modules, styles and sample without a root-path dependency',async()=>{
  const context=await browser.newContext();const page=await context.newPage();const errors=[];const failed=[];
  page.on('pageerror',error=>errors.push(error.message));
  const files=new Set(['/index.html','/src/app.js','/src/library.js','/src/model.js','/src/storage.js','/src/workflow.js','/src/style.css','/samples/imagination.svg']);
  await context.route('**/*',async route=>{
    const request=new URL(route.request().url());
    // Emulate a static project host; requests outside its mount must fail.
    if(request.origin!==url || !request.pathname.startsWith('/book/')) {failed.push(request.pathname);await route.fulfill({status:404,body:'outside static project'});return;}
    let local=request.pathname.slice('/book'.length);if(local==='/')local='/index.html';
    if(!files.has(local)){failed.push(request.pathname);await route.fulfill({status:404,body:'missing file'});return;}
    await route.fulfill({path:fileURLToPath(new URL('..'+local,import.meta.url))});
  });
  await page.goto(url+'/book/');await page.locator('#home-create').click();await page.locator('#sample').click();await waitForText(page,'#originals','(1)');
  await page.locator('#generate').click();await page.getByRole('button',{name:'검토했어요 · 책에 반영'}).click();
  assert.equal(await page.locator('[data-page]').count(),5);
  assert.equal(await page.locator('.media-area img').evaluate(image=>image.naturalWidth>0),true);
  assert.equal(await page.locator('.studio-grid').evaluate(el=>getComputedStyle(el).display),'grid');
  assert.equal(await page.locator('.brand').getAttribute('href'),'./');
  assert.deepEqual(failed,[]);assert.deepEqual(errors,[]);await context.close();
});
test('bookshelf search, themes and sample reading work without creating a saved book',async()=>{
  const context=await browser.newContext();const page=await context.newPage();await page.goto(url);
  await page.locator('.book-spine').first().waitFor();assert.equal(await page.locator('.book-spine').count(),10);
  await page.locator('#book-search').fill('달빛');assert.equal(await page.locator('.book-spine').count(),1);
  await page.locator('.book-spine').click();assert.match(await page.locator('#detail-content').innerText(),/달빛을 모으는 고양이/);
  await page.locator('#detail-read').click();assert.match(await page.locator('#reader-title').innerText(),/달빛/);
  await page.locator('#next').click();assert.match(await page.locator('#reader-counter').innerText(),/2 \/ 4/);
  await page.locator('#close-reader').click();assert.equal(await page.locator('#mine-count').innerText(),'0');
  await page.locator('#book-search').fill('');await page.locator('#topic-filter').selectOption('마음과 감정');assert.equal(await page.locator('.book-spine').count(),2);
  await page.locator('#book-sort').selectOption('title');
  const titles=await page.locator('.book-spine strong').allTextContents();assert.deepEqual(titles,[...titles].sort((a,b)=>a.localeCompare(b,'ko')));
  await page.locator('[data-filter="mine"]').click();assert.equal(await page.locator('.book-spine').count(),0);assert.match(await page.locator('#bookcase').innerText(),/첫 주인공/);
  await context.close();
});
test('sample copy becomes an editable private book and exports through the sharing screen',async()=>{
  const context=await browser.newContext({acceptDownloads:true});const page=await context.newPage();await page.goto(url);
  await page.locator('.book-spine').first().click();await page.locator('#detail-edit').click();await page.locator('#title').waitFor();
  assert.match(page.url(),/#studio$/);assert.equal(await page.locator('[data-page]').count(),4);
  assert.equal(await page.locator('#book-topic').inputValue(),'자연과 모험');
  await page.locator('#title').fill('내가 바꾼 씨앗 이야기');await page.locator('#book-topic').selectOption('친구와 가족');
  await page.locator('a[data-nav="library"]').click();await page.locator('[data-filter="mine"]').click();
  assert.equal(await page.locator('.book-spine').count(),1);assert.match(await page.locator('.book-spine').innerText(),/내가 바꾼/);
  await page.locator('nav [data-share]').click();assert.equal(await page.locator('#share-book option').count(),1);
  const downloaded=page.waitForEvent('download');await page.locator('#share-export').click();const file=await downloaded;
  const path=join(temporary,'shared-book.json');await file.saveAs(path);const saved=JSON.parse(await readFile(path,'utf8')).book;
  assert.equal(saved.title,'내가 바꾼 씨앗 이야기');assert.equal(saved.privacy,'private');assert.equal(saved.topic,'친구와 가족');assert.equal(saved.pages.length,4);
  await page.locator('#close-share').click();await page.locator('.book-spine').click();await page.locator('#detail-edit').click();assert.equal(await page.locator('#title').inputValue(),saved.title);
  await context.close();
});
test('older stored books remain editable after the new bookshelf is introduced',async()=>{
  const context=await browser.newContext();const page=await context.newPage();await page.goto(url);await page.locator('.book-spine').first().waitFor();
  await page.evaluate(()=>new Promise((resolve,reject)=>{const request=indexedDB.open('little-story-studio',1);request.onsuccess=()=>{const db=request.result;const tx=db.transaction('books','readwrite');tx.objectStore('books').put({id:'legacy-book',title:'예전에 만든 책',author:'가상 작가',status:'draft',privacy:'private',updatedAt:123,pages:[{id:'legacy-page',text:'기존 이야기 그대로',media:null}]});tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};}));
  await page.reload();await page.locator('[data-filter="mine"]').click();await page.locator('.book-spine').click();await page.locator('#detail-edit').click();
  assert.equal(await page.locator('#page-text').inputValue(),'기존 이야기 그대로');assert.equal(await page.locator('#book-topic').inputValue(),'상상과 발견');
  await context.close();
});
