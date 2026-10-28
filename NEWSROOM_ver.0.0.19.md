# NEWSROOM ver.0.0.19 — 언론사 공식 RSS로 수집 전환 (collect-news v8)

- 기준: ver.0.0.18. 이전 버전 파일은 수정하지 않음
- 파일: `NEWSROOM_ver.0.0.19.html`(화면은 동일, 버전 표기만 변경), `.md`, `.sql`

## 1. 변경 사항
- 문제: ver.0.0.18에서 GDELT가 서버 요청을 "요청 제한"으로 막아 주제별 수집 실패 (FASHION/SPORTS/영문 모두 오류, LIFESTYLE 0건)
- 조치: 수집 경로를 GDELT에서 **세계일보 그룹 공식 RSS**로 교체. GDELT 코드는 제거(v7에 있음)
- RSS 주소는 세계일보 RSS 안내 페이지(segye.com/rssInfo)에서 확인. 피드의 XML 형식은 직접 열어보지 못해 너그러운 파서로 작성

## 2. 신규 기능
- 수집 피드 4개
  - 스포츠월드 스포츠 `sportsworldi.com/Articles/RSSList/sw_sports.xml` → SPORTS 고정
  - 세계일보 스포츠 `segye.com/Articles/RSSList/segye_sports.xml` → SPORTS 고정
  - 스포츠월드 라이프 `sportsworldi.com/Articles/RSSList/sw_life.xml` → 키워드로 FASHION/LIFESTYLE 판정
  - 세계일보 문화 `segye.com/Articles/RSSList/segye_culture.xml` → 키워드로 FASHION/LIFESTYLE 판정 (패션·뷰티, 음식, 레저 등이 포함됨)
- 피드는 동시에 읽어 요청 제한 문제 없음, 피드당 최신 20건
- RSS에 요약/사진이 빠져 있으면 원문 페이지 메타(og:description, og:image)로 보완
- 정치/사건 제외 단어 유지, 판정 안 되는 기사는 저장하지 않음
- 응답 문구: `후보 N건 → 주제 일치 M건(SPORTS a, LIFESTYLE b, FASHION c · 사진 k) · 제외 x건 · 새로 저장 y건 · 피드: 각 피드별 건수`

## 3. 데이터 구조 / 4. DB 구조
변경 없음 (`.sql`은 ver.0.0.18과 동일)

## 5. API
- `POST /functions/v1/collect-news` (topic 값은 더 이상 수집 범위를 바꾸지 않음. 항상 전체 피드 수집, 화면 필터는 DB 기준)

## 6. UI 변경
- 없음

## 7. 현재 한계
- 매체가 사실상 세계일보 그룹 한 곳이라 시각이 치우칠 수 있고 패션 기사는 적을 수 있음. 패션 전문 매체 추가 필요
- 피드 형식/주소는 실제 호출로 확인 필요 (결과 문구에 피드별 건수 표시)
- 키워드 판정이라 오분류 가능, 피드 이용 약관/출처 표기 확인 필요(배포 전)
- 이전 저장 기사 14건(TREND/CULTURE)은 DB에 남아 있으나 화면에는 안 보임

## 8. 다음 버전 계획
1. 수집 결과 확인 후 피드/키워드 조정, 패션·라이프스타일 전문 매체 RSS 추가
2. 자동 수집(cron)
3. AI 카드뉴스 생성, 관리자 검토·발행
