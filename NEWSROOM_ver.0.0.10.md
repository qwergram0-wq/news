# NEWSROOM ver.0.0.10 — 회원가입 / 로그인 (Supabase Auth, JWT)

- 기준: ver.0.0.9. 이전 버전 파일은 수정하지 않음
- 파일: `NEWSROOM_ver.0.0.10.html`, `.md`, `.sql`

## 1. 변경 사항
- 헤더 우측에 LOGIN / SIGN UP 추가, 로그인 후 사용자 이름 + LOGOUT 표시
- 로그인하면 Supabase Auth가 발급한 JWT(access token)로 DB를 호출 (비로그인은 기존처럼 publishable key)

## 2. 신규 기능
- 회원가입 (이메일 + 비밀번호 + 표시 이름), 로그인, 로그아웃
- JWT 세션 유지: access_token / refresh_token을 localStorage에 저장, 만료 60초 전 자동 갱신
- 가입 시 `profiles` 행 자동 생성 (DB 트리거)
- 오류 한국어 안내 (잘못된 비밀번호, 이미 가입됨, 인증 미완료, 요청 제한 등)
- 비밀번호 8자 이상 (클라이언트 검사)

## 3. 데이터 구조
- `auth.users` (Supabase 관리) 1 : 1 `public.profiles`
- 화면 세션: `{access_token, refresh_token, expires_at, user, display_name}`

## 4. DB 구조
`.sql` 4번 항목 참고 (이미 적용됨)
- `profiles(id → auth.users.id, display_name, created_at)`, RLS 켬
- 정책: 본인 행만 조회 / 수정 (`authenticated`)
- 트리거 함수 `handle_new_user`는 API에서 직접 호출 불가하도록 실행 권한 회수

## 5. API
- 가입 `POST /auth/v1/signup`, 로그인 `POST /auth/v1/token?grant_type=password`
- 갱신 `POST /auth/v1/token?grant_type=refresh_token`, 로그아웃 `POST /auth/v1/logout`
- 이후 REST 호출은 `Authorization: Bearer <JWT>`

## 6. UI 변경
- 헤더 우측 인증 영역, LOGIN/SIGN UP 모달 (기존 모달 스타일 재사용)

## 7. 현재 한계
- Supabase 기본 설정은 **이메일 인증이 켜져 있음**: 가입 후 메일의 링크를 눌러야 로그인 가능. 링크가 가리키는 Site URL 기본값(localhost)이 로컬 파일과 달라 링크 페이지가 안 열려도 인증 자체는 완료됨. 대시보드 Authentication 설정에서 변경 가능
- 기본 메일 발송은 시간당 발송 수 제한이 낮음
- 토큰을 localStorage에 저장하므로 XSS에 취약할 수 있음 (프로토타입 수준)
- 로그인 여부가 아직 기능을 제한하지 않음 (뉴스 열람/수집은 누구나 가능)
- 비밀번호 재설정, 소셜 로그인 없음
- anon insert 정책(prototype)이 아직 남아 있음

## 8. 다음 버전 계획
1. 비밀번호 재설정, 로그인 사용자 전용 기능(수집 호출 제한 등) 결정
2. anon insert 정책 삭제
3. AI 카드뉴스 생성 → `card_news` 저장, 자동 수집
