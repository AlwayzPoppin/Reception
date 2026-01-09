import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

// Custom Yahoo Provider Implementation (since standard provider is missing in this version)
const YahooProvider = {
    id: "yahoo",
    name: "Yahoo",
    type: "oauth" as const,
    authorization: {
        url: "https://api.login.yahoo.com/oauth2/request_auth",
        params: {
            scope: "openid profile email",
            response_type: "code"
        }
    },
    token: {
        url: "https://api.login.yahoo.com/oauth2/get_token",
        async request({ client, params, checks, provider }: any) {
            const response = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": `Basic ${Buffer.from(`${provider.clientId}:${provider.clientSecret}`).toString("base64")}`
                },
                body: new URLSearchParams({
                    grant_type: "authorization_code",
                    code: params.code as string,
                    redirect_uri: params.redirect_uri as string,
                }).toString()
            });
            const tokens = await response.json();
            return { tokens };
        }
    },
    userinfo: "https://api.login.yahoo.com/openid/v1/userinfo",
    clientId: process.env.YAHOO_CLIENT_ID,
    clientSecret: process.env.YAHOO_CLIENT_SECRET,
    idToken: false,
    checks: ["state"] as any,
    profile(profile: any) {
        return {
            id: profile.sub || profile.guid,
            name: profile.name || profile.nickname,
            email: profile.email,
            image: profile.picture
        }
    }
}

console.log("DEBUG: NEXTAUTH_SECRET present:", !!process.env.NEXTAUTH_SECRET);

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET || "temp-debug-secret-7ec6d",
    debug: true,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/calendar",
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
        YahooProvider,
    ],
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token
                token.idToken = account.id_token
                token.provider = account.provider // Store provider type
            }
            return token
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string
            session.provider = token.provider as string // Pass provider to session
            return session
        },
    },
}

export default NextAuth(authOptions)
