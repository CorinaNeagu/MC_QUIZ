const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db"); // Assuming you have a DB connection file
const router = express.Router();

// REGISTER USER (Student or Professor)
router.post("/register", async (req, res) => {
    const { username, email, password, userType } = req.body;

    if (!username || !email || !password || !userType) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (userType !== "student" && userType !== "professor") {
        return res.status(400).json({ message: "Invalid user type" });
    }

    try {
        // Check if email already exists
        const checkQuery =
            userType === "student"
                ? `SELECT * FROM Student WHERE email = ?`
                : `SELECT * FROM Professor WHERE email = ?`;

        db.query(checkQuery, [email], async (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ message: "Database error", error: err });
            }

            if (results.length > 0) {
                return res.status(400).json({ message: "Email already in use" });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Choose the table based on userType
            const insertQuery =
                userType === "student"
                    ? `INSERT INTO Student (username, email, password) VALUES (?, ?, ?)`
                    : `INSERT INTO Professor (username, email, password) VALUES (?, ?, ?)`;

            // Insert the user
            db.query(insertQuery, [username, email, hashedPassword], (err, result) => {
                if (err) {
                    console.error("Error inserting user:", err);
                    return res.status(500).json({ message: "Error registering user", error: err });
                }
                return res.status(201).json({ message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} registered successfully!` });
            });
        });
    } catch (err) {
        console.error("Error in registration:", err);
        return res.status(500).json({ message: "Server error while hashing password" });
    }
});



// Login Route (Student or Professor)
router.post("/login", async (req, res) => {
    const { email, password, userType } = req.body;

    // Validate input
    if (!email || !password || !userType) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (userType !== "student" && userType !== "professor") {
        return res.status(400).json({ message: "Invalid user type" });
    }

    try {
        // Determine the table based on userType
        const table = userType === "student" ? "Student" : "Professor";
        const query = `SELECT * FROM ${table} WHERE email = ?`;

        // Query the database for user
        db.query(query, [email], async (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ message: "Database error" });
            }

            if (results.length === 0) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            const user = results[0];

            // Check if password is correct
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            // Generate JWT Token
            const token = jwt.sign(
                { userId: user.id, userType },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            return res.status(200).json({ message: "Login successful", token });
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Server error during login" });
    }
});

module.exports = router;
