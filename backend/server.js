const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes"); // Authentication-related routes (register, login)
const userRoutes = require("./routes/userRoutes"); // User-related routes (profile, etc.)
const app = express();

dotenv.config();

app.use(express.json());
app.use(cors());

// Use the routes
app.use("/api/auth", authRoutes); // Authentication routes (register, login)
app.use("/api/users", userRoutes); // User routes (profile, etc.)

// Set up the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
