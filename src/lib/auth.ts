/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "./db";
import User from "@/models/User";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email }).select("+password");


        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        if (user.isVerified === false) {
          throw new Error("Please verify your email before logging in.");
        }

        const isMatch = await bcrypt.compare(credentials.password as string, user.password);

        if (!isMatch) {
          // Check if it matches plain text directly (for manually inserted users)
          if (credentials.password === user.password) {
            // Hash it for the future
            user.password = await bcrypt.hash(credentials.password as string, 10);
            await user.save();
          } else {
            throw new Error("Invalid credentials");
          }
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image || null,
          role: user.role,
          timezone: user.timezone || "UTC",
          themeColor: (user as any).themeColor || null,
          currency: (user as any).currency || "INR",
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.timezone = (user as any).timezone || "UTC";
        token.themeColor = (user as any).themeColor || null;
        token.currency = (user as any).currency || "INR";
        if (user.image) token.picture = user.image;
      }
      if (trigger === "update") {
        if (session?.themeColor !== undefined) {
          token.themeColor = session.themeColor;
        }
        if (session?.timezone !== undefined) {
          token.timezone = session.timezone;
        }
        if (session?.currency !== undefined) {
          token.currency = session.currency;
        }
        if (session?.name !== undefined) {
          token.name = session.name;
        }
        if (session?.image !== undefined) {
          token.picture = session.image;
        }
        
        try {
          const dbConnect = (await import("./db")).default;
          const User = (await import("@/models/User")).default;
          await dbConnect();
          const dbUser = await User.findById(token.id).select("timezone themeColor currency name image");
          if (dbUser) {
            token.timezone = dbUser.timezone || "UTC";
            token.themeColor = dbUser.themeColor || null;
            token.currency = dbUser.currency || "INR";
            token.name = dbUser.name;
            if (dbUser.image) token.picture = dbUser.image;
          }
        } catch (e) {
          console.error("Failed to sync database on update", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "ADMIN";
        session.user.image = (token.picture as string) || null;
        (session.user as any).timezone = token.timezone as string;
        (session.user as any).themeColor = token.themeColor as string | null;
        (session.user as any).currency = token.currency as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
});
