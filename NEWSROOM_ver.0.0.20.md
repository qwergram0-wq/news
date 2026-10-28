# NEWSROOM ver.0.0.20 — 시맨틱 구조 정리 (`<main>`, 메뉴 링크, 키보드 접근)

- 기준: ver.0.0.19. 이전 버전 파일은 수정하지 않음
- 파일: `NEWSROOM_ver.0.0.20.html`, `.md`, `.sql`

## 1. 변경 사항
- 점검 결과: `<header>`, `<nav>`, `<section>`, `<footer>`는 있었으나 `<main>`이 없었고, 메뉴가 `<span>`이라 링크로 동작하지 않았음
- 본문(hero ~ HOW WE READ NEWS)을 `<main id="main">`으로 감쌈. `<header>`, `<footer>`, 로그인/카드뉴스 뷰어/편집 창은 `<main>` 밖

## 2. 신규 기능
- 메뉴 HOME / LATEST / TOPICS / ABOUT을 실제 링크(`<a href="#...">`)로 변경, 클릭 시 부드럽게 이동 (동작 줄이기 설정이면 즉시 이동)
  - HOME `#home`(hero), LATEST `#latest`, TOPICS `#topics`(카테고리 버튼 줄), ABOUT `#about`(HOW WE READ NEWS)
  - FEATURED 섹션에도 `id="featured"` 추가
- "본문으로 건너뛰기" 링크: 첫 Tab에 나타나며 Enter를 누르면 `<main>`으로 이동
- 뉴스 카드(`<article class="card">`)에 `tabindex="0"`: Tab으로 이동, Enter/Space로 카드뉴스 열기, 포커스 윤곽선 표시
- 메뉴에 `aria-label="주 메뉴"` 추가

## 3. 데이터 구조 / 4. DB 구조 / 5. API
- 변경 없음 (`.sql`은 ver.0.0.19와 동일)

## 6. UI 변경
- 디자인은 그대로. 메뉴에 마우스를 올리거나 포커스하면 밑줄 표시가 추가됨

## 7. 현재 한계
- FEATURED(대표 기사) 영역 자체는 키보드로 카드뉴스를 열 수 없음 (슬라이더 버튼은 Tab으로 사용 가능)
- 카드의 READ ORIGINAL 링크와 카드 전체 클릭이 겹쳐 있음
- 이미지 대체 텍스트(alt)는 빈 값(장식용 처리)
- 스크린리더 실제 점검은 하지 않았고, 자동 브라우저 테스트로만 확인

## 8. 다음 버전 계획
1. FEATURED 키보드 접근, 대체 텍스트 정리
2. 패션 전문 매체 추가, 자동 수집
3. AI 카드뉴스 생성, 관리자 검토·발행, 디자인 최종 수정
