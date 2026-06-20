const db = require("../db");
// IMPORTANT: Import the internal notification helper
const { createNotificationInternal } = require("./notificationController");
const { getUserStreak } = require("../utils/streakService");
const { ensureLeaveTable } = require("../utils/leaveService");

// Helper for Promisified Queries
const query = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) {
                console.error("SQL Error:", err.sqlMessage || err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

/* =========================================
   1. GET STUDENT DASHBOARD DATA
   ========================================= */
exports.getStudentDashboard = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Fetch Enrolled Courses
        const courses = await query(`
            SELECT c.id, c.course_name as name, c.course_code as code, 
            '75' as progress, '#4f46e5' as color
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.student_id = ?`,
            [id]
        );

        // 2. Fetch Assignments with Status & Score
        // Left Join ensures we see assignments even if not submitted yet
        const assignments = await query(`
            SELECT 
                a.id, a.title, a.subject, a.due_date as due, a.type,
                COALESCE(s.status, 'pending') as status,
                s.score,
                s.file_url,
                s.feedback
            FROM assignments a
            JOIN enrollments e ON a.course_id = e.course_id
            LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
            WHERE e.student_id = ?
            ORDER BY a.due_date ASC`,
            [id, id]
        );

        // 3. Fetch Attendance Stats
        const attendanceData = await query(`
            SELECT c.course_name as subject, 
            COUNT(*) as total,
            SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as attended
            FROM attendance a
            JOIN courses c ON a.course_id = c.id
            WHERE a.student_id = ?
            GROUP BY c.course_name`,
            [id]
        );

        res.json({
            courses: courses || [],
            assignments: assignments || [],
            attendanceData: attendanceData || []
        });

    } catch (err) {
        console.error("Student Dashboard Error:", err);
        res.status(500).json({ msg: "Server Error fetching dashboard" });
    }
};

/* =========================================
   2. SUBMIT ASSIGNMENT
   ========================================= */
exports.submitAssignment = async (req, res) => {
    try {
        // 'req.body' contains text fields, 'req.file' contains the uploaded file
        const { assignmentId, studentId, code } = req.body;
        const file = req.file;

        if (!assignmentId || !studentId) {
            return res.status(400).json({ msg: "Missing Assignment ID or Student ID" });
        }

        // Generate File URL (Pointing to your static uploads folder)
        const fileUrl = file ? `https://campus-bridge-backend.onrender.com/uploads/${file.filename}` : null;

        // 1. Check if a submission already exists (to update instead of insert)
        const existing = await query(
            "SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?",
            [assignmentId, studentId]
        );

        if (existing.length > 0) {
            // UPDATE existing submission
            await query(
                `UPDATE submissions 
                 SET file_url = ?, code = ?, status = 'submitted', submitted_at = NOW() 
                 WHERE id = ?`,
                [fileUrl, code || "", existing[0].id]
            );
        } else {
            // INSERT new submission
            await query(
                `INSERT INTO submissions 
                 (assignment_id, student_id, file_url, code, status, submitted_at) 
                 VALUES (?, ?, ?, ?, 'submitted', NOW())`,
                [assignmentId, studentId, fileUrl || null, code || ""]
            );
        }

        // 2. Notify the Faculty Member
        // First, find out who teaches this course
        const facultyData = await query(`
            SELECT c.faculty_id, c.course_name, u.name as studentName, a.title
            FROM assignments a
            JOIN courses c ON a.course_id = c.id
            JOIN users u ON u.id = ?
            WHERE a.id = ?
        `, [studentId, assignmentId]);

        if (facultyData.length > 0) {
            const { faculty_id, studentName, title, course_name } = facultyData[0];

            if (faculty_id) {
                // Use the Internal Helper to avoid "res.status" crash
                await createNotificationInternal(
                    faculty_id,
                    'info',
                    `${studentName} submitted '${title}' for ${course_name}`
                );
            }
        }

        res.json({ msg: "Assignment Submitted Successfully" });

    } catch (err) {
        console.error("Assignment Submission Error:", err);
        res.status(500).json({ msg: "Submission failed" });
    }
};

/* =========================================
   3. GET STUDENT SCHEDULE
   ========================================= */
exports.getStudentSchedule = async (req, res) => {
    try {
        const { id } = req.params;

        const sql = `
            SELECT s.day_of_week, s.start_time, s.end_time, s.room_number, c.course_name, c.course_code, u.name as faculty_name
            FROM schedules s
            JOIN enrollments e ON s.course_id = e.course_id
            JOIN courses c ON s.course_id = c.id
            LEFT JOIN users u ON c.faculty_id = u.id
            WHERE e.student_id = ?
            ORDER BY 
            FIELD(s.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
            s.start_time
        `;

        const schedule = await query(sql, [id]);
        res.json(schedule);
    } catch (err) {
        console.error("Student Schedule Error:", err);
        res.status(500).json({ msg: "Error fetching schedule" });
    }
};
// ... existing imports and query helper ...

/* =========================================
   4. GET STUDENT SETTINGS
   ========================================= */
exports.getSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query("SELECT * FROM user_settings WHERE user_id = ?", [id]);

        if (result.length === 0) {
            // Return defaults if no settings exist yet
            return res.json({
                darkMode: false,
                compactView: false,
                emailNotifs: true,
                assignmentReminders: true,
                publicProfile: false
            });
        }

        // Convert 1/0 to true/false for React
        const s = result[0];
        res.json({
            darkMode: !!s.dark_mode,
            compactView: !!s.compact_view,
            emailNotifs: !!s.email_notifs,
            assignmentReminders: !!s.assignment_reminders,
            publicProfile: !!s.public_profile
        });

    } catch (err) {
        console.error("Get Settings Error:", err);
        res.status(500).json({ msg: "Error fetching settings" });
    }
};

/* =========================================
   5. SAVE STUDENT SETTINGS
   ========================================= */
exports.saveSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const { darkMode, compactView, emailNotifs, assignmentReminders, publicProfile } = req.body;

        // Upsert (Insert or Update) logic
        const sql = `
            INSERT INTO user_settings (user_id, dark_mode, compact_view, email_notifs, assignment_reminders, public_profile)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            dark_mode = VALUES(dark_mode),
            compact_view = VALUES(compact_view),
            email_notifs = VALUES(email_notifs),
            assignment_reminders = VALUES(assignment_reminders),
            public_profile = VALUES(public_profile)
        `;

        await query(sql, [id, darkMode, compactView, emailNotifs, assignmentReminders, publicProfile]);
        res.json({ msg: "Settings saved" });

    } catch (err) {
        console.error("Save Settings Error:", err);
        res.status(500).json({ msg: "Error saving settings" });
    }

};
/* =========================================
   6. SUBMIT LEAVE APPLICATION
   ========================================= */
exports.applyLeave = async (req, res) => {
    try {
        await ensureLeaveTable();
        const { studentId, courseId, fromDate, toDate, reason } = req.body;

        if (!studentId || !courseId || !fromDate || !toDate || !reason) {
            return res.status(400).json({ msg: "All leave fields are required" });
        }

        if (new Date(fromDate) > new Date(toDate)) {
            return res.status(400).json({ msg: "From date cannot be after to date" });
        }

        // Insert the leave request
        await query(
            `INSERT INTO leave_requests (student_id, course_id, from_date, to_date, reason, status) 
             VALUES (?, ?, ?, ?, ?, 'Pending')`,
            [studentId, courseId, fromDate, toDate, reason]
        );

        // Fetch student and course info for the notification
        const info = await query(`
            SELECT u.name as studentName, c.course_name, c.faculty_id 
            FROM users u, courses c 
            WHERE u.id = ? AND c.id = ?
        `, [studentId, courseId]);

        // Notify the faculty member
        if (info.length > 0 && info[0].faculty_id) {
            await createNotificationInternal(
                info[0].faculty_id,
                'alert',
                `New Leave Request: ${info[0].studentName} requested leave for ${info[0].course_name}.`
            );
        }

        res.json({ msg: "Leave application submitted successfully." });
    } catch (err) {
        console.error("Apply Leave Error:", err);
        res.status(500).json({ msg: "Server error applying for leave" });
    }
};

/* =========================================
   7. GET LEAVE HISTORY
   ========================================= */
exports.getLeaveHistory = async (req, res) => {
    try {
        await ensureLeaveTable();
        const { id } = req.params;

        const leaves = await query(`
            SELECT l.id, c.course_name as courseName, 
            DATE_FORMAT(l.from_date, '%Y-%m-%d') as fromDate, 
            DATE_FORMAT(l.to_date, '%Y-%m-%d') as toDate, 
            l.reason, l.status 
            FROM leave_requests l
            JOIN courses c ON l.course_id = c.id
            WHERE l.student_id = ?
            ORDER BY l.id DESC
        `, [id]);

        res.json(leaves);
    } catch (err) {
        console.error("Get Leave History Error:", err);
        res.status(500).json({ msg: "Server error fetching leave history" });
    }
};

/* =========================================
   8. GET LOGIN STREAK
   ========================================= */
exports.getStreak = async (req, res) => {
    try {
        const { id } = req.params;
        const streak = await getUserStreak(id);
        res.json(streak);
    } catch (err) {
        console.error("Get Streak Error:", err);
        res.status(500).json({ msg: "Server error fetching streak" });
    }
};
