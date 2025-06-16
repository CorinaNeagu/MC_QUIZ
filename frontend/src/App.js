import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage/LandingPage";
import Register from "./components/Register/Register";
import Login from "./components/Login/Login";
import HomePage from './pages/HomePage/HomePage';
import UserProfile from "./pages/UserProfile/UserProfile";
import CreateQuiz from "./pages/CreateQuiz/CreateQuiz";
import QuizPreview from "./pages/QuizPreview/QuizPreview";
import CreateQuestion from "./pages/CreateQuestion/CreateQuestion";
import DisplayQuiz from "./pages/DisplayQuiz/DisplayQuiz";
import DisplayQuestion from "./pages/DisplayQuestion/DisplayQuestion";
import DisplayScore from "./pages/DisplayScore/DisplayScore";
import DisplayResponses from "./pages/DisplayResponses/DisplayResponses";
import ProfManageQuizzes from "./pages/ProfManageQuizzes/ProfManageQuizzes";
import UserStatistics from "./pages/UserStatistics/UserStatistics";
import Groups from "./pages/Groups/Groups";
import GroupDetails from "./pages/GroupDetails/GroupDetails"


function App() {
  return (
  
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile" element={<UserProfile />} /> 
        <Route path="/create-quiz" element={<CreateQuiz/>} /> 
        <Route path="/create-question/:quizId" element={<CreateQuestion/>} /> 
        <Route path="/quizPreview" element={<QuizPreview />} />
        <Route path="/quiz/:quizId" element={<DisplayQuiz />} />
        <Route path="/display-question/:quizId/:attemptId" element={<DisplayQuestion />} /> 
        <Route path="/display-score/:attemptId" element={<DisplayScore />} />
        <Route path="/responses/:attemptId" element={<DisplayResponses />} />
        <Route path = "/manage-quizzes" element = {<ProfManageQuizzes/>} />
        <Route path = "/stats" element = {<UserStatistics/>} />
        <Route path = "/groups" element = {<Groups/>} />
        <Route path = "/groups/:groupId/details" element = { <GroupDetails/>} />
       </Routes>
    </Router>
  );
}

export default App;
