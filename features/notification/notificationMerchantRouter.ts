import express from "express";
import { isMerchantLoggedIn } from "../../libs/auth";
import { 
  getUnreadNotifications,
  getRecentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount
} from "./controllers/notificationMerchantController";

const router = express.Router();

router.use(isMerchantLoggedIn);
// Get unread notifications for current user
router.get("/notifications/unread", getUnreadNotifications);

// Get recent notifications for current user
router.get("/notifications/recent", getRecentNotifications);

// Get unread notification count for current user
router.get("/notifications/count", getUnreadCount);

// Mark a notification as read
router.put("/notifications/:id/read", markNotificationAsRead);

// Mark all notifications as read
router.put("/notifications/read-all", markAllNotificationsAsRead);

// Delete a notification
router.delete("/notifications/:id", deleteNotification);

export const notificationMerchantRouter = router;
