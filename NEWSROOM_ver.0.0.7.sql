-- NEWSROOM ver.0.0.7 — Supabase schema
-- 프로젝트: zgwjyksettploauvmkmo
-- 이미 적용 완료된 상태. 새 프로젝트에 다시 만들 때 SQL Editor에 통째로 붙여 넣고 Run.
-- 여러 번 실행해도 안전하도록 작성됨 (이미 있는 테이블/정책은 건너뜀·재생성).

-- 1. ARTICLES: 뉴스 원본
create table if not exists public.articles (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  source_name   text,
  source_url    text not null unique,            -- 중복 방지 기준
  published_at  timestamptz,
  category      text not null default 'TREND'
                check (category in ('TREND','FASHION','CULTURE','LIFESTYLE','DESIGN','TECH')),
  description   text,
  language      text default 'ko',
  collected_at  timestamptz not null default now()
);
create index if not exists articles_published_idx on public.articles (published_at desc);
create index if not exists articles_category_idx  on public.articles (category);

-- 2. CARD_NEWS: AI가 만든 6장 카드뉴스 (기사 1건 : 카드뉴스 1건)
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

-- 3. RLS (보안)
alter table public.articles  enable row level security;
alter table public.card_news enable row level security;

drop policy if exists "articles read" on public.articles;
create policy "articles read" on public.articles for select using (true);

drop policy if exists "card_news read" on public.card_news;
create policy "card_news read" on public.card_news for select using (status = 'published');

-- ⚠ 프로토타입 전용 임시 정책: 브라우저(anon)에서 직접 저장하기 위함.
-- 서버 측 수집기를 만들면 아래 정책을 삭제할 것:
--   drop policy "articles insert (prototype)" on public.articles;
drop policy if exists "articles insert (prototype)" on public.articles;
create policy "articles insert (prototype)" on public.articles for insert with check (true);
