import passport from "passport";
const LocalStrategy = require("passport-local").Strategy;
import { MerchantAuthRepo } from "./merchant-auth-repo";
import { validStringToHash } from "../../libs/hash";

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser(async (user: any, done) => {
  return done(null, user);
});

passport.use(
  "merchant.login",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: false,
    },
    async (email: any, password: any, done: any) => {
      try {
        const merchant = await (new MerchantAuthRepo).findByEmail(email);

        if (!merchant) {
          return done(null, false, { message: "Merchant doesn't exist" });
        }

        if (merchant.status === 0) {
          return done(null, false, { message: "Merchant email not verified yet" });
        }

        if (!validStringToHash(password, merchant.password)) {
          return done(null, false, { message: "Wrong password" });
        }

        await (new MerchantAuthRepo()).updateLastLogin(merchant.merchantId);

        return done(null, {
          merchantId: merchant.merchantId,
        });

      } catch (error) {
        return done(error);
      }
    }
  )
);

export const Passport = passport;