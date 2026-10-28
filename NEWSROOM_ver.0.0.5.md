# NEWSROOM ver.0.0.5 — Supabase 연결 단계

- 기준: 업로드된 `NEWSROOM_ver.0.0.4.html`을 그대로 복사해 Supabase 부분만 추가 (디자인 변경 없음)
- ver.0.0.1 ~ 0.0.4 파일은 수정하지 않음
- 파일: `NEWSROOM_ver.0.0.5.html`, `NEWSROOM_ver.0.0.5.md`

## 1. 변경 사항
- 뉴스 데이터를 Supabase `articles`에 저장하고, 화면은 Supabase에서 읽음
- Supabase 연결 시: GDELT 수집 → 중복 제거 → `articles` 저장 → DB에서 다시 읽어 표시
- Supabase 미연결 시: ver.0.0.4와 동일하게 동작 (GDELT 직접 표시, 실패 시 데모 데이터)
- `card_news`에 `published` 상태의 AI 카드 6장이 있으면 뷰어에서 그것을 표시, 없으면 ver.0.0.4의 프로토타입 6장을 표시
- 카테고리 필터(ALL/FASHION/CULTURE/LIFESTYLE/DESIGN)는 연결 시 DB를 조회 (GDELT를 다시 호출하지 않음). REFRESH NEWS를 눌렀을 때만 새로 수집
- 연결됐는데 DB가 비어 있으면 첫 로딩 때 한 번 자동 수집
- 카드 클릭 연결 방식을 인라인 JSON 대신 배열 인덱스(`LIVE[i]`)로 변경 (제목에 특수문자가 있어도 깨지지 않도록)

## 2. 신규 기능
- NEWS FEED 영역의 `SUPABASE 설정` 패널: URL, publishable key 입력 (브라우저 localStorage 저장), `SAVE & CONNECT` / `DISCONNECT`
- secret / service_role 키 입력 차단 (`sb_secret_`, JWT role 검사)
- 상태 표시: `● SUPABASE` / `● DEMO MODE`
- 카드 힌트에 AI 카드뉴스 여부 표시 (`OPEN CARD NEWS · AI →`)
- 수집 날짜를 `20260930T...` 대신 한국어 날짜로 표시

## 3. 데이터 구조
```
GDELT → NORMALIZER → articles → (AI, 다음 버전) → card_news → NEWSROOM
```
- `articles` 1 : 0..1 `card_news` (`article_id` UNIQUE)
- 카드 6장은 `card_news.cards` (jsonb 배열, 정확히 6개)에 저장. 한 번에 읽고 쓰며 카드 타입 변경에 스키마 변경이 필요 없음. 카드 단위 검색이 필요해지면 별도 테이블 분리 검토
- 상태: `draft → review → published → archived`
- 화면 내부 기사 배열: `[title, category, desc, visualClass, url, source, date, id, aiCards]` (0.0.4의 7칸에 id, aiCards 추가)
- 카테고리는 0.0.4의 `classify()`(제목 키워드)를 그대로 사용하므로 `TREND`도 저장됨

## 4. DB 구조 (Supabase SQL Editor에서 실행)
```sql
create table if not exists public.articles (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  source_name   text,
  source_url    text not null unique,          -- 중복 방지 기준
  published_at  timestamptz,
  category      text not null default 'TREND'
                check (category in ('TREND','FASHION','CULTURE','LIFESTYLE','DESIGN','TECH')),
  description   text,
  language      text default 'ko',
  collected_at  timestamptz not null default now()
);
create index if not exists articles_published_idx on public.articles (published_at desc);
create index if not exists articles_category_idx  on public.articles (category);

create table if not exists public.card_news (
  id          uuid primary key default gen_random_uuid(),
  article_id  uuid not null unique references public.articles(id) on delete cascade,
  status      text not null default 'draft'
              check (status in ('draft','review','published','archived')),
  cards       jsonb not null
              check (jsonb_typeof(cards) = 'array' and jsonb_array_length(cards) = 6),
  model       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.articles  enable row level security;
alter table public.card_news enable row level security;

create policy "articles read"  on public.articles  for select using (true);
create policy "card_news read" on public.card_news for select using (status = 'published');

-- ⚠ 프로토타입 전용 임시 정책: 누구나 articles에 쓸 수 있음.
-- 서버 측 수집기로 옮기는 ver.0.0.6 이후 반드시 삭제
create policy "articles insert (prototype)" on public.articles for insert with check (true);
```
`cards` 형식:
```json
[{"order":1,"type":"COVER","title":"...","body":"..."}, ... ,{"order":6,"type":"SUMMARY","title":"...","body":"..."}]
```

## 5. API
- 읽기: `GET {URL}/rest/v1/articles?select=*,card_news(status,cards)&order=published_at.desc.nullslast&limit=12[&category=eq.FASHION]`
- 저장: `POST {URL}/rest/v1/articles?on_conflict=source_url` + `Prefer: resolution=ignore-duplicates`
- 뉴스 소스: GDELT DOC 2.0 (검색식, `sourcelang:korean`, 24시간은 ver.0.0.4와 동일)
- 브라우저에는 `SUPABASE_URL` + publishable key만 사용. secret / service_role / DB 비밀번호는 넣지 않음

## 6. UI 변경
- ver.0.0.4 디자인 유지
- NEWS FEED 박스 하단에 `SUPABASE 설정` 버튼과 접이식 입력 패널 추가, 상태 문구 변경
- 최종 디자인 수정(STEP 1)은 이 버전에서 하지 않음

## 7. 현재 한계
- 6장 카드는 아직 AI 생성이 아님 (프로토타입 문구)
- GDELT는 기사 설명을 주지 않아 `description`이 비어 있고, 화면에는 0.0.4의 기본 문구가 표시됨
- 브라우저에서 직접 저장하므로 페이지를 열어야만 수집됨 (자동 업데이트 없음)
- 임시 insert 정책은 보안상 프로토타입 전용
- 중복 제거는 URL/제목 기준이라 같은 사건의 다른 매체 기사는 걸러지지 않음
- 실제 Supabase 프로젝트에 연결해 실행한 테스트는 아직 하지 않음 (JS 문법 검사만 완료)
- 수집 시 DB 한 번에 12건 조회 (0.0.4의 6건에서 변경)

## 8. 다음 버전 계획 (ver.0.0.6)
1. 수집 우선순위 확정: ① GDELT(발견) ② 네이버 뉴스 API(한국 보강, 제목+요약) ③ 원문 본문
2. 서버 측 수집기(Edge Function 등)로 이동하고 anon insert 정책 삭제
3. AI 분석 → `card_news` 생성 (draft → review → published)
4. 이후 자동 업데이트(cron)

## 9. 사용 순서
1. Supabase 프로젝트 생성
2. SQL Editor에서 4번 SQL 실행
3. Project Settings → API에서 Project URL과 publishable key 복사
4. HTML 열기 → `SUPABASE 설정`에 입력 → `SAVE & CONNECT` → `↻ REFRESH NEWS`
