import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';;
import { storefrontRespond } from '../../respond';
import ProductRepo from '../../../modules/product/infrastructure/repositories/ProductRepository';
import { ListProductsCommand, ListProductsUseCase } from '../../../modules/product/application/useCases/ListProducts';

// GET: home page
export const getHomePage = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    // Get featured/latest products
    const productCommand = new ListProductsCommand({ isFeatured: true }, 9, 0);
    const productUseCase = new ListProductsUseCase(ProductRepo);
    const productResult = await productUseCase.execute(productCommand);

    storefrontRespond(req, res, 'page/home', {
      pageName: 'Home',
      products: productResult.products,
      // Categories are not yet available via product module. Pass empty for now.
      categories: [],
      user: req.user,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load home page',
      user: req.user,
    });
  }
};

// GET: display about us page
export const getAboutUsPage = (req: TypedRequest, res: Response): void => {
  storefrontRespond(req, res, 'page/about-us', {
    pageName: 'About Us',
    user: req.user,
  });
};

// GET: display shipping policy page
export const getShippingPolicyPage = (req: TypedRequest, res: Response): void => {
  storefrontRespond(req, res, 'page/shipping-policy', {
    pageName: 'Shipping Policy',
    user: req.user,
  });
};

// GET: display careers page
export const getCareersPage = (req: TypedRequest, res: Response): void => {
  storefrontRespond(req, res, 'page/careers', {
    pageName: 'Careers',
    user: req.user,
  });
};

// GET: display contact us page and form with csrf tokens
export const getContactUsPage = (req: TypedRequest, res: Response): void => {
  const successMsg = req.flash('success')[0];
  const errorMsg = req.flash('error');
  storefrontRespond(req, res, 'page/contact-us', {
    pageName: 'Contact Us',
    successMsg,
    errorMsg,
    user: req.user,
  });
};

// POST: handle contact us form logic using nodemailer
export const submitContactForm = (req: TypedRequest, res: Response): void => {
  // This would typically send an email, but for now we'll just redirect with success
  req.flash('success', "Thank you for your message! We'll get back to you soon.");
  res.redirect('/pages/contact-us');
};

// GET: display contact form page
export const getContactFormPage = (req: TypedRequest, res: Response): void => {
  const successMsg = req.flash('success')[0];
  const errorMsg = req.flash('error');
  storefrontRespond(req, res, 'page/contact-form', {
    pageName: 'Contact Form',
    successMsg,
    errorMsg,
    user: req.user,
  });
};

// GET: display FAQ page
export const getFaqPage = (req: TypedRequest, res: Response): void => {
  const successMsg = req.flash('success')[0];
  const errorMsg = req.flash('error');
  storefrontRespond(req, res, 'page/faq', {
    pageName: 'FAQ',
    successMsg,
    errorMsg,
    user: req.user,
  });
};

// GET: display returns page
export const getReturnsPage = (req: TypedRequest, res: Response): void => {
  const successMsg = req.flash('success')[0];
  const errorMsg = req.flash('error');
  storefrontRespond(req, res, 'page/returns', {
    pageName: 'Returns & Exchanges',
    successMsg,
    errorMsg,
    user: req.user,
  });
};

// GET: display support page
export const getSupportPage = (req: TypedRequest, res: Response): void => {
  const successMsg = req.flash('success')[0];
  const errorMsg = req.flash('error');
  storefrontRespond(req, res, 'page/support', {
    pageName: 'Support Center',
    successMsg,
    errorMsg,
    user: req.user,
  });
};

// POST: handle contact form submission
export const submitContactFormAdvanced = (req: TypedRequest, res: Response): void => {
  // Validation is handled by middleware, so we can proceed with processing
  const { name, email, phone, subject, message } = req.body;

  // TODO: Add email sending logic here using nodemailer
  // For now, we'll just log the form data and show success
  console.log('Advanced contact form submission:', {
    name: name.trim(),
    email: email.trim(),
    phone: phone?.trim() || null,
    subject,
    message: message.trim(),
    submittedAt: new Date(),
  });

  req.flash('success', "Thank you for your message! We've received your inquiry and will get back to you within 24 hours.");
  res.redirect('/contact-form');
};
