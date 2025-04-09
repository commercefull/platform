import express from "express";
import stripePackage from "stripe";
import { isLoggedIn } from "../../libs/middlewares";
import basketPublicController from "./basketPublicController";

if (!process.env.STRIPE_PRIVATE_KEY) {
  throw new Error("Stripe private key is not defined");
}
const stripe = new stripePackage(process.env.STRIPE_PRIVATE_KEY);
const router = express.Router();

// GET: add a product to the shopping cart when "Add to cart" button is pressed
router.get("/add-to-cart/:id", (req, res) => {
  basketPublicController.addToCart(req, res);
});

// GET: view shopping cart contents
router.get("/shopping-cart", (req, res) => {
  basketPublicController.viewCart(req, res);
});

// GET: reduce one from an item in the shopping cart
router.get("/reduce/:id", (req, res, next) => {
  basketPublicController.reduceItem(req, res);
});

// GET: remove all instances of a single product from the cart
router.get("/removeAll/:id", (req, res, next) => {
  basketPublicController.removeAllItems(req, res);
});

// GET: checkout form with csrf token
router.get("/checkout", isLoggedIn, (req, res) => {
  basketPublicController.viewCheckout(req, res);
});

export const basketRouter = router;
