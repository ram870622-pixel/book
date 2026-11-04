import test from 'node:test';
import assert from 'node:assert/strict';
import {createBook, movePage, validateBook, generateDraft, characterGenerationRequest} from '../src/model.js';
import { filterLibrary, SAMPLE_BOOKS } from '../src/library.js';

const wrap = book => ({format:'little-storybook',version:1,book});
test('new books have an editable first page and independent identifiers',()=>{
  const a=createBook(),b=createBook();
  assert.equal(a.pages.length,1); assert.equal(a.pages[0].media,null); assert.notEqual(a.id,b.id);
});
test('mock drafts use 4–6 pages and keep actual child speech separate from generated text',()=>{
  for(const count of [4,5,6]) {
    const pages=generateDraft('숲을 그린 놀이','친구 집이야!',count);
    assert.equal(pages.length,count); assert.equal(pages[0].childQuote,'친구 집이야!');
    assert.match(pages[0].text,/숲을 그린 놀이/);
    assert.ok(pages.every(p=>p.origin==='mock' && !p.text.includes('친구 집이야!')));
  }
  assert.throws(()=>generateDraft('','말',5));assert.throws(()=>generateDraft('메모','말',3));
});
test('import preserves originals, source attribution and forces private visibility',()=>{
  const book=createBook();book.privacy='public';book.teacherNotes='메모';book.childQuote='실제 말';book.status='complete';
  const media={type:'image',name:'원본.png',data:'data:image/png;base64,aGVsbG8='};
  book.materials=[{id:'old',kind:'drawing',identifiable:false,guardianConsent:false,media}];
  book.pages=generateDraft(book.teacherNotes,book.childQuote,4);
  const copy=validateBook(wrap(book));
  assert.deepEqual(copy.materials[0].media,media);assert.equal(copy.pages[0].origin,'mock');
  assert.equal(copy.pages[0].childQuote,'실제 말');assert.equal(copy.privacy,'private');assert.equal(copy.status,'complete');
  book.materials[0].identifiable=true;assert.throws(()=>validateBook(wrap(book)));
});
test('future character request requires explicit guardian consent and review',()=>{
  const m={id:'photo',kind:'photo',identifiable:true,guardianConsent:false};
  assert.throws(()=>characterGenerationRequest(m,{}));
  m.guardianConsent=true; const req=characterGenerationRequest(m,{hair:'갈색'});
  assert.equal(req.mode,'unconnected');assert.equal(req.requiresTeacherReview,true);
});
test('library search, ownership, topic and sort use actual story metadata',()=>{
  const mine={...createBook(),title:'가족과 나',author:'가상 작가',topic:'친구와 가족',updatedAt:100};
  const all=[mine,...SAMPLE_BOOKS];
  assert.deepEqual(filterLibrary(all,{kind:'mine'}).map(b=>b.id),[mine.id]);
  assert.equal(filterLibrary(all,{kind:'sample'}).length,SAMPLE_BOOKS.length);
  assert.deepEqual(filterLibrary(all,{query:'가상 작가',topic:'친구와 가족'}).map(b=>b.id),[mine.id]);
  assert.equal(filterLibrary(all,{query:'아무것도없는검색어'}).length,0);
  const sorted=filterLibrary(all,{sort:'title'});
  assert.deepEqual(sorted.map(b=>b.title),all.map(b=>b.title).sort((a,b)=>a.localeCompare(b,'ko')));
});
test('book topic survives JSON backup and older books receive a compatible default',()=>{
  const book=createBook();book.topic='마음과 감정';assert.equal(validateBook(wrap(book)).topic,'마음과 감정');
  delete book.topic;assert.equal(validateBook(wrap(book)).topic,'상상과 발견');
});
test('page reorder preserves text and media without mutating original order',()=>{
  const pages=[{text:'처음',media:{name:'그림'}},{text:'다음'}];
  const moved=movePage(pages,0,1);
  assert.equal(moved[1],pages[0]); assert.equal(pages[0].text,'처음');
  assert.equal(movePage(pages,0,-1),pages);
});
test('export/import round trip preserves stories and media with new identifiers',()=>{
  const original=createBook(); original.author='작은 작가'; original.pages[0].text='숲속의 친구들';
  original.pages[0].media={type:'image',name:'그림.png',data:'data:image/png;base64,aGVsbG8='};
  const copy=validateBook(JSON.parse(JSON.stringify(wrap(original))));
  assert.equal(copy.title,original.title); assert.equal(copy.author,original.author);
  assert.equal(copy.pages[0].text,original.pages[0].text); assert.deepEqual(copy.pages[0].media,original.pages[0].media);
  assert.notEqual(copy.id,original.id); assert.notEqual(copy.pages[0].id,original.pages[0].id);
});
test('imports reject malformed books and executable or mismatched media',()=>{
  assert.throws(()=>validateBook({}));
  const book=createBook(); book.pages=[]; assert.throws(()=>validateBook(wrap(book)));
  book.pages=[{text:'test',media:{type:'image',name:'bad',data:'data:image/svg+xml;base64,aGVsbG8='}}];
  assert.throws(()=>validateBook(wrap(book)));
  book.pages[0].media.data='data:video/mp4;base64,aGVsbG8='; assert.throws(()=>validateBook(wrap(book)));
  book.pages[0].media={type:'video',name:'movie.mp4',data:'data:video/mp4;base64,aGVsbG8='};
  assert.equal(validateBook(wrap(book)).pages[0].media.type,'video');
});
