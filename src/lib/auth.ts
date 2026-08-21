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

        let user = await User.findOne({ email: credentials.email }).select("+password");


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
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "ADMIN";
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
