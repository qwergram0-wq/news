# NEWSROOM ver.0.0.8 — 서버 측 수집기 (Edge Function)

- 기준: ver.0.0.7. 이전 버전 파일은 수정하지 않음
- 파일: `NEWSROOM_ver.0.0.8.html`, `.md`, `.sql`

## 1. 변경 사항
- 문제: ver.0.0.7에서 브라우저가 GDELT에 직접 접속하지 못함 (네트워크/CORS)
- 해결: 뉴스 수집을 Supabase Edge Function `collect-news`(서버)로 이동
- 흐름(Supabase 연결 시): `HTML → collect-news → GDELT → articles(서버가 저장) → HTML이 DB에서 읽기`
- Supabase 미연결 시: ver.0.0.4처럼 브라우저가 GDELT 직접 호출 (CORS 문제 가능)

## 2. 신규 기능
- Edge Function `collect-news` (verify_jwt=false, 함수 안에서 직접 인증)
  - 인증: 호출자의 apikey가 이 프로젝트에서 유효한지 REST 조회로 확인
  - 남용 방지: 마지막 수집 후 30초 이내 재호출은 건너뜀
  - GDELT 요청 제한 시 6초 후 1회 재시도
  - 저장: 함수 내부의 service role 키로 `articles`에 upsert (`source_url` 중복 무시). service role 키는 서버 환경변수에만 있고 브라우저에 노출되지 않음
  - 응답: `{ok, fetched, inserted}`
- 코드 확인: Supabase 대시보드 → Edge Functions → collect-news

## 3. 데이터 구조 / 4. DB 구조
ver.0.0.6과 동일 (`.sql` 복사본, 이미 적용됨)

## 5. API
- `POST {URL}/functions/v1/collect-news` (헤더 `apikey`, body `{"topic":"all|fashion|culture|lifestyle|design"}`)
- 읽기는 기존 REST (`/rest/v1/articles`)

## 6. UI 변경
- 없음 (수집 호출 경로만 변경)

## 7. 현재 한계
- 서버에서도 GDELT 접속이 막히거나 0건이면 수집 실패 (화면에 원인 표시)
- anon insert 정책(`articles insert (prototype)`)은 이 버전부터 필요 없음 → 동작 확인 후 삭제 예정
- 6장 카드는 아직 AI 생성이 아닌 프로토타입
- 함수 배포 후 실제 호출 테스트는 사용자 환경에서 처음 수행됨

## 8. 다음 버전 계획
1. 동작 확인 후 anon insert 정책 삭제
2. 수집 우선순위 확정 (GDELT → 네이버 뉴스 → 원문)
3. AI 카드뉴스 생성(Edge Function) → `card_news` 저장
4. 정기 자동 수집 (cron)
