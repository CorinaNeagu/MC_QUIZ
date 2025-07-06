const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
const path = require('path');

const authRoutes = require("./routes/authRoutes"); 
const userRoutes = require("./routes/userRoutes"); 
const quizRoutes = require("./routes/quizRoutes");
const takeQuizRoutes = require("./routes/takeQuizRoutes");
const scoreRoutes = require("./routes/scoreRoutes");
const statsRoutes = require("./routes/statsRoutes");
const groupRoutes = require("./routes/groupRoutes");
const groupDetails = require("./routes/groupDetails");


dotenv.config();

app.use(express.json());
app.use(cors());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use the routes
app.use("/api/auth", authRoutes); 
app.use("/api/user", userRoutes); 
app.use("/api", quizRoutes);
app.use("/api/takeQuiz", takeQuizRoutes);
app.use("/api/score", scoreRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/group/details", groupDetails);

// Set up the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
