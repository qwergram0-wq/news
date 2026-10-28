# NEWSROOM ver.0.0.9 — 프로젝트 URL/키 내장 (바로 연결)

- 기준: ver.0.0.8. 이전 버전 파일은 수정하지 않음
- 파일: `NEWSROOM_ver.0.0.9.html`, `.md`, `.sql`

## 1. 변경 사항
- Supabase URL과 publishable key를 HTML에 기본값으로 내장 → 열면 바로 DB에 연결
- 화면에서 입력한 값이 있으면 그 값이 우선 (`SUPABASE 설정`)

## 2. 신규 기능
- 없음 (연결 설정 자동화)

## 3. 데이터 구조 / 4. DB 구조
ver.0.0.6과 동일. `.sql`은 같은 스키마의 복사본이며 사용자가 SQL Editor에서 실행 완료

## 5. API
- 읽기: `GET /rest/v1/articles?select=*,card_news(status,cards)...`
- 수집: `POST /functions/v1/collect-news` (Edge Function, 서버에서 GDELT 호출 후 저장)

## 6. UI 변경
- 없음

## 7. 현재 한계
- 내장된 키는 publishable(공개용)이며 RLS 정책이 접근을 제한. secret / service_role 키는 넣지 않음
- Edge Function 실제 수집 성공 여부는 사용자 환경에서 확인 필요
- anon insert 정책(prototype)이 아직 남아 있음 → 수집 성공 확인 후 삭제
- 6장 카드는 아직 AI 생성이 아닌 프로토타입

## 8. 다음 버전 계획
1. anon insert 정책 삭제
2. 수집 우선순위 확정 (GDELT → 네이버 뉴스 → 원문)
3. AI 카드뉴스 생성 → `card_news` 저장
4. 자동 수집 (cron)
