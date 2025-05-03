import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // TODO: add authentication logic (pl. adatbázisból való ellenőrzés)
                const user = { id: '1', name: 'Demo User' };
                return user;
            },
        }),
    ],
    session: { strategy: "jwt" },
};

export default NextAuth(authOptions); 