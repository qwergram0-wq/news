# NEWSROOM ver.0.0.14 — 네이버 API HUB 방식으로 전환 (collect-news v4)

- 기준: ver.0.0.13. 이전 버전 파일은 수정하지 않음
- 파일: `NEWSROOM_ver.0.0.14.html`(화면은 동일, 버전 표기만 변경), `.md`, `.sql`

## 1. 변경 사항
- 문제: 네이버 개발자센터의 "사용 API" 목록에 검색이 없어 기존 방식으로 키 발급 불가
- 확인: 네이버 공식 이관 가이드(guide.ncloud-docs.com/docs/apihub-migration)에 따르면 검색 API는 NAVER API HUB(네이버 클라우드 플랫폼)로 이관됨. 신규 신청 종료일(2026-07-31)은 제3자 블로그 기준이라 미확인
- 조치: `collect-news`를 v4로 재배포. 호출 주소와 인증 헤더를 HUB 방식으로 변경

## 2. 신규 기능
- 호출: `GET https://naverapihub.apigw.ntruss.com/search/v1/news?query=..&display=20&sort=date`
- 헤더: `X-NCP-APIGW-API-KEY-ID`, `X-NCP-APIGW-API-KEY`
- Supabase Secrets 이름: `NAVER_HUB_CLIENT_ID`, `NAVER_HUB_CLIENT_SECRET` (v3의 NAVER_CLIENT_* 이름은 더 이상 사용하지 않음)
- HUB 오류 응답(Gateway 형식 포함)도 메시지로 표시
- 키가 없으면 GDELT 폴백 (기존과 동일)

## 3. 데이터 구조 / 4. DB 구조
변경 없음 (`.sql`은 ver.0.0.13과 동일)

## 5. API
- 응답 필드(title, originallink, link, description, pubDate)는 기존과 같다고 안내되나 API별 확인 필요. `sort` 파라미터 동작은 실제 호출로 확인 필요
- 호출 한도: 제3자 자료 기준 월 775,000건(검색 통합), 한시 무료. HUB 콘솔과 최신 공지로 확인할 것

## 6. UI 변경
- 없음

## 7. 현재 한계
- HUB 키가 아직 없어 실제 호출 미검증
- HUB 이용 신청 시 요구 조건(결제수단 등록 여부 등)은 미확인
- 기존 GDELT 기사 14건은 요약 없음

## 8. 다음 버전 계획
1. HUB 키 등록 후 수집 확인
2. 자동 수집(cron), AI 카드뉴스 생성
