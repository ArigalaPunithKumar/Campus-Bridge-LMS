const db = require("../db");

const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

const ensureLeaveTable = async () => {
    await query(`
        CREATE TABLE IF NOT EXISTS leave_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            course_id INT NOT NULL,
            from_date DATE NOT NULL,
            to_date DATE NOT NULL,
            reason TEXT NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX student_leave_idx (student_id),
            INDEX course_leave_idx (course_id)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS faculty_leave_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            faculty_id INT NOT NULL,
            from_date DATE NOT NULL,
            to_date DATE NOT NULL,
            reason TEXT NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX faculty_leave_idx (faculty_id)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS youtube_courses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            channel_name VARCHAR(255) NOT NULL,
            video_url VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL DEFAULT 'Technology',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
};

module.exports = {
    ensureLeaveTable
};
