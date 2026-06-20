const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --- 1. MULTER CONFIGURATION (File Uploads) ---

// Ensure the 'uploads' folder exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Save files to 'server/uploads'
    },
    filename: (req, file, cb) => {
        // Create unique filename: file-1689234-98234.pdf
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- 2. ROUTES ---

// Get Dashboard Data (Courses, Assignments, Attendance)
router.get("/dashboard/:id", studentController.getStudentDashboard);

// Submit Assignment (Handles File Upload + Data)
// 'file' matches the formData.append('file', ...) key from React
router.post("/submit", upload.single("file"), studentController.submitAssignment);

// Get Schedule
router.get("/schedule/:id", studentController.getStudentSchedule);

// Leave Requests
router.post("/leaves", studentController.applyLeave);
router.get("/leaves/:id", studentController.getLeaveHistory);

// Login Streak
router.get("/streak/:id", studentController.getStreak);

// Settings
router.get("/settings/:id", studentController.getSettings);
router.put("/settings/:id", studentController.saveSettings);


module.exports = router;
