export function createBook() {
  return { id: crypto.randomUUID(), title: '나의 첫 번째 이야기', author: '', status: 'draft', topic: '상상과 발견', privacy: 'private', teacherNotes: '', childQuote: '', materials: [], pages: [createPage()], updatedAt: Date.now() };
}
export function createPage() {
  return { id: crypto.randomUUID(), text: '', media: null, origin: 'teacher', childQuote: '' };
}
export function movePage(pages, index, direction) {
  const target = index + direction;
  if (index < 0 || index >= pages.length || target < 0 || target >= pages.length) return pages;
  const result = [...pages];
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}
export const MAX_MEDIA_BYTES = 20 * 1024 * 1024;
export const MAX_IMPORT_BYTES = 100 * 1024 * 1024;
export const SAMPLE_CONTEXT = { teacher: '샘플 선생님', classroom: '상상반', child: '가상 어린이 별이' };
export function generateDraft(notes, quote, count = 5) {
  if (typeof notes !== 'string' || !notes.trim()) throw new Error('놀이 기록이나 교사 메모를 먼저 적어 주세요.');
  if (![4, 5, 6].includes(count)) throw new Error('이야기는 4~6페이지로 만들어 주세요.');
  const scenes = [
    '작은 마을에 호기심 많은 친구가 살았어요. 오늘은 어떤 모험이 기다리고 있을까요?',
    '친구는 주변을 천천히 둘러보았어요. 익숙한 풍경도 새로운 이야기의 시작이 되었지요.',
    '길을 가다가 작은 어려움을 만났어요. 잠깐 멈추어 생각하고, 다른 방법을 찾아보았어요.',
    '함께 힘을 모으니 혼자서는 몰랐던 방법이 보였어요. 친구의 마음에 용기가 자라났어요.',
    '집으로 돌아오는 길, 마음속에 따뜻한 기억이 반짝였어요. 내일은 또 어떤 이야기가 펼쳐질까요?',
    '친구는 오늘의 모험을 그림으로 남겼어요. 작은 그림 한 장이 다음 이야기의 씨앗이 되었답니다.'
  ];
  const chosen = count === 4 ? [scenes[0], scenes[1], scenes[3], scenes[4]] : scenes.slice(0,count);
  return chosen.map((text,index) => ({ ...createPage(), text: index===0 ? `이야기 소재 (교사 메모): ${notes.trim()}\n\n${text}` : text, origin: 'mock', childQuote: index===0 ? quote : '' }));
}
// Future server-side providers implement this contract. Never send materials
// automatically; consent and teacher review must precede a real AI request.
export const mockStoryProvider = { mode: 'mock', async generate({ notes, quote, count }) { return generateDraft(notes, quote, count); } };
export function characterGenerationRequest(material, characterSheet) {
  if (!material || material.kind !== 'photo' || !material.identifiable || !material.guardianConsent) throw new Error('식별 사진의 보호자 동의가 필요해요.');
  return { mode: 'unconnected', materialId: material.id, characterSheet, requiresTeacherReview: true };
}
export function validateMedia(m) {
  if (!m || !['image', 'video'].includes(m.type) || typeof m.name !== 'string' || m.name.length > 255 || typeof m.data !== 'string' || m.data.length > Math.ceil(MAX_MEDIA_BYTES / 3) * 4 + 200) throw new Error('첨부 파일 정보가 올바르지 않아요.');
  const match = /^data:(image\/(?:png|jpeg|webp|gif)|video\/(?:mp4|webm|ogg));base64,([A-Za-z0-9+/]*={0,2})$/.exec(m.data);
  if (!match || !match[1].startsWith(m.type + '/') || !match[2] || match[2].length % 4 !== 0) throw new Error('지원하지 않는 첨부 파일이에요.');
  return { type: m.type, name: m.name, data: m.data };
}
export function validateBook(input) {
  if (!input || input.format !== 'little-storybook' || input.version !== 1) throw new Error('작은 이야기 공방에서 내보낸 책 파일을 선택해 주세요.');
  const book = input.book;
  if (!book || typeof book.title !== 'string' || book.title.length > 100 || typeof book.author !== 'string' || book.author.length > 60 || !Array.isArray(book.pages) || book.pages.length < 1 || book.pages.length > 100) throw new Error('책 정보가 올바르지 않아요.');
  const pages = book.pages.map(page => {
    if (!page || typeof page.text !== 'string' || page.text.length > 3000) throw new Error('페이지의 글이 올바르지 않아요.');
    let media = null;
    if (page.media !== null && page.media !== undefined) {
      media = validateMedia(page.media);
    }
    if (page.childQuote !== undefined && (typeof page.childQuote !== 'string' || page.childQuote.length > 1000)) throw new Error('아이의 말이 올바르지 않아요.');
    return { id: crypto.randomUUID(), text: page.text, media, origin: ['mock','teacher'].includes(page.origin) ? page.origin : 'teacher', childQuote: page.childQuote || '' };
  });
  for (const [key,limit] of [['teacherNotes',2000],['childQuote',1000]]) if(book[key] !== undefined && (typeof book[key] !== 'string' || book[key].length>limit)) throw new Error('소재 기록이 올바르지 않아요.');
  if(book.materials !== undefined && (!Array.isArray(book.materials) || book.materials.length>100)) throw new Error('원본 자료 목록이 올바르지 않아요.');
  const materials=(book.materials || []).map(m=>{
    if(!m || !['drawing','photo','artwork','video'].includes(m.kind) || typeof m.identifiable !== 'boolean' || typeof m.guardianConsent !== 'boolean' || (m.identifiable && !m.guardianConsent)) throw new Error('원본 자료의 분류·동의 정보가 올바르지 않아요.');
    return {id:crypto.randomUUID(),kind:m.kind,identifiable:m.identifiable,guardianConsent:m.guardianConsent,media:validateMedia(m.media)};
  });
  return { id: crypto.randomUUID(), title: book.title, author: book.author, status:book.status==='complete'?'complete':'draft', topic:['자연과 모험','마음과 감정','친구와 가족','상상과 발견'].includes(book.topic)?book.topic:'상상과 발견', privacy:'private',teacherNotes:book.teacherNotes||'',childQuote:book.childQuote||'',materials,pages, updatedAt: Date.now() };
}
