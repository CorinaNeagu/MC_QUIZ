const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db"); // Assuming you have a DB connection file
const router = express.Router();

// REGISTER USER (Student or Professor)
router.post("/register", async (req, res) => {
    const { username, email, password, userType } = req.body;

    // Validate input fields
    if (!username || !email || !password || !userType) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (userType !== "student" && userType !== "professor") {
        return res.status(400).json({ message: "Invalid user type" });
    }

    try {
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

            // Insert the user into the correct table based on userType
            const insertQuery =
                userType === "student"
                    ? `INSERT INTO Student (username, email, password) VALUES (?, ?, ?)`
                    : `INSERT INTO Professor (username, email, password) VALUES (?, ?, ?)`;

            db.query(insertQuery, [username, email, hashedPassword], (err, result) => {
                if (err) {
                    console.error("Error inserting user:", err);
                    return res.status(500).json({ message: "Error registering user", error: err });
                }

                // Create a unique user_id that is either a student_id or professor_id
                const userId = `${userType}_${result.insertId}`;  // Prefix user_id with the userType and insertId

                // Respond with success and include the user_id (student or professor)
                return res.status(201).json({
                    message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} registered successfully!`,
                    user_id: userId,  // Return the user_id
                    userType,  // Return the userType (either 'student' or 'professor')
                });
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

    // Validate input fields
    if (!email || !password || !userType) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (userType !== "student" && userType !== "professor") {
        return res.status(400).json({ message: "Invalid user type" });
    }

    try {
        const table = userType === "student" ? "Student" : "Professor";
        const idField = userType === "student" ? "student_id" : "professor_id";  

        const query = `SELECT * FROM ${table} WHERE email = ?`;
        db.query(query, [email], async (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ message: "Database error" });
            }

            if (results.length === 0) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            const user = results[0];

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            const token = jwt.sign(
                { id: user.student_id || user.professor_id, userType },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            const response = {
                message: "Login successful",
                token,
                student_id: user.student_id || null, 
                professor_id: user.professor_id || null, 
                userType,
            };

            return res.status(200).json(response);
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Server error during login" });
    }
});



module.exports = router;
