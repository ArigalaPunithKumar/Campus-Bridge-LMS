const jwt = require("jsonwebtoken");
require("dotenv").config();

/* =========================================
   VERIFY JWT TOKEN
========================================= */
exports.verifyToken = (req, res, next) => {
    try {
        let token = null;

        // 1️⃣ Check Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        // 2️⃣ Fallback to cookie
        if (!token && req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                msg: "Access denied. No token provided."
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        next();

    } catch (err) {
        console.error("AUTH ERROR:", err.message);
        return res.status(401).json({
            msg: "Invalid or expired token"
        });
    }
};

/* =========================================
   ROLE-BASED ACCESS CONTROL
========================================= */
exports.checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                msg: "Access denied. Insufficient permissions."
            });
        }
        next();
    };
};
