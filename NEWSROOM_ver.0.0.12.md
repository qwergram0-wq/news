# NEWSROOM ver.0.0.12 — 임시 insert 정책 삭제 (수집 성공 확인 후)

- 기준: ver.0.0.11. 이전 버전 파일은 수정하지 않음
- 파일: `NEWSROOM_ver.0.0.12.html`(화면은 ver.0.0.11과 동일, 버전 표기만 변경), `.md`, `.sql`

## 1. 변경 사항
- 수집 성공 확인: `articles` 14건 (전부 한국어, ko). 화면 로드 확인됨
- DB에서 `articles insert (prototype)` 정책 삭제 → 이제 브라우저(anon)는 `articles`에 쓸 수 없고, 저장은 Edge Function만 수행

## 2. 신규 기능
- 없음 (보안 강화)

## 3. 데이터 구조 / 4. DB 구조
- 테이블: `articles`, `card_news`, `profiles` (변경 없음)
- 현재 정책: `articles read`(전체 읽기), `card_news read`(published만), `profiles select own` / `profiles update own`
- `.sql`은 insert 정책 없이 현재 상태를 재현. **ver.0.0.6~0.0.11의 .sql은 다시 실행하지 말 것** (insert 정책이 되살아남)

## 5. API
- 변경 없음: `POST /functions/v1/collect-news`, REST 읽기, Auth

## 6. UI 변경
- 없음

## 7. 현재 한계
- 6장 카드뉴스는 아직 AI 생성이 아님
- 수집된 기사 `description`이 비어 있음 (GDELT는 요약 미제공)
- collect-news는 누구나(유효한 키로) 호출 가능하며 30초 간격 제한만 있음
- 자동 수집(cron) 없음, 인증 설정(Site URL 등) 미완료

## 8. 다음 버전 계획
1. 자동 수집 예약 (cron)
2. 기사 본문/요약 확보 (네이버 뉴스 API 또는 원문 수집)
3. AI 카드뉴스 생성 → `card_news` 저장
4. 배포 전 인증 설정 (Site URL, 유출 비밀번호 보호)
