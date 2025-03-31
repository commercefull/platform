import express from "express";
import stripePackage from "stripe";
import { Product } from "../product/repos/productRepo";
import { Basket, findBasketByIdAndDelete, findUserBasket } from "./repos/basketMongo";
import { isLoggedIn } from "../../libs/middlewares";
import { storefrontRespond } from "../../libs/templates";
import { Schema } from "mongoose";

if (!process.env.STRIPE_PRIVATE_KEY) {
  throw new Error("Stripe private key is not defined");
}
const stripe = new stripePackage(process.env.STRIPE_PRIVATE_KEY);
const router = express.Router();

// GET: add a product to the shopping cart when "Add to cart" button is pressed
router.get("/add-to-cart/:id", async (req: any, res) => {
  const productId = req.params.id;
  try {
    // get the correct cart, either from the db, session, or an empty cart.
    let user_cart;
    if (req.user) {
      user_cart = await findUserBasket(req.user._id);
    }
    let cart;
    if (
      (req.user && !user_cart && req.session.cart) ||
      (!req.user && req.session.cart)
    ) {
      cart = new Basket(req.session.cart);//@TODO: create a basket domain model
    } else if (!req.user || !user_cart) {
      cart = new Basket({});
    } else {
      cart = user_cart;
    }

    // add the product to the cart
    const product = await Product.findById<any>(productId);

    const itemIndex: number = cart.items.findIndex((p: { productId: any }) => p.productId.toString() == productId);

    if (itemIndex > -1) {
      // if product exists in the cart, update the quantity
      cart.items[itemIndex].qty++;

      cart.items[itemIndex].price = cart.items[itemIndex].qty * product.price;
      cart.totalQty++;
      cart.totalCost += product.price;
    } else {
      // if product does not exists in cart, find it in the db to retrieve its price and add new item
      cart.items.push({
        productId: productId,
        qty: 1,
        price: product.price,
        title: product.title,
        productCode: product.productCode,
      });
      cart.totalQty++;
      cart.totalCost += product.price;
    }

    // if the user is logged in, store the user's id and save cart to the db
    if (req.user) {
      cart.user = req.user._id;
      await cart.save();
    }
    req.session.cart = cart;
    req.flash("success", "Item added to the shopping cart");
    res.redirect(req.headers.referer);
  } catch (err) {
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    console.log(err.message);
    res.redirect("/");
  }
});

// GET: view shopping cart contents
router.get("/shopping-cart", async (req: any, res) => {
  try {
    // find the cart, whether in session or in db based on the user state
    let user_cart;
    if (req.user) {
      user_cart = await findUserBasket(req.user._id);
    }
    // if user is signed in and has cart, load user's cart from the db
    if (req.user && user_cart) {
      req.session.cart = user_cart;
      return storefrontRespond(req, res, "basket/basket", {
        cart: user_cart,
        pageName: "Shopping Cart",
        products: await productsFromCart(user_cart),
      });
    }
    // if there is no cart in session and user is not logged in, cart is empty
    if (!req.session.cart) {
      return storefrontRespond(req, res, "basket/basket", {
        cart: null,
        pageName: "Shopping Cart",
        products: null,
      });
    }
    // otherwise, load the session's cart
    return storefrontRespond(req, res, "basket/basket", {
      cart: req.session.cart,
      pageName: "Shopping Cart",
      products: await productsFromCart(req.session.cart),
    });
  } catch (err) {
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    console.log(err.message);
    res.redirect("/");
  }
});

// GET: reduce one from an item in the shopping cart
router.get("/reduce/:id", async function (req: any, res, next) {
  // if a user is logged in, reduce from the user's cart and save
  // else reduce from the session's cart
  const productId = req.params.id;
  let cart;
  try {
    if (req.user) {
      cart = await findUserBasket(req.user._id);
    } else if (req.session.cart) {
      cart = new Basket(req.session.cart);
    }

    // find the item with productId
    if (!cart) {
      throw new Error("Cart not found");
    }
    let itemIndex = cart.items.findIndex((p: { productId: any; }) => p.productId == productId);
    if (itemIndex > -1) {
      // find the product to find its price
      const product = await Product.findById<any>(productId);
      // if product is found, reduce its qty
      cart.items[itemIndex].qty--;
      cart.items[itemIndex].price -= product.price;
      cart.totalQty--;
      cart.totalCost -= product.price;
      // if the item's qty reaches 0, remove it from the cart
      if (cart.items[itemIndex].qty <= 0) {
        cart.items.splice(itemIndex, 1);
      }
      req.session.cart = cart;
      //save the cart it only if user is logged in
      if (req.user) {
        await cart.save();
      }
      //delete cart if qty is 0
      if (cart.totalQty <= 0) {
        req.session.cart = null;
        await findBasketByIdAndDelete(cart._id as Schema.Types.ObjectId)
      }
    }
    res.redirect(req.headers.referer);
  } catch (err) {
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    console.log(err.message);
    res.redirect("/");
  }
});

// GET: remove all instances of a single product from the cart
router.get("/removeAll/:id", async function (req: any, res, next) {
  const productId = req.params.id;
  let cart;
  try {
    if (req.user) {
      cart = await findUserBasket(req.user._id);
    } else if (req.session.cart) {
      cart = new Basket(req.session.cart);
    }
    //fnd the item with productId
    if (!cart) {
      throw new Error("Cart not found");
    }
    let itemIndex: number = cart.items.findIndex((p: { productId: Schema.Types.ObjectId }) => p.productId.toString() == productId);
    if (itemIndex > -1) {
      //find the product to find its price
      cart.totalQty -= cart.items[itemIndex].qty;
      cart.totalCost -= cart.items[itemIndex].price;
      cart.items.splice(itemIndex, 1);
    }
    req.session.cart = cart;
    //save the cart it only if user is logged in
    if (req.user) {
      await cart.save();
    }
    //delete cart if qty is 0
    if (cart.totalQty <= 0) {
      req.session.cart = null;
      await findBasketByIdAndDelete(cart._id as Schema.Types.ObjectId)
    }
    res.redirect(req.headers.referer);
  } catch (err) {
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    console.log(err.message);
    res.redirect("/");
  }
});

// GET: checkout form with csrf token
router.get("/checkout", isLoggedIn, async (req: any, res) => {
  const errorMsg = req.flash("error")[0];

  if (!req.session.cart) {
    return res.redirect("/shopping-cart");
  }
  //load the cart with the session's cart's id from the db
  // @ts-expect-error TS(2552): Cannot find name 'cart'. Did you mean 'Cart'?
  cart = await Cart.findById(req.session.cart._id);

  const errMsg = req.flash("error")[0];
  storefrontRespond(req, res, "shop/checkout", {
    // @ts-expect-error TS(2552): Cannot find name 'cart'. Did you mean 'Cart'?
    total: cart.totalCost,
    csrfToken: req.csrfToken(),
    errorMsg,
    pageName: "Checkout",
  });
});

// create products array to store the info of each product in the cart
async function productsFromCart(cart: { items: any; }) {
  let products: { [key: string]: any }[] = []; // array of objects
  for (const item of cart.items) {
    let foundProduct = (await Product.findById<any>(item.productId).populate("category")).toObject();
    foundProduct["qty"] = item.qty;
    foundProduct["totalPrice"] = item.price;
    products.push(foundProduct);
  }
  return products;
}

export const basketRouter = router;
