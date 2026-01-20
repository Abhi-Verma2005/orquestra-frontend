import { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: "/",
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isChat = nextUrl.pathname.startsWith("/chat");
      const isAuthPage = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
      const isRoot = nextUrl.pathname === "/";

      console.log(`[AUTH] Path: ${nextUrl.pathname}, LoggedIn: ${isLoggedIn}`);

      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      if (isChat) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }

      // Allow access to landing page (root) and other public pages by default
      return true;
    },
  },
} satisfies NextAuthConfig;
