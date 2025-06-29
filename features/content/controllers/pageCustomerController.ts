import { Request, Response } from "express";
import nodemailer from "nodemailer";
import { ProductRepo } from "../../product/repos/productRepo";
import { CategoryRepo } from "../../product/repos/categoryRepo";
import { storefrontRespond } from "../../../libs/templates";

const productRepo = new ProductRepo();
const categoryRepo = new CategoryRepo();

// GET: home page
export const getHomePage = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await productRepo.findAll();
    const categories = await categoryRepo.findAll();
    storefrontRespond(req, res, "page/home", { pageName: "Home", products, categories });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};

// GET: display about us page
export const getAboutUsPage = (req: Request, res: Response): void => {
  storefrontRespond(req, res, "page/about-us", {
    pageName: "About Us",
  });
};

// GET: display shipping policy page
export const getShippingPolicyPage = (req: Request, res: Response): void => {
  storefrontRespond(req, res, "page/shipping-policy", {
    pageName: "Shipping Policy",
  });
};

// GET: display careers page
export const getCareersPage = (req: Request, res: Response): void => {
  storefrontRespond(req, res, "page/careers", {
    pageName: "Careers",
  });
};

// GET: display contact us page and form with csrf tokens
export const getContactUsPage = (req: Request, res: Response): void => {
  const successMsg = req.flash("success")[0];
  const errorMsg = req.flash("error");
  storefrontRespond(req, res, "page/contact-us", {
    pageName: "Contact Us",
    successMsg,
    errorMsg,
  });
};

// POST: handle contact us form logic using nodemailer
export const submitContactForm = (req: Request, res: Response): void => {
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
};
