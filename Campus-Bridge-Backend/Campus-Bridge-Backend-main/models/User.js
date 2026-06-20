const db = require("../db");

const User = {
    /* =========================================
       CREATE USER
    ========================================= */
    create: (name, email, hashedPassword, role) => {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO users (name, email, password, role)
                VALUES (?, ?, ?, ?)
            `;

            db.query(
                sql,
                [name, email, hashedPassword, role],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                }
            );
        });
    },

    /* =========================================
       FIND USER BY EMAIL
    ========================================= */
    findByEmail: (email) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT *
                FROM users
                WHERE email = ?
                LIMIT 1
            `;

            db.query(sql, [email], (err, results) => {
                if (err) return reject(err);
                resolve(results.length ? results[0] : null);
            });
        });
    },

    /* =========================================
       SAVE OTP HASH + EXPIRY
       (used in forgot password)
    ========================================= */
    saveResetToken: (email, hashedOtp, expiry) => {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE users
                SET reset_token = ?,
                    reset_token_expiry = ?
                WHERE email = ?
            `;

            db.query(
                sql,
                [hashedOtp, expiry, email],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                }
            );
        });
    },

    /* =========================================
       UPDATE PASSWORD
       (does NOT clear token here)
    ========================================= */
    updatePassword: (email, hashedPassword) => {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE users
                SET password = ?
                WHERE email = ?
            `;

            db.query(
                sql,
                [hashedPassword, email],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                }
            );
        });
    },

    /* =========================================
       CLEAR OTP TOKEN + EXPIRY
       (after successful reset)
    ========================================= */
    clearResetToken: (email) => {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE users
                SET reset_token = NULL,
                    reset_token_expiry = NULL
                WHERE email = ?
            `;

            db.query(sql, [email], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }
};

module.exports = User;
