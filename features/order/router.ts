import express from "express";
import { findAllOrdersForAnUser } from "./repos/orderMongo";
import { isLoggedIn } from "../../libs/middlewares";
import { storefrontRespond } from "../../libs/templates";

const router = express.Router();

// GET: display user's profile
router.get("/orders", isLoggedIn, async (req, res) => {
  const successMsg = req.flash("success")[0];
  const errorMsg = req.flash("error")[0];
  try {
    const allOrders = await findAllOrdersForAnUser(req.user);
    storefrontRespond(req, res, "user/profile", {
      orders: allOrders,
      errorMsg,
      successMsg,
      pageName: "User Profile",
    });
  } catch (err) {
    console.log(err);
    return res.redirect("/");
  }
});

export const orderRouter = router;