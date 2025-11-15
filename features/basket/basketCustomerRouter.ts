import express from "express";
import { isCustomerLoggedIn } from "../../libs/auth";
import { addToCart, increaseItem, reduceItem, removeItem, viewCart, checkout } from "./basketCustomerController";

const router = express.Router();

// GET: view shopping cart contents
router.get("/basket", viewCart);

// POST: add a product to the shopping cart when "Add to cart" button is pressed
router.post("/basket", addToCart);

// POST: reduce one from an item in the shopping cart
router.post("/reduce/:id", reduceItem);

// POST: increase one from an item in the shopping cart
router.post("/increase/:id", increaseItem);

// POST: remove all instances of a single product from the cart
router.post("/removeAll/:id", removeItem);

// POST: checkout form with csrf token
router.post("/checkout", isCustomerLoggedIn, checkout);

export const basketCustomerRouter = router;
