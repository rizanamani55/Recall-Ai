// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const isClerkConfiguredServer = !!process.env.CLERK_SECRET_KEY;

export default async function middleware(req: NextRequest) {
  if (isClerkConfiguredServer) {
    try {
      // Lazy load Clerk middleware if configured
      const { clerkMiddleware, createRouteMatcher } = require("@clerk/nextjs/server");
      const isPublicRoute = createRouteMatcher([
        "/",
        "/pricing",
        "/sign-in(.*)",
        "/sign-up(.*)",
        "/api/stripe/webhook(.*)",
        "/api/clerk/webhook(.*)",
        "/api/convert(.*)",
        "/api/decks(.*)",
        "/api/usage(.*)",
        "/api/stripe/checkout(.*)",
      ]);
      
      return clerkMiddleware((auth: any, request: any) => {
        if (!isPublicRoute(request)) {
          auth().protect();
        }
      })(req);
    } catch (err) {
      console.warn("Clerk middleware loading failed, passing request along", err);
    }
  }

  // Developer mock local session passes through automatically
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
