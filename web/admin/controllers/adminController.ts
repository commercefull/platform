import { Request, Response } from "express";
import { isMerchantLoggedIn } from "../../../libs/auth";
import MerchantRepo from "../../../modules/merchant/repos/merchantRepo";
import { query, queryOne } from "../../../libs/db";

// ============================================================================
// Dashboard Stats Queries
// ============================================================================

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockProducts: number;
  todayOrders: number;
  todayRevenue: number;
}

interface RecentOrder {
  orderId: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
}

interface TopProduct {
  productId: string;
  name: string;
  totalSold: number;
  revenue: number;
}

async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Total orders
  const ordersResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "order" WHERE "deletedAt" IS NULL`
  );

  // Total revenue
  const revenueResult = await queryOne<{ total: string }>(
    `SELECT COALESCE(SUM("totalAmount"), 0) as total FROM "order" WHERE "deletedAt" IS NULL AND "paymentStatus" = 'paid'`
  );

  // Total customers
  const customersResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "customer" WHERE "deletedAt" IS NULL`
  );

  // Total products
  const productsResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "product" WHERE "deletedAt" IS NULL`
  );

  // Pending orders
  const pendingResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "order" WHERE "deletedAt" IS NULL AND "status" IN ('pending', 'processing')`
  );

  // Low stock products
  const lowStockResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "inventoryLevel" WHERE ("quantity" - "reserved") <= "reorderPoint"`
  );

  // Today's orders
  const todayOrdersResult = await queryOne<{ count: string; total: string }>(
    `SELECT COUNT(*) as count, COALESCE(SUM("totalAmount"), 0) as total 
     FROM "order" WHERE "deletedAt" IS NULL AND "createdAt" >= $1`,
    [today]
  );

  return {
    totalOrders: parseInt(ordersResult?.count || '0'),
    totalRevenue: parseFloat(revenueResult?.total || '0'),
    totalCustomers: parseInt(customersResult?.count || '0'),
    totalProducts: parseInt(productsResult?.count || '0'),
    pendingOrders: parseInt(pendingResult?.count || '0'),
    lowStockProducts: parseInt(lowStockResult?.count || '0'),
    todayOrders: parseInt(todayOrdersResult?.count || '0'),
    todayRevenue: parseFloat(todayOrdersResult?.total || '0')
  };
}

async function getRecentOrders(limit: number = 5): Promise<RecentOrder[]> {
  const orders = await query<RecentOrder[]>(
    `SELECT 
      o."orderId",
      o."orderNumber",
      COALESCE(c."firstName" || ' ' || c."lastName", 'Guest') as "customerName",
      o."totalAmount",
      o."status",
      o."createdAt"
     FROM "order" o
     LEFT JOIN "customer" c ON o."customerId" = c."customerId"
     WHERE o."deletedAt" IS NULL
     ORDER BY o."createdAt" DESC
     LIMIT $1`,
    [limit]
  );
  return orders || [];
}

async function getTopProducts(limit: number = 5): Promise<TopProduct[]> {
  const products = await query<TopProduct[]>(
    `SELECT 
      p."productId",
      p."name",
      COALESCE(SUM(oi."quantity"), 0)::int as "totalSold",
      COALESCE(SUM(oi."totalPrice"), 0) as "revenue"
     FROM "product" p
     LEFT JOIN "orderItem" oi ON p."productId" = oi."productId"
     WHERE p."deletedAt" IS NULL
     GROUP BY p."productId", p."name"
     ORDER BY "totalSold" DESC
     LIMIT $1`,
    [limit]
  );
  return products || [];
}

async function getRevenueByDay(days: number = 7): Promise<Array<{ date: string; revenue: number; orders: number }>> {
  const result = await query<Array<{ date: string; revenue: string; orders: string }>>(
    `SELECT 
      DATE("createdAt") as date,
      COALESCE(SUM("totalAmount"), 0) as revenue,
      COUNT(*) as orders
     FROM "order"
     WHERE "deletedAt" IS NULL 
       AND "createdAt" >= NOW() - INTERVAL '${days} days'
     GROUP BY DATE("createdAt")
     ORDER BY date ASC`
  );
  return (result || []).map(r => ({
    date: r.date,
    revenue: parseFloat(r.revenue || '0'),
    orders: parseInt(r.orders || '0')
  }));
}

// GET: admin dashboard
export const getAdminDashboard = [
  isMerchantLoggedIn,
  async (req: Request, res: Response) => {
    try {
      // Fetch real dashboard data
      const [stats, recentOrders, topProducts, revenueByDay] = await Promise.all([
        getDashboardStats(),
        getRecentOrders(5),
        getTopProducts(5),
        getRevenueByDay(7)
      ]);

      const dashboardData = {
        pageName: "Dashboard",
        user: req.user,
        stats,
        recentOrders,
        topProducts,
        revenueByDay
      };

      res.render("hub/views/dashboard", dashboardData);
    } catch (error) {
      console.error("Error loading admin dashboard:", error);
      res.status(500).render("hub/views/error", {
        pageName: "Error",
        error: "Failed to load dashboard",
        user: req.user
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

// POST: admin login form submission
export const postAdminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.render("hub/views/login", {
        pageName: "Admin Login",
        error: "Email and password are required"
      });
    }

    // Authenticate against database
    const merchant = await MerchantRepo.authenticateMerchant({ email, password });

    if (!merchant) {
      return res.render("hub/views/login", {
        pageName: "Admin Login",
        error: "Invalid email or password"
      });
    }

    // Check merchant status
    if (merchant.status !== 'active') {
      return res.render("hub/views/login", {
        pageName: "Admin Login",
        error: "Account is not active. Please contact support."
      });
    }

    // Set session/user data
    (req as any).user = {
      id: merchant.merchantId,
      email: merchant.email,
      name: merchant.name,
      role: 'merchant'
    };

    // Update last login
    await MerchantRepo.updateLastLogin(merchant.merchantId);

    // Redirect to dashboard
    return res.redirect("/hub");

  } catch (error) {
    console.error("Error processing admin login:", error);
    res.status(500).render("hub/views/login", {
      pageName: "Admin Login",
      error: "An error occurred during login"
    });
  }
};

// POST: admin logout
export const postAdminLogout = async (req: Request, res: Response) => {
  try {
    // Clear user session/data
    (req as any).user = null;
    (req as any).session = null;

    // Redirect to login page
    res.redirect("/hub/login");
  } catch (error) {
    console.error("Error processing admin logout:", error);
    // Even if there's an error, redirect to login
    res.redirect("/hub/login");
  }
};

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
