import { NextFunction, Request, Response } from "express";
import { check, validationResult } from "express-validator";


export const userContactUsValidationRules = () => {
  return [
    check("name", "Please enter a name").not().isEmpty(),
    check("email", "Please enter a valid email address")
      .not()
      .isEmpty()
      .isEmail(),
    check("message", "Please enter a message with at least 10 words")
      .not()
      .isEmpty()
      .isLength({ min: 10 }),
  ];
};

export const userContactFormValidationRules = () => {
  return [
    check("name", "Please enter a valid name (minimum 2 characters)")
      .not()
      .isEmpty()
      .isLength({ min: 2 }),
    check("email", "Please enter a valid email address")
      .not()
      .isEmpty()
      .isEmail(),
    check("subject", "Please select a subject")
      .not()
      .isEmpty(),
    check("message", "Please enter a message (minimum 10 characters)")
      .not()
      .isEmpty()
      .isLength({ min: 10 }),
    check("phone", "Please enter a valid phone number")
      .optional()
      .isMobilePhone("any"),
  ];
};

export const validateContactUs = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let messages: string[] = [];
    errors.array().forEach((error: any) => {
      messages.push(error.msg);
    });
    
    req.flash("error", messages);
    return res.redirect("/pages/contact-us");
  }
  next();
};

export const validateContactForm = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let messages: string[] = [];
    errors.array().forEach((error: any) => {
      messages.push(error.msg);
    });
    
    req.flash("error", messages);
    return res.redirect("/contact-form");
  }
  next();
};
