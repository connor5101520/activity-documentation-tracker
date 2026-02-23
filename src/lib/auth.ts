import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { getDb, ensureMigrated } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await ensureMigrated();
        const db = getDb();
        const result = await db.execute({
          sql: "SELECT * FROM users WHERE email = ?",
          args: [credentials.email],
        });

        const user = result.rows[0] as unknown as
          | { id: string; email: string; name: string; password_hash: string }
          | undefined;

        if (!user) {
          return null;
        }

        const isValid = await compare(
          credentials.password,
          user.password_hash as string
        );
        if (!isValid) {
          return null;
        }

        return {
          id: user.id as string,
          email: user.email as string,
          name: user.name as string,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
