-- NEWSROOM ver.0.0.18 — Supabase schema
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

-- (ver.0.0.18) 프로토타입용 anon insert 정책은 삭제됨.
-- 이전 버전 SQL을 다시 실행하면 이 정책이 되살아나므로 이 파일을 사용할 것.
-- 기사 저장은 Edge Function(collect-news)이 서버 권한으로만 수행한다.
drop policy if exists "articles insert (prototype)" on public.articles;

-- 4. PROFILES (ver.0.0.18): 회원(auth.users)과 1:1. 가입 시 트리거로 자동 생성
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  created_at    timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. ARTICLES 이미지 칸 (ver.0.0.18): 원문 대표 사진 주소와 메타 확인 시각
alter table public.articles
  add column if not exists image_url text,
  add column if not exists meta_checked_at timestamptz;
alter table public.articles drop constraint if exists articles_image_url_http_check;
alter table public.articles add constraint articles_image_url_http_check
  check (image_url is null or image_url ~ '^https?://');

-- 6. 카테고리에 SPORTS 추가 (ver.0.0.18)
-- 서비스 주제는 FASHION / LIFESTYLE / SPORTS 3개. 이전 값(TREND, CULTURE, DESIGN, TECH)은 기존 데이터 보존을 위해 허용만 하고 화면에는 표시하지 않음.
alter table public.articles drop constraint if exists articles_category_check;
alter table public.articles add constraint articles_category_check
  check (category in ('FASHION','LIFESTYLE','SPORTS','TREND','CULTURE','DESIGN','TECH'));
