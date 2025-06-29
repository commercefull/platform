import express from "express";
import stripePackage from "stripe";
import basketPublicController from "./basketCustomerController";
import { isCustomerLoggedIn } from "../../libs/auth";

const router = express.Router();

// GET: view shopping cart contents
router.get("/basket", (req, res) => {
  basketPublicController.viewCart(req, res);
});

// POST: add a product to the shopping cart when "Add to cart" button is pressed
router.post("/basket", (req, res) => {
  basketPublicController.addToCart(req, res);
});

// POST: reduce one from an item in the shopping cart
router.post("/reduce/:id", (req, res) => {
  basketPublicController.reduceItem(req, res);
});

// POST: increase one from an item in the shopping cart
router.post("/increase/:id", (req, res) => {
  basketPublicController.increaseItem(req, res);
});

// POST: remove all instances of a single product from the cart
router.post("/removeAll/:id", (req, res) => {
  basketPublicController.removeAllItems(req, res);
});

// POST: checkout form with csrf token
router.post("/checkout", isCustomerLoggedIn, (req, res) => {
  basketPublicController.viewCheckout(req, res);
});

export const basketCustomerRouter = router;
