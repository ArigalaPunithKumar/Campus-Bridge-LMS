// controllers/adminController.js
const db = require("../db");
const bcrypt = require("bcryptjs");

const query = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

const safeQuery = async (sql, params = []) => {
    try {
        return await query(sql, params);
    } catch (err) {
        console.warn("Optional admin cleanup skipped:", err.message);
        return [];
    }
};

const columnExists = async (tableName, columnName) => {
    const rows = await query(`
        SELECT COUNT(*) AS count
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
    `, [tableName, columnName]);

    return rows[0]?.count > 0;
};

const getSubmissionScoreColumn = async () => {
    if (await columnExists("submissions", "score")) return "score";
    if (await columnExists("submissions", "grade")) return "grade";
    return null;
};

const ensureSystemSettings = async () => {
    await query(`
        CREATE TABLE IF NOT EXISTS system_settings (
            setting_key VARCHAR(100) PRIMARY KEY,
            setting_value VARCHAR(20) NOT NULL
        )
    `);

    await query(`
        INSERT IGNORE INTO system_settings (setting_key, setting_value)
        VALUES
            ('maintenance_mode', 'false'),
            ('allow_registrations', 'true'),
            ('system_notifications', 'true')
    `);
};

const deleteCourseCascade = async (courseId) => {
    await safeQuery(`
        DELETE s FROM submissions s
        JOIN assignments a ON s.assignment_id = a.id
        WHERE a.course_id = ?
    `, [courseId]);
    await safeQuery("DELETE FROM assignments WHERE course_id = ?", [courseId]);
    await safeQuery("DELETE FROM attendance WHERE course_id = ?", [courseId]);
    await safeQuery("DELETE FROM enrollments WHERE course_id = ?", [courseId]);
    await safeQuery("DELETE FROM schedules WHERE course_id = ?", [courseId]);
    await query("DELETE FROM courses WHERE id = ?", [courseId]);
};

exports.getStats = async (req, res) => {
    try {
        const total = await query("SELECT COUNT(*) as count FROM users");
        const students = await query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
        const faculty = await query("SELECT COUNT(*) as count FROM users WHERE role = 'faculty'");

        let active = { count: 0 };
        try {
            const result = await query("SELECT COUNT(*) as count FROM users WHERE status = 'active'");
            active = result[0];
        } catch (e) {
            console.warn("Status column might be missing, ignoring active count.");
        }

        res.json({
            total: total[0].count,
            students: students[0].count,
            faculty: faculty[0].count,
            active: active.count
        });
    } catch (err) {
        console.error("Admin Stats Error:", err);
        res.status(500).json({ msg: "Server Error fetching stats", exact_error: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const sql = "SELECT id, name, email, role, status FROM users ORDER BY id ASC";
        const users = await query(sql);
        res.json(users);
    } catch (err) {
        console.error("Fetch Users Error:", err);
        res.status(500).json({ msg: "SQL Error: " + err.message, exact_error: err.message });
    }
};

exports.getUserProgress = async (req, res) => {
    try {
        const { id } = req.params;

        const totalAssignmentsRes = await query(`
            SELECT COUNT(a.id) as total 
            FROM assignments a 
            JOIN enrollments e ON a.course_id = e.course_id 
            WHERE e.student_id = ?`, [id]);

        const completedAssignmentsRes = await query(`
            SELECT COUNT(id) as completed 
            FROM submissions 
            WHERE student_id = ?`, [id]);

        const attendanceRes = await query(`
            SELECT (COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as percentage 
            FROM attendance 
            WHERE student_id = ?`, [id]);

        const scoreColumn = await getSubmissionScoreColumn();
        const gradeRes = scoreColumn
            ? await query(`SELECT AVG(${scoreColumn}) as avgGrade FROM submissions WHERE student_id = ?`, [id])
            : [{ avgGrade: null }];

        const userRes = await query(`SELECT last_login FROM users WHERE id = ?`, [id]);

        res.json({
            assignmentsCompleted: completedAssignmentsRes[0].completed || 0,
            assignmentsTotal: totalAssignmentsRes[0].total || 0,
            attendance: attendanceRes[0].percentage ? parseFloat(attendanceRes[0].percentage).toFixed(1) + "%" : "0%",
            overallGrade: gradeRes[0].avgGrade ? parseFloat(gradeRes[0].avgGrade).toFixed(2) : "N/A",
            lastLogin: userRes[0].last_login || "Never"
        });
    } catch (err) {
        console.error("Fetch User Progress Error:", err);
        res.status(500).json({ msg: "Error fetching user progress", exact_error: err.message });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await query("UPDATE users SET status = ? WHERE id = ?", [status, id]);
        res.json({ msg: `User marked as ${status}` });
    } catch (err) {
        console.error("Update Status Error:", err);
        res.status(500).json({ msg: "Error updating status", exact_error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const users = await query("SELECT id, role FROM users WHERE id = ?", [id]);
        if (users.length === 0) return res.status(404).json({ msg: "User not found" });

        const user = users[0];

        if (user.role === "faculty") {
            const courses = await query("SELECT id FROM courses WHERE faculty_id = ?", [id]);
            for (const course of courses) {
                await deleteCourseCascade(course.id);
            }
        }

        await safeQuery("DELETE FROM password_reset_verifications WHERE email = (SELECT email FROM users WHERE id = ?)", [id]);
        await safeQuery("DELETE FROM notifications WHERE user_id = ?", [id]);
        await safeQuery("DELETE FROM leave_requests WHERE student_id = ?", [id]);
        await safeQuery("DELETE FROM attendance WHERE student_id = ?", [id]);
        await safeQuery("DELETE FROM enrollments WHERE student_id = ?", [id]);
        await safeQuery("DELETE FROM submissions WHERE student_id = ?", [id]);
        await query("DELETE FROM users WHERE id = ?", [id]);
        res.json({ msg: "User deleted permanently" });
    } catch (err) {
        console.error("Delete User Error:", err);
        res.status(500).json({ msg: "Error deleting user", exact_error: err.message });
    }
};

exports.adminResetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("Campus123", salt);

        await query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, id]);
        res.json({ msg: "Password reset to 'Campus123'" });
    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ msg: "Error resetting password", exact_error: err.message });
    }
};

exports.getSystemSettings = async (req, res) => {
    try {
        await ensureSystemSettings();
        const settings = await query("SELECT * FROM system_settings");
        const formatted = {};
        settings.forEach(s => formatted[s.setting_key] = s.setting_value === 'true');
        res.json(formatted);
    } catch (err) {
        console.error("Get Settings Error:", err);
        res.status(500).json({ msg: "Error fetching settings", exact_error: err.message });
    }
};

exports.toggleSetting = async (req, res) => {
    try {
        const { key } = req.body;
        await ensureSystemSettings();
        const current = await query("SELECT setting_value FROM system_settings WHERE setting_key = ?", [key]);
        if (current.length === 0) return res.status(404).json({ msg: "Setting not found" });

        const newValue = current[0].setting_value === 'true' ? 'false' : 'true';
        await query("UPDATE system_settings SET setting_value = ? WHERE setting_key = ?", [newValue, key]);

        res.json({ msg: "Setting updated", newValue: newValue === 'true' });
    } catch (err) {
        console.error("Toggle Setting Error:", err);
        res.status(500).json({ msg: "Error updating setting", exact_error: err.message });
    }
};

exports.getPlatformAnalytics = async (req, res) => {
    try {
        const dauRes = await query(`
            SELECT (COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM users), 0)) as dauRate 
            FROM users 
            WHERE last_login >= NOW() - INTERVAL 1 DAY`);

        const subRateRes = await query(`
            SELECT (COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM enrollments e JOIN assignments a ON e.course_id = a.course_id), 0)) as subRate 
            FROM submissions`);

        const scoreColumn = await getSubmissionScoreColumn();
        const avgScoreRes = scoreColumn
            ? await query(`SELECT AVG(${scoreColumn}) as avgScore FROM submissions`)
            : [{ avgScore: null }];

        res.json({
            dailyActiveUsers: dauRes[0].dauRate ? parseFloat(dauRes[0].dauRate).toFixed(1) + "%" : "0%",
            assignmentSubmissionRate: subRateRes[0].subRate ? parseFloat(subRateRes[0].subRate).toFixed(1) + "%" : "0%",
            averageQuizScore: avgScoreRes[0].avgScore ? parseFloat(avgScoreRes[0].avgScore).toFixed(1) + "%" : "0%"
        });
    } catch (err) {
        console.error("Analytics Error:", err);
        res.status(500).json({ msg: "Error fetching analytics", exact_error: err.message });
    }
};

exports.getCourses = async (req, res) => {
    try {
        const sql = `
            SELECT 
                c.id, 
                c.course_name AS name, 
                c.course_code AS code,
                c.faculty_id AS facultyId,
                u.name AS instructor, 
                COUNT(DISTINCT e.student_id) AS enrolled, 
                COUNT(DISTINCT a.id) AS activeAssignments 
            FROM courses c
            LEFT JOIN users u ON c.faculty_id = u.id
            LEFT JOIN enrollments e ON c.id = e.course_id
            LEFT JOIN assignments a ON c.id = a.course_id
            GROUP BY c.id, c.course_name, c.course_code, c.faculty_id, u.name
        `;
        const courses = await query(sql);
        res.json(courses);
    } catch (err) {
        console.error("Courses Error:", err);
        res.status(500).json({ msg: "Error fetching courses", exact_error: err.message });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const { courseName, courseCode, facultyId } = req.body;

        if (!courseName || !courseCode || !facultyId) {
            return res.status(400).json({ msg: "Course name, code, and faculty are required" });
        }

        const faculty = await query("SELECT id FROM users WHERE id = ? AND role = 'faculty'", [facultyId]);
        if (faculty.length === 0) return res.status(404).json({ msg: "Faculty member not found" });

        const result = await query(
            "INSERT INTO courses (course_name, course_code, faculty_id) VALUES (?, ?, ?)",
            [courseName.trim(), courseCode.trim(), facultyId]
        );

        res.status(201).json({ msg: "Course created successfully", courseId: result.insertId });
    } catch (err) {
        console.error("Admin Create Course Error:", err);
        res.status(500).json({ msg: "Error creating course", exact_error: err.message });
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { courseName, courseCode, facultyId } = req.body;

        if (!courseName || !courseCode || !facultyId) {
            return res.status(400).json({ msg: "Course name, code, and faculty are required" });
        }

        const faculty = await query("SELECT id FROM users WHERE id = ? AND role = 'faculty'", [facultyId]);
        if (faculty.length === 0) return res.status(404).json({ msg: "Faculty member not found" });

        const result = await query(
            "UPDATE courses SET course_name = ?, course_code = ?, faculty_id = ? WHERE id = ?",
            [courseName.trim(), courseCode.trim(), facultyId, id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ msg: "Course not found" });

        res.json({ msg: "Course updated successfully" });
    } catch (err) {
        console.error("Admin Update Course Error:", err);
        res.status(500).json({ msg: "Error updating course", exact_error: err.message });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await query("SELECT id FROM courses WHERE id = ?", [id]);
        if (existing.length === 0) return res.status(404).json({ msg: "Course not found" });

        await deleteCourseCascade(id);

        res.json({ msg: "Course deleted successfully" });
    } catch (err) {
        console.error("Admin Delete Course Error:", err);
        res.status(500).json({ msg: "Error deleting course", exact_error: err.message });
    }
};
