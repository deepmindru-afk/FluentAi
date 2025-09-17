import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Add your own authentication logic here
        if (!credentials) return null;
        
        // Mock user for demonstration
        const mockUser = {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          password: 'password' // In a real app, this would be a hashed password
        };

        if (credentials.email === mockUser.email && credentials.password === mockUser.password) {
          return {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email
          };
        }
        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt',
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
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
