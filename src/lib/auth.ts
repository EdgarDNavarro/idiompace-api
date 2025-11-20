import { betterAuth, BetterAuthOptions } from "better-auth";
import { admin } from "better-auth/plugins";
import { Pool } from "pg";
import { stripe } from "@better-auth/stripe"
import Stripe from "stripe"
import SubscriptionUsage from "../models/SubscriptionUsage.Model";
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!)

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
  plugins: [
    admin(),
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
      subscription: {
          enabled: true,
          plans: [
              {
                  name: "basic", // the name of the plan, it'll be automatically lower cased when stored in the database
                  priceId: "price_1SM8kyFfj1stO4RvhBtXVcPf", // the price ID from stripe
                  limits: {
                      stories: 0, // number of stories the user can create
                  }
              },
              {
                  name: "pro",
                  priceId: "price_1SM8mfFfj1stO4Rv3sGST7Wm",
                  limits: {
                       stories: 10,
                  }
              },
              {
                  name: "advanced",
                  priceId: "price_1SMtmhFfj1stO4RvqXimr7Aj",
                  limits: {
                       stories: 30,
                  }
              }
          ],
          onSubscriptionUpdate: async ({ event, subscription }) => {
            
            try {
              if(!subscription.stripeSubscriptionId) return;
              const usage = await SubscriptionUsage.findOne({ where: { stripeSubscriptionId: subscription.stripeSubscriptionId } });

              if (!usage) return;

              // Detectar renovación mensual
              if (new Date(subscription.periodStart).getTime() !== new Date(usage.periodStart).getTime()) {

                usage.storiesUsed = 0;
                usage.periodStart = subscription.periodStart;
                usage.periodEnd = subscription.periodEnd;
              }

              // Detectar cambio de plan
              // if (usage.priceId !== subscription.priceId) {
              //   // usage.storiesUsed = 0;
              //   console.log(`Plan changed from ${usage.priceId} to ${subscription.priceId}`);
              //   usage.priceId = subscription.priceId;
              // }

              usage.status = subscription.status;
              await usage.save();

            } catch (error) {
              console.error("Error updating subscription:", error);
            }
          },
          onSubscriptionComplete: async ({ subscription, stripeSubscription }) => {
              
              try {
                const existing = await SubscriptionUsage.findOne({
                  where: { stripeSubscriptionId: stripeSubscription.id },
                });
                if (existing) return; // ya existe, no duplicar

                await SubscriptionUsage.create({
                  userId: subscription.referenceId,
                  stripeSubscriptionId: stripeSubscription.id,
                  storiesUsed: 0,
                  status: stripeSubscription.status,
                  priceId: stripeSubscription.items.data[0].price.id,
                  periodStart: subscription.periodStart,
                  periodEnd: subscription.periodEnd
                });
              } catch (error) {
                console.error("Error creating SubscriptionUsage:", error);
              }
          },
          onSubscriptionCancel: async ({ subscription }) => {
            try {
              const usage = await SubscriptionUsage.findOne({
                where: { stripeSubscriptionId: subscription.stripeSubscriptionId },
              });
              if (usage) {
                usage.status = "canceled";
                await usage.save();
              }
            } catch (error) {
              
            }
          }
      }
    })
  ],
}

if(process.env.NODE_ENV === "production") {
  betterAuthConfig.advanced = {
    useSecureCookies: true,
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
