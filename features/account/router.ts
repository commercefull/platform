import express, { Request, Response } from "express";
import passport from "passport";
import basketRepo from "../basket/basketRepo";
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
        // Get or create a basket for the user
        let userBasket = await basketRepo.findUserBasket(req.user._id);
        
        if (!userBasket) {
          // Create a new basket for the user if one doesn't exist
          userBasket = await basketRepo.createBasket(req.user._id);
        }
        
        // Add each item from the session cart to the user's basket
        if (req.session.cart.items && Array.isArray(req.session.cart.items)) {
          for (const item of req.session.cart.items) {
            await basketRepo.addItemToBasket(userBasket.id, {
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
              name: item.name,
              sku: item.sku,
              imageUrl: item.imageUrl,
              attributes: item.attributes
            });
          }
        }
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
      let basket = await basketRepo.findUserBasket(req.user._id)
      // if there is a cart session and user has no cart, save it to the user's cart in db
      if (req.session.cart && !basket) {
        // Create a new basket for the user
        basket = await basketRepo.createBasket(req.user._id);
        
        // Add each item from the session cart to the user's basket
        if (req.session.cart.items && Array.isArray(req.session.cart.items)) {
          for (const item of req.session.cart.items) {
            await basketRepo.addItemToBasket(basket.id, {
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
              name: item.name,
              sku: item.sku,
              imageUrl: item.imageUrl,
              attributes: item.attributes
            });
          }
        }
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
