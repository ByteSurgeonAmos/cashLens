import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import {
  loginSchema,
  verifyPassword,
  checkRateLimit,
  resetRateLimit,
  getUserByEmail,
} from "./auth-utils";
import { z } from "zod";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "Enter your email",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password",
        },
      },
      async authorize(credentials) {
        try {
          const validatedCredentials = loginSchema.parse({
            email: credentials?.email,
            password: credentials?.password,
          });

          const { email, password } = validatedCredentials;

          if (!checkRateLimit(email)) {
            console.warn(`Rate limit exceeded for email: ${email}`);
            throw new Error("Too many login attempts. Please try again later.");
          }

          const user = await getUserByEmail(email);

          if (!user) {
            console.warn(`Login attempt for non-existent user: ${email}`);
            throw new Error("Invalid email or password");
          }

          if (!user.hashedPassword) {
            console.warn(
              `User ${email} attempted credentials login but has no password (likely OAuth-only user)`
            );
            throw new Error(
              "Please sign in with your social account or reset your password"
            );
          }

          const isValidPassword = await verifyPassword(
            password,
            user.hashedPassword
          );

          if (!isValidPassword) {
            console.warn(`Invalid password attempt for user: ${email}`);
            throw new Error("Invalid email or password");
          }

          resetRateLimit(email);

          console.info(`Successful login for user: ${email}`);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          if (error instanceof z.ZodError) {
            console.warn("Login validation error:", error.errors);
            throw new Error("Invalid email or password format");
          }

          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      if (account) {
        token.provider = account.provider;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }

      if (trigger === "update") {
        const updatedUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        });

        if (updatedUser) {
          token.email = updatedUser.email;
          token.name = updatedUser.name;
          token.picture = updatedUser.image;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;

        (session as any).provider = token.provider;
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      try {
        if (account?.provider === "google") {
          const googleProfile = profile as any;
          if (!googleProfile?.email || !googleProfile.email_verified) {
            console.warn(
              `Google sign-in attempt with unverified email: ${googleProfile?.email}`
            );
            return false;
          }
          return true;
        }

        if (account?.provider === "credentials") {
          return true;
        }

        console.warn(
          `Sign-in attempt with unknown provider: ${account?.provider}`
        );
        return false;
      } catch (error) {
        console.error("Sign-in callback error:", error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async signIn(message) {
      const userInfo = message.user.email || message.user.id || "unknown";
      const provider = message.account?.provider || "unknown";
      console.info(`User signed in: ${userInfo} via ${provider}`);
    },
    async signOut(message) {
      const userInfo =
        message.token?.email || message.session?.user?.email || "unknown";
      console.info(`User signed out: ${userInfo}`);
    },
    async createUser(message) {
      const userInfo = message.user.email || message.user.id;
      console.info(`New user created: ${userInfo}`);

      if (message.user.id) {
        try {
          const { createDefaultCategories } = await import("./auth-utils");
          await createDefaultCategories(message.user.id);
        } catch (error) {
          console.error(
            "Error creating default categories for new user:",
            error
          );
        }
      }
    },
    async linkAccount(message) {
      console.info(`Account linked for user: ${message.user.email}`);
    },
  },
  debug: process.env.NODE_ENV === "development",
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60,
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.callback-url"
          : "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-next-auth.csrf-token"
          : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};
