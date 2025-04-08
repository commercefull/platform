import express from "express";
import moment from "moment";
import { storefrontRespond } from "../../libs/templates";
import { ProductRepo } from "./repos/productRepo";
import { CategoryRepo } from "./repos/categoryRepo";

const router = express.Router();

// GET: display all products
router.get("/", async (req: any, res) => {
  const successMsg = req.flash("success")[0];
  const errorMsg = req.flash("error")[0];
  const perPage = 8;
  let page = parseInt(req.query.page) || 1;
  try {
    const productRepo = new ProductRepo();
    const products = await productRepo.findAll();
      
    const count = await productRepo.count();

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
    const products = await (new ProductRepo()).findBySearch(req.query.search);
    const count = await (new ProductRepo()).countBySearch(req.query.search);
    storefrontRespond(req, res, "product/plp", {
      pageName: "Search Results",
      products,
      successMsg,
      errorMsg,
      current: page,
      home: "/products/search?search=" + req.query.search + "&",
      pages: Math.ceil(count / perPage),
      search: req.query.search,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

// GET: get product by category
router.get("/category/:slug", async (req: any, res) => {
  const successMsg = req.flash("success")[0];
  const errorMsg = req.flash("error")[0];
  const perPage = 8;
  let page = parseInt(req.query.page) || 1;
  try {
    const foundCategory = await (new CategoryRepo()).findOne(req.params.slug);
    if (!foundCategory) {
      req.flash("error", "Category not found");
      return res.redirect("/");
    }

    const allProducts = await (new ProductRepo()).findByCategory(foundCategory.id);
    const count = await (new ProductRepo()).countByCategory(foundCategory.id);

    storefrontRespond(req, res, "product/plp", {
      pageName: foundCategory.title,
      currentCategory: foundCategory,
      products: allProducts,
      successMsg,
      errorMsg,
      current: page,
      home: "/products/category/" + req.params.slug + "/?",
      pages: Math.ceil(count / perPage),
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

// GET: get a product by id
router.get("/:id", async (req: any, res) => {
  const successMsg = req.flash("success")[0];
  const errorMsg = req.flash("error")[0];
  try {
    const product = await (new ProductRepo()).findById(req.params.id);
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
    res.redirect("/");
  }
});

export const productRouter = router;
