import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
    FaChalkboardTeacher, FaUsers, FaClipboardList, FaCalendarAlt,
    FaSignOutAlt, FaUserCheck, FaBook, FaPlus, FaSave,
    FaClock, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle,
    FaGraduationCap, FaBars, FaTimes, FaCommentDots, FaHistory,
    FaTrash, FaEnvelopeOpenText, FaEye, FaUserMinus, FaUser, FaCog, FaLock, FaBell, FaCode
} from "react-icons/fa";
import "./FacultyDashboard.css";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    exit: { opacity: 0, y: -20 }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
};

/* ==================================================================================
   SUB-COMPONENTS
   ================================================================================== */

const ProfileView = ({ faculty }) => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="section-container">
        <h3 className="section-title"><FaUser /> My Profile</h3>
        <div className="profile-card">
            <div className="profile-avatar-large">{faculty.name ? faculty.name[0] : "F"}</div>
            <div className="profile-details">
                <div className="profile-info-group">
                    <label>Full Name</label>
                    <p>{faculty.name || "N/A"}</p>
                </div>
                <div className="profile-info-group">
                    <label>Email Address</label>
                    <p>{faculty.email || "faculty@university.edu"}</p>
                </div>
                <div className="profile-info-group">
                    <label>Role / Designation</label>
                    <p className="capitalize-text">{faculty.role || "Faculty Member"}</p>
                </div>
                <div className="profile-info-group">
                    <label>Employee ID</label>
                    <p>MBU-FAC-{faculty.id || "001"}</p>
                </div>
            </div>
        </div>
    </motion.div>
);

const SettingsView = ({ user }) => {
    const [passwordData, setPasswordData] = useState({ current: "", newPassword: "", confirm: "" });
    const [notifications, setNotifications] = useState({ emailAlerts: true, classReminders: true });
    const [passwordMsg, setPasswordMsg] = useState("");

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirm) return setPasswordMsg("Passwords do not match");
        try {
            const res = await axios.post("https://campus-bridge-lms.onrender.com/api/auth/change-password", {
                userId: user.id,
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

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="section-container">
            <h3 className="section-title"><FaCog /> Account Settings</h3>
            <div className="responsive-form-grid">
                <div className="card-form">
                    <div className="form-header">
                        <h3><FaLock style={{ color: '#6366f1' }} /> Change Password</h3>
                    </div>
                    <form onSubmit={handlePasswordUpdate}>
                        <div className="form-group">
                            <label>Current Password</label>
                            <input type="password" value={passwordData.current} onChange={e => setPasswordData({ ...passwordData, current: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <input type="password" value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input type="password" value={passwordData.confirm} onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })} required />
                        </div>
                        <button type="submit" className="btn-primary">Update Password</button>
                        {passwordMsg && <p style={{ color: passwordMsg.includes("success") ? "green" : "red", marginTop: '10px' }}>{passwordMsg}</p>}
                    </form>
                </div>

                <div className="card-form">
                    <div className="form-header">
                        <h3><FaBell style={{ color: '#10b981' }} /> Notification Preferences</h3>
                    </div>
                    <div className="setting-toggle-group">
                        <div className="toggle-item">
                            <div>
                                <h4>Email Alerts</h4>
                                <p>Receive email updates for new student submissions and leave requests.</p>
                            </div>
                            <input type="checkbox" checked={notifications.emailAlerts} onChange={e => setNotifications({ ...notifications, emailAlerts: e.target.checked })} />
                        </div>
                        <div className="toggle-item">
                            <div>
                                <h4>Class Reminders</h4>
                                <p>Get notified 15 minutes before your scheduled classes start.</p>
                            </div>
                            <input type="checkbox" checked={notifications.classReminders} onChange={e => setNotifications({ ...notifications, classReminders: e.target.checked })} />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const CoursesView = ({ newCourse, setNewCourse, handleCreateCourse, handleDeleteCourse, courses, handleEnroll, handleUnenroll }) => {
    const [enrollData, setEnrollData] = useState({ courseId: "", email: "" });
    const [manageCourseId, setManageCourseId] = useState("");
    const [enrolledStudents, setEnrolledStudents] = useState([]);

    useEffect(() => {
        if (manageCourseId) {
            axios.get(`https://campus-bridge-lms.onrender.com/api/faculty/students/${manageCourseId}`)
                .then(res => setEnrolledStudents(res.data))
                .catch(err => console.error(err));
        } else {
            setEnrolledStudents([]);
        }
    }, [manageCourseId]);

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="section-container">
            <div className="responsive-form-grid">
                <motion.div variants={itemVariants} className="card-form">
                    <div className="form-header">
                        <h3><FaPlus style={{ color: '#6366f1' }} /> Create Course</h3>
                    </div>
                    <div className="form-group">
                        <label>Course Name</label>
                        <input placeholder="e.g. Advanced AI" value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Course Code</label>
                        <input placeholder="e.g. AI404" value={newCourse.code} onChange={e => setNewCourse({ ...newCourse, code: e.target.value })} />
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} className="btn-primary" onClick={handleCreateCourse}>Create Course</motion.button>
                </motion.div>

                <motion.div variants={itemVariants} className="card-form" style={{ borderLeft: '5px solid #10b981' }}>
                    <div className="form-header">
                        <h3><FaUserCheck style={{ color: '#10b981' }} /> Manage Enrollments</h3>
                    </div>
                    <div className="form-group">
                        <label>Select Course</label>
                        <select value={manageCourseId} onChange={e => setManageCourseId(e.target.value)}>
                            <option value="">-- Choose Course --</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.course_name}</option>)}
                        </select>
                    </div>
                    {manageCourseId && (
                        <>
                            <div className="enroll-action-bar">
                                <input placeholder="Student Email..." value={enrollData.email} onChange={e => setEnrollData({ ...enrollData, email: e.target.value })} />
                                <button className="btn-primary" onClick={() => { handleEnroll(manageCourseId, enrollData.email); setEnrollData({ ...enrollData, email: "" }); }}>Enroll</button>
                            </div>
                            <div className="enrolled-list">
                                <h4>Currently Enrolled:</h4>
                                {enrolledStudents.length === 0 ? <p>No students enrolled.</p> : enrolledStudents.map(s => (
                                    <div key={s.id} className="enrolled-item">
                                        <span>{s.name} ({s.email})</span>
                                        <button className="icon-btn delete" onClick={() => handleUnenroll(manageCourseId, s.id)}><FaUserMinus /></button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </motion.div>
            </div>

            <h3 className="section-title">Active Courses</h3>
            <div className="courses-grid-view">
                {courses.map(c => (
                    <motion.div key={c.id} variants={itemVariants} className="course-card">
                        <div className="course-header">
                            <div>
                                <h4>{c.course_name}</h4>
                                <span className="code-badge">{c.course_code}</span>
                            </div>
                            <button className="icon-btn delete" onClick={() => handleDeleteCourse(c.id)} title="Delete Course"><FaTrash /></button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

const AttendanceView = ({ courses, selectedCourseId, setSelectedCourseId, selectedDate, setSelectedDate, handleSaveAttendance, students, toggleAttendance, updateRemark, isAttendanceSaved, allPostedAttendance }) => {
    const [historyModal, setHistoryModal] = useState({ open: false, studentName: "", records: [] });
    const [viewMode, setViewMode] = useState("mark"); // "mark" or "records"

    const fetchStudentHistory = async (studentId, studentName) => {
        try {
            const res = await axios.get(`https://campus-bridge-lms.onrender.com/api/faculty/attendance/history/${selectedCourseId}/${studentId}`);
            setHistoryModal({ open: true, studentName, records: res.data });
        } catch (err) {
            setHistoryModal({
                open: true, studentName, records: [
                    { date: '2026-05-20', status: 'Present' },
                    { date: '2026-05-22', status: 'Absent' }
                ]
            });
        }
    };

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="section-container relative">
            <div className="view-toggle-tabs">
                <button className={viewMode === "mark" ? "active" : ""} onClick={() => setViewMode("mark")}>Mark / Edit Daily Register</button>
                <button className={viewMode === "records" ? "active" : ""} onClick={() => setViewMode("records")}>All Posted Logs</button>
            </div>

            {viewMode === "mark" ? (
                <>
                    <div className="card-form attendance-controls">
                        <div className="form-group">
                            <label>Select Course</label>
                            <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.course_name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Date</label>
                            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                        </div>
                        <motion.button className={`save-btn ${isAttendanceSaved ? 'update-mode' : ''}`} onClick={() => handleSaveAttendance(selectedDate)}>
                            {isAttendanceSaved ? <><FaHistory /> Update Existing Record</> : <><FaSave /> Save Register</>}
                        </motion.button>
                    </div>

                    <div className="table-responsive">
                        <table className="dashboard-table">
                            <thead><tr><th>Student</th><th>Status</th><th>Remarks</th><th>Actions</th></tr></thead>
                            <tbody>
                                {students.map(s => (
                                    <tr key={s.id}>
                                        <td><strong>{s.name}</strong></td>
                                        <td><span className={`status-badge ${s.attendance?.toLowerCase() || 'absent'}`}>{s.attendance || 'Absent'}</span></td>
                                        <td>
                                            <div className="remark-input-wrap">
                                                <FaCommentDots className="remark-icon" />
                                                <input placeholder="Add remark..." value={s.remarks || ""} onChange={(e) => updateRemark(s.id, e.target.value)} />
                                            </div>
                                        </td>
                                        <td className="action-cell">
                                            <button className="toggle-btn" onClick={() => toggleAttendance(s.id)}>
                                                {s.attendance === 'Present' ? <FaCheckCircle color="#10b981" size={20} /> : <FaTimesCircle color="#ef4444" size={20} />}
                                            </button>
                                            <button className="history-btn" onClick={() => fetchStudentHistory(s.id, s.name)}>
                                                <FaEye size={14} /> Tracking Log
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="table-responsive">
                    <table className="dashboard-table">
                        <thead><tr><th>Course ID / Name</th><th>Date Posted</th><th>Total Evaluated</th><th>Status</th></tr></thead>
                        <tbody>
                            {allPostedAttendance.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: "center" }}>No posted attendance sheets found.</td></tr>
                            ) : allPostedAttendance.map((log, i) => (
                                <tr key={i}>
                                    <td><strong>{log.course_name || `Course #${log.course_id}`}</strong></td>
                                    <td>{log.date}</td>
                                    <td>{log.student_count || students.length} Students</td>
                                    <td><span className="status-badge present">Published</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {historyModal.open && (
                <div className="modal-overlay" onClick={() => setHistoryModal({ ...historyModal, open: false })}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{historyModal.studentName}'s Metrics</h3>
                            <button onClick={() => setHistoryModal({ ...historyModal, open: false })}><FaTimes /></button>
                        </div>
                        <ul className="history-list">
                            {historyModal.records.map((r, i) => (
                                <li key={i}>
                                    <span className="history-date">{r.date}</span>
                                    <span className={`status-badge ${r.status.toLowerCase()}`}>{r.status}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

const LeavesView = ({ leaves, handleLeaveAction }) => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="section-container">
        <h3 className="section-title"><FaEnvelopeOpenText /> Student Leave Requests</h3>
        <div className="table-responsive">
            <table className="dashboard-table">
                <thead><tr><th>Student</th><th>Course</th><th>Dates</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                    {leaves.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center' }}>No pending leave requests.</td></tr> : leaves.map(leave => (
                        <tr key={leave.id}>
                            <td><strong>{leave.studentName}</strong></td>
                            <td>{leave.courseName}</td>
                            <td>{leave.fromDate} to {leave.toDate}</td>
                            <td className="reason-cell">{leave.reason}</td>
                            <td><span className={`status-badge ${leave.status.toLowerCase()}`}>{leave.status}</span></td>
                            <td>
                                {leave.status === 'Pending' ? (
                                    <div className="action-buttons">
                                        <button className="approve-btn" onClick={() => handleLeaveAction(leave.id, 'Approved')}><FaCheckCircle /> Approve</button>
                                        <button className="deny-btn" onClick={() => handleLeaveAction(leave.id, 'Denied')}><FaTimesCircle /> Deny</button>
                                    </div>
                                ) : (
                                    <span className="resolved-text">Completed</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </motion.div>
);

const MyLeavesView = ({ myLeaves, newLeave, setNewLeave, handleApplyLeave }) => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="section-container">
        <h3 className="section-title"><FaEnvelopeOpenText /> Apply for Leave</h3>
        <div className="card-form mb-20">
            <div className="form-row">
                <div className="form-group"><label>From Date</label><input type="date" value={newLeave.fromDate} onChange={e => setNewLeave({ ...newLeave, fromDate: e.target.value })} /></div>
                <div className="form-group"><label>To Date</label><input type="date" value={newLeave.toDate} onChange={e => setNewLeave({ ...newLeave, toDate: e.target.value })} /></div>
            </div>
            <div className="form-group"><label>Reason</label><textarea value={newLeave.reason} onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })} /></div>
            <motion.button whileHover={{ scale: 1.02 }} className="submit-btn" onClick={handleApplyLeave}>Apply for Leave</motion.button>
        </div>

        <h3 className="section-title">My Leave History</h3>
        <div className="table-responsive">
            <table className="dashboard-table">
                <thead><tr><th>Dates</th><th>Reason</th><th>Status</th></tr></thead>
                <tbody>
                    {myLeaves.length === 0 ? <tr><td colSpan="3" style={{ textAlign: 'center' }}>No leave history.</td></tr> : myLeaves.map(leave => (
                        <tr key={leave.id}>
                            <td>{leave.fromDate} to {leave.toDate}</td>
                            <td className="reason-cell">{leave.reason}</td>
                            <td><span className={`status-badge ${leave.status.toLowerCase()}`}>{leave.status}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </motion.div>
);

const ScheduleView = ({ newClass, setNewClass, courses, handleAddClass, handleDeleteClass, schedule }) => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="section-container">
        <div className="card-form">
            <div className="form-header"><h3><FaCalendarAlt style={{ color: '#3b82f6' }} /> Add Class</h3></div>
            <div className="form-row">
                <div className="form-group"><label>Course</label><select value={newClass.courseId} onChange={e => setNewClass({ ...newClass, courseId: e.target.value })}><option value="">Select Course</option>{courses.map(c => <option key={c.id} value={c.id}>{c.course_name}</option>)}</select></div>
                <div className="form-group"><label>Day</label><select value={newClass.day} onChange={e => setNewClass({ ...newClass, day: e.target.value })}>{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div className="form-group"><label>Room Number</label><input placeholder="e.g. Lab 101" value={newClass.room} onChange={e => setNewClass({ ...newClass, room: e.target.value })} /></div>
            </div>
            <div className="form-row">
                <div className="form-group"><label>Start Time</label><input type="time" value={newClass.startTime} onChange={e => setNewClass({ ...newClass, startTime: e.target.value })} /></div>
                <div className="form-group"><label>End Time</label><input type="time" value={newClass.endTime} onChange={e => setNewClass({ ...newClass, endTime: e.target.value })} /></div>
                <motion.button whileHover={{ scale: 1.02 }} className="btn-primary" onClick={handleAddClass}>Add Class</motion.button>
            </div>
        </div>

        <h3 className="section-title">Timetable Schedule</h3>
        <div className="schedule-list">
            {schedule.length === 0 ? <p>No classes scheduled.</p> : schedule.map((s, i) => (
                <motion.div key={i} variants={itemVariants} className="schedule-item">
                    <div className="time-col"><span className="day">{s.day_of_week?.substring(0, 3)}</span><span className="time">{s.start_time?.substring(0, 5)}</span></div>
                    <div className="info-col">
                        <h4>{s.course_name || "Course Lecture"}</h4>
                        <div className="meta"><span><FaClock /> {s.start_time?.substring(0, 5)} - {s.end_time?.substring(0, 5)}</span><span><FaMapMarkerAlt /> {s.room_number}</span></div>
                    </div>
                    <button className="icon-btn delete" onClick={() => handleDeleteClass(s.id)}><FaTrash /></button>
                </motion.div>
            ))}
        </div>
    </motion.div>
);

const AssignmentsView = ({ newAssignment, setNewAssignment, handlePostAssignment, courses }) => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="section-container">
        <div className="card-form max-width-form">
            <div className="form-header">
                <h3><FaClipboardList style={{ color: '#f59e0b' }} /> Post Assignment</h3>
            </div>
            <div className="form-group">
                <label>Title</label>
                <input placeholder="Assignment Title" value={newAssignment.title} onChange={e => setNewAssignment({ ...newAssignment, title: e.target.value })} />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Subject</label>
                    <input placeholder="Topic" value={newAssignment.subject} onChange={e => setNewAssignment({ ...newAssignment, subject: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Course</label>
                    <select value={newAssignment.courseId} onChange={e => setNewAssignment({ ...newAssignment, courseId: e.target.value })}>
                        <option value="">Select Course...</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.course_name}</option>)}
                    </select>
                </div>
            </div>
            <div className="form-row">
                <div className="form-group"><label>Due Date</label><input type="date" value={newAssignment.due} onChange={e => setNewAssignment({ ...newAssignment, due: e.target.value })} /></div>
                <div className="form-group">
                    <label>Type</label>
                    <select value={newAssignment.type} onChange={e => setNewAssignment({ ...newAssignment, type: e.target.value })}>
                        <option value="Code">Coding Task</option><option value="Theory">Theory / Upload</option>
                    </select>
                </div>
                <div className="form-group"><label>Auto-Delete On (Optional)</label><input type="date" value={newAssignment.autoDeleteDate} onChange={e => setNewAssignment({ ...newAssignment, autoDeleteDate: e.target.value })} /></div>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} className="submit-btn" onClick={handlePostAssignment}>Post Assignment</motion.button>
        </div>
    </motion.div>
);

const CodingQuestionsView = ({ newCodingQuestion, setNewCodingQuestion, handlePostCodingQuestion }) => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="section-container">
        <div className="card-form max-width-form">
            <div className="form-header">
                <h3><FaCode style={{ color: '#2563eb' }} /> Post Coding Question</h3>
                <p>Create a coding assessment question with public and private test cases.</p>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Question Title</label>
                    <input placeholder="e.g. Checkerboard Pattern" value={newCodingQuestion.title} onChange={e => setNewCodingQuestion({ ...newCodingQuestion, title: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Company</label>
                    <input placeholder="e.g. TCS, Google" value={newCodingQuestion.company} onChange={e => setNewCodingQuestion({ ...newCodingQuestion, company: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Topic</label>
                    <input placeholder="e.g. Arrays, Strings" value={newCodingQuestion.topic} onChange={e => setNewCodingQuestion({ ...newCodingQuestion, topic: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Difficulty</label>
                    <select value={newCodingQuestion.difficulty} onChange={e => setNewCodingQuestion({ ...newCodingQuestion, difficulty: e.target.value })}>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                </div>
            </div>
            <div className="form-group">
                <label>Problem Statement</label>
                <textarea placeholder="Describe the problem students need to solve..." value={newCodingQuestion.description} onChange={e => setNewCodingQuestion({ ...newCodingQuestion, description: e.target.value })} />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Input Format</label>
                    <textarea value={newCodingQuestion.inputFormat} onChange={e => setNewCodingQuestion({ ...newCodingQuestion, inputFormat: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Output Format</label>
                    <textarea value={newCodingQuestion.outputFormat} onChange={e => setNewCodingQuestion({ ...newCodingQuestion, outputFormat: e.target.value })} />
                </div>
            </div>
            <div className="form-group">
                <label>Constraints</label>
                <input placeholder="e.g. 1 <= n <= 100" value={newCodingQuestion.constraints} onChange={e => setNewCodingQuestion({ ...newCodingQuestion, constraints: e.target.value })} />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Public Test Input</label>
                    <textarea value={newCodingQuestion.publicInput} onChange={e => setNewCodingQuestion({ ...newCodingQuestion, publicInput: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Public Expected Output</label>
                    <textarea value={newCodingQuestion.publicOutput} onChange={e => setNewCodingQuestion({ ...newCodingQuestion, publicOutput: e.target.value })} />
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Private Test Input</label>
                    <textarea value={newCodingQuestion.privateInput} onChange={e => setNewCodingQuestion({ ...newCodingQuestion, privateInput: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Private Expected Output</label>
                    <textarea value={newCodingQuestion.privateOutput} onChange={e => setNewCodingQuestion({ ...newCodingQuestion, privateOutput: e.target.value })} />
                </div>
            </div>
            <div className="form-group">
                <label>Java Starter Code</label>
                <textarea value={newCodingQuestion.javaStarter} onChange={e => setNewCodingQuestion({ ...newCodingQuestion, javaStarter: e.target.value })} />
            </div>
            <motion.button whileHover={{ scale: 1.02 }} className="submit-btn" onClick={handlePostCodingQuestion}>Post Coding Question</motion.button>
        </div>
    </motion.div>
);

const GradingView = ({ submissions, handleGradeSubmission, refreshSubmissions }) => {
    const [grades, setGrades] = useState({});
    const [remarks, setRemarks] = useState({});

    const handleScoreChange = (id, val) => setGrades(prev => ({ ...prev, [id]: val }));
    const handleRemarkChange = (id, val) => setRemarks(prev => ({ ...prev, [id]: val }));

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="section-container">
            <div className="grading-header">
                <h3><FaGraduationCap style={{ color: '#a855f7' }} /> Grading Center</h3>
                <motion.button whileHover={{ scale: 1.05 }} onClick={refreshSubmissions} className="refresh-btn">Refresh Submissions</motion.button>
            </div>
            <div className="table-responsive">
                <table className="dashboard-table">
                    <thead><tr><th>Student</th><th>Assignment</th><th>File</th><th>Score</th><th>Feedback</th><th>Action</th></tr></thead>
                    <tbody>
                        {submissions.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center' }}>No pending student submissions found.</td></tr>
                        ) : submissions.map(sub => (
                            <tr key={sub.id}>
                                <td><strong>{sub.studentName || "Student"}</strong></td>
                                <td>{sub.title || "Assignment Task"}</td>
                                <td><a href={sub.file} target="_blank" rel="noreferrer" className="view-link">View Submissions</a></td>
                                <td>
                                    {sub.status === 'graded' ? (
                                        <span className="status-badge graded">{sub.score} / 100</span>
                                    ) : (
                                        <input type="number" min="0" max="100" className="score-input" value={grades[sub.id] ?? ''} onChange={e => handleScoreChange(sub.id, e.target.value)} placeholder="--" />
                                    )}
                                </td>
                                <td>
                                    {sub.status === 'graded' ? (
                                        <span>{sub.remark || "No feedback left."}</span>
                                    ) : (
                                        <input className="remark-input-table" placeholder="Add feedback observations..." value={remarks[sub.id] ?? ''} onChange={e => handleRemarkChange(sub.id, e.target.value)} />
                                    )}
                                </td>
                                <td>
                                    {sub.status === 'graded' ? (
                                        <span className="status-badge present"><FaCheckCircle /> Verified</span>
                                    ) : (
                                        <motion.button whileHover={{ scale: 1.05 }} onClick={() => handleGradeSubmission(sub.id, grades[sub.id], remarks[sub.id])} className="grade-btn">Evaluate</motion.button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

/* ==================================================================================
   MAIN DASHBOARD
   ================================================================================== */
const FacultyDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [faculty, setFaculty] = useState({ id: null, name: "Loading...", email: "", role: "" });
    const [activeMenu, setActiveMenu] = useState("dashboard");

    const [stats, setStats] = useState({ courses: 0, students: 0, pending: 0 });
    const [courses, setCourses] = useState([]);
    const [students, setStudents] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [myLeaves, setMyLeaves] = useState([]);
    const [allPostedAttendance, setAllPostedAttendance] = useState([]);

    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isAttendanceSaved, setIsAttendanceSaved] = useState(false);

    const [newCourse, setNewCourse] = useState({ name: "", code: "" });
    const [newAssignment, setNewAssignment] = useState({ title: "", subject: "", due: "", type: "Code", courseId: "", autoDeleteDate: "" });
    const [newClass, setNewClass] = useState({ courseId: "", day: "Monday", startTime: "", endTime: "", room: "" });
    const [newCodingQuestion, setNewCodingQuestion] = useState({
        title: "Checkerboard Pattern",
        company: "TCS",
        topic: "General",
        difficulty: "Easy",
        description: "You are given an integer n. Print an n x n square pattern filled with alternating 0s and 1s.",
        inputFormat: "The first line contains a single integer n.",
        outputFormat: "Print n lines, each containing n space-separated values.",
        constraints: "1 <= n <= 100",
        publicInput: "3",
        publicOutput: "0 1 0\n1 0 1\n0 1 0",
        privateInput: "4",
        privateOutput: "0 1 0 1\n1 0 1 0\n0 1 0 1\n1 0 1 0",
        javaStarter: "import java.util.*;\n\nclass Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        // Your code here\n    }\n}"
    });
    const [newLeave, setNewLeave] = useState({ fromDate: "", toDate: "", reason: "" });

    useEffect(() => {
        const user = location.state?.user || {
            id: 1,
            name: "A Punith Kumar",
            email: "punith@university.edu",
            role: "faculty"
        };

        setFaculty(user);
        fetchDashboardData(user.id);
        fetchAllPostedAttendance(user.id);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (activeMenu === 'attendance' && selectedCourseId) fetchStudentsAndAttendance(selectedCourseId, selectedDate); }, [activeMenu, selectedCourseId, selectedDate]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (activeMenu === 'grading') fetchSubmissions(); }, [activeMenu]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (activeMenu === 'leaves') fetchLeaves(); }, [activeMenu]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (activeMenu === 'myLeaves') fetchMyLeaves(); }, [activeMenu]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (activeMenu === 'schedule') fetchSchedule(); }, [activeMenu]);

    const fetchDashboardData = async (fid) => {
        try {
            const res = await axios.get(`https://campus-bridge-lms.onrender.com/api/faculty/dashboard/${fid}`);
            setStats(res.data.stats);
            setCourses(res.data.courses);
            if (res.data.courses.length > 0 && !selectedCourseId) setSelectedCourseId(res.data.courses[0].id);
        } catch (err) { console.error(err); }
    };

    const fetchAllPostedAttendance = async (fid) => {
        try {
            const res = await axios.get(`https://campus-bridge-lms.onrender.com/api/faculty/attendance-history/${fid}`);
            setAllPostedAttendance(res.data);
        } catch (err) {
            setAllPostedAttendance([
                { course_name: "Advanced AI", date: "2026-05-25", student_count: 42, present_count: 40 }
            ]);
        }
    };

    const fetchStudentsAndAttendance = async (cid, date) => {
        try {
            const res = await axios.get(`https://campus-bridge-lms.onrender.com/api/faculty/attendance/${cid}?date=${date}`);
            setStudents(res.data.students || []);
            setIsAttendanceSaved(res.data.isAlreadyTaken || false);
        } catch (e) {
            setStudents([]);
            setIsAttendanceSaved(false);
        }
    };

    const handleCreateCourse = async () => {
        try {
            await axios.post("https://campus-bridge-lms.onrender.com/api/faculty/create-course", { facultyId: faculty.id, courseName: newCourse.name, courseCode: newCourse.code });
            alert("Course Created!");
            fetchDashboardData(faculty.id);
            setNewCourse({ name: '', code: '' });
        } catch (err) { alert("Error creating course"); }
    };

    const handleDeleteCourse = async (courseId) => {
        if (window.confirm("Are you sure you want to delete this course?")) {
            try {
                await axios.delete(`https://campus-bridge-lms.onrender.com/api/faculty/course/${courseId}`);
                alert("Course Deleted");
                fetchDashboardData(faculty.id);
            } catch (err) { alert("Failed to delete course"); }
        }
    };

    const handleEnroll = async (courseId, email) => {
        try {
            await axios.post("https://campus-bridge-lms.onrender.com/api/faculty/enroll", { courseId, studentEmail: email });
            alert("Student Enrolled!");
            fetchStudentsAndAttendance(courseId, selectedDate);
        } catch (err) { alert("Enrollment failed"); }
    };

    const handleUnenroll = async (courseId, studentId) => {
        if (window.confirm("Remove this student from the course?")) {
            try {
                await axios.post(`https://campus-bridge-lms.onrender.com/api/faculty/unenroll`, { courseId, studentId });
                alert("Student removed");
                fetchStudentsAndAttendance(courseId, selectedDate);
            } catch (err) { alert("Failed to unenroll"); }
        }
    };

    const fetchSchedule = async () => {
        try {
            const res = await axios.get(`https://campus-bridge-lms.onrender.com/api/faculty/schedule/${faculty.id}`);
            setSchedule(res.data || []);
        } catch (e) { setSchedule([]); }
    };

    const handleAddClass = async () => {
        if (!newClass.courseId || !newClass.startTime || !newClass.endTime || !newClass.room) return alert("Fill all fields");
        try {
            await axios.post("https://campus-bridge-lms.onrender.com/api/faculty/schedule", {
                facultyId: faculty.id, courseId: newClass.courseId, day_of_week: newClass.day,
                start_time: newClass.startTime, end_time: newClass.endTime, room_number: newClass.room
            });
            alert("Class Scheduled!");
            fetchSchedule();
            setNewClass({ courseId: "", day: "Monday", startTime: "", endTime: "", room: "" });
        } catch (err) { alert("Failed to schedule class"); }
    };

    const fetchMyLeaves = async () => {
        try {
            const res = await axios.get(`https://campus-bridge-lms.onrender.com/api/faculty/my-leaves/${faculty.id}`);
            setMyLeaves(res.data);
        } catch (err) { alert("Failed to fetch my leaves"); }
    };

    const handleDeleteClass = async (classId) => {
        if (window.confirm("Remove this class?")) {
            try {
                await axios.delete(`https://campus-bridge-lms.onrender.com/api/faculty/schedule/${classId}`);
                fetchSchedule();
            } catch (err) { alert("Failed to delete class"); }
        }
    };

    const fetchLeaves = async () => {
        try {
            const res = await axios.get(`https://campus-bridge-lms.onrender.com/api/faculty/leaves/${faculty.id}`);
            setLeaves(res.data || []);
        } catch (err) {
            setLeaves([{ id: 1, studentName: "John Doe", courseName: "Advanced AI", fromDate: "2026-05-24", toDate: "2026-05-26", reason: "Medical Emergency", status: "Pending" }]);
        }
    };

    const handleLeaveAction = async (leaveId, status) => {
        try {
            await axios.put(`https://campus-bridge-lms.onrender.com/api/faculty/leaves/${leaveId}`, { status });
            setLeaves(leaves.map(l => l.id === leaveId ? { ...l, status } : l));
            alert(`Leave request: ${status}`);
        } catch (err) { alert("Failed to process leave"); }
    };

    const fetchSubmissions = async () => {
        try {
            const res = await axios.get(`https://campus-bridge-lms.onrender.com/api/faculty/submissions/${faculty.id}`);
            setSubmissions(res.data || []);
        } catch (e) { setSubmissions([]); }
    };

    const handleGradeSubmission = async (sid, score, remark) => {
        if (!score) return alert("Please specify a validation grade metric.");
        try {
            await axios.post("https://campus-bridge-lms.onrender.com/api/faculty/grade", { submissionId: sid, score, remark });
            alert("Graded Successfully!");
            fetchSubmissions();
        } catch (err) { alert("Error saving evaluation record"); }
    };

    const handleSaveAttendance = async (date) => {
        try {
            await axios.post("https://campus-bridge-lms.onrender.com/api/faculty/attendance", { courseId: selectedCourseId, date, students });
            alert("Attendance Record Synchronized!");
            setIsAttendanceSaved(true);
            fetchAllPostedAttendance(faculty.id);
            return true;
        } catch (err) { alert("Error writing data register"); return false; }
    };

    const toggleAttendance = (id) => setStudents(prev => prev.map(s => s.id === id ? { ...s, attendance: s.attendance === "Present" ? "Absent" : "Present" } : s));
    const updateRemark = (id, text) => setStudents(prev => prev.map(s => s.id === id ? { ...s, remarks: text } : s));
    const handlePostAssignment = async () => {
        if (!newAssignment.courseId) return alert("Select a course");
        try {
            await axios.post("https://campus-bridge-lms.onrender.com/api/faculty/assignments", newAssignment);
            alert("Assignment Synchronized!");
            setNewAssignment({ title: '', subject: '', due: '', type: 'Code', courseId: '', autoDeleteDate: '' });
        } catch (err) { alert("Failed to broadcast assignment structure"); }
    };

    const handlePostCodingQuestion = async () => {
        if (!newCodingQuestion.title || !newCodingQuestion.description || !newCodingQuestion.publicInput || !newCodingQuestion.publicOutput) {
            return alert("Please fill title, problem statement, and at least one public test case.");
        }

        try {
            const payload = {
                title: newCodingQuestion.title,
                company: newCodingQuestion.company,
                topic: newCodingQuestion.topic,
                difficulty: newCodingQuestion.difficulty,
                description: newCodingQuestion.description,
                inputFormat: newCodingQuestion.inputFormat,
                outputFormat: newCodingQuestion.outputFormat,
                constraints: newCodingQuestion.constraints,
                starterCode: { java: newCodingQuestion.javaStarter },
                publicTests: [{ input: newCodingQuestion.publicInput, expectedOutput: newCodingQuestion.publicOutput }],
                privateTests: newCodingQuestion.privateInput && newCodingQuestion.privateOutput
                    ? [{ input: newCodingQuestion.privateInput, expectedOutput: newCodingQuestion.privateOutput }]
                    : []
            };
            await axios.post("https://campus-bridge-lms.onrender.com/api/coding/questions", payload);
            alert("Coding question posted. Students will see it in Coding Practice.");
        } catch (err) {
            alert(err.response?.data?.msg || "Failed to post coding question");
        }
    };

    const handleApplyLeave = async () => {
        if (!newLeave.fromDate || !newLeave.toDate || !newLeave.reason) return alert("Fill all leave fields");
        try {
            await axios.post("https://campus-bridge-lms.onrender.com/api/faculty/apply-leave", { ...newLeave, facultyId: faculty.id });
            alert("Leave Applied Successfully!");
            setNewLeave({ fromDate: "", toDate: "", reason: "" });
            fetchMyLeaves();
        } catch (err) { alert("Failed to apply for leave"); }
    };

    return (
        <div className="faculty-dashboard-container">
            <button className="mobile-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>

            <aside className={`faculty-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="logo"><FaChalkboardTeacher /> Faculty<span className="brand-highlight">Portal</span></div>
                <div className="sidebar-menu">
                    <div className={`menu-item ${activeMenu === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveMenu('dashboard'); setIsSidebarOpen(false); }}><FaClipboardList /> Dashboard</div>
                    <div className={`menu-item ${activeMenu === 'profile' ? 'active' : ''}`} onClick={() => { setActiveMenu('profile'); setIsSidebarOpen(false); }}><FaUser /> Profile</div>
                    <div className={`menu-item ${activeMenu === 'courses' ? 'active' : ''}`} onClick={() => { setActiveMenu('courses'); setIsSidebarOpen(false); }}><FaBook /> Courses</div>
                    <div className={`menu-item ${activeMenu === 'assignments' ? 'active' : ''}`} onClick={() => { setActiveMenu('assignments'); setIsSidebarOpen(false); }}><FaPlus /> Assignments</div>
                    <div className={`menu-item ${activeMenu === 'codingQuestions' ? 'active' : ''}`} onClick={() => { setActiveMenu('codingQuestions'); setIsSidebarOpen(false); }}><FaCode /> Coding Questions</div>
                    <div className={`menu-item ${activeMenu === 'attendance' ? 'active' : ''}`} onClick={() => { setActiveMenu('attendance'); setIsSidebarOpen(false); }}><FaUserCheck /> Attendance</div>
                    <div className={`menu-item ${activeMenu === 'myLeaves' ? 'active' : ''}`} onClick={() => { setActiveMenu('myLeaves'); setIsSidebarOpen(false); }}><FaEnvelopeOpenText /> Apply Leave</div>
                    <div className={`menu-item ${activeMenu === 'leaves' ? 'active' : ''}`} onClick={() => { setActiveMenu('leaves'); setIsSidebarOpen(false); }}><FaEnvelopeOpenText /> Student Leaves</div>
                    <div className={`menu-item ${activeMenu === 'grading' ? 'active' : ''}`} onClick={() => { setActiveMenu('grading'); setIsSidebarOpen(false); }}><FaGraduationCap /> Grading</div>
                    <div className={`menu-item ${activeMenu === 'schedule' ? 'active' : ''}`} onClick={() => { setActiveMenu('schedule'); setIsSidebarOpen(false); }}><FaCalendarAlt /> Schedule</div>
                    <div className={`menu-item ${activeMenu === 'settings' ? 'active' : ''}`} onClick={() => { setActiveMenu('settings'); setIsSidebarOpen(false); }}><FaCog /> Settings</div>
                    <div className="menu-item logout" onClick={() => navigate("/auth")}><FaSignOutAlt /> Logout</div>
                </div>
            </aside>

            <main className="faculty-main">
                <header className="faculty-header">
                    <div><h2>Welcome, {faculty.name}</h2><p className="subtitle">MBU Administration Engine</p></div>
                    <div className="avatar" onClick={() => setActiveMenu('profile')} style={{ cursor: 'pointer' }}>{faculty.name ? faculty.name[0] : "F"}</div>
                </header>
                <div className="scrollable-content">
                    <AnimatePresence mode="wait">
                        {activeMenu === 'dashboard' && (
                            <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="stats-grid">
                                <div className="stat-card"><div className="stat-icon" style={{ background: '#e0e7ff', color: '#6366f1' }}><FaBook /></div><div><h3>{stats.courses}</h3><p>Active Subjects</p></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: '#dcfce7', color: '#10b981' }}><FaUsers /></div><div><h3>{stats.students}</h3><p>Total Enrolled</p></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: '#ffedd5', color: '#f59e0b' }}><FaClipboardList /></div><div><h3>{stats.pending}</h3><p>Pending Evaluations</p></div></div>
                            </motion.div>
                        )}
                        {activeMenu === 'profile' && <ProfileView faculty={faculty} />}
                        {activeMenu === 'courses' && <CoursesView {...{ newCourse, setNewCourse, handleCreateCourse, handleDeleteCourse, courses, handleEnroll, handleUnenroll }} />}
                        {activeMenu === 'assignments' && <AssignmentsView {...{ newAssignment, setNewAssignment, handlePostAssignment, courses }} />}
                        {activeMenu === 'codingQuestions' && <CodingQuestionsView {...{ newCodingQuestion, setNewCodingQuestion, handlePostCodingQuestion }} />}
                        {activeMenu === 'attendance' && <AttendanceView {...{ courses, selectedCourseId, setSelectedCourseId, selectedDate, setSelectedDate, handleSaveAttendance, students, toggleAttendance, updateRemark, isAttendanceSaved, allPostedAttendance }} />}
                        {activeMenu === 'myLeaves' && <MyLeavesView {...{ myLeaves, newLeave, setNewLeave, handleApplyLeave }} />}
                        {activeMenu === 'leaves' && <LeavesView {...{ leaves, handleLeaveAction }} />}
                        {activeMenu === 'grading' && <GradingView submissions={submissions} handleGradeSubmission={handleGradeSubmission} refreshSubmissions={fetchSubmissions} />}
                        {activeMenu === 'schedule' && <ScheduleView {...{ newClass, setNewClass, courses, handleAddClass, handleDeleteClass, schedule }} />}
                        {activeMenu === 'settings' && <SettingsView user={faculty} />}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default FacultyDashboard;
