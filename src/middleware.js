import { NextResponse } from "next/server";

export function middleware(request) {
  const currentPath = request.nextUrl.pathname;
  
  // Check for various auth tokens/sessions
  const token = request.cookies.get("token")?.value;
  const appwriteSession = request.cookies.get("a_session_console")?.value; // Appwrite session
  const authSession = request.cookies.get("authjs.session-token")?.value; // NextAuth session
  
  // Consider user logged in if any auth method is present
  const isLoggedIn = !!(token || appwriteSession || authSession);

  console.log('Middleware Debug:', {
    currentPath,
    token: !!token,
    appwriteSession: !!appwriteSession,
    authSession: !!authSession,
    isLoggedIn,
    cookies: request.cookies.getAll().map(c => c.name)
  });

  // Define protected routes and their redirect behaviors
  const protectedRoutes = {
    "/upload": "/auth/login",
    "/profile": "/auth/login",
    "/favorites": "/auth/login",
    "/settings": "/auth/login",
    "/wallpapers/edit": "/auth/login",
    "/wallpapers/delete": "/auth/login"
  };

  // Define auth routes that should redirect to home if already logged in
  const authRoutes = ["/auth/login", "/auth/signup"];
  
  // If user is logged in and trying to access auth pages, redirect to home
  if (isLoggedIn && authRoutes.some(route => currentPath.startsWith(route))) {
    console.log('Redirecting logged-in user from auth page to home');
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Check if the current path needs protection
  for (const [protectedPath, redirectPath] of Object.entries(protectedRoutes)) {
    if (currentPath.startsWith(protectedPath) && !isLoggedIn) {
      console.log(`Protecting ${protectedPath}, redirecting to ${redirectPath}`);
      // Store the attempted URL to redirect back after login
      const redirectUrl = new URL(redirectPath, request.url);
      redirectUrl.searchParams.set("callbackUrl", currentPath);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Special case for logout route - must be logged in
  if (currentPath === "/logout" && !isLoggedIn) {
    console.log('Redirecting logout attempt without session to home');
    return NextResponse.redirect(new URL("/", request.url));
  }

  console.log('Allowing access to:', currentPath);
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/upload/:path*",
    "/profile/:path*",
    "/favorites/:path*",
    "/settings/:path*",
    "/wallpapers/edit/:path*",
    "/wallpapers/delete/:path*",
    "/auth/:path*",
    "/logout"
  ],
};