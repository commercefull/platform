import express, { Request, Response } from "express";
import passport from "passport";
import { findUserBasket, saveUserBasket } from "../basket/repos/basketMongo";
import { isLoggedIn, isNotLoggedIn } from "../../libs/middlewares";
import {
  userSignUpValidationRules,
  userSignInValidationRules,
  validateSignup,
  validateSignin,
} from "./validator";
import { storefrontRespond } from "../../libs/templates";

const router = express.Router();

// GET: display the signup form with csrf token
router.get("/signup", isNotLoggedIn, (req, res) => {
  var errorMsg = req.flash("error")[0];
  storefrontRespond(req, res, "user/signup", {
    errorMsg,
    pageName: "Sign Up",
  });
});
// POST: handle the signup logic
router.post(
  "/signup",
  [
    isNotLoggedIn,
    userSignUpValidationRules(),
    validateSignup,
    passport.authenticate("local.signup", {
      successRedirect: "/user/profile",
      failureRedirect: "/user/signup",
      failureFlash: true,
    }),
  ],
  async (req: any, res: Response) => {
    try {
      //if there is cart session, save it to the user's cart in db
      if (req.session.cart) {
        await saveUserBasket(req.session.cart, req.user._id);
      }
      // redirect to the previous URL
      if (req.session.oldUrl) {
        var oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.redirect(oldUrl);
      } else {
        res.redirect("/user/profile");
      }
    } catch (err) {
      console.log(err);
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      req.flash("error", err.message);
      return res.redirect("/");
    }
  }
);

// GET: display the signin form with csrf token
router.get("/signin", isNotLoggedIn, async (req, res) => {
  var errorMsg = req.flash("error")[0];
  storefrontRespond(req, res, "user/signin", {
    errorMsg,
    pageName: "Sign In",
  });
});

// POST: handle the signin logic
router.post(
  "/signin",
  [
    isNotLoggedIn,
    userSignInValidationRules(),
    validateSignin,
    passport.authenticate("local.signin", {
      failureRedirect: "/user/signin",
      failureFlash: true,
    }),
  ],
  async (req: any, res: Response) => {
    try {
      // cart logic when the user logs in
      let basket = await findUserBasket(req.user._id)
      // if there is a cart session and user has no cart, save it to the user's cart in db
      if (req.session.cart && !basket) {
        await saveUserBasket(req.session.cart, req.user._id);
      }
      // if user has a cart in db, load it to session
      if (basket) {
        req.session.cart = basket;
      }
      // redirect to old URL before signing in
      if (req.session.oldUrl) {
        var oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.redirect(oldUrl);
      } else {
        res.redirect("/user/profile");
      }
    } catch (err:any) {
      console.log(err);
      req.flash("error", err.message);
      return res.redirect("/");
    }
  }
);

router.get("/logout", isLoggedIn, (req: any, res) => {
  req.logout();
  req.session.cart = null;
  res.redirect("/");
});

export const accountRouter = router;
