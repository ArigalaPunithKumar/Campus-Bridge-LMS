const db = require("../db");

// Helper: Wrap DB query in a Promise for async/await
const query = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

/* ==================================================================================
   INTERNAL HELPER FUNCTION
   Use this when calling from another Controller (e.g. Faculty Grading)
   ================================================================================== */
exports.createNotificationInternal = async (studentId, type, message) => {
    try {
        const sql = "INSERT INTO notifications (user_id, type, message, is_read, created_at) VALUES (?, ?, ?, FALSE, NOW())";
        await query(sql, [studentId, type || 'info', message]);
        console.log(`Notification created for User ${studentId}: ${message}`);
        return true;
    } catch (err) {
        console.error("Internal Notification Error:", err);
        return false;
    }
};

/* ==================================================================================
   ROUTE HANDLERS (API Endpoints)
   Use these for requests coming from the Frontend (React)
   ================================================================================== */

// 1. GET Notifications for a specific user
exports.getNotifications = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Fetch unread first, then recent read ones
        const sql = `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`;
        const notifications = await query(sql, [studentId]);

        res.json(notifications);
    } catch (err) {
        console.error("Error fetching notifications:", err);
        res.status(500).json({ msg: "Error fetching notifications" });
    }
};

// 2. MARK AS READ
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await query("UPDATE notifications SET is_read = TRUE WHERE id = ?", [id]);
        res.json({ msg: "Marked as read" });
    } catch (err) {
        console.error("Error updating notification:", err);
        res.status(500).json({ msg: "Error updating notification" });
    }
};

// 2b. MARK ALL AS READ
exports.markAllAsRead = async (req, res) => {
    try {
        const { studentId } = req.params;
        await query("UPDATE notifications SET is_read = TRUE WHERE user_id = ?", [studentId]);
        res.json({ msg: "All notifications marked as read" });
    } catch (err) {
        console.error("Error updating notifications:", err);
        res.status(500).json({ msg: "Error updating notifications" });
    }
};

// 3. CREATE SINGLE NOTIFICATION (API Route)
exports.createNotification = async (req, res) => {
    try {
        const { studentId, type, message } = req.body;

        // Use the internal helper to avoid code duplication
        await exports.createNotificationInternal(studentId, type, message);

        res.json({ msg: "Notification sent successfully" });
    } catch (err) {
        console.error("Failed to create notification:", err);
        res.status(500).json({ msg: "Error creating notification" });
    }
};

// 4. CREATE BATCH NOTIFICATIONS (For Assignments/Attendance)
exports.createBatchNotifications = async (req, res) => {
    try {
        const { notifications } = req.body;
        // Expects: [{ studentId: 1, type: 'alert', message: '...' }, ...]

        if (!notifications || notifications.length === 0) {
            return res.status(400).json({ msg: "No notifications to send" });
        }

        // Prepare data for MySQL Bulk Insert
        const values = notifications.map(n => [
            n.studentId,
            n.type || 'info',
            n.message,
            false,       // is_read
            new Date()   // created_at
        ]);

        const sql = "INSERT INTO notifications (user_id, type, message, is_read, created_at) VALUES ?";

        // Pass [values] as a single parameter for bulk insert
        await query(sql, [values]);

        res.json({ msg: `Successfully sent ${notifications.length} notifications` });

    } catch (err) {
        console.error("Batch Notification Error:", err);
        res.status(500).json({ msg: "Error sending batch notifications" });
    }
};

// 5. DELETE: Clear all notifications for a student
exports.clearNotifications = async (req, res) => {
    try {
        const { studentId } = req.params;
        await query("DELETE FROM notifications WHERE user_id = ?", [studentId]);
        res.json({ msg: "Notifications cleared" });
    } catch (err) {
        console.error("Error clearing notifications:", err);
        res.status(500).json({ msg: "Error clearing notifications" });
    }
};
