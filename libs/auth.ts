import { RequestHandler } from "express";

export const isMerchantLoggedIn = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/merchant/login");
};

export const isLoggedIn = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
};

// Middleware to ensure admin authorization (assuming there's a middleware in your app)
export const isAdmin: RequestHandler = (req, res, next) => {
    // This is a placeholder - replace with your actual admin authorization logic
    if (req.user && (req.user as any).role === 'admin') {
      return next();
    }
    res.status(403).json({ success: false, message: 'Unauthorized access' });
};