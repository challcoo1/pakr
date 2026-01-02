import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { sql } from './db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Upsert user in database
      try {
        await sql`
          INSERT INTO users (email, name, image, provider, provider_id)
          VALUES (${user.email}, ${user.name}, ${user.image}, ${account?.provider}, ${account?.providerAccountId})
          ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            image = EXCLUDED.image,
            updated_at = NOW()
        `;
      } catch (error) {
        console.error('Error saving user:', error);
      }
      return true;
    },
    async session({ session }) {
      // Add user ID to session
      if (session.user?.email) {
        try {
          const result = await sql`
            SELECT id FROM users WHERE email = ${session.user.email}
          `;
          if (result[0]) {
            session.user.id = result[0].id;
          }
        } catch (error) {
          console.error('Error fetching user ID:', error);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
});
