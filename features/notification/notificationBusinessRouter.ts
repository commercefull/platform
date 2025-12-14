import express from "express";
import { isMerchantLoggedIn } from "../../libs/auth";
import { 
  getAllNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  markNotificationAsSent,
  getUnreadNotifications,
  getRecentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount
} from "./controllers/notificationBusinessController";

const router = express.Router();

router.use(isMerchantLoggedIn);

// ============================================================================
// Admin CRUD routes for notifications
// ============================================================================
router.get("/notifications", getAllNotifications);
router.post("/notifications", createNotification);
router.get("/notifications/:id", getNotificationById);
router.put("/notifications/:id", updateNotification);
router.delete("/notifications/:id", deleteNotification);
router.post("/notifications/:id/send", markNotificationAsSent);

// ============================================================================
// User-specific routes (for logged-in merchant viewing their own notifications)
// ============================================================================
router.get("/notifications/unread", getUnreadNotifications);
router.get("/notifications/recent", getRecentNotifications);
router.get("/notifications/count", getUnreadCount);
router.put("/notifications/:id/read", markNotificationAsRead);
router.put("/notifications/read-all", markAllNotificationsAsRead);

export const notificationMerchantRouter = router;
