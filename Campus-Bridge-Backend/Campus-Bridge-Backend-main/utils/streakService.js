const db = require("../db");

const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

const ensureStreakTable = async () => {
    await query(`
        CREATE TABLE IF NOT EXISTS user_streaks (
            user_id INT NOT NULL PRIMARY KEY,
            current_streak INT NOT NULL DEFAULT 1,
            longest_streak INT NOT NULL DEFAULT 1,
            last_active_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
};

const initializeSignupStreak = async (userId) => {
    await ensureStreakTable();
    await query(
        `INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date)
         VALUES (?, 1, 1, CURDATE())
         ON DUPLICATE KEY UPDATE
            current_streak = current_streak,
            longest_streak = longest_streak,
            last_active_date = last_active_date`,
        [userId]
    );
    return getUserStreak(userId);
};

const ensureUserStreak = async (userId) => {
    await ensureStreakTable();
    await query(
        `INSERT IGNORE INTO user_streaks (user_id, current_streak, longest_streak, last_active_date)
         VALUES (?, 1, 1, CURDATE())`,
        [userId]
    );
};

const recordLoginStreak = async (userId) => {
    await ensureUserStreak(userId);

    const rows = await query(
        `SELECT current_streak, longest_streak, DATEDIFF(CURDATE(), last_active_date) AS day_gap
         FROM user_streaks
         WHERE user_id = ?`,
        [userId]
    );

    const row = rows[0] || { current_streak: 0, longest_streak: 0, day_gap: 0 };
    const gap = Number(row.day_gap);
    let currentStreak = Number(row.current_streak) || 1;

    if (gap === 1) {
        currentStreak += 1;
    } else if (gap > 1) {
        currentStreak = 1;
    }

    const longestStreak = Math.max(Number(row.longest_streak) || 1, currentStreak);

    await query(
        `UPDATE user_streaks
         SET current_streak = ?, longest_streak = ?, last_active_date = CURDATE()
         WHERE user_id = ?`,
        [currentStreak, longestStreak, userId]
    );

    return getUserStreak(userId);
};

const getUserStreak = async (userId) => {
    await ensureUserStreak(userId);
    const rows = await query(
        `SELECT current_streak AS currentStreak,
                longest_streak AS longestStreak,
                DATE_FORMAT(last_active_date, '%Y-%m-%d') AS lastActiveDate
         FROM user_streaks
         WHERE user_id = ?`,
        [userId]
    );

    return rows[0] || { currentStreak: 1, longestStreak: 1, lastActiveDate: null };
};

module.exports = {
    initializeSignupStreak,
    recordLoginStreak,
    getUserStreak
};
