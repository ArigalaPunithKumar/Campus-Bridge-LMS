import React, { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import "../../apiConfig";
import {
    FaBookOpen, FaCode, FaChartLine, FaSignOutAlt, FaBell, FaUserGraduate,
    FaFire, FaCalendarAlt, FaClock, FaMoon, FaSun, FaRobot,
    FaPlay, FaExclamationCircle, FaTimes, FaSearch, FaCog,
    FaCloudUploadAlt, FaFileAlt, FaTrashAlt, FaCheckCircle, FaBars,
    FaUser, FaLock, FaEnvelopeOpenText, FaPalette, FaShieldAlt, FaPlus, FaHistory
} from "react-icons/fa";
import "./StudentDashboard.css";

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    exit: { opacity: 0 }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
};

const Skeleton = ({ className }) => <div className={`skeleton ${className}`} />;

const DashboardHome = ({ user, currentTime, courses, assignments, attendanceData, schedule, searchTerm, isLoading, streak, onOpenAssistant }) => {
    const activeAssignments = assignments.filter(a => a.status === 'pending').length;
    const avgAttendance = attendanceData.length > 0
        ? Math.round(attendanceData.reduce((acc, curr) => acc + (curr.attended / curr.total) * 100, 0) / attendanceData.length)
        : 0;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[currentTime.getDay()];

    const todaysClasses = schedule
        .filter(item => item.day_of_week === todayName)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

    const filteredCourses = courses.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="dashboard-grid">
                <Skeleton className="welcome-banner" />
                <div className="stats-row">
                    <Skeleton className="stat-card" /> <Skeleton className="stat-card" />
                    <Skeleton className="stat-card" /> <Skeleton className="stat-card" />
                </div>
                <div className="main-split">
                    <Skeleton className="card-section" /> <Skeleton className="card-section" />
                </div>
            </div>
        );
    }

    return (
        <motion.div className="dashboard-grid" variants={pageVariants} initial="initial" animate="in" exit="out">
            <div className="welcome-banner">
                <div className="banner-text">
                    <h1>Hello, {user.name}! 👋</h1>
                    <p>You have <strong>{activeAssignments} assignments</strong> due soon.</p>
                </div>
                <div className="banner-illustration"><FaCode size={80} opacity={0.2} /></div>
            </div>

            <div className="stats-row">
                <StatCard icon={<FaBookOpen />} title="Enrolled Courses" value={courses.length} color="#6366f1" />
                <StatCard icon={<FaCheckCircle />} title="Avg Attendance" value={`${avgAttendance}%`} color="#10b981" />
                <StatCard icon={<FaFire />} title="Streak" value={`${streak.currentStreak} ${streak.currentStreak === 1 ? "Day" : "Days"}`} color="#f59e0b" />
                <StatCard icon={<FaCode />} title="Total Assignments" value={assignments.length} color="#ec4899" />
            </div>

            <div className="main-split">
                <div className="card-section schedule-card">
                    <div className="card-header">
                        <h3><FaCalendarAlt /> Today's Schedule ({todayName})</h3>
                    </div>
                    <div className="timeline">
                        {todaysClasses.length === 0 ? (
                            <div className="no-data-text">
                                <p>No classes scheduled for today.</p>
                                <small>Enjoy your free time! 🎉</small>
                            </div>
                        ) : (
                            todaysClasses.map((cls, idx) => (
                                <div key={idx} className="timeline-item">
                                    <div className="time">{cls.start_time.substring(0, 5)}</div>
                                    <div className="details">
                                        <h4>{cls.course_name} <span className="code-badge">{cls.course_code}</span></h4>
                                        <small>{cls.room_number ? `Room: ${cls.room_number}` : 'Online'} • {cls.faculty_name}</small>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="card-section courses-card">
                    <div className="card-header"><h3>My Courses</h3></div>
                    <div className="course-list">
                        {filteredCourses.length === 0 ? (
                            <p className="no-data-text">No courses found matching your search.</p>
                        ) : (
                            filteredCourses.map(c => (
                                <div key={c.id} className="course-item">
                                    <div className="course-details">
                                        <h4>{c.name}</h4>
                                        <small>{c.code}</small>
                                    </div>
                                    <div className="course-icon-box" style={{ background: c.color || '#e0e7ff' }}>
                                        <FaBookOpen />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="card-section dashboard-ai-card">
                    <div className="card-header"><h3><FaRobot /> Campus AI</h3></div>
                    <div className="dashboard-ai-body">
                        <p>Ask about attendance, assignments, timetable, leave, notifications, password reset, courses, or coding practice.</p>
                        <button type="button" onClick={onOpenAssistant}><FaRobot /> Open AI Help</button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const TimetableView = ({ schedule }) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return (
        <motion.div className="assignments-container" variants={pageVariants} initial="initial" animate="in" exit="out">
            <div className="assignments-header"><h2>Weekly Timetable</h2></div>
            <div className="timetable-grid">
                {days.map(day => (
                    <div key={day} className="day-column">
                        <div className="day-header">{day}</div>
                        <div className="day-content">
                            {schedule.filter(s => s.day_of_week === day).length === 0 ? (
                                <div className="free-slot">No Classes</div>
                            ) : (
                                schedule.filter(s => s.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time)).map((cls, idx) => (
                                    <div key={idx} className="class-card">
                                        <span className="time-badge">{cls.start_time.substring(0, 5)} - {cls.end_time.substring(0, 5)}</span>
                                        <h4>{cls.course_name}</h4>
                                        <small>{cls.room_number || "TBA"}</small>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

// eslint-disable-next-line no-unused-vars
const OldCodingArena = ({ user, selectedLanguage, setSelectedLanguage, code, setCode, isRunning, setIsRunning, compilerInput, setCompilerInput, compilerOutput, setCompilerOutput }) => {
    const [mobileTab, setMobileTab] = useState('code');
    const [questions, setQuestions] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [publicTests, setPublicTests] = useState([]);
    const [runResults, setRunResults] = useState([]);
    const [expectedOutput, setExpectedOutput] = useState("");
    const [customOutput, setCustomOutput] = useState("");
    const [showCustomRunner, setShowCustomRunner] = useState(false);

    const getStarterCode = (question, language) => {
        return question?.starterCode?.[language] || {
            python: 'print("Hello Campus Bridge!")',
            javascript: 'console.log("Hello Campus Bridge!");',
            java: 'public class Main {\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println("Hello World");\n\t}\n}',
            cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n\tcout << "Hello World";\n\treturn 0;\n}'
        }[language];
    };

    const loadQuestionDetail = async (questionId, language = selectedLanguage) => {
        try {
            const res = await axios.get(`https://campus-bridge-lms.onrender.com/api/coding/questions/${questionId}`);
            setSelectedQuestion(res.data);
            setPublicTests(res.data.publicTests || []);
            setRunResults([]);
            setCompilerOutput("");
            setCustomOutput("");
            setCompilerInput("");
            setExpectedOutput("");
            setShowCustomRunner(false);
            setMobileTab('code');
            setCode(getStarterCode(res.data, language));
        } catch (err) {
            alert("Unable to load the selected coding question.");
        }
    };

    useEffect(() => {
        const loadQuestions = async () => {
            try {
                const res = await axios.get("https://campus-bridge-lms.onrender.com/api/coding/questions");
                const list = res.data || [];
                setQuestions(list);
                if (list.length > 0) {
                    loadQuestionDetail(list[0].id, selectedLanguage);
                }
            } catch (err) {
                setCompilerOutput("Could not load coding questions from the backend.");
            }
        };

        loadQuestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLanguageChange = (e) => {
        const nextLanguage = e.target.value;
        setSelectedLanguage(nextLanguage);
        setCode(getStarterCode(selectedQuestion, nextLanguage));
    };

    const handleRunPublicTests = async () => {
        if (!selectedQuestion) return alert("Select a coding question first.");
        setIsRunning(true);
        setCompilerOutput("Running public test cases...");
        setMobileTab('output');
        try {
            const res = await axios.post(`https://campus-bridge-lms.onrender.com/api/coding/questions/${selectedQuestion.id}/run`, {
                language: selectedLanguage,
                code
            });
            setRunResults(res.data.results || []);
            setCompilerOutput(`Public tests: ${res.data.passed}/${res.data.total} passed`);
            setShowCustomRunner(true);
        } catch (error) {
            setCompilerOutput("Server Error: Could not run public tests.");
        } finally {
            setIsRunning(false);
        }
    };

    const handleRunCustomInput = async () => {
        if (!selectedQuestion) return alert("Select a coding question first.");
        if (!showCustomRunner) return alert("Run the public tests first, then enter custom input.");

        setIsRunning(true);
        setCustomOutput("Running custom input...");
        setMobileTab('output');
        try {
            const res = await axios.post(`https://campus-bridge-lms.onrender.com/api/coding/questions/${selectedQuestion.id}/run`, {
                language: selectedLanguage,
                code,
                customInput: compilerInput,
                expectedOutput
            });
            const resultText = res.data.passed === null
                ? res.data.output
                : `${res.data.passed ? "Matched expected output" : "Did not match expected output"}\n\n${res.data.output}`;
            setCustomOutput(resultText);
        } catch (error) {
            setCustomOutput("Server Error: Could not run custom input.");
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmitSolution = async () => {
        if (!selectedQuestion) return alert("Select a coding question first.");

        setIsRunning(true);
        setCompilerOutput("Submitting against public and private test cases...");
        setMobileTab('output');
        try {
            const res = await axios.post(`https://campus-bridge-lms.onrender.com/api/coding/questions/${selectedQuestion.id}/submit`, {
                language: selectedLanguage,
                code,
                studentId: user.id
            });
            setRunResults(res.data.results || []);
            setCompilerOutput(`${res.data.status}: ${res.data.passed}/${res.data.total} tests passed. Score ${res.data.score}%`);
            setShowCustomRunner(true);
        } catch (error) {
            setCompilerOutput("Server Error: Could not submit the solution.");
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <motion.div className="compiler-container" variants={pageVariants} initial="initial" animate="in" exit="out">
            <div className="compiler-header">
                <div className="lang-selector compiler-title-group">
                    <div>
                        <h2>Coding Practice</h2>
                        <p>{selectedQuestion ? `${selectedQuestion.company} • ${selectedQuestion.difficulty}` : "Select a question to begin"}</p>
                    </div>
                    <select value={selectedLanguage} onChange={handleLanguageChange}>
                        <option value="javascript">JavaScript (Node 18)</option>
                        <option value="python">Python 3.10</option>
                        <option value="java">Java 15</option>
                        <option value="cpp">C++ (GCC)</option>
                    </select>
                </div>
                <div className="compiler-controls">
                    <button className="run-btn" onClick={handleRunPublicTests} disabled={isRunning || !selectedQuestion}>
                        {isRunning ? <FaExclamationCircle className="spin" /> : <FaPlay />}
                        {isRunning ? " Running..." : " Run Public Tests"}
                    </button>
                    <button className="submit-solution-btn" onClick={handleSubmitSolution} disabled={isRunning || !selectedQuestion}>
                        <FaCheckCircle /> Submit
                    </button>
                </div>
            </div>

            <div className="compiler-mobile-tabs">
                <button className={mobileTab === 'question' ? 'active' : ''} onClick={() => setMobileTab('question')}>Question</button>
                <button className={mobileTab === 'code' ? 'active' : ''} onClick={() => setMobileTab('code')}>Code</button>
                <button className={mobileTab === 'output' ? 'active' : ''} onClick={() => setMobileTab('output')}>Output</button>
            </div>

            <div className="practice-shell">
                <div className="problem-column">
                    <div className={`question-list-panel ${mobileTab === 'question' ? 'mobile-visible' : 'mobile-hidden'}`}>
                        <div className="pane-label">Problems</div>
                        <div className="question-list">
                            {questions.map((question, index) => (
                                <button
                                    key={question.id}
                                    className={`question-list-item ${selectedQuestion?.id === question.id ? 'active' : ''}`}
                                    onClick={() => loadQuestionDetail(question.id)}
                                >
                                    <span>{index + 1}. {question.title}</span>
                                    <small>{question.company} • {question.difficulty}</small>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={`question-detail-panel ${mobileTab === 'question' ? 'mobile-visible' : 'mobile-hidden'}`}>
                        {selectedQuestion ? (
                            <>
                                <div className="question-heading">
                                    <div>
                                        <h3>{selectedQuestion.title}</h3>
                                        <span className={`difficulty-pill ${selectedQuestion.difficulty.toLowerCase()}`}>{selectedQuestion.difficulty}</span>
                                    </div>
                                    <span className="company-pill">Asked by {selectedQuestion.company}</span>
                                </div>
                                <p>{selectedQuestion.description}</p>
                                <div className="question-meta-grid">
                                    <div><strong>Input</strong><span>{selectedQuestion.inputFormat}</span></div>
                                    <div><strong>Output</strong><span>{selectedQuestion.outputFormat}</span></div>
                                    <div><strong>Constraints</strong><span>{selectedQuestion.constraints}</span></div>
                                    <div><strong>Tests</strong><span>{selectedQuestion.publicTestCount} public, {selectedQuestion.privateTestCount} private</span></div>
                                </div>
                                <div className="public-tests">
                                    {publicTests.map((test, index) => (
                                        <div key={test.id} className="public-test-card">
                                            <strong>Sample {index + 1}</strong>
                                            <code>Input: {test.input}</code>
                                            <code>Output: {test.expectedOutput}</code>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="no-data-text">No coding question selected.</p>
                        )}
                    </div>
                </div>

                <div className="workbench-column">
                    <div className={`editor-pane ${mobileTab === 'code' ? 'mobile-visible' : 'mobile-hidden'}`}>
                        <div className="pane-label">Source Code</div>
                        <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck="false" className="code-editor" />
                    </div>
                    <div className="io-pane">
                        <div className={`output-section ${mobileTab === 'output' ? 'mobile-visible' : 'mobile-hidden'}`}>
                            <div className="pane-label">Run Result</div>
                            <div className="test-results-panel">
                                <pre className={isRunning ? "pulse" : ""}>{compilerOutput || "Run public tests first. Custom input unlocks after the first run."}</pre>
                                {runResults.map(result => (
                                    <div key={`${result.visibility}-${result.id}`} className={`test-result-card ${result.passed ? 'passed' : 'failed'}`}>
                                        <div>
                                            <strong>{result.name}</strong>
                                            <span>{result.passed ? "Passed" : "Failed"}</span>
                                        </div>
                                        {result.input ? <code>Input: {result.input}</code> : <code>Private input hidden</code>}
                                        {result.expectedOutput ? <code>Expected: {result.expectedOutput}</code> : <code>Expected output hidden</code>}
                                        {result.actualOutput && <code>Actual: {result.actualOutput}</code>}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className={`input-section custom-input-section ${mobileTab === 'output' ? 'mobile-visible' : 'mobile-hidden'} ${showCustomRunner ? '' : 'locked'}`}>
                            <div className="pane-label">Custom Input</div>
                            {!showCustomRunner ? (
                                <div className="custom-input-lock">Run public tests once to unlock custom input and output checking.</div>
                            ) : (
                                <>
                                    <textarea value={compilerInput} onChange={(e) => setCompilerInput(e.target.value)} placeholder="Enter custom input after running..." />
                                    <textarea value={expectedOutput} onChange={(e) => setExpectedOutput(e.target.value)} placeholder="Optional expected output..." />
                                    <button className="custom-run-btn" onClick={handleRunCustomInput} disabled={isRunning}>
                                        <FaPlay /> Run Custom Input
                                    </button>
                                    {customOutput && <pre className="custom-output">{customOutput}</pre>}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const formatDuration = (seconds) => {
    const safeSeconds = Math.max(0, seconds);
    const hours = Math.floor(safeSeconds / 3600).toString().padStart(2, "0");
    const minutes = Math.floor((safeSeconds % 3600) / 60).toString().padStart(2, "0");
    const secs = Math.floor(safeSeconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${secs}`;
};

const CodingArena = ({ user, onExit, selectedLanguage, setSelectedLanguage, code, setCode, isRunning, setIsRunning, compilerInput, setCompilerInput, compilerOutput, setCompilerOutput }) => {
    const [mobileTab, setMobileTab] = useState("question");
    const [questions, setQuestions] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [publicTests, setPublicTests] = useState([]);
    const [runResults, setRunResults] = useState([]);
    const [expectedOutput, setExpectedOutput] = useState("");
    const [customOutput, setCustomOutput] = useState("");
    const [customInputEnabled, setCustomInputEnabled] = useState(false);
    const [aiReview, setAiReview] = useState("");
    const [lastReport, setLastReport] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showCodingAssistant, setShowCodingAssistant] = useState(false);
    const [answeredQuestionIds, setAnsweredQuestionIds] = useState([]);
    const [visitedQuestionIds, setVisitedQuestionIds] = useState([]);
    const [testSeconds, setTestSeconds] = useState(30 * 60 + 5);
    const [sectionSeconds, setSectionSeconds] = useState(25 * 60 + 7);
    const [selectedTopic, setSelectedTopic] = useState("All");

    const topics = ["All", ...new Set(questions.map(q => q.topic || "General"))];
    const filteredQuestions = selectedTopic === "All" ? questions : questions.filter(q => (q.topic || "General") === selectedTopic);

    const selectedIndex = filteredQuestions.findIndex(question => question.id === selectedQuestion?.id);
    const selectedNumber = selectedIndex >= 0 ? selectedIndex + 1 : 0;
    const publicPassed = runResults.filter(result => result.visibility === "public" && result.passed).length;

    const getStarterCode = (question, language) => {
        return question?.starterCode?.[language] || {
            python: 'print("Hello Campus Bridge!")',
            javascript: 'console.log("Hello Campus Bridge!");',
            java: 'class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}',
            cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}'
        }[language];
    };

    const markVisited = (questionId) => {
        setVisitedQuestionIds(prev => prev.includes(questionId) ? prev : [...prev, questionId]);
    };

    const loadQuestionDetail = async (questionId, language = selectedLanguage) => {
        try {
            const res = await axios.get(`https://campus-bridge-lms.onrender.com/api/coding/questions/${questionId}`);
            setSelectedQuestion(res.data);
            setPublicTests(res.data.publicTests || []);
            setRunResults([]);
            setCompilerOutput("");
            setCustomOutput("");
            setCompilerInput("");
            setExpectedOutput("");
            setCustomInputEnabled(false);
            setAiReview("");
            setLastReport(null);
            setMobileTab("code");
            setCode(getStarterCode(res.data, language));
            markVisited(res.data.id);
        } catch (err) {
            alert("Unable to load the selected coding question.");
        }
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setTestSeconds(prev => Math.max(0, prev - 1));
            setSectionSeconds(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener("fullscreenchange", syncFullscreen);
        return () => document.removeEventListener("fullscreenchange", syncFullscreen);
    }, []);

    useEffect(() => {
        const loadQuestions = async () => {
            try {
                const res = await axios.get("https://campus-bridge-lms.onrender.com/api/coding/questions");
                const list = res.data || [];
                setQuestions(list);
                const firstQuestion = list.find(question => question.slug === "checkerboard-pattern") || list[0];
                if (firstQuestion) loadQuestionDetail(firstQuestion.id, selectedLanguage);
            } catch (err) {
                setCompilerOutput("Could not load coding questions from the backend.");
            }
        };

        loadQuestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLanguageChange = (e) => {
        const nextLanguage = e.target.value;
        setSelectedLanguage(nextLanguage);
        setCode(getStarterCode(selectedQuestion, nextLanguage));
    };

    const goToQuestion = (direction) => {
        const nextIndex = selectedIndex + direction;
        if (nextIndex < 0 || nextIndex >= filteredQuestions.length) return;
        loadQuestionDetail(filteredQuestions[nextIndex].id);
    };

    const handleRunPublicTests = async () => {
        if (!selectedQuestion) return alert("Select a coding question first.");
        setIsRunning(true);
        setCompilerOutput("Running public test cases...");
        setMobileTab("output");
        try {
            const res = await axios.post(`https://campus-bridge-lms.onrender.com/api/coding/questions/${selectedQuestion.id}/run`, {
                language: selectedLanguage,
                code
            });
            setRunResults(res.data.results || []);
            setCompilerOutput(`Public tests: ${res.data.passed}/${res.data.total} passed`);
            setLastReport({
                type: "Public Run",
                status: "Public Tests",
                score: null,
                passed: res.data.passed,
                total: res.data.total,
                results: res.data.results || [],
                aiReview: ""
            });
        } catch (error) {
            setCompilerOutput("Server Error: Could not run public tests.");
        } finally {
            setIsRunning(false);
        }
    };

    const handleRunCustomInput = async () => {
        if (!selectedQuestion) return alert("Select a coding question first.");
        setIsRunning(true);
        setCustomOutput("Running custom input...");
        setMobileTab("output");
        try {
            const res = await axios.post(`https://campus-bridge-lms.onrender.com/api/coding/questions/${selectedQuestion.id}/run`, {
                language: selectedLanguage,
                code,
                customInput: compilerInput,
                expectedOutput
            });
            const resultText = res.data.passed === null
                ? res.data.output
                : `${res.data.passed ? "Matched expected output" : "Did not match expected output"}\n\n${res.data.output}`;
            setCustomOutput(resultText);
            setLastReport({
                type: "Custom Input",
                status: res.data.passed === null ? "Executed" : (res.data.passed ? "Matched" : "Mismatch"),
                score: null,
                passed: res.data.passed === true ? 1 : 0,
                total: res.data.passed === null ? 0 : 1,
                results: [],
                aiReview: "",
                customOutput: resultText
            });
        } catch (error) {
            setCustomOutput("Server Error: Could not run custom input.");
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmitSolution = async () => {
        if (!selectedQuestion) return alert("Select a coding question first.");

        setIsRunning(true);
        setCompilerOutput("Submitting against public and private test cases...");
        setMobileTab("output");
        try {
            const res = await axios.post(`https://campus-bridge-lms.onrender.com/api/coding/questions/${selectedQuestion.id}/submit`, {
                language: selectedLanguage,
                code,
                studentId: user.id
            });
            setRunResults(res.data.results || []);
            setCompilerOutput(`${res.data.status}: ${res.data.passed}/${res.data.total} tests passed. Score ${res.data.score}%`);
            setAiReview(res.data.aiReview || "AI review is not available for this submission.");
            setLastReport({
                type: "Submission",
                status: res.data.status,
                score: res.data.score,
                passed: res.data.passed,
                total: res.data.total,
                results: res.data.results || [],
                aiReview: res.data.aiReview || ""
            });
            setAnsweredQuestionIds(prev => prev.includes(selectedQuestion.id) ? prev : [...prev, selectedQuestion.id]);
        } catch (error) {
            setCompilerOutput("Server Error: Could not submit the solution.");
        } finally {
            setIsRunning(false);
        }
    };

    const getQuestionState = (questionId) => {
        if (answeredQuestionIds.includes(questionId)) return "answered";
        if (visitedQuestionIds.includes(questionId)) return "not-answered";
        return "not-visited";
    };

    const toggleFullscreen = async () => {
        const target = document.querySelector(".assessment-container");
        try {
            if (!document.fullscreenElement && target?.requestFullscreen) {
                await target.requestFullscreen();
            } else if (document.exitFullscreen) {
                await document.exitFullscreen();
            }
        } catch (err) {
            setIsFullscreen(prev => !prev);
        }
    };

    const downloadReport = () => {
        if (!lastReport || !selectedQuestion) return;
        const resultLines = (lastReport.results || []).map((result, index) =>
            `${index + 1}. ${result.name}: ${result.passed ? "Passed" : "Failed"}`
        ).join("\n");
        const report = [
            "Campus Bridge Coding Report",
            `Student: ${user.name || "Student"}`,
            `Question: ${selectedQuestion.title}`,
            `Company: ${selectedQuestion.company}`,
            `Language: ${selectedLanguage}`,
            `Run Type: ${lastReport.type}`,
            `Status: ${lastReport.status}`,
            lastReport.score !== null && lastReport.score !== undefined ? `Score: ${lastReport.score}%` : null,
            `Passed: ${lastReport.passed}/${lastReport.total}`,
            "",
            "AI Review:",
            lastReport.aiReview || aiReview || "Not available.",
            "",
            "Results:",
            resultLines || lastReport.customOutput || "No detailed test result data."
        ].filter(Boolean).join("\n");

        const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${selectedQuestion.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-report.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <motion.div className={`compiler-container assessment-container ${isFullscreen ? "fullscreen-active" : ""}`} variants={pageVariants} initial="initial" animate="in" exit="out">
            <div className="assessment-header">
                <div>
                    <h1>Coding Assessment</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                        <select 
                            value={selectedTopic} 
                            onChange={(e) => {
                                setSelectedTopic(e.target.value);
                                const newFiltered = e.target.value === "All" ? questions : questions.filter(q => (q.topic || "General") === e.target.value);
                                if (newFiltered.length > 0) {
                                    loadQuestionDetail(newFiltered[0].id, selectedLanguage);
                                } else {
                                    setSelectedQuestion(null);
                                }
                            }}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            {topics.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <p style={{ margin: 0 }}>{selectedQuestion ? `${selectedQuestion.company} coding question` : "Select a topic/question to begin"}</p>
                    </div>
                </div>
                <div className="assessment-header-actions">
                    <button className={`assessment-ai-btn ${showCodingAssistant ? "active" : ""}`} onClick={() => setShowCodingAssistant(prev => !prev)}>
                        <FaRobot /> AI Help
                    </button>
                    <button className="assessment-exit-btn" onClick={onExit}>Back to LMS</button>
                </div>
            </div>

            <div className="compiler-mobile-tabs">
                <button className={mobileTab === "question" ? "active" : ""} onClick={() => setMobileTab("question")}>Problem</button>
                <button className={mobileTab === "code" ? "active" : ""} onClick={() => setMobileTab("code")}>Code</button>
                <button className={mobileTab === "output" ? "active" : ""} onClick={() => setMobileTab("output")}>Status</button>
            </div>

            <div className="assessment-grid">
                <section className={`problem-panel ${mobileTab === "question" ? "mobile-visible" : "mobile-hidden"}`}>
                    {filteredQuestions.length === 0 ? (
                        <h3 className="no-data-text" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No coding questions available for this topic.</h3>
                    ) : selectedQuestion ? (
                        <>
                            <h2>{selectedQuestion.title}</h2>
                            <span className="company-line">Company: {selectedQuestion.company}</span>
                            <div className="problem-section">
                                <h3>Problem</h3>
                                <p>{selectedQuestion.description}</p>
                            </div>
                            <div className="problem-section">
                                <h3>Input Format</h3>
                                <p>{selectedQuestion.inputFormat}</p>
                            </div>
                            <div className="problem-section">
                                <h3>Output Format</h3>
                                <p>{selectedQuestion.outputFormat}</p>
                            </div>
                            <div className="problem-section">
                                <h3>Constraints</h3>
                                <p>{selectedQuestion.constraints}</p>
                            </div>
                            <div className="problem-section">
                                <h3>Sample Inputs & Outputs</h3>
                                {publicTests.map((test, index) => (
                                    <div key={test.id} className="sample-block">
                                        <h4>Sample Input {index + 1}</h4>
                                        <pre>{test.input}</pre>
                                        <h4>Sample Output {index + 1}</h4>
                                        <pre>{test.expectedOutput}</pre>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="no-data-text">No coding question selected.</p>
                    )}
                </section>

                <section className={`coding-panel ${mobileTab === "code" ? "mobile-visible" : "mobile-hidden"}`}>
                    <div className="question-nav-row">
                        <span>Question {selectedNumber || "-"} of {filteredQuestions.length || "-"}</span>
                        <div>
                            <button onClick={() => goToQuestion(-1)} disabled={selectedIndex <= 0}>Previous</button>
                            <button onClick={() => goToQuestion(1)} disabled={selectedIndex < 0 || selectedIndex >= filteredQuestions.length - 1}>Next</button>
                        </div>
                    </div>
                    <div className="assessment-editor-card">
                        <div className="assessment-editor-toolbar">
                            <select value={selectedLanguage} onChange={handleLanguageChange}>
                                <option value="java">Java</option>
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="cpp">C++</option>
                            </select>
                            <button onClick={toggleFullscreen} title={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}>{isFullscreen ? "Exit" : "Full"}</button>
                        </div>
                        <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck="false" className="assessment-code-editor" />
                        <div className="assessment-editor-footer">
                            <label className="custom-toggle">
                                <input
                                    type="checkbox"
                                    checked={customInputEnabled}
                                    onChange={(e) => setCustomInputEnabled(e.target.checked)}
                                />
                                <span></span>
                                Run with custom input
                            </label>
                            <div className="footer-actions">
                                <button className="run-code-btn" onClick={customInputEnabled ? handleRunCustomInput : handleRunPublicTests} disabled={isRunning || !selectedQuestion}>
                                    {isRunning ? "Running..." : "Run code"}
                                </button>
                                <button className="submit-code-btn" onClick={handleSubmitSolution} disabled={isRunning || !selectedQuestion}>Submit code</button>
                            </div>
                        </div>
                    </div>

                    {customInputEnabled && (
                        <div className="custom-input-box">
                            <textarea value={compilerInput} onChange={(e) => setCompilerInput(e.target.value)} placeholder="Custom input" />
                            <textarea value={expectedOutput} onChange={(e) => setExpectedOutput(e.target.value)} placeholder="Expected output (optional)" />
                        </div>
                    )}

                    <div className={`result-panel ${mobileTab === "output" ? "mobile-visible" : "mobile-hidden"}`}>
                        <h3>Output</h3>
                        <pre className={isRunning ? "pulse" : ""}>{customInputEnabled && customOutput ? customOutput : (compilerOutput || "Run code to view public test output.")}</pre>
                        <div className="test-summary-row">
                            <span>{publicPassed}/{publicTests.length} public cases passed</span>
                            <span>{selectedQuestion?.privateTestCount || 0} private cases on submit</span>
                        </div>
                        {aiReview && (
                            <div className="ai-review-card">
                                <h4>AI Evaluation</h4>
                                <p>{aiReview}</p>
                                <button onClick={downloadReport}>Download report</button>
                            </div>
                        )}
                        {lastReport && !aiReview && (
                            <button className="download-report-btn" onClick={downloadReport}>Download report</button>
                        )}
                        {runResults.map(result => (
                            <div key={`${result.visibility}-${result.id}`} className={`assessment-result-case ${result.passed ? "passed" : "failed"}`}>
                                <strong>{result.name}</strong>
                                <span>{result.passed ? "Passed" : "Failed"}</span>
                                {result.input && <code>Input: {result.input}</code>}
                                {result.expectedOutput && <code>Expected: {result.expectedOutput}</code>}
                                {result.actualOutput && <code>Actual: {result.actualOutput}</code>}
                            </div>
                        ))}
                    </div>
                </section>

                <aside className={`assessment-sidebar-panel ${mobileTab === "output" ? "mobile-visible" : "mobile-hidden"}`}>
                    <h3>Sections</h3>
                    <div className="section-pill">
                        <FaLock />
                        <span>Coding Questions</span>
                        <small>25mins</small>
                    </div>

                    <h3>Questions</h3>
                    <div className="question-chip-grid">
                        {questions.map((question, index) => (
                            <button
                                key={question.id}
                                className={`question-chip ${getQuestionState(question.id)} ${selectedQuestion?.id === question.id ? "active" : ""}`}
                                onClick={() => loadQuestionDetail(question.id)}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>

                    <div className="assessment-legend">
                        <div><span className="legend-number answered">{answeredQuestionIds.length}</span> Answered</div>
                        <div><span className="legend-number not-answered">{visitedQuestionIds.filter(id => !answeredQuestionIds.includes(id)).length}</span> Not Answered</div>
                        <div><span className="legend-number not-visited">{Math.max(0, questions.length - visitedQuestionIds.length)}</span> Not Visited</div>
                    </div>

                    <div className="timer-card">
                        <span>Time left for test</span>
                        <strong>{formatDuration(testSeconds)}</strong>
                    </div>
                    <div className="timer-card">
                        <span>Time left for section</span>
                        <strong>{formatDuration(sectionSeconds)}</strong>
                    </div>
                </aside>
            </div>

            <ChatAssistant
                showAssistant={showCodingAssistant}
                setShowAssistant={setShowCodingAssistant}
                code={code}
                language={selectedLanguage}
                mode="coding"
                questionContext={selectedQuestion}
            />
        </motion.div>
    );
};

const AttendanceAnalytics = ({ attendanceData }) => {
    const chartColors = [
        ["#2563eb", "#38bdf8"],
        ["#16a34a", "#86efac"],
        ["#f97316", "#facc15"],
        ["#9333ea", "#f0abfc"],
        ["#dc2626", "#fb7185"],
        ["#0f766e", "#5eead4"]
    ];

    return (
        <motion.div className="analytics-wrapper colorful-attendance" variants={pageVariants} initial="initial" animate="in" exit="out">
            <div className="chart-header">
                <div>
                    <h2>Attendance Analytics</h2>
                    <p>Colorful subject-wise attendance bar chart</p>
                </div>
                <div className="legend"><span className="dot safe"></span> Safe (&gt;75%) <span className="dot danger"></span> Low (&lt;75%)</div>
            </div>
            <div className="bars-container">
                {attendanceData.length === 0 ? <p className="no-data-text">No attendance records found.</p> : attendanceData.map((sub, i) => {
                    const percentage = sub.total === 0 ? 0 : Math.round((sub.attended / sub.total) * 100);
                    const isLow = percentage < 75;
                    const colors = chartColors[i % chartColors.length];
                    return (
                        <div key={i} className="bar-group colorful-bar-card">
                            <div className="bar-labels"><span>{sub.subject}</span><span>{percentage}%</span></div>
                            <div className="bar-track">
                                <motion.div
                                    className={`bar-fill ${isLow ? 'low' : ''}`}
                                    style={{ background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})` }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ delay: i * 0.1 }}
                                />
                            </div>
                            <small>{sub.attended}/{sub.total} Classes attended</small>
                        </div>
                    )
                })}
            </div>
        </motion.div>
    );
};

const AssignmentsView = ({ assignments, setAssignments, user, code }) => {
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('active');
    };
    const handleDragLeave = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('active');
    };
    const handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('active');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedAssignment) return;
        if (!file && !code) return alert("Please upload a file or write code in the compiler to submit.");

        setUploading(true);
        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += 20;
            setProgress(currentProgress);
            if (currentProgress >= 100) clearInterval(interval);
        }, 100);

        try {
            const formData = new FormData();
            formData.append("assignmentId", selectedAssignment.id);
            formData.append("studentId", user.id);
            if (file) formData.append("file", file);
            formData.append("code", code || "");

            await axios.post("https://campus-bridge-lms.onrender.com/api/student/submit", formData);

            setTimeout(() => {
                setAssignments(prev => prev.map(a => a.id === selectedAssignment.id ? { ...a, status: "submitted" } : a));
                setUploading(false);
                setSelectedAssignment(null);
                setFile(null);
                setProgress(0);
                alert("Assignment Submitted Successfully!");
            }, 800);
        } catch (error) {
            setUploading(false);
            alert("Failed to submit assignment.");
        }
    };

    return (
        <motion.div className="assignments-container" variants={pageVariants} initial="initial" animate="in" exit="out">
            <div className="assignments-header"><h2>Assignments</h2></div>
            <div className="assignments-grid">
                {assignments.length === 0 ? <p className="no-data-text">No pending assignments!</p> : assignments.map(assign => (
                    <div key={assign.id} className={`assignment-card ${assign.status}`}>
                        <div className="assign-badge">{assign.type}</div>
                        <h3>{assign.title}</h3>
                        <p className="assign-sub">{assign.subject}</p>
                        <div className="assign-meta">
                            {assign.status === "graded" ? (
                                <span className="status-tag success"><FaCheckCircle /> Graded: <strong>{assign.score}/100</strong></span>
                            ) : assign.status === "submitted" ? (
                                <span className="status-tag success"><FaCheckCircle /> Submitted</span>
                            ) : (
                                <span className="status-tag pending"><FaClock /> Due: {assign.due ? new Date(assign.due).toLocaleDateString() : "TBA"}</span>
                            )}
                        </div>
                        {assign.status === "pending" && (
                            <button className="upload-trigger-btn" onClick={() => setSelectedAssignment(assign)}>Submit Work</button>
                        )}
                    </div>
                ))}
            </div>
            <AnimatePresence>
                {selectedAssignment && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="upload-modal" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
                            <div className="modal-header">
                                <h3>Submit: {selectedAssignment.title}</h3>
                                <button className="close-btn" onClick={() => { setSelectedAssignment(null); setFile(null); }}><FaTimes /></button>
                            </div>
                            <div className={`drop-zone ${file ? 'active' : ''}`}
                                onClick={() => fileInputRef.current.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}>
                                <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} />
                                {file ? (
                                    <div className="file-preview">
                                        <FaFileAlt size={40} color="#6366f1" />
                                        <div className="file-info"><span>{file.name}</span><small>{(file.size / 1024).toFixed(2)} KB</small></div>
                                        {!uploading && <button className="remove-file" onClick={(e) => { e.stopPropagation(); setFile(null); }}><FaTrashAlt /></button>}
                                    </div>
                                ) : (
                                    <div className="upload-placeholder"><FaCloudUploadAlt size={50} /><p>Drag & drop or click to browse</p></div>
                                )}
                            </div>
                            {uploading && <div className="upload-progress-container"><div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${progress}%` }} /></div><span>Uploading... {progress}%</span></div>}
                            <div className="modal-footer">
                                <button className="cancel-btn" onClick={() => setSelectedAssignment(null)} disabled={uploading}>Cancel</button>
                                <button className="confirm-upload-btn" onClick={handleUpload} disabled={!file || uploading}>{uploading ? "Uploading..." : "Upload Assignment"}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const LeaveApplicationView = ({ user, courses }) => {
    const [leaveForm, setLeaveForm] = useState({ courseId: "", fromDate: "", toDate: "", reason: "" });
    const [leaveHistory, setLeaveHistory] = useState([]);

    const fetchLeaveHistory = useCallback(async () => {
        if (!user.id) return;
        try {
            const res = await axios.get(`https://campus-bridge-lms.onrender.com/api/student/leaves/${user.id}`);
            setLeaveHistory(res.data || []);
        } catch (err) {
            setLeaveHistory([]);
        }
    }, [user.id]);

    useEffect(() => {
        fetchLeaveHistory();
    }, [fetchLeaveHistory]);

    const handleLeaveSubmit = async (e) => {
        e.preventDefault();
        if (!leaveForm.courseId || !leaveForm.fromDate || !leaveForm.toDate || !leaveForm.reason) {
            return alert("Please map out all application fields.");
        }
        try {
            await axios.post("https://campus-bridge-lms.onrender.com/api/student/leaves", { studentId: user.id, ...leaveForm });
            alert("Leave Request Dispatched Successfully!");
            setLeaveForm({ courseId: "", fromDate: "", toDate: "", reason: "" });
            fetchLeaveHistory();
        } catch (err) {
            alert("Failed to submit leave structural payload.");
        }
    };

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="section-container">
            <div className="responsive-form-grid">
                <motion.div variants={itemVariants} className="card-form">
                    <div className="form-header">
                        <h3><FaPlus style={{ color: '#6366f1' }} /> Apply for Leave</h3>
                        <p>File a programmatic request directly to the mapped instructor.</p>
                    </div>
                    <form onSubmit={handleLeaveSubmit}>
                        <div className="form-group">
                            <label>Mapped Course Framework</label>
                            <select value={leaveForm.courseId} onChange={e => setLeaveForm({ ...leaveForm, courseId: e.target.value })} required>
                                <option value="">-- Choose Course --</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>From Date</label>
                                <input type="date" value={leaveForm.fromDate} onChange={e => setLeaveForm({ ...leaveForm, fromDate: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>To Date</label>
                                <input type="date" value={leaveForm.toDate} onChange={e => setLeaveForm({ ...leaveForm, toDate: e.target.value })} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Reason / Statement</label>
                            <textarea placeholder="Specify verification context..." value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} required />
                        </div>
                        <button type="submit" className="btn-primary">Dispatch Application</button>
                    </form>
                </motion.div>

                <motion.div variants={itemVariants} className="card-form" style={{ borderLeft: '5px solid #f59e0b' }}>
                    <div className="form-header">
                        <h3><FaHistory style={{ color: '#f59e0b' }} /> Application History</h3>
                        <p>Track synchronization states of requested gaps.</p>
                    </div>
                    <div className="history-scroll-panel">
                        {leaveHistory.length === 0 ? <p className="no-data-text">No data logs found.</p> : leaveHistory.map(log => (
                            <div key={log.id} className="history-log-item">
                                <div className="log-meta">
                                    <h4>{log.courseName || "Course Lecture"}</h4>
                                    <small>{log.fromDate} to {log.toDate}</small>
                                </div>
                                <span className={`status-badge ${log.status ? log.status.toLowerCase() : 'pending'}`}>{log.status || 'Pending'}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

const SettingsView = ({ settings, setSettings, user }) => {
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [passwordMsg, setPasswordMsg] = useState("");

    const toggleSetting = async (key) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);
        localStorage.setItem("studentSettings", JSON.stringify(newSettings));
        try {
            await axios.put(`https://campus-bridge-lms.onrender.com/api/student/settings/${user.id}`, newSettings);
        } catch (err) { console.error("Failed to save setting"); }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMsg("New passwords do not match.");
            return;
        }
        try {
            const res = await axios.post("https://campus-bridge-lms.onrender.com/api/auth/change-password", {
                userId: user.id,
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setPasswordMsg(res.data.msg);
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setTimeout(() => { setShowPasswordForm(false); setPasswordMsg(""); }, 2000);
        } catch (err) {
            setPasswordMsg(err.response?.data?.msg || "Error changing password");
        }
    };

    return (
        <motion.div className="settings-wrapper" variants={pageVariants} initial="initial" animate="in" exit="out">
            <h2 className="settings-title">Settings</h2>

            <div className="settings-container">
                <div className="settings-section">
                    <div className="section-header"><FaPalette /> Appearance</div>
                    <div className="settings-group">
                        <div className="setting-item">
                            <div className="info"><h4>Dark Mode</h4><p>Switch between light and dark themes</p></div>
                            <button className={`toggle-switch ${settings.darkMode ? 'active' : ''}`} onClick={() => toggleSetting('darkMode')}><div className="toggle-knob"></div></button>
                        </div>
                        <div className="setting-item">
                            <div className="info"><h4>Compact View</h4><p>Reduce padding for more density</p></div>
                            <button className={`toggle-switch ${settings.compactView ? 'active' : ''}`} onClick={() => toggleSetting('compactView')}><div className="toggle-knob"></div></button>
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <div className="section-header"><FaBell /> Notifications</div>
                    <div className="settings-group">
                        <div className="setting-item">
                            <div className="info"><h4>Email Alerts</h4><p>Receive grades via email</p></div>
                            <button className={`toggle-switch ${settings.emailNotifs ? 'active' : ''}`} onClick={() => toggleSetting('emailNotifs')}><div className="toggle-knob"></div></button>
                        </div>
                        <div className="setting-item">
                            <div className="info"><h4>Assignment Reminders</h4><p>Get notified 24h before due date</p></div>
                            <button className={`toggle-switch ${settings.assignmentReminders ? 'active' : ''}`} onClick={() => toggleSetting('assignmentReminders')}><div className="toggle-knob"></div></button>
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <div className="section-header"><FaUser /> Account & Privacy</div>
                    <div className="settings-group">
                        <div className="setting-input-field">
                            <label>Full Name</label>
                            <input type="text" value={user.name} disabled />
                        </div>
                        <div className="setting-item">
                            <div className="info"><h4>Public Profile</h4><p>Allow other students to see you</p></div>
                            <button className={`toggle-switch ${settings.publicProfile ? 'active' : ''}`} onClick={() => toggleSetting('publicProfile')}><div className="toggle-knob"></div></button>
                        </div>
                    </div>
                </div>

                <div className="settings-section security-section">
                    <div className="section-header"><FaShieldAlt /> Security</div>
                    <div className="settings-group" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        {!showPasswordForm ? (
                            <button className="btn-setting-action" onClick={() => setShowPasswordForm(true)}><FaLock /> Change Password</button>
                        ) : (
                            <form onSubmit={handlePasswordChange} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <input type="password" placeholder="Current Password" required value={passwordData.currentPassword} onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                <input type="password" placeholder="New Password" required value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                <input type="password" placeholder="Confirm New Password" required value={passwordData.confirmPassword} onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="submit" className="btn-setting-action" style={{ background: '#2563eb', color: 'white', flex: 1 }}>Update</button>
                                    <button type="button" className="btn-setting-action" style={{ background: '#eee', flex: 1 }} onClick={() => { setShowPasswordForm(false); setPasswordMsg(""); }}>Cancel</button>
                                </div>
                                {passwordMsg && <p style={{ color: passwordMsg.includes("success") ? "green" : "red", fontSize: '0.9em', margin: 0 }}>{passwordMsg}</p>}
                            </form>
                        )}
                        <button className="btn-setting-action danger" style={{ marginTop: '10px' }}><FaSignOutAlt /> Sign out of all devices</button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const ChatAssistant = ({ showAssistant, setShowAssistant, code, language, mode = "general", questionContext = null, dashboardContext = null }) => {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const isCodingMode = mode === "coding";

    const getInitialMessage = useCallback(() => {
        return isCodingMode
            ? "Hi! I am your coding mentor. Ask for hints, debugging help, input/output clarification, or test-case guidance."
            : "Hi! I am your Campus AI assistant. Ask me about attendance, assignments, timetable, leave, notifications, courses, or coding practice.";
    }, [isCodingMode]);

    useEffect(() => {
        if (showAssistant) {
            setMessages([{ role: "bot", text: getInitialMessage() }]);
        }
    }, [mode, showAssistant, getInitialMessage]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, showAssistant]);

    const getLocalReply = (questionText) => {
        const text = (questionText || "").toLowerCase();

        if (isCodingMode) {
            if (text.includes("hint") || text.includes("approach")) {
                return "Start from the input format, solve the sample manually, then convert that logic into code. Keep the output format exactly the same as the sample.";
            }
            if (text.includes("error") || text.includes("wrong") || text.includes("bug")) {
                return "Check three things first: are you reading input from standard input, are variable types correct, and does your output have the exact spaces/new lines required?";
            }
            if (text.includes("input") || text.includes("output")) {
                return "Enable custom input, enter your test input, optionally add expected output, then click Run code. The system will show if your output matched.";
            }
            return "Run the public tests first. If one fails, compare expected and actual output, fix that case, then submit for private test evaluation.";
        }

        const assignments = dashboardContext?.assignments || [];
        const courses = dashboardContext?.courses || [];
        const attendance = dashboardContext?.attendanceData || [];
        const schedule = dashboardContext?.schedule || [];

        if (text.includes("attendance")) {
            const avg = attendance.length
                ? Math.round(attendance.reduce((sum, item) => sum + ((item.attended || 0) / Math.max(item.total || 1, 1)) * 100, 0) / attendance.length)
                : 0;
            return `Your average attendance is around ${avg}%. Open the Attendance section to see the subject-wise colorful chart.`;
        }
        if (text.includes("assignment") || text.includes("submit")) {
            const pending = assignments.filter(item => item.status === "pending").length;
            return `You have ${pending} pending assignment${pending === 1 ? "" : "s"}. Open Assignments, upload your work, and submit before the due date.`;
        }
        if (text.includes("leave")) {
            return "Open Apply Leave, select the course, choose from/to dates, enter your reason, and submit. Faculty can approve or deny it, and you will get a notification.";
        }
        if (text.includes("timetable") || text.includes("schedule") || text.includes("class")) {
            return schedule.length ? "Open Timetable to see your weekly classes. Today's schedule is also shown on the dashboard." : "No timetable is loaded for your account yet. Ask faculty or admin to publish it.";
        }
        if (text.includes("course")) {
            return `You are enrolled in ${courses.length} course${courses.length === 1 ? "" : "s"}. Use the dashboard search to find a course quickly.`;
        }
        if (text.includes("notification")) {
            return "Use the bell icon to see notifications. You can mark all as read or clear all from the dropdown.";
        }
        if (text.includes("password") || text.includes("reset")) {
            return "Use Forgot Password on the login page, enter your registered email, verify the OTP, and then create a new password.";
        }

        return "I can help with attendance, assignments, timetable, leave requests, notifications, courses, password reset, and coding practice. Ask me what you want to do.";
    };

    const handleSend = async (presetText) => {
        const finalInput = presetText || input;
        if (!finalInput.trim()) return;
        const userMsg = { role: 'user', text: finalInput };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);
        try {
            const res = await axios.post("https://campus-bridge-lms.onrender.com/api/compiler/analyze", {
                mode,
                message: finalInput,
                code: isCodingMode ? code : "",
                context: language,
                question: questionContext,
                dashboardContext
            });
            setMessages(prev => [...prev, { role: 'bot', text: res.data.reply }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'bot', text: getLocalReply(finalInput) }]);
        } finally {
            setIsLoading(false);
        }
    };

    const quickPrompts = isCodingMode
        ? ["Give me a hint", "Why is my output wrong?", "Explain sample input"]
        : ["How is my attendance?", "How do I apply leave?", "What should I do next?"];

    return (
        <AnimatePresence>
            {showAssistant && (
                <motion.div className="ai-panel" initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}>
                    <div className="ai-header">
                        <div>
                            <h3><FaRobot /> {isCodingMode ? "Coding AI Help" : "Campus AI Help"}</h3>
                            <span>{isCodingMode ? (questionContext?.title || "Coding Practice") : "Student Dashboard"}</span>
                        </div>
                        <button onClick={() => setShowAssistant(false)}><FaTimes /></button>
                    </div>
                    <div className="ai-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`msg ${msg.role}`}>{msg.text}</div>
                        ))}
                        {isLoading && <div className="msg bot">Typing...</div>}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="ai-quick-prompts">
                        {quickPrompts.map(prompt => (
                            <button key={prompt} type="button" disabled={isLoading} onClick={() => handleSend(prompt)}>{prompt}</button>
                        ))}
                    </div>
                    <div className="ai-input">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={isCodingMode ? "Ask about this problem or your code..." : "Ask a student portal question..."}
                            disabled={isLoading}
                        />
                        <button onClick={() => handleSend()} disabled={isLoading}><FaPlay /></button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const LearnView = ({ courses }) => {
    return (
        <motion.div className="assignments-container" variants={pageVariants} initial="initial" animate="in" exit="out">
            <div className="assignments-header">
                <h2>Learn Tech</h2>
                <p>Curated technical courses to enhance your skills.</p>
            </div>
            <div className="course-grid">
                {courses.length === 0 ? (
                    <p className="no-data-text">No courses available at the moment.</p>
                ) : (
                    courses.map(course => (
                        <div key={course.id} className="card-section course-video-card">
                            <div className="video-wrapper">
                                <iframe 
                                    src={course.video_url} 
                                    title={course.title} 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen>
                                </iframe>
                            </div>
                            <div className="course-info">
                                <h4>{course.title}</h4>
                                <small>{course.channel_name} • {course.category}</small>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
};

const StudentDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser] = useState({ name: "Student", id: null, role: "student" });
    const [activeMenu, setActiveMenu] = useState("dashboard");
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const [showAssistant, setShowAssistant] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem("studentSettings");
        return saved ? JSON.parse(saved) : {
            darkMode: false, compactView: false, emailNotifs: true, assignmentReminders: true, publicProfile: false
        };
    });

    const [courses, setCourses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [streak, setStreak] = useState({ currentStreak: 1, longestStreak: 1, lastActiveDate: null });
    const [youtubeCourses, setYoutubeCourses] = useState([]);

    const [selectedLanguage, setSelectedLanguage] = useState("javascript");
    const [code, setCode] = useState("// Write your solution here...\nconsole.log('Hello Campus Bridge!');");
    const [compilerInput, setCompilerInput] = useState("");
    const [compilerOutput, setCompilerOutput] = useState("");
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);

        if (location.state?.user) {
            setUser(location.state.user);
        } else {
            navigate("/auth");
            return;
        }

        const currentUser = location.state.user;
        setStreak(prev => ({ ...prev, currentStreak: currentUser.streak || prev.currentStreak }));

        const initFetch = async () => {
            setIsLoading(true);
            try {
                const [dashRes, notifRes, schedRes, ytRes] = await Promise.all([
                    axios.get(`https://campus-bridge-lms.onrender.com/api/student/dashboard/${currentUser.id}`),
                    axios.get(`https://campus-bridge-lms.onrender.com/api/notifications/${currentUser.id}`),
                    axios.get(`https://campus-bridge-lms.onrender.com/api/student/schedule/${currentUser.id}`),
                    axios.get(`https://campus-bridge-lms.onrender.com/api/student/youtube-courses`)
                ]);
                setCourses(dashRes.data.courses || []);
                setAssignments(dashRes.data.assignments || []);
                setAttendanceData(dashRes.data.attendanceData || []);
                setNotifications(notifRes.data || []);
                setUnreadCount(notifRes.data ? notifRes.data.filter(n => !n.is_read).length : 0);
                setSchedule(schedRes.data || []);
                setYoutubeCourses(ytRes.data || []);
            } catch (err) { console.error(err); }
            try {
                const streakRes = await axios.get(`https://campus-bridge-lms.onrender.com/api/student/streak/${currentUser.id}`);
                setStreak(streakRes.data || { currentStreak: currentUser.streak || 1, longestStreak: currentUser.streak || 1 });
            } catch (err) {
                setStreak(prev => ({ ...prev, currentStreak: currentUser.streak || prev.currentStreak }));
            }
            finally { setIsLoading(false); }
        };

        initFetch();
        const handleResize = () => setIsSidebarOpen(window.innerWidth > 768);
        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            clearInterval(timer);
            window.removeEventListener('resize', handleResize);
        };
    }, [location, navigate]);

    const markNotificationRead = async (id) => {
        try {
            await axios.put(`https://campus-bridge-lms.onrender.com/api/notifications/read/${id}`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) { console.error(err); }
    };

    const markAllNotificationsRead = async () => {
        if (notifications.length === 0) return;

        try {
            await axios.put(`https://campus-bridge-lms.onrender.com/api/notifications/read-all/${user.id}`);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
            alert("Could not mark notifications as read.");
        }
    };

    const clearAllNotifications = async () => {
        if (notifications.length === 0) return;
        if (!window.confirm("Clear all notifications?")) return;

        try {
            await axios.delete(`https://campus-bridge-lms.onrender.com/api/notifications/clear/${user.id}`);
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
            alert("Could not clear notifications.");
        }
    };

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) navigate("/auth", { replace: true });
    };

    return (
        <div className={`app-container ${settings.darkMode ? "dark-theme" : "light-theme"} ${activeMenu === "compiler" ? "assessment-mode" : ""}`}>
            <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>

            <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="brand"><FaUserGraduate className="brand-icon" /><span>Campus<span className="brand-highlight">Bridge</span></span></div>
                <nav className="nav-menu">
                    <NavItem icon={<FaChartLine />} label="Dashboard" active={activeMenu === "dashboard"} onClick={() => setActiveMenu("dashboard")} />
                    <NavItem icon={<FaCalendarAlt />} label="Timetable" active={activeMenu === "schedule"} onClick={() => setActiveMenu("schedule")} />
                    <NavItem icon={<FaCode />} label="Coding Practice" active={activeMenu === "compiler"} onClick={() => setActiveMenu("compiler")} />
                    <NavItem icon={<FaPlay />} label="Learn" active={activeMenu === "learn"} onClick={() => setActiveMenu("learn")} />
                    <NavItem icon={<FaCheckCircle />} label="Attendance" active={activeMenu === "attendance"} onClick={() => setActiveMenu("attendance")} />
                    <NavItem icon={<FaEnvelopeOpenText />} label="Apply Leave" active={activeMenu === "leave"} onClick={() => setActiveMenu("leave")} />
                    <NavItem icon={<FaBookOpen />} label="Assignments" active={activeMenu === "assignments"} onClick={() => setActiveMenu("assignments")} />
                    <NavItem icon={<FaCog />} label="Settings" active={activeMenu === "settings"} onClick={() => setActiveMenu("settings")} />
                </nav>
                <div className="sidebar-footer">
                    <div className="user-mini">
                        <div className="avatar">{user.name ? user.name[0] : ""}</div>
                        <div className="user-details"><span className="name">{user.name}</span><span className="role">Student</span></div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}><FaSignOutAlt /></button>
                </div>
            </aside>

            <main className="main-viewport">
                <header className="top-bar">
                    <div className="breadcrumbs"><span>Student</span> / <span className="active">{activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1)}</span></div>
                    <div className="top-actions">
                        <div className="search-bar"><FaSearch /><input placeholder="Search courses/assignments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>

                        <button className="action-btn" onClick={() => setSettings(p => ({ ...p, darkMode: !p.darkMode }))}>
                            {settings.darkMode ? <FaSun /> : <FaMoon />}
                        </button>

                        <div className="notification-wrapper" onClick={(e) => e.stopPropagation()}>
                            <button className="action-btn" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                                <FaBell />{unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                            </button>
                            {notificationsOpen && (
                                <motion.div className="dropdown-menu" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                    <div className="dd-header">
                                        <span>Notifications</span>
                                        <div className="notification-actions">
                                            <button type="button" onClick={markAllNotificationsRead} disabled={notifications.length === 0 || unreadCount === 0}>Mark as read</button>
                                            <button type="button" onClick={clearAllNotifications} disabled={notifications.length === 0}>Clear all</button>
                                        </div>
                                    </div>
                                    <div className="dd-body">
                                        {notifications.length === 0 ? <div className="dd-item" style={{ justifyContent: 'center' }}>No notifications</div> : notifications.map(notif => (
                                            <div key={notif.id} className={`dd-item ${!notif.is_read ? 'unread' : ''}`} onClick={() => markNotificationRead(notif.id)}>
                                                <div className={`dot ${notif.type === 'alert' ? 'danger' : 'safe'}`}></div>
                                                <div className="notif-content"><span>{notif.message}</span></div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                        <button className={`ai-toggle ${showAssistant ? 'active' : ''}`} onClick={() => setShowAssistant(!showAssistant)}><FaRobot /> AI Help</button>
                    </div>
                </header>

                <div className="content-area">
                    <AnimatePresence mode="wait">
                        {activeMenu === "dashboard" && <DashboardHome user={user} currentTime={currentTime} courses={courses} assignments={assignments} attendanceData={attendanceData} schedule={schedule} searchTerm={searchTerm} isLoading={isLoading} streak={streak} onOpenAssistant={() => setShowAssistant(true)} />}
                        {activeMenu === "schedule" && <TimetableView schedule={schedule} />}
                        {activeMenu === "learn" && <LearnView courses={youtubeCourses} />}
                        {activeMenu === "compiler" && <CodingArena user={user} onExit={() => setActiveMenu("dashboard")} selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage} code={code} setCode={setCode} isRunning={isRunning} setIsRunning={setIsRunning} compilerInput={compilerInput} setCompilerInput={setCompilerInput} compilerOutput={compilerOutput} setCompilerOutput={setCompilerOutput} />}
                        {activeMenu === "attendance" && <AttendanceAnalytics attendanceData={attendanceData} />}
                        {activeMenu === "leave" && <LeaveApplicationView user={user} courses={courses} />}
                        {activeMenu === "assignments" && <AssignmentsView assignments={assignments} setAssignments={setAssignments} user={user} code={code} />}
                        {activeMenu === "settings" && <SettingsView settings={settings} setSettings={setSettings} user={user} />}
                    </AnimatePresence>
                </div>
            </main>

            {activeMenu !== "compiler" && (
                <ChatAssistant
                    showAssistant={showAssistant}
                    setShowAssistant={setShowAssistant}
                    code={code}
                    language={selectedLanguage}
                    mode="general"
                    dashboardContext={{ courses, assignments, attendanceData, schedule, user }}
                />
            )}
        </div>
    );
};

const NavItem = ({ icon, label, active, onClick }) => (
    <div className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
        <span className="icon">{icon}</span><span className="label">{label}</span>
        {active && <motion.div layoutId="active-pill" className="active-pill" />}
    </div>
);

const StatCard = ({ icon, title, value, color }) => (
    <motion.div className="stat-card" whileHover={{ y: -5 }}>
        <div className="stat-icon" style={{ backgroundColor: `${color}20`, color: color }}>{icon}</div>
        <div className="stat-info"><h3>{value}</h3><p>{title}</p></div>
    </motion.div>
);

export default StudentDashboard;
