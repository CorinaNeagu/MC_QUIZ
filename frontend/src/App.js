import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage/LandingPage";
import Register from "./components/Register";
import Login from "./components/Login";
import HomePage from './pages/HomePage/HomePage';
import UserProfile from "./pages/UserProfile/UserProfile";
import CreateQuiz from "./pages/CreateQuiz";
import CreateQuestion from "./pages/CreateQuestion";
import DisplayQuestion from "./pages/DisplayQuestion/DisplayQuestion";
import ScorePage from "./pages/ScorePage/ScorePage";

function App() {
  return (
  
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} /> {/* Make sure this is defined */}
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile" element={<UserProfile />} />  
        <Route path="/create-quiz" element={<CreateQuiz />} /> {/* Route for Create Quiz */} 
        <Route path="/create-question/:quizId" element={<CreateQuestion />} />
        <Route path="/quiz/:quizId" element={<DisplayQuestion />} />
        <Route path="/score/:attemptId" element={<ScorePage />} />

      </Routes>
    </Router>
  );
}

export default App;
