import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import './CreateQuestion.css';

const CreateQuestion = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { quizId, professor_id, noQuestions, category } = location.state;

  const [questionContent, setQuestionContent] = useState("");
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [answers, setAnswers] = useState([
    { answerContent: "", isCorrect: false, score: 0 },
    { answerContent: "", isCorrect: false, score: 0 },
  ]);
  const [questions, setQuestions] = useState([]);
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [pointsPerQuestion, setPointsPerQuestion] = useState(0);
  const [error, setError] = useState("");

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5000/api/questions/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.questions) {
        const sanitized = res.data.questions.map(q => ({
          ...q,
          question_id: Number(q.question_id),
        }));

        setQuestions(sanitized);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to fetch questions.");
    }
  };

  const fetchAnswers = async (questionId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5000/api/answers/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.answers) {
        setQuestionAnswers(prev => ({ ...prev, [questionId]: res.data.answers }));
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to fetch answers.");
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [quizId]);

  useEffect(() => {
    questions.forEach((q) => fetchAnswers(q.question_id));
  }, [questions]);

  const handleAnswerChange = (index, e) => {
    const newAnswers = [...answers];
    newAnswers[index][e.target.name] = e.target.value;
    setAnswers(newAnswers);
  };

  const handleCheckboxChange = (index) => {
    const updated = answers.map((a, i) => ({
      ...a,
      isCorrect: isMultipleChoice
        ? (i === index ? !a.isCorrect : a.isCorrect) // Only toggle the selected answer
        : (i === index ? true : false) // For single choice, set only the selected one to true
    }));
  
    // If it's single-choice, uncheck other answers
    if (!isMultipleChoice) {
      updated.forEach((a, i) => {
        if (i !== index) {
          a.isCorrect = false;
        }
      });
    }
  
    setAnswers(updated);
  };
  

  const handleMultipleChoiceChange = () => {
    setIsMultipleChoice(!isMultipleChoice);
    setAnswers(answers.map(a => ({ ...a, isCorrect: false })));
  };

  const handleAddAnswer = () => {
    setAnswers([...answers, { answerContent: "", isCorrect: false, score: pointsPerQuestion }]);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!questionContent) {
      return setError("Question content is required.");
    }
    if (questions.length >= noQuestions) return;

    const isAnyAnswerCorrect = answers.some(a => a.isCorrect);
    if (!isAnyAnswerCorrect) {
      return alert("At least one answer must be marked as correct.");
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/questions",
        {
          quizId,
          questionContent,
          isMultipleChoice,
          pointsPerQuestion,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const questionId = Number(res.data.questionId);

      await Promise.all(
        answers.map((a) =>
          axios.post(
            "http://localhost:5000/api/answers",
            {
              questionId,
              answerContent: a.answerContent,
              isCorrect: !!a.isCorrect,
              score: a.isCorrect ? a.score : 0,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );

      setQuestionContent("");
      setAnswers([
        { answerContent: "", isCorrect: false, score: 0 },
        { answerContent: "", isCorrect: false, score: 0 },
      ]);
      setIsMultipleChoice(false);
      setPointsPerQuestion(0);
      setError("");

      fetchQuestions();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to create question.");
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    const confirm = window.confirm("Are you sure you want to delete this question?");
    if (!confirm) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/delete/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setQuestions(prev => prev.filter(q => q.question_id !== questionId));
      setQuestionAnswers(prev => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete question.");
    }
  };

  const handlePointsChange = (e) => {
    const val = parseInt(e.target.value);
    
    // Check if the value is a positive number
    if (val <= 0 || isNaN(val)) {
      setError("Points per question must be a positive number.");
    } else {
      setError(""); // Clear the error if valid
      setPointsPerQuestion(val); // Set the points per question
      setAnswers(answers.map(a => ({ ...a, score: val }))); // Update the score for each answer
    }
  };

  const handleSubmitQuiz = () => {
    navigate("/quizPreview", { state: { quizId } });
  };

  const canAddMore = questions.length < noQuestions;

  return (
    <div className="create-question-container">
      <div className="form-group">
        <label>Points per Question</label>
        <input
          type="number"
          value={pointsPerQuestion}
          onChange={handlePointsChange}
          placeholder="Enter points"
          required
          min="1" 
        />
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="quiz-content-wrapper">
        <form onSubmit={handleAddQuestion} className="create-question-form-wrapper">
          <div className="form-group">
            <label>Question Content</label>
            <textarea
              value={questionContent}
              onChange={(e) => setQuestionContent(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Is this a multiple-choice question?</label>
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                id="multipleChoice"
                checked={isMultipleChoice}
                onChange={handleMultipleChoiceChange}
              />
              <label htmlFor="multipleChoice">Yes</label>
            </div>
          </div>

          {answers.map((answer, index) => (
  <div key={index} className="answer-group">
    <textarea
      name="answerContent"
      value={answer.answerContent}
      onChange={(e) => handleAnswerChange(index, e)}
      placeholder={`Answer ${index + 1}`}
      required
    />

    <label className="checkbox-label">
      Correct:
      <div className="checkbox-wrapper">
        <input
          type="checkbox"
          id={`correctCheckbox-${index}`}
          checked={answer.isCorrect}
          onChange={() => handleCheckboxChange(index)}
          className="checkbox-input"
        />
        <div className="checkbox-custom"></div>
      </div>
    </label>
  </div>
))}


          <div className="form-group">
            <button
              type="button"
              onClick={handleAddAnswer}
              disabled={!canAddMore}
            >
              Add Answer
            </button>
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="form-group">
            <button 
              type="submit" 
              disabled={!canAddMore}>
              {canAddMore ? "Submit Question" : "Maximum Questions Reached"}
            </button>
          </div>

          <div className="form-group">
            <button type="button" onClick={handleSubmitQuiz}>
              Submit Quiz
            </button>
          </div>
        </form>

        <div className="added-questions">
          <h3>Added Questions:</h3>
          {questions.length > 0 ? (
            <ul>
              {questions.map((q) => (
                <li key={q.question_id}>
                  <strong>{q.question_content}</strong>
                  <button onClick={() => handleDeleteQuestion(q.question_id)} style={{ color: "red", marginLeft: "10px" }}>
                    Delete
                  </button>
                  <ul>
                    {(questionAnswers[q.question_id] || []).map((a) => (
                      <li key={a.answer_id}>
                        {a.answer_content} - {a.is_correct ? "Correct" : "Incorrect"} - Score: {a.score}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p>No questions added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateQuestion;
