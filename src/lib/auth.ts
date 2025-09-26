import { betterAuth, BetterAuthOptions } from "better-auth";
import { admin } from "better-auth/plugins";
import { Pool } from "pg";

const betterAuthConfig: BetterAuthOptions = {
  database: new Pool({
    connectionString: process.env.DATABASE_URL!,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  trustedOrigins: [
    process.env.FRONTEND_URL!,
    process.env.FRONTEND_URL_ADMIN!,
  ],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  // Aquí agregas la configuración “advanced”
  plugins: [admin()],
}

if(process.env.NODE_ENV === "production") {
  betterAuthConfig.advanced = {
    useSecureCookies: true,  // fuerza cookies seguras siempre
    crossSubDomainCookies: {
      enabled: true,
      domain: "dnavarro.dev",  
    },
    defaultCookieAttributes: {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    },
    cookies: {
      session_token: {
        name: "better-auth.session_token",  
        attributes: {
          httpOnly: true,
          secure: true,
        },
      },
    },
  };
}
export const auth = betterAuth(betterAuthConfig);
