import { clerkMiddleware } from "@clerk/nextjs/server";

// Next.js에서 모든 페이지와 API 라우트에 Clerk 인증 기능을 적용
export default clerkMiddleware();

// 인증 기능이 적용될 경로를 지정
// 정적 파일, 루트 페이지, API 라우트 등에 적용 
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};