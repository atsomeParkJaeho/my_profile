# 회원가입 기능 복원 가이드

현재 회원가입 기능은 주석 처리되어 있습니다.
아래 파일별 안내에 따라 주석을 해제하면 즉시 복원됩니다.

---

## 주석 처리된 파일 목록

| 파일 | 위치 |
|---|---|
| `client/src/App.tsx` | 4번 줄, 9번 줄, 37번 줄 |
| `client/src/pages/login/LoginPage.tsx` | 90~95번 줄 |
| `server/src/auth/auth.controller.ts` | 12번 줄, 21~24번 줄 |

---

## 1. `client/src/App.tsx`

### 주석 해제 위치 3곳

```tsx
// ① 4번 줄 — import 주석 해제
// import SigninPage from '@pages/signin/SigninPage';
↓
import SigninPage from '@pages/signin/SigninPage';

// ② 9번 줄 — NO_AUTH_PATHS에 '/signin' 추가
const NO_AUTH_PATHS = ['/login']; // '/signin' 제거
↓
const NO_AUTH_PATHS = ['/login', '/signin'];

// ③ 37번 줄 — 라우트 주석 해제
{/* <Route path="/signin" element={user ? <Navigate to="/home" replace /> : <SigninPage />} /> */}
↓
<Route path="/signin" element={user ? <Navigate to="/home" replace /> : <SigninPage />} />
```

---

## 2. `client/src/pages/login/LoginPage.tsx`

### 주석 해제 위치 — 90~95번 줄 (회원가입 링크)

```tsx
// 현재 (주석 처리됨)
{/*<div className="mt-4 text-center">*/}
{/*  <span className="text-sm text-gray-500">계정이 없으신가요? </span>*/}
{/*  <Link to="/signin" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">*/}
{/*    회원가입*/}
{/*  </Link>*/}
{/*</div>*/}

// 복원 후
<div className="mt-4 text-center">
  <span className="text-sm text-gray-500">계정이 없으신가요? </span>
  <Link to="/signin" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
    회원가입
  </Link>
</div>
```

---

## 3. `server/src/auth/auth.controller.ts`

### 주석 해제 위치 2곳

```typescript
// ① 12번 줄 — import 주석 해제
// import { SignupDto } from './dto/signup.dto';
↓
import { SignupDto } from './dto/signup.dto';

// ② 21~24번 줄 — 엔드포인트 주석 해제
// 회원가입 비활성화
// @Post('signup')
// signup(@Body() dto: SignupDto) {
//   return this.authService.signup(dto);
// }
↓
// POST /api/auth/signup
@Post('signup')
signup(@Body() dto: SignupDto) {
  return this.authService.signup(dto);
}
```

---

## 복원 후 확인사항

```bash
# 서버 재빌드 (auth.controller.ts 변경 후 필요)
cd server
npm run build
npm run start:dev

# 클라이언트는 HMR로 자동 반영 (재시작 불필요)
```

### 복원 후 활성화되는 기능

| 기능 | URL / 엔드포인트 |
|---|---|
| 회원가입 페이지 | `http://localhost:5173/signin` |
| 회원가입 API | `POST /api/auth/signup` |
| 로그인 페이지 회원가입 링크 | 로그인 카드 하단 |

### 회원가입 요청 Body

```json
{
  "name": "홍길동",
  "email": "hong@test.com",
  "password": "123456"
}
```

---

## 관련 파일 (변경 없음 — 그대로 사용 가능)

| 파일 | 설명 |
|---|---|
| `client/src/pages/signin/SigninPage.tsx` | 회원가입 UI 컴포넌트 |
| `server/src/auth/dto/signup.dto.ts` | 회원가입 DTO (유효성 검사) |
| `server/src/auth/auth.service.ts` | 회원가입 비즈니스 로직 |
