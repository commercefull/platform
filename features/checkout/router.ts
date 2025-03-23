import express from "express";
import stripePackage from "stripe";
import { findBasketById, findBasketByIdAndDelete } from "../basket/repos/basketMongo";
import { createOrder } from "../order/repos/orderMongo";
import { isLoggedIn } from "../../libs/middlewares";

if (!process.env.STRIPE_PRIVATE_KEY) {
  throw new Error("Stripe private key is not defined");
}
const stripe = new stripePackage(process.env.STRIPE_PRIVATE_KEY);
const router = express.Router();

// POST: handle checkout logic and payment using Stripe
router.post("/checkout", isLoggedIn, async (req: any, res) => {
  if (!req.session.cart) {
    return res.redirect("/shopping-cart");
  }

  try {
    const cart = await findBasketById(req.session.cart._id);

    const charge = await stripe.charges.create({
      amount: cart.totalCost * 100,
      currency: "usd",
      source: req.body.stripeToken,
      description: "Test charge",
    });

    await createOrder({
      user: req.user,
      cart: {
        totalQty: cart.totalQty,
        totalCost: cart.totalCost,
        items: cart.items,
      },
      address: req.body.address,
      paymentId: charge.id,
    });

    await findBasketByIdAndDelete(req.session.cart._id);
    
    req.flash("success", "Successfully purchased");
    req.session.cart = null;
    res.redirect("/user/profile");
  } catch (err:any) {
    req.flash("error", err.message);
    console.log(err);
    res.redirect("/checkout");
  }
});

export const checkoutRouter = router;
