const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes"); // Authentication-related routes (register, login)
const userRoutes = require("./routes/userRoutes"); // User-related routes (profile, etc.)
const quizRoutes = require("./routes/quizRoutes");
const takeQuizRoutes = require("./routes/takeQuizRoutes");
const scoreRoutes = require("./routes/scoreRoutes");
const statsRoutes = require("./routes/statsRoutes");


dotenv.config();

app.use(express.json());
app.use(cors());

// Use the routes
app.use("/api/auth", authRoutes); 
app.use("/api/user", userRoutes); 
app.use("/api", quizRoutes);
app.use("/api/takeQuiz", takeQuizRoutes);
app.use("/api/score", scoreRoutes);
app.use("/api/stats", statsRoutes);

// Set up the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
