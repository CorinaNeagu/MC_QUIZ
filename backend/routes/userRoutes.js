const express = require("express");
const db = require("../db");
const authenticateJWT = require("../middleware/authMiddleware");
const router = express.Router();

// Protected Route - Get User Profile
// User Profile route
router.get('/profile', authenticateJWT, (req, res) => {
    const { id, userType } = req.user;  // Extract from JWT payload

    console.log('Fetching profile for id:', id);

    // Dynamically choose the table based on userType
    const table = userType === "student" ? "Student" : "Professor";
    const userKey = userType === "student" ? "student_id" : "professor_id";

    // Query the respective table for the user by the ID (either student_id or professor_id)
    const query = `SELECT username, email, created_at FROM ${table} WHERE ${userKey} = ?`;
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: err.message });
        }

        if (result.length === 0) {
            console.log(`${userType} not found for ${userKey}:`, id);
            return res.status(404).json({ error: `${userType.charAt(0).toUpperCase() + userType.slice(1)} not found` });
        }

        // Send the user data to frontend
        res.json({
            username: result[0].username,
            email: result[0].email,
            created_at: result[0].created_at, // Send the created_at field
            userType, // Include userType in the response
        });
    });
});

module.exports = router;
