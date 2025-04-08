import express from "express";
import { isLoggedIn } from "../../libs/middlewares";
import { 
  getUnreadNotifications,
  getRecentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount
} from "./controllers/notificationController";

const router = express.Router();

// Get unread notifications for current user
router.get("/notifications/unread", isLoggedIn, getUnreadNotifications);

// Get recent notifications for current user
router.get("/notifications/recent", isLoggedIn, getRecentNotifications);

// Get unread notification count for current user
router.get("/notifications/count", isLoggedIn, getUnreadCount);

// Mark a notification as read
router.put("/notifications/:id/read", isLoggedIn, markNotificationAsRead);

// Mark all notifications as read
router.put("/notifications/read-all", isLoggedIn, markAllNotificationsAsRead);

// Delete a notification
router.delete("/notifications/:id", isLoggedIn, deleteNotification);

export const notificationRouter = router;
