const axios = require("axios");

const getExecutionConfig = (language) => {
    const languageMap = {
        javascript: { language: "nodejs", versionIndex: "4" },
        python: { language: "python3", versionIndex: "4" },
        java: { language: "java", versionIndex: "3" },
        cpp: { language: "cpp", versionIndex: "5" }
    };

    let cleanLangKey = "javascript";
    const normalized = (language || "").toLowerCase();

    if (normalized.includes("python")) cleanLangKey = "python";
    if (normalized.includes("java") && !normalized.includes("script")) cleanLangKey = "java";
    if (normalized.includes("c++") || normalized.includes("cpp")) cleanLangKey = "cpp";

    return languageMap[cleanLangKey] || languageMap.javascript;
};

const runCodeWithJDoodle = async ({ language, code, sourceCode, stdin = "" }) => {
    const finalCode = code || sourceCode;

    if (!finalCode || finalCode.trim() === "") {
        return {
            stdout: "",
            output: "",
            stderr: "No source code received by the backend.",
            code: 1
        };
    }

    const config = getExecutionConfig(language);
    const jdoodlePayload = {
        clientId: process.env.JDOODLE_CLIENT_ID ? process.env.JDOODLE_CLIENT_ID.trim() : null,
        clientSecret: process.env.JDOODLE_CLIENT_SECRET ? process.env.JDOODLE_CLIENT_SECRET.trim() : null,
        script: finalCode,
        stdin: stdin || "",
        language: config.language,
        versionIndex: config.versionIndex
    };

    try {
        const response = await axios.post("https://api.jdoodle.com/v1/execute", jdoodlePayload, {
            headers: { "Content-Type": "application/json" },
            timeout: 15000
        });

        if (response.data.statusCode && response.data.statusCode !== 200) {
            return {
                stdout: "",
                output: "",
                stderr: response.data.error || `Compiler Error: ${response.data.statusCode}`,
                code: 1
            };
        }

        const finalOutput = response.data.output || "";
        return {
            stdout: finalOutput,
            output: finalOutput || "No output returned.",
            stderr: "",
            code: 0
        };
    } catch (error) {
        return {
            stdout: "",
            output: "",
            stderr: `Connection Error: ${error.message}`,
            code: 1
        };
    }
};

/* ===================================================
   1. CODE EXECUTION LOGIC (JDoodle Integration)
=================================================== */
exports.executeCode = async (req, res) => {
    const { language, code, sourceCode, stdin } = req.body;

    console.log("\n--- COMPILER LOG START ---");
    console.log({
        languageProvided: language,
        codeLength: (code || sourceCode || "").length,
        stdinProvided: stdin
    });

    const result = await runCodeWithJDoodle({ language, code, sourceCode, stdin });
    res.status(result.stderr && result.stderr.startsWith("Connection Error") ? 500 : 200).json(result);

    console.log("--- COMPILER LOG END ---\n");
};

/* ===================================================
   2. AI LOGIC (Pollinations)
=================================================== */
const buildAssistantPrompt = ({ mode, message, code, context, question, dashboardContext }) => {
    if (mode === "general") {
        return [
            "You are Campus Bridge AI, a friendly LMS assistant for a student.",
            "Answer normal student queries about dashboard, attendance, timetable, assignments, leave, courses, coding practice, notifications, and password/account guidance.",
            "Use the provided student context when useful. Keep the answer concise, practical, and under 120 words.",
            `Student context: ${JSON.stringify(dashboardContext || {})}`,
            `Student question: ${message}`
        ].join("\n");
    }

    return [
        "You are Campus Bridge Coding AI, a mentor inside a coding practice assessment.",
        "Help the student understand the problem, debug code, reason about input/output, and improve approach.",
        "Do not dump a full final solution unless the student explicitly asks for complete code. Prefer hints and targeted fixes.",
        "Keep the answer concise and practical, under 140 words.",
        `Language: ${context || "coding"}`,
        `Question: ${JSON.stringify(question || {})}`,
        `Current code:\n${code || "No code provided."}`,
        `Student question: ${message}`
    ].join("\n");
};

const offlineGeneralReply = (message, dashboardContext = {}) => {
    const text = (message || "").toLowerCase();
    const assignments = dashboardContext.assignments || [];
    const courses = dashboardContext.courses || [];
    const attendance = dashboardContext.attendanceData || [];
    const schedule = dashboardContext.schedule || [];

    if (text.includes("leave")) {
        return "To apply for leave, open Apply Leave, choose your course, select from/to dates, write the reason, and submit. Your faculty can approve or deny it, and you will see the update in notifications.";
    }
    if (text.includes("attendance")) {
        const avg = attendance.length
            ? Math.round(attendance.reduce((sum, item) => sum + ((item.attended || 0) / Math.max(item.total || 1, 1)) * 100, 0) / attendance.length)
            : 0;
        return `Your current average attendance is about ${avg}%. Open Attendance for the colorful subject-wise chart and focus first on subjects below 75%.`;
    }
    if (text.includes("assignment") || text.includes("submit")) {
        const pending = assignments.filter(item => item.status === "pending").length;
        return `You have ${pending} pending assignment${pending === 1 ? "" : "s"}. Open Assignments, choose the task, upload your file or code, and submit before the due date.`;
    }
    if (text.includes("timetable") || text.includes("schedule") || text.includes("class")) {
        return schedule.length
            ? "Open Timetable to see your weekly classes. Today's classes are also shown on the dashboard with time, course, room, and faculty details."
            : "No timetable records are currently loaded for your account. Ask faculty/admin to publish the schedule if it should be visible.";
    }
    if (text.includes("course")) {
        return `You are enrolled in ${courses.length} course${courses.length === 1 ? "" : "s"}. Use the dashboard course cards or search bar to find a specific course quickly.`;
    }
    if (text.includes("notification")) {
        return "Use the bell icon to view notifications. You can now mark everything as read or clear all notifications from the dropdown.";
    }
    if (text.includes("password") || text.includes("login")) {
        return "For password issues, use Forgot Password on the login page. Enter your registered email, verify the OTP, then create a new password.";
    }
    if (text.includes("coding") || text.includes("practice")) {
        return "Open Coding Practice from the sidebar. Choose a question, write code, run public or custom tests, then submit for public and private test evaluation with an AI report.";
    }

    return "I can help with attendance, assignments, timetable, leave requests, notifications, password reset, courses, and coding practice. Tell me what you want to do, and I will guide you step by step.";
};

const offlineCodingReply = ({ message, code, question, context }) => {
    const text = (message || "").toLowerCase();
    const title = question?.title ? ` for ${question.title}` : "";

    if (text.includes("hint") || text.includes("approach")) {
        return `Think about the input/output pattern${title}. Break the problem into small steps, test with the first sample, then handle edge cases from the constraints.`;
    }
    if (text.includes("error") || text.includes("bug") || text.includes("fix")) {
        return `Check syntax for ${context || "your language"}, confirm you read input from standard input, and compare your printed format with the sample output exactly. Extra spaces or missing new lines can fail tests.`;
    }
    if (text.includes("input") || text.includes("output")) {
        return "Use custom input after enabling the custom input toggle, then run code. If you add expected output, the system will compare your output and tell you whether it matched.";
    }
    if (!code || code.trim().length < 25) {
        return "Start by reading the required input, storing it in variables, and printing exactly what the output format asks for. Run the sample before submitting.";
    }

    return "Your next best step is to run the public tests, inspect the first failing case, then adjust only that part of the logic. If public tests pass, submit to check private edge cases.";
};

exports.getAiAssistance = async (req, res) => {
    const {
        message = "",
        code = "",
        context = "coding",
        mode = "coding",
        question = null,
        dashboardContext = null
    } = req.body;

    if (!message.trim()) {
        return res.status(400).json({ reply: "Please type a question first." });
    }

    const normalizedMode = mode === "general" ? "general" : "coding";
    const fullPrompt = buildAssistantPrompt({
        mode: normalizedMode,
        message,
        code,
        context,
        question,
        dashboardContext
    });

    try {
        console.log("\n--- AI PING START (Pollinations) ---");
        const encodedPrompt = encodeURIComponent(fullPrompt);

        const response = await axios.get(`https://text.pollinations.ai/${encodedPrompt}?model=openai`, {
            timeout: 12000
        });

        const reply = typeof response.data === "string" && response.data.trim()
            ? response.data.trim()
            : null;

        if (!reply) throw new Error("Empty AI response");

        console.log("AI Reply Received.");
        res.json({ reply });
    } catch (error) {
        console.error("[POLLINATIONS_ERROR]:", error.message);
        const reply = normalizedMode === "general"
            ? offlineGeneralReply(message, dashboardContext || {})
            : offlineCodingReply({ message, code, question, context });
        res.json({ reply, offline: true });
    }
    console.log("--- AI PING END ---\n");
};

exports.runCodeWithJDoodle = runCodeWithJDoodle;
