import express, { Response } from "express";
import nodemailer from "nodemailer";
import { userContactUsValidationRules, validateContactUs } from "./validator";
import { Product } from "../product/repos/productRepo";
import { storefrontRespond } from "../../libs/templates";

const router = express.Router();

// GET: home page
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({})
      .sort("-createdAt")
      .populate("category");
    storefrontRespond(req, res, "page/home", { pageName: "Home", products });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

//GET: display about us page
router.get("/about-us", (req, res) => {
  storefrontRespond(req, res, "page/about-us", {
    pageName: "About Us",
  });
});

//GET: display shipping policy page
router.get("/shipping-policy", (req, res) => {
  storefrontRespond(req, res, "page/shipping-policy", {
    pageName: "Shipping Policy",
  });
});

//GET: display careers page
router.get("/careers", (req, res) => {
  storefrontRespond(req, res, "page/careers", {
    pageName: "Careers",
  });
});

//GET: display contact us page and form with csrf tokens
router.get("/contact-us", (req, res) => {
  const successMsg = req.flash("success")[0];
  const errorMsg = req.flash("error");
  storefrontRespond(req, res, "page/contact-us", {
    pageName: "Contact Us",
    successMsg,
    errorMsg,
  });
});

//POST: handle contact us form logic using nodemailer
router.post(
  "/contact-us",
  [userContactUsValidationRules, validateContactUs],
  (req: any, res: Response) => {
    // instantiate the SMTP server
    const smtpTrans = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        // company's email and password
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // email options
    const mailOpts = {
      from: req.body.email,
      to: process.env.GMAIL_EMAIL,
      subject: `Enquiry from ${req.body.name}`,
      html: `
      <div>
      <h2 style="color: #478ba2; text-align:center;">Client's name: ${req.body.name}</h2>
      <h3 style="color: #478ba2;">Client's email: (${req.body.email})<h3>
      </div>
      <h3 style="color: #478ba2;">Client's message: </h3>
      <div style="font-size: 30;">
      ${req.body.message}
      </div>
      `,
    };

    // send the email
    smtpTrans.sendMail(mailOpts, (error, response) => {
      if (error) {
        req.flash(
          "error",
          "An error occured... Please check your internet connection and try again later"
        );
        return res.redirect("/page/contact-us");
      } else {
        req.flash(
          "success",
          "Email sent successfully! Thanks for your inquiry."
        );
        return res.redirect("/page/contact-us");
      }
    });
  }
);

export const pageRouter = router;
