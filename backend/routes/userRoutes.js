const express = require("express");
const db = require("../db");
const authenticateJWT = require("../middleware/authMiddleware"); // Import the authentication middleware
const router = express.Router();

// Protected Route - Get User Profile
router.get("/profile", authenticateJWT, (req, res) => {
    const { userId, userType } = req.user;

    const query =
        userType === "student"
            ? `SELECT * FROM Student WHERE student_id = ?`
            : `SELECT * FROM Professor WHERE professor_id = ?`;

    db.query(query, [userId], (err, result) => {
        if (err || result.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(result[0]);
    });
});

// Other routes can go here, such as updating user information, etc.

module.exports = router;
