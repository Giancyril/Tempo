import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';

export const MOCK_USER_ID = 'demo-user-123';
export const MOCK_USER_EMAIL = 'demo@example.com';

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id'
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                scope: 'openid email profile https://www.googleapis.com/auth/calendar.events',
                access_type: 'offline',
                prompt: 'consent',
              },
            },
          }),
        ]
      : []),
    // Credentials provider for Demo / Local Guest Mode without needing OAuth setup
    CredentialsProvider({
      id: 'demo-credentials',
      name: 'Demo Account',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'demo@example.com' },
      },
      async authorize() {
        // Find or create demo user
        let user = await prisma.user.findUnique({
          where: { email: MOCK_USER_EMAIL },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              id: MOCK_USER_ID,
              email: MOCK_USER_EMAIL,
              name: 'Demo User',
              image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
              preferences: {
                create: {
                  workStart: '09:00',
                  workEnd: '18:00',
                  daysOff: 'Saturday,Sunday',
                  bufferMinutes: 15,
                  maxFocusBlockMin: 120,
                },
              },
            },
          });
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          await prisma.user.upsert({
            where: { email: user.email! },
            update: {
              name: user.name,
              image: user.image,
              googleAccessToken: account.access_token,
              googleRefreshToken: account.refresh_token || undefined,
            },
            create: {
              email: user.email!,
              name: user.name,
              image: user.image,
              googleAccessToken: account.access_token,
              googleRefreshToken: account.refresh_token,
              preferences: {
                create: {
                  workStart: '09:00',
                  workEnd: '18:00',
                  daysOff: 'Saturday,Sunday',
                  bufferMinutes: 15,
                  maxFocusBlockMin: 120,
                },
              },
            },
          });
        } catch (error) {
          console.error('Error saving Google tokens to DB:', error);
        }
      }
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
        });
        if (dbUser) {
          (session.user as any).id = dbUser.id;
          (session.user as any).hasGoogleCalendar = Boolean(dbUser.googleAccessToken || dbUser.googleRefreshToken);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'ai-calendar-planner-super-secret-key-2026',
};
