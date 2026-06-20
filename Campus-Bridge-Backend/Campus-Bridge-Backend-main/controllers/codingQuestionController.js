const db = require("../db");
const axios = require("axios");
const { runCodeWithJDoodle } = require("./compilerController");

const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

const normalizeOutput = (value = "") => {
    return String(value)
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map(line => line.trimEnd())
        .join("\n")
        .trim();
};

const slugify = (value) => {
    return String(value || "question")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
};

const buildStarterCode = (starterCode = {}) => {
    return {
        javascript: starterCode.javascript || `const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim();\n\n// Your code here\n`,
        python: starterCode.python || `# Your code here\n`,
        java: starterCode.java || `import java.util.*;\n\nclass Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        // Your code here\n    }\n}\n`,
        cpp: starterCode.cpp || `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}\n`
    };
};

const getAiReview = async ({ questionTitle, status, score, passed, total, language, results }) => {
    const failed = results.filter(result => !result.passed).length;
    const prompt = encodeURIComponent(
        `Evaluate this coding submission in 4 short bullet points. ` +
        `Question: ${questionTitle}. Language: ${language}. Status: ${status}. ` +
        `Score: ${score}%. Passed ${passed}/${total}. Failed cases: ${failed}. ` +
        `Give feedback on correctness, edge cases, and next improvement.`
    );

    try {
        const response = await axios.get(`https://text.pollinations.ai/${prompt}?model=openai`, { timeout: 10000 });
        return String(response.data).trim();
    } catch (err) {
        return `AI review is offline. Result summary: ${status}. Passed ${passed}/${total} test cases with a score of ${score}%. Review failed cases and edge cases before resubmitting.`;
    }
};

const starterCode = {
    checkerboard: {
        javascript: `const fs = require("fs");
const n = Number(fs.readFileSync(0, "utf8").trim());

// Print the checkerboard pattern.
`,
        python: `n = int(input())

# Print the checkerboard pattern.
`,
        java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.nextInt();

        // Your code here
    }
}
`,
        cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;

    // Print the checkerboard pattern.
    return 0;
}
`
    },
    twoSum: {
        javascript: `const fs = require("fs");
const input = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);

const n = input[0];
const nums = input.slice(1, 1 + n);
const target = input[1 + n];

// Write your solution here.
`,
        python: `n = int(input())
nums = list(map(int, input().split()))
target = int(input())

# Write your solution here.
`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();

        // Write your solution here.
    }
}
`,
        cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    int target;
    cin >> target;

    // Write your solution here.
    return 0;
}
`
    },
    validParentheses: {
        javascript: `const fs = require("fs");
const s = fs.readFileSync(0, "utf8").trim();

// Print true if the brackets are balanced, otherwise false.
`,
        python: `s = input().strip()

# Print true if the brackets are balanced, otherwise false.
`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine().trim();

        // Print true if the brackets are balanced, otherwise false.
    }
}
`,
        cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string s;
    cin >> s;

    // Print true if the brackets are balanced, otherwise false.
    return 0;
}
`
    },
    maxSubarray: {
        javascript: `const fs = require("fs");
const input = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
const n = input[0];
const nums = input.slice(1, 1 + n);

// Print the maximum subarray sum.
`,
        python: `n = int(input())
nums = list(map(int, input().split()))

# Print the maximum subarray sum.
`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();

        // Print the maximum subarray sum.
    }
}
`,
        cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];

    // Print the maximum subarray sum.
    return 0;
}
`
    }
};

const seedQuestions = [
    {
        slug: "checkerboard-pattern",
        title: "Checkerboard Pattern",
        company: "TCS",
        difficulty: "Easy",
        description: "You are given an integer n. Print an n x n square pattern filled with alternating 0s and 1s. Adjacent cells horizontally or vertically must never have the same value. Use the parity of row + column to decide what to print.",
        inputFormat: "The first line contains a single integer n.",
        outputFormat: "Print n lines, each containing n space-separated values forming the required pattern.",
        constraints: "1 <= n <= 100.",
        starterCode: starterCode.checkerboard,
        tests: [
            { input: "3", expected: "0 1 0\n1 0 1\n0 1 0", public: true },
            { input: "4", expected: "0 1 0 1\n1 0 1 0\n0 1 0 1\n1 0 1 0", public: true },
            { input: "1", expected: "0", public: false },
            { input: "5", expected: "0 1 0 1 0\n1 0 1 0 1\n0 1 0 1 0\n1 0 1 0 1\n0 1 0 1 0", public: false }
        ]
    },
    {
        slug: "two-sum-indices",
        title: "Two Sum Indices",
        company: "Google",
        difficulty: "Easy",
        description: "Given an array of integers and a target value, print the two zero-based indices whose values add up to the target. Exactly one answer exists.",
        inputFormat: "Line 1: n. Line 2: n integers. Line 3: target.",
        outputFormat: "Print two zero-based indices separated by one space.",
        constraints: "2 <= n <= 100000. -1000000000 <= nums[i], target <= 1000000000.",
        starterCode: starterCode.twoSum,
        tests: [
            { input: "4\n2 7 11 15\n9", expected: "0 1", public: true },
            { input: "5\n3 2 4 8 11\n12", expected: "2 3", public: true },
            { input: "6\n10 -2 4 8 15 3\n13", expected: "0 5", public: false },
            { input: "3\n-5 -3 -8\n-11", expected: "1 2", public: false }
        ]
    },
    {
        slug: "valid-parentheses",
        title: "Valid Parentheses",
        company: "Amazon",
        difficulty: "Easy",
        description: "Given a string containing only bracket characters, print true if every opening bracket is closed in the correct order. Otherwise print false.",
        inputFormat: "A single line containing the bracket string.",
        outputFormat: "Print true or false in lowercase.",
        constraints: "1 <= length <= 100000. Characters are one of (), {}, [].",
        starterCode: starterCode.validParentheses,
        tests: [
            { input: "()[]{}", expected: "true", public: true },
            { input: "([)]", expected: "false", public: true },
            { input: "{[()()]}", expected: "true", public: false },
            { input: "(((()", expected: "false", public: false }
        ]
    },
    {
        slug: "maximum-subarray-sum",
        title: "Maximum Subarray Sum",
        company: "Microsoft",
        difficulty: "Medium",
        description: "Given an integer array, print the largest possible sum of any non-empty contiguous subarray.",
        inputFormat: "Line 1: n. Line 2: n integers.",
        outputFormat: "Print one integer, the maximum subarray sum.",
        constraints: "1 <= n <= 100000. -1000000000 <= nums[i] <= 1000000000.",
        starterCode: starterCode.maxSubarray,
        tests: [
            { input: "9\n-2 1 -3 4 -1 2 1 -5 4", expected: "6", public: true },
            { input: "5\n5 4 -1 7 8", expected: "23", public: true },
            { input: "4\n-8 -3 -6 -2", expected: "-2", public: false },
            { input: "6\n2 -1 2 3 4 -5", expected: "10", public: false }
        ]
    }
];

const ensureCodingTables = async () => {
    await query(`
        CREATE TABLE IF NOT EXISTS coding_questions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            slug VARCHAR(120) NOT NULL UNIQUE,
            title VARCHAR(160) NOT NULL,
            company VARCHAR(120) NOT NULL,
            difficulty VARCHAR(30) NOT NULL,
            description TEXT NOT NULL,
            input_format TEXT NOT NULL,
            output_format TEXT NOT NULL,
            constraints_text TEXT NOT NULL,
            starter_code MEDIUMTEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS coding_test_cases (
            id INT AUTO_INCREMENT PRIMARY KEY,
            question_id INT NOT NULL,
            input_data MEDIUMTEXT NOT NULL,
            expected_output MEDIUMTEXT NOT NULL,
            is_public BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX question_idx (question_id)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS coding_submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NULL,
            question_id INT NOT NULL,
            language VARCHAR(40) NOT NULL,
            source_code MEDIUMTEXT NOT NULL,
            passed_cases INT NOT NULL,
            total_cases INT NOT NULL,
            score INT NOT NULL,
            status VARCHAR(30) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX student_idx (student_id),
            INDEX question_submission_idx (question_id)
        )
    `);

    for (const question of seedQuestions) {
        let rows = await query("SELECT id FROM coding_questions WHERE slug = ?", [question.slug]);
        let questionId = rows[0]?.id;

        if (!questionId) {
            const result = await query(
                `INSERT INTO coding_questions
                    (slug, title, company, difficulty, description, input_format, output_format, constraints_text, starter_code)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    question.slug,
                    question.title,
                    question.company,
                    question.difficulty,
                    question.description,
                    question.inputFormat,
                    question.outputFormat,
                    question.constraints,
                    JSON.stringify(question.starterCode)
                ]
            );
            questionId = result.insertId;
        }

        const caseRows = await query("SELECT COUNT(*) AS count FROM coding_test_cases WHERE question_id = ?", [questionId]);
        if (Number(caseRows[0].count) === 0) {
            for (const test of question.tests) {
                await query(
                    `INSERT INTO coding_test_cases (question_id, input_data, expected_output, is_public)
                     VALUES (?, ?, ?, ?)`,
                    [questionId, test.input, test.expected, test.public]
                );
            }
        }
    }
};

const mapQuestion = (row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    company: row.company,
    difficulty: row.difficulty,
    description: row.description,
    inputFormat: row.input_format,
    outputFormat: row.output_format,
    constraints: row.constraints_text,
    starterCode: row.starter_code ? JSON.parse(row.starter_code) : {},
    publicTestCount: Number(row.publicTestCount || 0),
    privateTestCount: Number(row.privateTestCount || 0)
});

const questionOrderSql = seedQuestions.map(question => `'${question.slug}'`).join(", ");

const runSingleCase = async ({ testCase, code, language, index, reveal }) => {
    const result = await runCodeWithJDoodle({
        language,
        code,
        stdin: testCase.input_data
    });

    const actualOutput = result.stderr ? result.stderr : result.output;
    const passed = !result.stderr && normalizeOutput(result.output) === normalizeOutput(testCase.expected_output);

    return {
        id: testCase.id,
        name: `${testCase.is_public ? "Public" : "Private"} Test ${index + 1}`,
        visibility: testCase.is_public ? "public" : "private",
        passed,
        input: reveal ? testCase.input_data : undefined,
        expectedOutput: reveal ? testCase.expected_output : undefined,
        actualOutput: reveal || testCase.is_public ? actualOutput : undefined,
        error: result.stderr || ""
    };
};

exports.listQuestions = async (req, res) => {
    try {
        await ensureCodingTables();
        const rows = await query(`
            SELECT q.*,
                   SUM(CASE WHEN t.is_public = TRUE THEN 1 ELSE 0 END) AS publicTestCount,
                   SUM(CASE WHEN t.is_public = FALSE THEN 1 ELSE 0 END) AS privateTestCount
            FROM coding_questions q
            LEFT JOIN coding_test_cases t ON q.id = t.question_id
            GROUP BY q.id
            ORDER BY FIELD(q.slug, ${questionOrderSql}), q.id ASC
        `);

        res.json(rows.map(mapQuestion));
    } catch (err) {
        console.error("List Coding Questions Error:", err);
        res.status(500).json({ msg: "Error fetching coding questions" });
    }
};

exports.createQuestion = async (req, res) => {
    try {
        await ensureCodingTables();

        const {
            title,
            company,
            difficulty,
            description,
            inputFormat,
            outputFormat,
            constraints,
            starterCode,
            publicTests = [],
            privateTests = []
        } = req.body;

        if (!title || !company || !description || !inputFormat || !outputFormat) {
            return res.status(400).json({ msg: "Title, company, problem, input format, and output format are required" });
        }

        const allTests = [
            ...publicTests.map(test => ({ ...test, public: true })),
            ...privateTests.map(test => ({ ...test, public: false }))
        ].filter(test => String(test.input || "").trim() !== "" && String(test.expectedOutput || test.expected || "").trim() !== "");

        if (allTests.length === 0) {
            return res.status(400).json({ msg: "At least one public or private test case is required" });
        }

        const slug = `${slugify(title)}-${Date.now()}`;
        const result = await query(
            `INSERT INTO coding_questions
                (slug, title, company, difficulty, description, input_format, output_format, constraints_text, starter_code)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                slug,
                title,
                company,
                difficulty || "Easy",
                description,
                inputFormat,
                outputFormat,
                constraints || "No additional constraints.",
                JSON.stringify(buildStarterCode(starterCode))
            ]
        );

        for (const test of allTests) {
            await query(
                `INSERT INTO coding_test_cases (question_id, input_data, expected_output, is_public)
                 VALUES (?, ?, ?, ?)`,
                [result.insertId, test.input, test.expectedOutput || test.expected, test.public]
            );
        }

        res.status(201).json({ msg: "Coding question posted successfully", id: result.insertId });
    } catch (err) {
        console.error("Create Coding Question Error:", err);
        res.status(500).json({ msg: "Error posting coding question" });
    }
};

exports.getQuestion = async (req, res) => {
    try {
        await ensureCodingTables();
        const { id } = req.params;

        const rows = await query(`
            SELECT q.*,
                   SUM(CASE WHEN t.is_public = TRUE THEN 1 ELSE 0 END) AS publicTestCount,
                   SUM(CASE WHEN t.is_public = FALSE THEN 1 ELSE 0 END) AS privateTestCount
            FROM coding_questions q
            LEFT JOIN coding_test_cases t ON q.id = t.question_id
            WHERE q.id = ?
            GROUP BY q.id
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ msg: "Question not found" });
        }

        const publicTests = await query(
            `SELECT id, input_data AS input, expected_output AS expectedOutput
             FROM coding_test_cases
             WHERE question_id = ? AND is_public = TRUE
             ORDER BY id ASC`,
            [id]
        );

        res.json({
            ...mapQuestion(rows[0]),
            publicTests
        });
    } catch (err) {
        console.error("Get Coding Question Error:", err);
        res.status(500).json({ msg: "Error fetching coding question" });
    }
};

exports.runQuestion = async (req, res) => {
    try {
        await ensureCodingTables();
        const { id } = req.params;
        const { language, code, customInput, expectedOutput } = req.body;

        if (typeof customInput === "string") {
            const result = await runCodeWithJDoodle({ language, code, stdin: customInput });
            const hasExpected = typeof expectedOutput === "string" && expectedOutput.trim() !== "";
            return res.json({
                mode: "custom",
                output: result.stderr ? result.stderr : result.output,
                stderr: result.stderr,
                passed: hasExpected ? !result.stderr && normalizeOutput(result.output) === normalizeOutput(expectedOutput) : null
            });
        }

        const publicCases = await query(
            `SELECT id, input_data, expected_output, is_public
             FROM coding_test_cases
             WHERE question_id = ? AND is_public = TRUE
             ORDER BY id ASC`,
            [id]
        );

        const results = [];
        for (let index = 0; index < publicCases.length; index += 1) {
            results.push(await runSingleCase({
                testCase: publicCases[index],
                code,
                language,
                index,
                reveal: true
            }));
        }

        res.json({
            mode: "public",
            passed: results.filter(result => result.passed).length,
            total: results.length,
            results
        });
    } catch (err) {
        console.error("Run Coding Question Error:", err);
        res.status(500).json({ msg: "Error running coding question" });
    }
};

exports.submitQuestion = async (req, res) => {
    try {
        await ensureCodingTables();
        const { id } = req.params;
        const { language, code, studentId } = req.body;

        const testCases = await query(
            `SELECT id, input_data, expected_output, is_public
             FROM coding_test_cases
             WHERE question_id = ?
             ORDER BY is_public DESC, id ASC`,
            [id]
        );

        if (testCases.length === 0) {
            return res.status(404).json({ msg: "No test cases found for this question" });
        }

        const results = [];
        for (let index = 0; index < testCases.length; index += 1) {
            results.push(await runSingleCase({
                testCase: testCases[index],
                code,
                language,
                index,
                reveal: Boolean(testCases[index].is_public)
            }));
        }

        const passed = results.filter(result => result.passed).length;
        const total = results.length;
        const score = Math.round((passed / total) * 100);
        const status = passed === total ? "Accepted" : "Wrong Answer";
        const questionRows = await query("SELECT title FROM coding_questions WHERE id = ?", [id]);
        const questionTitle = questionRows[0]?.title || "Coding Question";
        const aiReview = await getAiReview({ questionTitle, status, score, passed, total, language, results });

        await query(
            `INSERT INTO coding_submissions
                (student_id, question_id, language, source_code, passed_cases, total_cases, score, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [studentId || null, id, language, code, passed, total, score, status]
        );

        res.json({
            status,
            score,
            passed,
            total,
            results,
            aiReview
        });
    } catch (err) {
        console.error("Submit Coding Question Error:", err);
        res.status(500).json({ msg: "Error submitting coding question" });
    }
};
