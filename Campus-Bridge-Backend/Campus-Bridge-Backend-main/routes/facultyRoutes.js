const express = require("express");
const router = express.Router();
const facultyController = require("../controllers/facultyController");

// Dashboard Data
router.get("/dashboard/:id", facultyController.getDashboardStats);

// 1. Create Course (THIS WAS MISSING)
router.post("/create-course", facultyController.createCourse);

// 2. Assignments
router.post("/assignments", facultyController.createAssignment);
router.get("/submissions/:facultyId", facultyController.getSubmissions); // Fixes 500 error on fetch
router.post("/grade", facultyController.gradeSubmission);

// 3. Attendance
router.get("/students/:courseId", facultyController.getStudentsByCourse);
router.post("/attendance", facultyController.saveAttendance);

// 4. Schedule
router.get("/schedule/:facultyId", facultyController.getSchedule);
router.post("/schedule", facultyController.addScheduleItem);

// 5. Leave Requests
router.get("/leaves/:facultyId", facultyController.getLeaveRequests);
router.put("/leaves/:leaveId", facultyController.updateLeaveRequest);

router.post("/enroll", facultyController.enrollStudent);

module.exports = router;
