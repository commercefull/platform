import express from "express";
import { Product } from "./repos/productRepo";
import { Category } from "./repos/category";
import moment from "moment";
import { storefrontRespond } from "../../libs/templates";

const router = express.Router();

// GET: display all products
router.get("/", async (req: any, res) => {
  const successMsg = req.flash("success")[0];
  const errorMsg = req.flash("error")[0];
  const perPage = 8;
  let page = parseInt(req.query.page) || 1;
  try {
    const products = await Product.find({})
      .sort("-createdAt")
      .skip(perPage * page - perPage)
      .limit(perPage)
      .populate("category");

    const count = await Product.countDocuments();

    storefrontRespond(req, res, "product/plp", {
      pageName: "All Products",
      products,
      successMsg,
      errorMsg,
      current: page,
      home: "/products/?",
      pages: Math.ceil(count / perPage),
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

// GET: search box
router.get("/search", async (req: any, res) => {
  const perPage = 8;
  let page = parseInt(req.query.page) || 1;
  const successMsg = req.flash("success")[0];
  const errorMsg = req.flash("error")[0];

  try {
    const products = await Product.find({
      title: { $regex: req.query.search, $options: "i" },
    })
      .sort("-createdAt")
      .skip(perPage * page - perPage)
      .limit(perPage)
      .populate("category")
      .exec();
    const count = await Product.countDocuments({
      title: { $regex: req.query.search, $options: "i" },
    });
    storefrontRespond(req, res, "product/plp", {
      pageName: "Search Results",
      products,
      successMsg,
      errorMsg,
      current: page,
      home: "/products/search?search=" + req.query.search + "&",
      pages: Math.ceil(count / perPage),
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

//GET: get a certain category by its slug (this is used for the categories navbar)
router.get("/:slug", async (req: any, res) => {
  const successMsg = req.flash("success")[0];
  const errorMsg = req.flash("error")[0];
  const perPage = 8;
  let page = parseInt(req.query.page) || 1;
  try {
    const foundCategory = await Category.findOne({ slug: req.params.slug });

    if (!foundCategory) {
      req.flash("error", "Product not found");
      return res.redirect("/");
    }

    const allProducts = await Product.find({ category: foundCategory.id })
      .sort("-createdAt")
      .skip(perPage * page - perPage)
      .limit(perPage)
      .populate("category");

    const count = await Product.countDocuments({ category: foundCategory.id });

    storefrontRespond(req, res, "product/plp", {
      pageName: foundCategory.title,
      currentCategory: foundCategory,
      products: allProducts,
      successMsg,
      errorMsg,
      current: page,
      home: "/products/" + req.params.slug.toString() + "/?",
      pages: Math.ceil(count / perPage),
    });
  } catch (error) {
    console.log(error);
    return res.redirect("/");
  }
});

// GET: display a certain product by its id
router.get("/:slug/:id", async (req, res) => {
  const successMsg = req.flash("success")[0];
  const errorMsg = req.flash("error")[0];
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) {
      req.flash("error", "Product not found");
      return res.redirect("/");
    }
    storefrontRespond(req, res, "product/pdp", {
      pageName: product.title,
      product,
      successMsg,
      errorMsg,
      moment: moment,
    });
  } catch (error) {
    console.log(error);
    return res.redirect("/");
  }
});

export const productRouter = router;
