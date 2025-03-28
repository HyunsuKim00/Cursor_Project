# Clerk 인증 시스템 사용 가이드

이 문서는 현재 프로젝트에서 Clerk을 사용한 인증 시스템의 구현 방법과 프로세스를 설명합니다.

## 1. 설치 및 초기 설정

```bash
npm install @clerk/nextjs
```

## 2. 파일 구조

프로젝트에서 Clerk과 관련된 주요 파일들:

- `middleware.ts`: 인증 미들웨어 설정
- `app/layout.tsx`: Clerk Provider 설정
- `app/sign-in/[[...sign-in]]/page.tsx`: 로그인 페이지
- `app/sign-up/[[...sign-up]]/page.tsx`: 회원가입 페이지
- `app/account/page.tsx`: 사용자 계정 페이지
- `app/api/posts/my-posts/route.ts`: 사용자 게시물 API

## 3. 미들웨어 설정 (middleware.ts)

```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

미들웨어는 모든 페이지 요청에 대해 인증 상태를 확인합니다. 설정된 matcher 패턴에 따라 적용됩니다.

## 4. 인증 상태 확인 및 접근 제어

### 4.1. 클라이언트 측 인증 확인 (app/page.tsx)

```typescript
'use client'

import { SignedIn, SignedOut, useAuth } from '@clerk/nextjs'

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth()
  
  // 로그인 확인 및 리다이렉트 로직
  
  return (
    <main>
      <SignedIn>
        {/* 로그인한 사용자에게만 보이는 콘텐츠 */}
      </SignedIn>
      
      <SignedOut>
        {/* 로그인하지 않은 사용자에게만 보이는 콘텐츠 */}
      </SignedOut>
    </main>
  )
}
```

- `useAuth()`: 현재 인증 상태 확인
- `SignedIn`/`SignedOut`: 조건부 렌더링 컴포넌트

### 4.2. 서버 측 인증 확인 (API 라우트)

```typescript
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  
  // 인증된 사용자에게만 제공하는 데이터
  
  return NextResponse.json(data)
}
```

## 5. 로그인/회원가입 페이지

### 5.1. 로그인 페이지 (app/sign-in/[[...sign-in]]/page.tsx)

```typescript
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignIn />
    </div>
  );
}
```

### 5.2. 회원가입 페이지 (app/sign-up/[[...sign-up]]/page.tsx)

```typescript
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignUp />
    </div>
  );
}
```

## 6. 사용자 계정 관리

### 6.1. 로그아웃 기능

```typescript
import { useClerk } from '@clerk/nextjs'

export default function LogoutButton() {
  const { signOut } = useClerk()
  
  const handleSignOut = async () => {
    await signOut()
    // 필요시 리다이렉트 로직 추가
  }
  
  return (
    <button onClick={handleSignOut}>로그아웃</button>
  )
}
```

### 6.2. 사용자 데이터 접근 (클라이언트)

```typescript
import { useUser } from '@clerk/nextjs'

export default function UserProfile() {
  const { user } = useUser()
  
  return (
    <div>
      <h1>안녕하세요, {user?.firstName}님!</h1>
      {/* 사용자 정보 표시 */}
    </div>
  )
}
```

### 6.3. 사용자 데이터 접근 (서버)

```typescript
import { currentUser } from '@clerk/nextjs/server'

export async function GET() {
  const user = await currentUser()
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // 사용자 데이터 처리
}
```

## 7. 사용자 인증 UI 컴포넌트

### 7.1. 로그인/회원가입 버튼

```tsx
import { SignInButton, SignUpButton } from '@clerk/nextjs'

export default function AuthButtons() {
  return (
    <div>
      <SignInButton mode="modal">
        <button>로그인</button>
      </SignInButton>
      
      <SignUpButton mode="modal">
        <button>회원가입</button>
      </SignUpButton>
    </div>
  )
}
```

### 7.2. 사용자 버튼 (프로필 메뉴)

```tsx
import { UserButton } from '@clerk/nextjs'

export default function UserNav() {
  return (
    <UserButton afterSignOutUrl="/" />
  )
}
```

## 8. 데모: 인증이 필요한 API 엔드포인트

```typescript
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { posts } from '@/data/posts'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // 사용자가 작성한 게시물만 필터링
  const myPosts = posts.filter(post => post.author === userId)

  return NextResponse.json(myPosts)
}
```

## 9. 주의사항 및 팁

1. Clerk 업데이트: 버전에 따라 import 경로와 API가 변경될 수 있습니다.
2. 캐시 문제: Next.js와 Clerk 통합 시 간혹 캐시 문제가 발생할 수 있습니다. 이 경우 `.next` 폴더를 삭제하고 다시 시작해보세요.
3. 환경 변수: 실제 프로덕션 환경에서는 Clerk의 공개 키와 비밀 키를 환경 변수로 설정해야 합니다.
4. 모바일 지원: Clerk은 모바일 인증도 지원합니다.

## 10. 문제 해결

### 10.1. "Export auth doesn't exist in target module" 에러

최신 Clerk 버전에서는 import 경로가 변경되었을 수 있습니다. 다음과 같이 시도해보세요:

```typescript
// 대신
import { auth } from '@clerk/nextjs/server'
```

### 10.2. 세션 관리 문제

세션 관리 설정은 Clerk 대시보드에서 직접 수정하는 것이 좋습니다.

## 11. 결론

Clerk은 Next.js 애플리케이션에 쉽게 통합할 수 있는 강력한 인증 시스템을 제공합니다. 이 가이드를 통해 기본적인 설정부터 고급 인증 기능까지 구현할 수 있습니다. 