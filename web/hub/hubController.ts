import { Request, Response } from "express";
import { isMerchantLoggedIn } from "../../libs/auth";

// GET: admin dashboard
export const getAdminDashboard = [
  isMerchantLoggedIn,
  async (req: Request, res: Response) => {
    try {
      // For now, just render a basic dashboard
      // Later we can add real data from the database
      const dashboardData = {
        pageName: "Dashboard",
        user: req.user,
        stats: {
          totalOrders: 0,
          totalRevenue: 0,
          totalCustomers: 0,
          totalProducts: 0
        }
      };

      res.render("hub/views/dashboard", dashboardData);
    } catch (error) {
      console.error("Error loading admin dashboard:", error);
      res.status(500).render("hub/error", {
        pageName: "Error",
        error: "Failed to load dashboard"
      });
    }
  }
];

// GET: admin login page
export const getAdminLogin = (req: Request, res: Response) => {
  // If already logged in, redirect to dashboard
  if (req.user) {
    return res.redirect("/hub");
  }

  res.render("hub/views/login", {
    pageName: "Admin Login"
  });
};

// POST: admin login (handled by auth routes)

// GET: admin logout (handled by auth routes)

// GET: admin profile
export const getAdminProfile = [
  isMerchantLoggedIn,
  async (req: Request, res: Response) => {
    try {
      res.render("hub/views/profile", {
        pageName: "Admin Profile",
        user: req.user
      });
    } catch (error) {
      console.error("Error loading admin profile:", error);
      res.status(500).render("hub/views/error", {
        pageName: "Error",
        error: "Failed to load profile"
      });
    }
  }
];
