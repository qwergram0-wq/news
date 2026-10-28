# NEWSROOM ver.0.0.6 — Supabase 프로젝트 연결 및 로컬 실행

- 기준: 업로드된 `NEWSROOM_ver_0_0_5.html` (ver.0.0.5와 동일 내용 확인)
- ver.0.0.1 ~ 0.0.5 파일은 수정하지 않음
- 파일: `NEWSROOM_ver.0.0.6.html`, `NEWSROOM_ver.0.0.6.md`

## 1. 변경 사항
- Supabase 프로젝트 주소 `https://zgwjyksettploauvmkmo.supabase.co`를 기본값으로 내장 (공개 값)
- 키는 HTML에 넣지 않고 화면의 `SUPABASE 설정`에서 입력 (브라우저 localStorage에만 저장)
- `SAVE & CONNECT` 시 연결 테스트 수행 (`articles` 1건 조회)
- 실패 원인 안내: 키 오류 / 테이블 없음(SQL 미실행) / 접속 불가

## 2. 신규 기능
- 연결 테스트 및 한국어 오류 안내
- 설정 패널에 프로젝트 ID 표시

## 3. 데이터 구조
ver.0.0.5와 동일: `GDELT → articles → (AI) → card_news → NEWSROOM`, `articles` 1 : 0..1 `card_news`, 카드 6장은 `cards` jsonb

## 4. DB 구조 (Supabase SQL Editor에서 먼저 실행)
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

## 5. API
- 읽기: `GET {URL}/rest/v1/articles?select=*,card_news(status,cards)&order=published_at.desc.nullslast&limit=12`
- 저장: `POST {URL}/rest/v1/articles?on_conflict=source_url` (`ignore-duplicates`)
- 뉴스 소스: GDELT DOC 2.0
- 키 규칙: publishable key만 사용. secret / service_role / DB 비밀번호는 입력 금지 (입력 시 차단)

## 6. UI 변경
- 설정 버튼 옆 프로젝트 안내 문구 추가. 그 외 디자인은 ver.0.0.4와 동일

## 7. 로컬 실행 방법
1. Supabase 대시보드 → SQL Editor → 위 4번 SQL 실행
2. Project Settings → API → **publishable key** 복사
3. `NEWSROOM_ver.0.0.6.html`을 브라우저로 열기 (더블클릭)
4. `SUPABASE 설정` → 키 붙여넣기 → `SAVE & CONNECT`
5. `↻ REFRESH NEWS`로 수집, Supabase 대시보드 Table Editor에서 `articles` 저장 확인
- 더블클릭 실행에서 GDELT/Supabase 요청이 막히면 폴더에서 `python3 -m http.server 8000` 실행 후 `http://localhost:8000/NEWSROOM_ver.0.0.6.html` 로 접속

## 8. 현재 한계
- 실제 프로젝트 연결 테스트는 사용자 환경에서 처음 수행됨 (제 쪽에서는 키가 없어 확인 불가)
- 6장 카드는 아직 AI 생성이 아닌 프로토타입
- articles에 대한 anon insert 정책은 프로토타입 전용 (보안상 임시)
- 자동 수집 없음 (페이지를 열고 REFRESH를 눌러야 함)

## 9. 다음 버전 계획 (ver.0.0.7)
1. 수집 우선순위 확정 (GDELT → 네이버 뉴스 API → 원문)
2. 서버 측 수집기로 이동, anon insert 정책 삭제
3. AI 분석 → `card_news` 생성
