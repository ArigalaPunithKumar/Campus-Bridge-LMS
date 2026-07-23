const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// --- 1. IMPORT ROUTES ---
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const facultyRoutes = require("./routes/facultyRoutes");
const studentRoutes = require("./routes/studentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const compilerRoutes = require("./routes/compilerRoutes"); // Import Compiler Routes
const codingQuestionRoutes = require("./routes/codingQuestionRoutes");

// --- 2. INITIALIZE APP ---
const app = express();

// --- 3. MIDDLEWARE (Must come before routes) ---
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// --- 4. STATIC FOLDERS ---
// Serve uploaded files (assignments, resources, etc.)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- 5. REGISTER API ROUTES ---
app.use("/api/auth", authRoutes);


app.use("/api/admin", adminRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/compiler", compilerRoutes); // Register Compiler Logic
app.use("/api/coding", codingQuestionRoutes);
// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// --- 6. ROOT ROUTE (Health Check) ---
app.get("/", (req, res) => {
    res.send("Campus Bridge API is Running...");
});

// --- 7. START SERVER ---
const PORT = process.env.PORT || 5000;
const { ensureLeaveTable } = require("./utils/leaveService");

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    try {
        await ensureLeaveTable();
        console.log("✅ Tables ensured (Leave, Faculty Leave, YouTube Courses)");
    } catch (err) {
        console.error("❌ Error ensuring tables:", err);
    }
});
