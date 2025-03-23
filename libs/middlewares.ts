import { Response, NextFunction } from 'express';
import { Roles } from './roles';

export const isNotLoggedIn = (req: any, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
};

export const isLoggedIn = (req: any, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/user/signin");
};


export const grantAccess = function (roles: Roles[]) {
  return async (req: any, res: any, next: any) => {
    if (req.session.passport.user.role && roles.includes(req.session.passport.user.role)) {
      return next();
    }

    res.render("403");
  }
}