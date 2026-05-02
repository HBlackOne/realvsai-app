import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/reset(.*)",
  "/verify(.*)",
  "/api/webhooks(.*)",
  "/api/billing/webhook(.*)",
  "/api/validate-billing(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname, search, origin } = req.nextUrl;

  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  if (pathname === "/welcome") {
    const onboardingComplete = req.cookies.get("realvsai_onboarding_complete")?.value === "1";
    const hasSeenWelcome = req.cookies.get("hasSeenWelcome")?.value === "1";

    if (onboardingComplete || hasSeenWelcome) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return;
  }

  // New users: redirect to /welcome
  if (
    !isPublicRoute(req) &&
    req.cookies.get("realvsai_onboarding_complete")?.value !== "1" &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/billing") &&
    pathname !== "/welcome"
  ) {
    return NextResponse.redirect(new URL("/welcome", origin));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
