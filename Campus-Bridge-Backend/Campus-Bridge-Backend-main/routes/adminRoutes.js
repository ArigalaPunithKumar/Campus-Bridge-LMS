const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

router.get("/stats", adminController.getStats);
router.get("/users", adminController.getAllUsers);
router.get("/user/:id/progress", adminController.getUserProgress);
router.put("/user-status/:id", adminController.updateUserStatus);
router.delete("/user/:id", adminController.deleteUser);
router.put("/reset-password/:id", adminController.adminResetPassword);
router.get("/settings", adminController.getSystemSettings);
router.post("/settings/toggle", adminController.toggleSetting);
router.get("/analytics", adminController.getPlatformAnalytics);
router.get("/courses", adminController.getCourses);
router.post("/courses", adminController.createCourse);
router.put("/course/:id", adminController.updateCourse);
router.delete("/course/:id", adminController.deleteCourse);

// Faculty Leaves
router.get("/faculty-leaves", adminController.getFacultyLeaves);
router.put("/faculty-leaves/:leaveId", adminController.updateFacultyLeave);

// YouTube Courses
router.get("/youtube-courses", adminController.getYoutubeCourses);
router.post("/youtube-courses", adminController.addYoutubeCourse);
router.delete("/youtube-courses/:id", adminController.deleteYoutubeCourse);

module.exports = router;
