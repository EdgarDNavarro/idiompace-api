import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { Pool } from "pg";

export const auth = betterAuth({
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
  advanced: {
    useSecureCookies: true,  // fuerza cookies seguras siempre
    crossSubDomainCookies: {
      enabled: true,
      domain: "dnavarro.dev",  // o ".dnavarro.dev", lo que englobe tu dominio
      // additionalCookies: [ ... ] si defines cookies personalizadas
    },
    defaultCookieAttributes: {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    },
    cookies: {
      session_token: {
        name: "better-auth.session_token",  // o tu prefijo
        attributes: {
          httpOnly: true,
          secure: true,
        },
      },
    },
  },
  plugins: [admin()],
});
