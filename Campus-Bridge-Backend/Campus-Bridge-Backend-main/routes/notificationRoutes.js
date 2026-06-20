const express = require("express");
const router = express.Router();
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    createBatchNotifications,
    clearNotifications // <--- Import this
} = require("../controllers/notificationController");

router.get("/:studentId", getNotifications);
router.put("/read/:id", markAsRead);
router.put("/read-all/:studentId", markAllAsRead);
router.post("/create", createNotification);
router.post("/batch", createBatchNotifications);

// NEW ROUTE: Clear all
router.delete("/clear/:studentId", clearNotifications);

module.exports = router;
