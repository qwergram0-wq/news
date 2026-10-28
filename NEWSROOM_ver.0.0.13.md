# NEWSROOM ver.0.0.13 — 네이버 뉴스 API로 기사 요약 확보 (collect-news v3)

- 기준: ver.0.0.12. 이전 버전 파일은 수정하지 않음
- 파일: `NEWSROOM_ver.0.0.13.html`(화면은 동일, 버전 표기만 변경), `.md`, `.sql`

## 1. 변경 사항
- 문제: GDELT 기사는 `description`이 비어 있어 AI 카드뉴스의 재료가 부족
- 조치: `collect-news`를 v3로 재배포. 네이버 뉴스 검색 API를 1순위, GDELT를 폴백으로 사용
- 네이버 키(NAVER_CLIENT_ID / NAVER_CLIENT_SECRET)가 설정돼 있으면 네이버로 수집, 없거나 0건이면 기존 GDELT 방식

## 2. 신규 기능
- 네이버 뉴스 수집: 카테고리별 키워드(패션/문화/라이프스타일/디자인) 검색, 최신순
- 제목과 요약(description) 저장, HTML 태그/특수문자 정리, 원문 링크(originallink) 우선 저장
- 카테고리는 검색한 키워드 그룹 기준으로 지정 (ALL은 카테고리별 키워드 2개씩)
- 응답 문구에 수집 경로와 요약 포함 건수 표시 (예: `네이버 48건 수집 (요약 48건) · 새로 저장 30건`)

## 3. 데이터 구조 / 4. DB 구조
변경 없음. 기존 `articles.description`에 네이버 요약이 저장됨 (`.sql`은 ver.0.0.12와 동일)

## 5. API
- 서버 → 네이버: `GET https://openapi.naver.com/v1/search/news.json` (헤더 X-Naver-Client-Id / Secret)
- 키는 Supabase Edge Function Secrets에만 저장. 브라우저/HTML/채팅에 넣지 않음

## 6. UI 변경
- 없음. 요약이 있는 기사는 카드뉴스 BACKGROUND 등에 설명으로 표시됨

## 7. 현재 한계
- 네이버 키 설정 전에는 이전과 동일하게 GDELT로 동작 (요약 없음)
- 네이버 API는 기사 전문이 아닌 요약 일부만 제공
- 기존에 저장된 GDELT 기사 14건은 요약이 비어 있음 (중복 무시 방식이라 갱신되지 않음)
- 네이버 API 이용약관/일일 호출 한도(검색 API 하루 25,000회)와 기사 표시 조건 확인 필요
- 이 변경은 배포만 했고 실제 네이버 수집은 키 설정 후 확인 필요

## 8. 다음 버전 계획
1. 네이버 수집 성공 확인
2. 자동 수집(cron)
3. AI 카드뉴스 생성 → `card_news` 저장
