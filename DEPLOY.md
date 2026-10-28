# 배포 · 발표 체크리스트 (GitHub Pages)

배포 주소: `https://<GitHub아이디>.github.io/newsroom/`

## A. 배포 (처음 한 번)
1. github.com → New repository → 이름 `newsroom`, **Public** → Create
2. 이 폴더의 파일/폴더를 모두 업로드 (index.html이 저장소 맨 위에 보여야 함, `.github`, `.nojekyll` 포함 확인)
3. Settings → Pages → Source `Deploy from a branch` → Branch `main` / `(root)` → Save
4. 1~2분 뒤 Actions 탭의 `pages build and deployment`가 초록 체크 → Pages 화면에 주소 표시
5. Supabase 대시보드 → Authentication → URL Configuration
   - Site URL: `https://<GitHub아이디>.github.io/newsroom/`
   - Redirect URLs: `https://<GitHub아이디>.github.io/newsroom/**`
6. (선택) Settings → Secrets and variables → Actions → `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` 추가 → Actions → collect-news → Run workflow

## B. 발표 2~3일 전 점검
- [ ] 주소를 **휴대폰 데이터**로 열어 기사 카드/사진/FEATURED 슬라이드가 보인다
- [ ] 카드를 눌러 6장 카드뉴스가 열리고 ← → ESC가 동작한다
- [ ] 회원가입 → (메일 인증을 켰다면 메일 링크) → 로그인 → 헤더에 이름과 LOGOUT 표시
- [ ] Supabase 프로젝트 상태가 **Active** (무료 프로젝트는 일정 기간 사용이 없으면 멈춤 → 멈췄으면 Restore)
- [ ] REFRESH NEWS 후 새 기사가 들어온다

## C. 발표 당일
- [ ] 발표 1시간 전: 대시보드에서 프로젝트 Active 확인, 사이트 새로고침, REFRESH NEWS 한 번 실행
- [ ] 네트워크가 불안할 때를 대비해 **화면 캡처/녹화**와 로컬 `index.html`(더블클릭 실행)을 준비
- [ ] 발표 중 메일 인증이 필요한 가입 시연은 피하거나, 미리 만든 계정으로 로그인 시연

## D. 안 될 때
| 증상 | 확인 |
|---|---|
| 404 | 파일 이름이 `index.html`인지, Pages가 main/(root)인지, Actions 배포가 끝났는지 |
| 기사가 안 뜸 / Failed to fetch | Supabase 프로젝트 일시정지 → Restore |
| 메일 링크가 localhost로 감 | Site URL 미설정 |
| 수정했는데 안 바뀜 | Ctrl+Shift+R (캐시), 1~2분 대기 |
