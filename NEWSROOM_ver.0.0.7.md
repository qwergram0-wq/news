# NEWSROOM ver.0.0.7 — 수집 오류 원인 표시

- 기준: ver.0.0.6. 이전 버전 파일은 수정하지 않음
- 파일: `NEWSROOM_ver.0.0.7.html`, `.md`, `.sql`

## 1. 변경 사항 (버그 수정)
- 증상: Supabase 연결은 되는데 REFRESH NEWS 후 `FALLBACK · EMPTY_DB`가 뜸
- 확인: 로그에 GET만 있고 POST(저장)가 없음, `articles` 0건 → 저장 전 단계인 GDELT 수집 실패
- 원인: 수집 오류를 catch에서 숨기고 DB가 비었다는 메시지만 표시했음

## 2. 신규 기능
- GDELT 실패 원인을 화면에 표시: 접속 불가(네트워크/CORS) / 요청 제한 / HTTP 오류 / JSON 아님 / 0건
- GDELT 요청 제한(5초 간격) 응답 시 6초 뒤 1회 자동 재시도
- 0건 반환 시 별도 안내

## 3. 데이터 구조 / 4. DB 구조
ver.0.0.6과 동일 (`NEWSROOM_ver.0.0.7.sql`은 같은 스키마의 복사본, 이미 적용됨)

## 5. API
- GDELT DOC 2.0, Supabase REST (ver.0.0.6과 동일)

## 6. UI 변경
- FALLBACK 문구를 "원인: ..."으로 변경. 디자인 변경 없음

## 7. 현재 한계
- GDELT가 브라우저에서 막히면(CORS, 네트워크) 수집 불가. 근본 해결은 서버 측 수집기
- 6장 카드는 아직 AI 생성이 아닌 프로토타입
- anon insert 정책은 프로토타입 전용

## 8. 다음 버전 계획
1. 서버 측 수집기(Edge Function)로 이동: 브라우저 CORS/제한 문제 해소, anon insert 정책 삭제
2. 수집 우선순위 확정 (GDELT → 네이버 뉴스 → 원문)
3. AI 카드뉴스 생성
