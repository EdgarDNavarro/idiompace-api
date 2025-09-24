import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { Pool } from "pg";

export const auth = betterAuth({
    database: new Pool({
        connectionString: process.env.DATABASE_URL!,
        
    }),
    emailAndPassword: {
        enabled: true,
    	autoSignIn: false
    },
    trustedOrigins: [
        process.env.FRONTEND_URL!,
        process.env.FRONTEND_URL_ADMIN!
    ],
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.BETTER_AUTH_URL!,
    plugins: [
        admin() 
    ]
})