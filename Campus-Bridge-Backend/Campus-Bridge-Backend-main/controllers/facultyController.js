const db = require("../db");
// IMPORTANT: Import the INTERNAL helper, not the route handler
const { createNotificationInternal } = require("./notificationController");
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
   1. DASHBOARD STATS
   ========================================= */
exports.getDashboardStats = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch courses taught by this faculty
        const courses = await query("SELECT * FROM courses WHERE faculty_id = ?", [id]);

        let studentCount = 0;
        let pendingCount = 0;

        if (courses.length > 0) {
            const courseIds = courses.map(c => c.id);

            // Count distinct students across all courses
            if (courseIds.length > 0) {
                const students = await query(
                    `SELECT COUNT(DISTINCT student_id) as count FROM enrollments WHERE course_id IN (?)`,
                    [courseIds]
                );
                studentCount = students[0].count;

                // Count pending submissions (Submitted but not Graded)
                const pending = await query(`
                    SELECT COUNT(*) as count FROM submissions s 
                    JOIN assignments a ON s.assignment_id = a.id 
                    WHERE a.course_id IN (?) AND s.status = 'submitted'`,
                    [courseIds]
                );
                pendingCount = pending[0].count;
            }
        }

        res.json({
            stats: {
                courses: courses.length,
                students: studentCount,
                pending: pendingCount
            },
            courses // Return courses for dropdown menus
        });

    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ msg: "Server Error fetching dashboard data" });
    }
};

/* =========================================
   2. CREATE COURSE
   ========================================= */
exports.createCourse = async (req, res) => {
    try {
        const { facultyId, courseName, courseCode } = req.body;

        if (!courseName || !courseCode || !facultyId) {
            return res.status(400).json({ msg: "All fields are required" });
        }

        await query(
            "INSERT INTO courses (course_name, course_code, faculty_id) VALUES (?, ?, ?)",
            [courseName, courseCode, facultyId]
        );

        res.json({ msg: "Course created successfully" });
    } catch (err) {
        console.error("Create Course Error:", err);
        res.status(500).json({ msg: "Error creating course" });
    }
};

/* =========================================
   3. POST ASSIGNMENT
   ========================================= */
exports.createAssignment = async (req, res) => {
    try {
        const { courseId, title, subject, due, type } = req.body;

        // 1. Insert Assignment
        await query(
            "INSERT INTO assignments (course_id, title, subject, due_date, type) VALUES (?, ?, ?, ?, ?)",
            [courseId, title, subject, due, type]
        );

        // 2. Fetch Enrolled Students
        const students = await query("SELECT student_id FROM enrollments WHERE course_id = ?", [courseId]);

        // 3. Notify Students (Using Internal Helper to avoid crash)
        // Using for...of loop to handle async/await correctly
        for (const s of students) {
            await createNotificationInternal(
                s.student_id,
                'alert',
                `New Assignment: ${title} (${subject})`
            );
        }

        res.json({ msg: "Assignment posted and students notified" });
    } catch (err) {
        console.error("Create Assignment Error:", err);
        res.status(500).json({ msg: "Error posting assignment" });
    }
};

/* =========================================
   4. MANAGE ATTENDANCE
   ========================================= */
// Get Students for a specific course
exports.getStudentsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const students = await query(`
            SELECT u.id, u.name, 'Absent' as attendance 
            FROM users u 
            JOIN enrollments e ON u.id = e.student_id 
            WHERE e.course_id = ?`,
            [courseId]
        );
        res.json(students);
    } catch (err) {
        console.error("Fetch Students Error:", err);
        res.status(500).json({ msg: "Error fetching student list" });
    }
};

// Save Attendance Data
exports.saveAttendance = async (req, res) => {
    try {
        const { courseId, date, students } = req.body;

        // 1. Delete existing records for this date/course
        await query("DELETE FROM attendance WHERE course_id = ? AND date = ?", [courseId, date]);

        // 2. Prepare bulk insert data
        const values = students.map(s => [courseId, s.id, date, s.attendance]);

        if (values.length > 0) {
            await query("INSERT INTO attendance (course_id, student_id, date, status) VALUES ?", [values]);
        }

        // 3. Optional: Send Notification to Absentees
        const absentees = students.filter(s => s.attendance === 'Absent');
        for (const s of absentees) {
            await createNotificationInternal(s.id, 'alert', `You were marked absent for ${date}`);
        }

        res.json({ msg: "Attendance saved successfully" });
    } catch (err) {
        console.error("Save Attendance Error:", err);
        res.status(500).json({ msg: "Error saving attendance" });
    }
};

/* =========================================
   5. MANAGE TIMETABLE (SCHEDULE)
   ========================================= */
exports.getSchedule = async (req, res) => {
    try {
        const { facultyId } = req.params;
        const schedule = await query(`
            SELECT s.id, c.course_name, c.course_code, s.day_of_week, s.start_time, s.end_time, s.room_number
            FROM schedules s 
            JOIN courses c ON s.course_id = c.id
            WHERE s.faculty_id = ? 
            ORDER BY FIELD(s.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), s.start_time`,
            [facultyId]
        );
        res.json(schedule);
    } catch (err) {
        console.error("Get Schedule Error:", err);
        res.status(500).json({ msg: "Error fetching schedule" });
    }
};

exports.addScheduleItem = async (req, res) => {
    try {
        const { facultyId, courseId, day, startTime, endTime, room } = req.body;

        await query(
            "INSERT INTO schedules (faculty_id, course_id, day_of_week, start_time, end_time, room_number) VALUES (?, ?, ?, ?, ?, ?)",
            [facultyId, courseId, day, startTime, endTime, room]
        );

        res.json({ msg: "Class added to schedule" });
    } catch (err) {
        console.error("Add Schedule Error:", err);
        res.status(500).json({ msg: "Error adding class" });
    }
};

/* =========================================
   6. GRADING SYSTEM
   ========================================= */
exports.getSubmissions = async (req, res) => {
    try {
        const { facultyId } = req.params;
        // Include student_id in selection for frontend notifications if needed
        const submissions = await query(`
            SELECT s.id, s.student_id, u.name as studentName, a.title, s.file_url as file, s.score, s.status 
            FROM submissions s 
            JOIN assignments a ON s.assignment_id = a.id 
            JOIN users u ON s.student_id = u.id 
            JOIN courses c ON a.course_id = c.id
            WHERE c.faculty_id = ? AND s.status != 'pending'
            ORDER BY s.submitted_at DESC`,
            [facultyId]
        );
        res.json(submissions);
    } catch (err) {
        console.error("Get Submissions Error:", err);
        res.status(500).json({ msg: "Error fetching submissions" });
    }
};

exports.gradeSubmission = async (req, res) => {
    try {
        const { submissionId, score } = req.body;

        // 1. Update Score
        await query("UPDATE submissions SET score = ?, status = 'graded' WHERE id = ?", [score, submissionId]);

        // 2. Fetch details to notify Student
        const subData = await query("SELECT student_id, assignment_id FROM submissions WHERE id = ?", [submissionId]);

        if (subData.length > 0) {
            const { student_id, assignment_id } = subData[0];
            const assignData = await query("SELECT title FROM assignments WHERE id = ?", [assignment_id]);
            const title = assignData[0]?.title || "Assignment";

            // 3. Notify (Using Internal Helper)
            await createNotificationInternal(
                student_id,
                'success',
                `Your assignment '${title}' has been graded. Score: ${score}/100`
            );
        }

        res.json({ msg: "Submission graded successfully" });
    } catch (err) {
        console.error("Grading Error:", err);
        res.status(500).json({ msg: "Error updating grade" });
    }
};

/* =========================================
   7. ENROLL STUDENT
   ========================================= */
exports.enrollStudent = async (req, res) => {
    try {
        const { courseId, studentEmail } = req.body;

        // 1. Find Student by Email
        const student = await query("SELECT id FROM users WHERE email = ? AND role = 'student'", [studentEmail]);
        if (student.length === 0) {
            return res.status(404).json({ msg: "Student email not found" });
        }

        const studentId = student[0].id;

        // 2. Check if already enrolled
        const exists = await query("SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?", [studentId, courseId]);
        if (exists.length > 0) {
            return res.status(400).json({ msg: "Student is already enrolled in this course" });
        }

        // 3. Create Enrollment Record
        await query("INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)", [studentId, courseId]);

        // 4. Notify Student
        await createNotificationInternal(studentId, 'info', `You have been enrolled in a new course.`);

        res.json({ msg: "Student enrolled successfully!" });
    } catch (err) {
        console.error("Enrollment Error:", err);
        res.status(500).json({ msg: "Error enrolling student" });
    }
};

/* =========================================
   8. FETCH ALL STUDENTS (Helper for Frontend Broadcasts)
   ========================================= */
exports.getAllStudents = async (req, res) => {
    try {
        // Fetch all users with role 'student'
        const students = await query("SELECT id, name, email FROM users WHERE role = 'student'");
        res.json(students);
    } catch (err) {
        console.error("Fetch All Students Error:", err);
        res.status(500).json({ msg: "Error fetching students" });
    }
};

/* =========================================
   9. LEAVE REQUESTS
   ========================================= */
exports.getLeaveRequests = async (req, res) => {
    try {
        await ensureLeaveTable();
        const { facultyId } = req.params;
        const leaves = await query(`
            SELECT l.id,
                   u.name AS studentName,
                   c.course_name AS courseName,
                   DATE_FORMAT(l.from_date, '%Y-%m-%d') AS fromDate,
                   DATE_FORMAT(l.to_date, '%Y-%m-%d') AS toDate,
                   l.reason,
                   l.status
            FROM leave_requests l
            JOIN users u ON l.student_id = u.id
            JOIN courses c ON l.course_id = c.id
            WHERE c.faculty_id = ?
            ORDER BY FIELD(l.status, 'Pending', 'Approved', 'Denied'), l.id DESC
        `, [facultyId]);

        res.json(leaves);
    } catch (err) {
        console.error("Fetch Leave Requests Error:", err);
        res.status(500).json({ msg: "Error fetching leave requests" });
    }
};

exports.updateLeaveRequest = async (req, res) => {
    try {
        await ensureLeaveTable();
        const { leaveId } = req.params;
        const { status } = req.body;
        const allowedStatuses = ["Pending", "Approved", "Denied"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ msg: "Invalid leave status" });
        }

        await query("UPDATE leave_requests SET status = ? WHERE id = ?", [status, leaveId]);

        const rows = await query(`
            SELECT l.student_id, c.course_name
            FROM leave_requests l
            JOIN courses c ON l.course_id = c.id
            WHERE l.id = ?
        `, [leaveId]);

        if (rows.length > 0) {
            await createNotificationInternal(
                rows[0].student_id,
                status === "Approved" ? "success" : "alert",
                `Your leave request for ${rows[0].course_name} was ${status.toLowerCase()}.`
            );
        }

        res.json({ msg: `Leave request ${status.toLowerCase()}` });
    } catch (err) {
        console.error("Update Leave Request Error:", err);
        res.status(500).json({ msg: "Error updating leave request" });
    }
};

exports.getAttendanceHistory = async (req, res) => {
    try {
        const { facultyId } = req.params;
        const history = await query(`
            SELECT a.date, c.course_name, c.course_code, 
                   COUNT(a.id) as total_students,
                   SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_count
            FROM attendance a
            JOIN courses c ON a.course_id = c.id
            WHERE c.faculty_id = ?
            GROUP BY a.date, c.id, c.course_name, c.course_code
            ORDER BY a.date DESC
        `, [facultyId]);
        res.json(history);
    } catch (err) {
        console.error("Attendance History Error:", err);
        res.status(500).json({ msg: "Error fetching attendance history" });
    }
};

exports.applyLeave = async (req, res) => {
    try {
        await ensureLeaveTable();
        const { facultyId, fromDate, toDate, reason } = req.body;
        
        if (!facultyId || !fromDate || !toDate || !reason) {
            return res.status(400).json({ msg: "All fields are required" });
        }

        await query(
            "INSERT INTO faculty_leave_requests (faculty_id, from_date, to_date, reason) VALUES (?, ?, ?, ?)",
            [facultyId, fromDate, toDate, reason]
        );
        res.json({ msg: "Leave applied successfully" });
    } catch (err) {
        console.error("Apply Leave Error:", err);
        res.status(500).json({ msg: "Error applying for leave" });
    }
};

exports.getMyLeaves = async (req, res) => {
    try {
        const { facultyId } = req.params;
        const leaves = await query(
            "SELECT id, DATE_FORMAT(from_date, '%Y-%m-%d') as fromDate, DATE_FORMAT(to_date, '%Y-%m-%d') as toDate, reason, status FROM faculty_leave_requests WHERE faculty_id = ? ORDER BY id DESC",
            [facultyId]
        );
        res.json(leaves);
    } catch (err) {
        console.error("Get My Leaves Error:", err);
        res.status(500).json({ msg: "Error fetching my leaves" });
    }
};
