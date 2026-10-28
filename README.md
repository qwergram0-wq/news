# NEWSROOM

뉴스를 6장짜리 에디토리얼 카드뉴스(COVER · BACKGROUND · KEY POINT · ISSUE · NOW · SUMMARY)로 보여주는 뉴스 웹사이트.
주제는 **FASHION / LIFESTYLE / SPORTS** 3개.

## 구조
```
언론사 RSS ─▶ Edge Function(collect-news) ─▶ Supabase articles ─▶ index.html(NEWSROOM)
                                              └▶ (예정) AI ─▶ card_news
```
- `index.html` — 사이트 전체(단일 파일). 최신 버전은 ver.0.0.20
- `supabase/functions/collect-news/index.ts` — 뉴스 수집 서버 함수 (Supabase Edge Function)
- `supabase/schema.sql` — DB 테이블/보안 정책 전체 (articles, card_news, profiles)
- `versions/` — ver.0.0.1 ~ 0.0.19 이전 버전 보관 (HTML / MD / SQL). **삭제·덮어쓰기 금지**

## 설정
1. Supabase 프로젝트 생성 → SQL Editor에서 `supabase/schema.sql` 실행
2. `index.html` 안의 `DEFAULT_SB_URL`, `DEFAULT_SB_KEY`를 본인 프로젝트 값으로 교체 (**publishable key만**)
3. Edge Function 배포: `supabase functions deploy collect-news --no-verify-jwt` (또는 대시보드에서 `index.ts` 붙여넣기)
   - 함수는 내부에서 호출자의 apikey를 직접 검증하므로 JWT 검증은 끈다
   - 함수가 쓰는 `SUPABASE_SERVICE_ROLE_KEY`는 Supabase가 서버에 자동 주입한다. 코드/HTML에 넣지 않는다
4. `index.html`을 열고 `REFRESH NEWS`로 수집 확인
5. 자동 수집: GitHub 저장소 Settings → Secrets and variables → Actions에 `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` 추가 후 Actions 탭에서 `collect-news`를 Run workflow로 시험 실행

## 보안 규칙
- 브라우저/HTML에는 **publishable key만**. secret / service_role / DB 비밀번호는 절대 넣지 않는다
- `articles`는 누구나 읽기만 가능, 쓰기는 Edge Function만 한다 (anon insert 정책 없음)
- 이전 버전의 `.sql`을 다시 실행하지 말 것 (삭제한 임시 insert 정책이 되살아날 수 있음). `supabase/schema.sql`만 사용

## 알려진 문제
- `collect-news`의 LIFESTYLE 키워드에 오타가 있음: `웨니스`(→ 웰니스), `핸스페이스`(의미 없음)
- 키워드 방식 분류라 오분류 가능, 매체가 세계일보 그룹 한 곳이라 패션 기사가 적음
- 자동 수집: `.github/workflows/collect-news.yml` (2시간마다). GitHub Secrets 설정 필요. 설정 전에는 수동(REFRESH)
- 6장 카드는 아직 AI 생성이 아닌 프로토타입 문구
- 기사 사진은 언론사 서버에서 직접 불러옴 → 공개 서비스 전 저작권/이용정책 확인 필요

## 다음 할 일
1. 패션 전문 매체 추가(패션엔/패션비즈 — 이용 허락 확인 후)
2. 자동 수집 동작 확인 (GitHub Actions → Run workflow로 수동 실행해 보기)
3. AI 카드뉴스 생성 → `card_news` 저장 (draft → review → published)
4. 관리자 검토·발행 화면, 디자인 최종 수정
5. 배포 전: Supabase Auth Site URL/Redirect URL 설정, 유출 비밀번호 보호 켜기
