require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 18373, // Cloud DBs often use distinct ports
    ssl: {
        rejectUnauthorized: false // Required for most cloud databases (Aiven, TiDB)
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err) => {
    if (err) {
        console.error("❌ DB Connection Error:", err.message);
    } else {
        console.log("✅ Connected Aiven cloud sql Database");
    }
});

module.exports = db;
