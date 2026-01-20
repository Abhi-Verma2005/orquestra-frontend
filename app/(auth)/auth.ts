import { compare } from "bcrypt-ts";
import NextAuth, { User, Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { getUser } from "@/db/queries";

import { authConfig } from "./auth.config";

interface ExtendedSession extends Session {
  user: User;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        try {
          // Use hardcoded localhost:8000 for server-side calls if env is not set
          const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
          const response = await fetch(`${backendUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();
          // The backend returns { token, user: { id, email } }
          // We return the user object to NextAuth
          return {
            id: data.user.id,
            email: data.user.email,
            token: data.token, // Store the JWT token to pass it to the session later if needed
          } as any;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.accessToken = user.token; // From the authorize return object
      }

      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession & { accessToken?: string };
      token: any;
    }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
});
