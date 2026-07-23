import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
    FaBan,
    FaBookOpen,
    FaChartBar,
    FaChalkboardTeacher,
    FaCheckCircle,
    FaCogs,
    FaDownload,
    FaEdit,
    FaEye,
    FaKey,
    FaLock,
    FaPlus,
    FaSearch,
    FaShieldAlt,
    FaSignOutAlt,
    FaSync,
    FaTimes,
    FaToggleOff,
    FaToggleOn,
    FaTrashAlt,
    FaUserGraduate,
    FaUserShield,
    FaUsers,
    FaVideo,
    FaEnvelopeOpenText
} from "react-icons/fa";
import "./AdminDashboard.css";

const API_BASE = "https://campus-bridge-lms.onrender.com/api/admin";

const emptyCourseForm = {
    courseName: "",
    courseCode: "",
    facultyId: ""
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [admin, setAdmin] = useState({ name: "Admin" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("users");
    const [searchTerm, setSearchTerm] = useState("");
    const [notice, setNotice] = useState(null);

    const [stats, setStats] = useState({ total: 0, students: 0, faculty: 0, active: 0 });
    const [users, setUsers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [analytics, setAnalytics] = useState({
        dailyActiveUsers: "0%",
        assignmentSubmissionRate: "0%",
        averageQuizScore: "0%"
    });
    const [config, setConfig] = useState({
        maintenance_mode: false,
        allow_registrations: true,
        system_notifications: true
    });

    const [facultyLeaves, setFacultyLeaves] = useState([]);
    const [youtubeCourses, setYoutubeCourses] = useState([]);
    const [youtubeForm, setYoutubeForm] = useState({ title: "", video_id: "", description: "" });
    const [passwordData, setPasswordData] = useState({ current: "", newPassword: "", confirm: "" });
    const [passwordMsg, setPasswordMsg] = useState("");

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirm) return setPasswordMsg("Passwords do not match");
        try {
            const res = await axios.post("https://campus-bridge-lms.onrender.com/api/auth/change-password", {
                userId: admin.id,
                currentPassword: passwordData.current,
                newPassword: passwordData.newPassword
            });
            setPasswordMsg(res.data.msg);
            setPasswordData({ current: "", newPassword: "", confirm: "" });
            setTimeout(() => setPasswordMsg(""), 3000);
        } catch (err) {
            setPasswordMsg(err.response?.data?.msg || "Failed to update password");
        }
    };

    const [viewUser, setViewUser] = useState(null);
    const [userProgress, setUserProgress] = useState(null);
    const [loadingProgress, setLoadingProgress] = useState(false);

    const [courseForm, setCourseForm] = useState(emptyCourseForm);
    const [editingCourseId, setEditingCourseId] = useState(null);

    const facultyOptions = useMemo(
        () => users.filter(user => user.role === "faculty"),
        [users]
    );

    const pendingCount = useMemo(
        () => users.filter(user => user.status === "pending").length,
        [users]
    );

    const inactiveCount = useMemo(
        () => users.filter(user => user.status === "inactive").length,
        [users]
    );

    const showNotice = (type, text) => {
        setNotice({ type, text });
        window.clearTimeout(showNotice.timer);
        showNotice.timer = window.setTimeout(() => setNotice(null), 3200);
    };

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsRes, usersRes, analyticsRes, coursesRes, settingsRes, leavesRes, youtubeRes] = await Promise.all([
                axios.get(`${API_BASE}/stats`),
                axios.get(`${API_BASE}/users`),
                axios.get(`${API_BASE}/analytics`),
                axios.get(`${API_BASE}/courses`),
                axios.get(`${API_BASE}/settings`),
                axios.get(`${API_BASE}/faculty-leaves`),
                axios.get(`${API_BASE}/youtube-courses`)
            ]);

            setStats(statsRes.data || { total: 0, students: 0, faculty: 0, active: 0 });
            setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
            setAnalytics(analyticsRes.data || {});
            setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
            setConfig(settingsRes.data || {});
            setFacultyLeaves(Array.isArray(leavesRes.data) ? leavesRes.data : []);
            setYoutubeCourses(Array.isArray(youtubeRes.data) ? youtubeRes.data : []);
        } catch (err) {
            console.error("Admin dashboard load failed:", err);
            setError("Failed to load admin data. Please make sure the backend and database are connected.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!location.state?.user || location.state.user?.role !== "admin") {
            setAdmin({ name: "Dev Admin", role: "admin" });
        } else {
            setAdmin(location.state.user);
        }
        fetchAllData();
    }, [location.state, fetchAllData]);

    const handleStatusToggle = async (id, currentStatus) => {
        const newStatus = currentStatus === "active" ? "inactive" : "active";
        try {
            await axios.put(`${API_BASE}/user-status/${id}`, { status: newStatus });
            setUsers(prev => prev.map(user => user.id === id ? { ...user, status: newStatus } : user));
            setViewUser(prev => prev?.id === id ? { ...prev, status: newStatus } : prev);
            showNotice("success", `User marked as ${newStatus}.`);
        } catch (err) {
            showNotice("error", err.response?.data?.msg || "Failed to update user status.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this user permanently? This also removes linked records where possible.")) return;

        try {
            await axios.delete(`${API_BASE}/user/${id}`);
            setUsers(prev => prev.filter(user => user.id !== id));
            setViewUser(null);
            await fetchAllData();
            showNotice("success", "User deleted successfully.");
        } catch (err) {
            showNotice("error", err.response?.data?.msg || "Failed to delete user.");
        }
    };

    const handleResetPassword = async (id) => {
        if (!window.confirm("Reset password to Campus123?")) return;

        try {
            await axios.put(`${API_BASE}/reset-password/${id}`);
            showNotice("success", "Password reset to Campus123.");
        } catch (err) {
            showNotice("error", err.response?.data?.msg || "Failed to reset password.");
        }
    };

    const handleSettingToggle = async (key) => {
        try {
            const res = await axios.post(`${API_BASE}/settings/toggle`, { key });
            setConfig(prev => ({ ...prev, [key]: res.data.newValue }));
            showNotice("success", "Settings updated successfully.");
        } catch (err) {
            showNotice("error", "Failed to update settings.");
        }
    };

    const handleFacultyLeaveAction = async (leaveId, status) => {
        try {
            await axios.put(`${API_BASE}/faculty-leaves/${leaveId}`, { status });
            setFacultyLeaves(facultyLeaves.map(l => l.id === leaveId ? { ...l, status } : l));
            showNotice("success", `Leave marked as ${status}`);
        } catch (err) {
            showNotice("error", "Failed to process leave request");
        }
    };

    const handleAddYoutubeCourse = async (e) => {
        e.preventDefault();
        if (!youtubeForm.title || !youtubeForm.video_id) return showNotice("error", "Title and Video ID required.");
        try {
            await axios.post(`${API_BASE}/youtube-courses`, youtubeForm);
            showNotice("success", "YouTube Course added!");
            setYoutubeForm({ title: "", video_id: "", description: "" });
            const res = await axios.get(`${API_BASE}/youtube-courses`);
            setYoutubeCourses(res.data);
        } catch (err) {
            showNotice("error", "Failed to add course.");
        }
    };

    const handleDeleteYoutubeCourse = async (id) => {
        if (!window.confirm("Remove this YouTube course?")) return;
        try {
            await axios.delete(`${API_BASE}/youtube-courses/${id}`);
            setYoutubeCourses(youtubeCourses.filter(c => c.id !== id));
            showNotice("success", "Course deleted.");
        } catch (err) {
            showNotice("error", "Failed to delete course.");
        }
    };

    const openUserModal = async (user) => {
        setViewUser(user);
        setUserProgress(null);

        if (user.role !== "student") return;

        setLoadingProgress(true);
        try {
            const res = await axios.get(`${API_BASE}/user/${user.id}/progress`);
            setUserProgress(res.data);
        } catch (err) {
            console.error("Failed to load progress:", err);
            setUserProgress(null);
        } finally {
            setLoadingProgress(false);
        }
    };

    const resetCourseForm = () => {
        setCourseForm(emptyCourseForm);
        setEditingCourseId(null);
    };

    const handleCourseSubmit = async (e) => {
        e.preventDefault();

        if (!courseForm.courseName || !courseForm.courseCode || !courseForm.facultyId) {
            showNotice("error", "Fill course name, code, and faculty.");
            return;
        }

        try {
            if (editingCourseId) {
                await axios.put(`${API_BASE}/course/${editingCourseId}`, courseForm);
                showNotice("success", "Course updated successfully.");
            } else {
                await axios.post(`${API_BASE}/courses`, courseForm);
                showNotice("success", "Course created successfully.");
            }
            resetCourseForm();
            await fetchAllData();
        } catch (err) {
            showNotice("error", err.response?.data?.msg || "Course action failed.");
        }
    };

    const handleCourseEdit = (course) => {
        setEditingCourseId(course.id);
        setCourseForm({
            courseName: course.name || "",
            courseCode: course.code || "",
            facultyId: course.facultyId || ""
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCourseDelete = async (courseId) => {
        if (!window.confirm("Delete this course and linked course records?")) return;

        try {
            await axios.delete(`${API_BASE}/course/${courseId}`);
            await fetchAllData();
            showNotice("success", "Course deleted successfully.");
        } catch (err) {
            showNotice("error", err.response?.data?.msg || "Failed to delete course.");
        }
    };

    const handleExportReport = () => {
        const rows = [
            ["Metric", "Value"],
            ["Total Users", stats.total || 0],
            ["Students", stats.students || 0],
            ["Faculty", stats.faculty || 0],
            ["Active Users", stats.active || 0],
            ["Pending Users", pendingCount],
            ["Inactive Users", inactiveCount],
            ["Daily Active Users", analytics.dailyActiveUsers || "0%"],
            ["Assignment Submission Rate", analytics.assignmentSubmissionRate || "0%"],
            ["Average Score", analytics.averageQuizScore || "0%"],
            [],
            ["Course", "Code", "Instructor", "Students", "Assignments"],
            ...courses.map(course => [
                course.name,
                course.code || "",
                course.instructor || "Unassigned",
                course.enrolled || 0,
                course.activeAssignments || 0
            ])
        ];

        const csv = rows
            .map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `campus-bridge-admin-report-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        showNotice("success", "Report downloaded.");
    };

    const handleLogout = () => navigate("/auth", { replace: true });

    const renderNotice = () => notice && (
        <div className={`admin-notice ${notice.type}`}>
            {notice.type === "success" ? <FaCheckCircle /> : <FaShieldAlt />}
            <span>{notice.text}</span>
        </div>
    );

    const renderUserDetailsModal = () => {
        if (!viewUser) return null;

        return (
            <div className="modal-overlay">
                <div className="modal-content admin-modal">
                    <div className="modal-header">
                        <div>
                            <span className="modal-kicker">User Profile</span>
                            <h2>{viewUser.name}</h2>
                        </div>
                        <button className="btn-icon" onClick={() => setViewUser(null)}><FaTimes /></button>
                    </div>
                    <div className="modal-body">
                        <div className="user-meta-info">
                            <p><strong>Email:</strong> {viewUser.email}</p>
                            <p><strong>Role:</strong> <span className={`role-pill ${viewUser.role}`}>{viewUser.role}</span></p>
                            <p><strong>Status:</strong> <span className={`status-badge ${viewUser.status}`}>{viewUser.status}</span></p>
                        </div>

                        {viewUser.role === "student" && (
                            <div className="student-analytics">
                                <h3>Academic Progress</h3>
                                {loadingProgress ? (
                                    <div className="loading-panel">Fetching latest progress records...</div>
                                ) : userProgress ? (
                                    <div className="progress-grid">
                                        <div className="prog-card"><h4>Assignments</h4><p>{userProgress.assignmentsCompleted} / {userProgress.assignmentsTotal}</p></div>
                                        <div className="prog-card"><h4>Attendance</h4><p>{userProgress.attendance}</p></div>
                                        <div className="prog-card"><h4>Average Score</h4><p>{userProgress.overallGrade}</p></div>
                                        <div className="prog-card"><h4>Last Login</h4><p>{userProgress.lastLogin !== "Never" ? new Date(userProgress.lastLogin).toLocaleDateString() : "Never"}</p></div>
                                    </div>
                                ) : (
                                    <div className="empty-state compact">No progress data available for this user.</div>
                                )}
                            </div>
                        )}

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => handleResetPassword(viewUser.id)}><FaKey /> Reset Password</button>
                            <button className={viewUser.status === "active" ? "btn-warning" : "btn-success"} onClick={() => handleStatusToggle(viewUser.id, viewUser.status)}>
                                {viewUser.status === "active" ? <FaBan /> : <FaCheckCircle />}
                                {viewUser.status === "active" ? "Suspend Account" : "Activate Account"}
                            </button>
                            <button className="btn-danger" onClick={() => handleDelete(viewUser.id)}><FaTrashAlt /> Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderUsersView = () => {
        const filteredUsers = users.filter(user =>
            (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        return (
            <div className="content-card">
                <div className="card-header">
                    <div>
                        <h2>User Management</h2>
                        <p>Approve, suspend, reset passwords, inspect progress, and remove accounts.</p>
                    </div>
                    <div className="search-wrapper">
                        <FaSearch />
                        <input
                            placeholder="Search users or roles..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="quick-summary">
                    <div><span>{pendingCount}</span><p>Pending approvals</p></div>
                    <div><span>{inactiveCount}</span><p>Suspended accounts</p></div>
                    <div><span>{facultyOptions.length}</span><p>Faculty accounts</p></div>
                </div>

                <div className="table-responsive">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>User Info</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr><td colSpan="5" className="empty-state">No users found.</td></tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className={user.status === "inactive" ? "dimmed" : ""}>
                                        <td>#{user.id}</td>
                                        <td>
                                            <div className="user-info">
                                                <strong>{user.name}</strong>
                                                <small>{user.email}</small>
                                            </div>
                                        </td>
                                        <td><span className={`role-pill ${user.role}`}>{user.role}</span></td>
                                        <td><span className={`status-badge ${user.status}`}>{user.status || "active"}</span></td>
                                        <td className="actions-col">
                                            <button className="btn-icon info-light" onClick={() => openUserModal(user)} title="View details"><FaEye /></button>
                                            <button className="btn-icon warning" onClick={() => handleResetPassword(user.id)} title="Reset password"><FaKey /></button>
                                            <button className={`btn-icon ${user.status === "active" ? "danger-light" : "success-light"}`} onClick={() => handleStatusToggle(user.id, user.status)} title="Toggle status">
                                                {user.status === "active" ? <FaBan /> : <FaCheckCircle />}
                                            </button>
                                            <button className="btn-icon danger" onClick={() => handleDelete(user.id)} title="Delete user"><FaTrashAlt /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderAnalyticsView = () => {
        const analyticsCards = [
            { title: "Daily Active Users", value: analytics.dailyActiveUsers || "0%", helper: "Users logged in during the last day" },
            { title: "Assignment Submission Rate", value: analytics.assignmentSubmissionRate || "0%", helper: "Submitted work across assigned courses" },
            { title: "Average Score", value: analytics.averageQuizScore || "0%", helper: "Average graded submission score" }
        ];

        return (
            <div className="content-card">
                <div className="card-header">
                    <div>
                        <h2>Reports & Analytics</h2>
                        <p>Track platform usage and export an admin summary.</p>
                    </div>
                    <button className="btn-primary" onClick={handleExportReport}><FaDownload /> Export CSV</button>
                </div>
                <div className="padding-wrapper">
                    <div className="mock-analytics-grid">
                        {analyticsCards.map(card => (
                            <div className="analytics-box" key={card.title}>
                                <h3>{card.title}</h3>
                                <p className="big-stat">{card.value}</p>
                                <small>{card.helper}</small>
                            </div>
                        ))}
                    </div>
                    <div className="analytics-strip">
                        <div><strong>{courses.length}</strong><span>Courses</span></div>
                        <div><strong>{stats.active || 0}</strong><span>Active Users</span></div>
                        <div><strong>{pendingCount}</strong><span>Pending Users</span></div>
                        <div><strong>{inactiveCount}</strong><span>Suspended Users</span></div>
                    </div>
                </div>
            </div>
        );
    };

    const renderCoursesView = () => (
        <div className="content-card">
            <div className="card-header">
                <div>
                    <h2>Course & Content Management</h2>
                    <p>Create, assign, edit, and remove courses from one place.</p>
                </div>
            </div>

            <form className="course-admin-form" onSubmit={handleCourseSubmit}>
                <div className="form-field">
                    <label>Course Name</label>
                    <input value={courseForm.courseName} onChange={e => setCourseForm({ ...courseForm, courseName: e.target.value })} placeholder="Example: Data Structures" />
                </div>
                <div className="form-field">
                    <label>Course Code</label>
                    <input value={courseForm.courseCode} onChange={e => setCourseForm({ ...courseForm, courseCode: e.target.value })} placeholder="Example: CS201" />
                </div>
                <div className="form-field">
                    <label>Faculty</label>
                    <select value={courseForm.facultyId} onChange={e => setCourseForm({ ...courseForm, facultyId: e.target.value })}>
                        <option value="">Select faculty</option>
                        {facultyOptions.map(faculty => (
                            <option key={faculty.id} value={faculty.id}>{faculty.name}</option>
                        ))}
                    </select>
                </div>
                <div className="course-form-actions">
                    <button className="btn-primary" type="submit">{editingCourseId ? <FaEdit /> : <FaPlus />} {editingCourseId ? "Update Course" : "Create Course"}</button>
                    {editingCourseId && <button className="btn-secondary" type="button" onClick={resetCourseForm}>Cancel</button>}
                </div>
            </form>

            <div className="table-responsive">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Course Name</th>
                            <th>Code</th>
                            <th>Instructor</th>
                            <th>Enrolled</th>
                            <th>Assignments</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.length === 0 ? (
                            <tr><td colSpan="6" className="empty-state">No courses available.</td></tr>
                        ) : (
                            courses.map(course => (
                                <tr key={course.id}>
                                    <td><strong>{course.name}</strong></td>
                                    <td><span className="course-code">{course.code || "N/A"}</span></td>
                                    <td>{course.instructor || "Unassigned"}</td>
                                    <td>{course.enrolled || 0}</td>
                                    <td>{course.activeAssignments || 0} Active</td>
                                    <td className="actions-col">
                                        <button className="btn-icon info-light" onClick={() => alert(`${course.name}\nStudents: ${course.enrolled || 0}\nAssignments: ${course.activeAssignments || 0}`)} title="View summary"><FaEye /></button>
                                        <button className="btn-icon warning" onClick={() => handleCourseEdit(course)} title="Edit course"><FaEdit /></button>
                                        <button className="btn-icon danger" onClick={() => handleCourseDelete(course.id)} title="Delete course"><FaTrashAlt /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderFacultyLeavesView = () => (
        <div className="content-card">
            <div className="card-header">
                <div>
                    <h2>Faculty Leave Requests</h2>
                    <p>Approve or deny faculty leave applications.</p>
                </div>
            </div>
            <div className="table-responsive padding-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Faculty Name</th>
                            <th>Dates</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {facultyLeaves.length === 0 ? (
                            <tr><td colSpan="5" className="empty-state">No pending leave requests.</td></tr>
                        ) : (
                            facultyLeaves.map(leave => (
                                <tr key={leave.id}>
                                    <td><strong>{leave.facultyName}</strong></td>
                                    <td>{leave.fromDate} to {leave.toDate}</td>
                                    <td className="reason-cell">{leave.reason}</td>
                                    <td><span className={`status-badge ${leave.status.toLowerCase()}`}>{leave.status}</span></td>
                                    <td>
                                        {leave.status === 'Pending' ? (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn-primary" style={{ padding: '6px 10px', fontSize: '13px' }} onClick={() => handleFacultyLeaveAction(leave.id, 'Approved')}>Approve</button>
                                                <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: '13px', borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleFacultyLeaveAction(leave.id, 'Denied')}>Deny</button>
                                            </div>
                                        ) : (
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>Resolved</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderYouTubeCoursesView = () => (
        <div className="content-card">
            <div className="card-header">
                <div>
                    <h2>YouTube Courses</h2>
                    <p>Manage free video courses available to students in their Learn tab.</p>
                </div>
            </div>
            <form className="course-admin-form" onSubmit={handleAddYoutubeCourse}>
                <div className="form-field">
                    <label>Course Title</label>
                    <input value={youtubeForm.title} onChange={e => setYoutubeForm({ ...youtubeForm, title: e.target.value })} placeholder="e.g. Complete React Tutorial" />
                </div>
                <div className="form-field">
                    <label>YouTube Video ID</label>
                    <input value={youtubeForm.video_id} onChange={e => setYoutubeForm({ ...youtubeForm, video_id: e.target.value })} placeholder="e.g. dGcsHMXbSOA" />
                </div>
                <div className="form-field">
                    <label>Description</label>
                    <input value={youtubeForm.description} onChange={e => setYoutubeForm({ ...youtubeForm, description: e.target.value })} placeholder="Short info about this course" />
                </div>
                <div className="course-form-actions">
                    <button className="btn-primary" type="submit"><FaPlus /> Add Video Course</button>
                </div>
            </form>
            <div className="table-responsive padding-wrapper mt-20">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Video / Thumbnail</th>
                            <th>Title & Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {youtubeCourses.length === 0 ? (
                            <tr><td colSpan="3" className="empty-state">No YouTube courses.</td></tr>
                        ) : (
                            youtubeCourses.map(course => (
                                <tr key={course.id}>
                                    <td>
                                        <img src={`https://img.youtube.com/vi/${course.video_id}/hqdefault.jpg`} alt="Thumbnail" style={{ width: '120px', borderRadius: '8px', objectFit: 'cover' }} />
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <strong>{course.title}</strong>
                                            <small style={{ color: '#64748b' }}>{course.description || "No description provided."}</small>
                                        </div>
                                    </td>
                                    <td>
                                        <button className="btn-icon danger" onClick={() => handleDeleteYoutubeCourse(course.id)} title="Remove Course"><FaTrashAlt /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderSettingsView = () => {
        const settings = [
            {
                key: "maintenance_mode",
                title: "Maintenance Mode",
                description: "Temporarily restrict regular portal usage during maintenance.",
                danger: true
            },
            {
                key: "allow_registrations",
                title: "Allow New Registrations",
                description: "Let students, faculty, and admins request new portal accounts."
            },
            {
                key: "system_notifications",
                title: "System Notifications",
                description: "Keep in-app notification delivery enabled for portal events."
            }
        ];

        return (
            <>
            <div className="content-card">
                <div className="card-header">
                    <div>
                        <h2>System Settings</h2>
                        <p>Control core platform switches.</p>
                    </div>
                </div>
                <div className="settings-grid">
                    {settings.map(setting => (
                        <div className="setting-item" key={setting.key}>
                            <div>
                                <h4>{setting.title}</h4>
                                <p>{setting.description}</p>
                            </div>
                            <button className="toggle-btn" onClick={() => handleSettingToggle(setting.key)} aria-label={`Toggle ${setting.title}`}>
                                {config?.[setting.key]
                                    ? <FaToggleOn size={38} color={setting.danger ? "#ef4444" : "#10b981"} />
                                    : <FaToggleOff size={38} color="#94a3b8" />}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="content-card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <div>
                        <h2><FaLock style={{ color: '#6366f1', marginRight: '8px' }} /> Account Security</h2>
                        <p>Change your admin password.</p>
                    </div>
                </div>
                <div style={{ padding: '20px' }}>
                    <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Current Password</label>
                            <input type="password" value={passwordData.current} onChange={e => setPasswordData({ ...passwordData, current: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px' }}>New Password</label>
                            <input type="password" value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Confirm New Password</label>
                            <input type="password" value={passwordData.confirm} onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        </div>
                        <button type="submit" className="btn-primary" style={{ padding: '10px' }}>Update Password</button>
                        {passwordMsg && <p style={{ color: passwordMsg.includes("success") ? "green" : "red" }}>{passwordMsg}</p>}
                    </form>
                </div>
            </div>
        </>
        );
    };

    if (loading) return <div className="admin-loading"><div className="spinner"></div><p>Loading admin control center...</p></div>;

    if (error) {
        return (
            <div className="admin-error">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={fetchAllData} className="btn-primary"><FaSync /> Retry Connection</button>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <aside className="admin-sidebar">
                <div className="brand"><FaUserShield /> <span>Admin<span className="highlight">Control</span></span></div>
                <div className="admin-profile">
                    <div className="avatar">{admin?.name?.charAt(0) || "A"}</div>
                    <div className="info"><h4>{admin?.name || "Admin"}</h4><span className="badge">Super Admin</span></div>
                </div>
                <nav className="menu">
                    <button className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}><FaUsers /> <span>User Management</span></button>
                    <button className={activeTab === "courses" ? "active" : ""} onClick={() => setActiveTab("courses")}><FaBookOpen /> <span>Courses & Content</span></button>
                    <button className={activeTab === "youtube" ? "active" : ""} onClick={() => setActiveTab("youtube")}><FaVideo /> <span>YouTube Courses</span></button>
                    <button className={activeTab === "leaves" ? "active" : ""} onClick={() => setActiveTab("leaves")}><FaEnvelopeOpenText /> <span>Faculty Leaves</span></button>
                    <button className={activeTab === "analytics" ? "active" : ""} onClick={() => setActiveTab("analytics")}><FaChartBar /> <span>Reports & Analytics</span></button>
                    <button className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}><FaCogs /> <span>System Settings</span></button>
                </nav>
                <button className="logout-btn" onClick={handleLogout}><FaSignOutAlt /> <span>Logout</span></button>
            </aside>

            <main className="admin-content">
                {renderNotice()}
                <header className="page-header">
                    <div>
                        <span className="page-kicker">Campus Bridge Administration</span>
                        <h1>Dashboard Overview</h1>
                        <p>Manage users, courses, reports, and system controls from one console.</p>
                    </div>
                    <button className="refresh-btn" onClick={fetchAllData} title="Refresh dashboard"><FaSync /></button>
                </header>

                <div className="stats-row">
                    <div className="stat-card"><div className="icon-bg purple"><FaUsers /></div><div><h3>{stats?.total || 0}</h3><p>Total Users</p></div></div>
                    <div className="stat-card"><div className="icon-bg blue"><FaUserGraduate /></div><div><h3>{stats?.students || 0}</h3><p>Students</p></div></div>
                    <div className="stat-card"><div className="icon-bg orange"><FaChalkboardTeacher /></div><div><h3>{stats?.faculty || 0}</h3><p>Faculty</p></div></div>
                    <div className="stat-card"><div className="icon-bg green"><FaCheckCircle /></div><div><h3>{stats?.active || 0}</h3><p>Active Users</p></div></div>
                </div>

                <div className="view-container">
                    {activeTab === "users" && renderUsersView()}
                    {activeTab === "courses" && renderCoursesView()}
                    {activeTab === "youtube" && renderYouTubeCoursesView()}
                    {activeTab === "leaves" && renderFacultyLeavesView()}
                    {activeTab === "analytics" && renderAnalyticsView()}
                    {activeTab === "settings" && renderSettingsView()}
                </div>
            </main>

            {renderUserDetailsModal()}
        </div>
    );
};

export default AdminDashboard;
