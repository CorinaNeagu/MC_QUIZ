import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import './CreateQuestion.css'

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
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState([]); 
  const [questionCount, setQuestionCount] = useState(0);
  const [questionAnswers, setQuestionAnswers] = useState({}); 
  const [pointsPerQuestion, setPointsPerQuestion] = useState(0);  // Changed state to reflect points per question
  const [deductionPercentage, setDeductionPercentage] = useState(0); // New state for deduction

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to view the questions.");
        return;
      }
  
      const response = await axios.get(
        `http://localhost:5000/api/questions/${quizId}`, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (response.data && response.data.questions) {
        // Make sure to sanitize questionId for each question
        const sanitizedQuestions = response.data.questions.map(question => ({
          ...question,
          question_id: Number(question.question_id),  // Ensure it's treated as a number
        }));
  
        setQuestions(sanitizedQuestions);
      } else {
        console.error("No questions found in the response data");
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
      alert(err.response ? err.response.data.message : "There was an error fetching the questions.");
    }
  };
  

  // Fetch answers for a specific question
  const fetchAnswers = async (questionId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to view the answers.");
        return;
      }
  
      // Ensure questionId is treated as a number before making the request
      const sanitizedQuestionId = Number(questionId);
  
      const response = await axios.get(
        `http://localhost:5000/api/answers/${sanitizedQuestionId}`, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (response.data && response.data.answers) {
        setQuestionAnswers((prevState) => ({
          ...prevState,
          [sanitizedQuestionId]: response.data.answers, 
        }));
      } else {
        console.error("No answers found in the response data");
      }
    } catch (err) {
      console.error("Error fetching answers:", err);
      alert(err.response ? err.response.data.message : "There was an error fetching the answers.");
    }
  };
  

  useEffect(() => {
    fetchQuestions();
  }, [quizId]);

  useEffect(() => {
    questions.forEach((question) => {
      fetchAnswers(question.question_id);
    });
  }, [questions]);

  const handleAnswerChange = (index, event) => {
    const newAnswers = [...answers];
    newAnswers[index][event.target.name] = event.target.value;
    setAnswers(newAnswers);
  };

  const handleCheckboxChange = (index) => {
    const newAnswers = [...answers];
    newAnswers[index].isCorrect = !newAnswers[index].isCorrect;
  
    console.log("Updated Answer:", newAnswers[index]);  // Debugging line
  
    if (!isMultipleChoice) {
      newAnswers.forEach((answer, i) => {
        if (i !== index) {
          answer.isCorrect = false;  // Uncheck other answers
        }
      });
    }
  
    setAnswers(newAnswers);
  };
  
  
  
  const handleMultipleChoiceChange = () => {
    setIsMultipleChoice(!isMultipleChoice);

    if (!isMultipleChoice) {
      const clearedAnswers = answers.map((answer) => ({
        ...answer,
        isCorrect: false, 
      }));
      setAnswers(clearedAnswers);
    }
  };

  const handleAddAnswer = () => {
    const newAnswer = { answerContent: "", isCorrect: false, score: pointsPerQuestion }; // Assign pointsPerAnswer to new answer
    setAnswers([...answers, newAnswer]);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
  
    if (!questionContent) {
      setError("Question content is required.");
      return;
    }
  
    if (questionCount >= noQuestions) {
      alert("You have reached the maximum number of questions.");
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to create a question.");
        return;
      }
  
      // Create the question and ensure the `questionId` is a number
      const questionResponse = await axios.post(
        "http://localhost:5000/api/questions",
        {
          quizId,
          questionContent,
          isMultipleChoice,
          pointsPerQuestion, // Pass pointsPerQuestion to backend
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      // Ensure questionId is treated as a number
      const questionId = Number(questionResponse.data.questionId);
  
      // Send the answers to the backend, including the calculated score
      for (let answer of answers) {
        await axios.post(
          "http://localhost:5000/api/answers",
          {
            questionId: questionId,
            answerContent: answer.answerContent,
            isCorrect: !!answer.isCorrect,
            score: answer.isCorrect ? answer.score : 0,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
      setQuestionCount(questionCount + 1);
  
      fetchQuestions();
      fetchAnswers(questionId);

      setQuestionContent("");
      setAnswers([
        { answerContent: "", isCorrect: false, score: 0 },
        { answerContent: "", isCorrect: false, score: 0 },
      ]);
      setIsMultipleChoice(false);
      setPointsPerQuestion(0);  // Reset points per question to 0
      setError("");  // Clear error message
  
    } catch (err) {
      console.error("Error creating question:", err);
      alert(err.response ? err.response.data.message : "There was an error creating the question.");
    }
  };
  
  

  const handlePointsChange = (e) => {
    const value = parseInt(e.target.value, 10) || 0;
    setPointsPerQuestion(value);
    setAnswers(answers.map(answer => ({ ...answer, score: value })));  // Update points for answers
  };

  const handleSubmitQuiz = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to submit the quiz.");
        return;
      }

      const allQuestions = questions.map((question) => ({
        quizId,
        questionContent: questionContent,
        isMultipleChoice,
        answers: answers.map((answer) => ({
          answerContent: answer.answerContent,
          isCorrect: !!answer.isCorrect,
          score: answer.isCorrect ? answer.score : 0,
        })),
      }));
  
      navigate("/quizPreview", { state: { quizId } });

      alert("Quiz submitted successfully! You are now viewing the quiz preview.");
  
    } catch (err) {
      console.error("Error submitting quiz:", err);
      alert(err.response ? err.response.data.message : "There was an error submitting the quiz.");
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to delete a question.");
        return;
      }
  
      const confirmed = window.confirm("Are you sure you want to delete this question?");
      if (!confirmed) return;
  
      // Delete the question from the backend
      await axios.delete(`http://localhost:5000/api/delete/${questionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      // Remove the deleted question from state
      setQuestions((prevQuestions) =>
        prevQuestions.filter((q) => q.question_id !== questionId)
      );
  
      // Remove its corresponding answers from state
      setQuestionAnswers((prevAnswers) => {
        const updatedAnswers = { ...prevAnswers };
        delete updatedAnswers[questionId];
        return updatedAnswers;
      });
  
      alert("Question deleted successfully.");
    } catch (err) {
      console.error("Error deleting question:", err);
      alert(
        err.response
          ? err.response.data.message
          : "There was an error deleting the question."
      );
    }
  };
  
  
  
  return (
    <div className="create-question-container">
      {/* Points per Answer Input */}
        <div className="form-group">
          <label>Points per Question</label>
            <input
            type="number"
            value={pointsPerQuestion}
            onChange={handlePointsChange}
            placeholder="Enter points for this question"
          />
        </div>

    
      <div className="quiz-content-wrapper">
        <form onSubmit={handleAddQuestion} className="create-question-form-wrapper">
          <div className="form-group">
            <label>Question Content</label>
            <textarea
              type="text"
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
                className="checkbox-input"
              />
              <label htmlFor="multipleChoice" className="checkbox-label">Yes</label>
            </div>
          </div>

          {answers.map((answer, index) => (
          <div key={index} className="answer-group">
            <textarea
              type="text"
              name="answerContent"
              value={answer.answerContent}
              onChange={(e) => handleAnswerChange(index, e)}
              placeholder={`Answer Option ${index + 1}`}
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
              <div className="checkbox-custom"></div> {/* Custom checkbox */}
              <label htmlFor={`correctCheckbox-${index}`} className="checkbox-label-text">Yes</label>
            </div>
          </label>
          </div>
        ))}

          <div className="form-group">
            <button type="button" 
            onClick={handleAddAnswer}
            disabled={questions.length >= noQuestions}
            >
              Add Answer
            </button>
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="form-group">
            <button type="submit" disabled={questions.length >= noQuestions}>
              {questionCount >= noQuestions ? "Maximum Questions Reached" : "Add Question"}
            </button>
          </div>

           {/* Submit Quiz Button */}
        <div className="form-group">
          <button type="button" onClick={handleSubmitQuiz}>
            Submit Quiz
          </button>
        </div>
        </form>

        <div className="added-questions">
          <h3>Added Questions:</h3>
          {questions && questions.length > 0 ? (
            <ul>
              {questions.map((question) => (
                <li key={question.question_id}>

                <strong>{question.question_content}</strong>
                <button
                  style={{ marginLeft: "10px", color: "red" }}
                  onClick={() => handleDeleteQuestion(question.question_id)}
                >
                  Delete
                </button>
                
                {questionAnswers[question.question_id] && questionAnswers[question.question_id].length > 0 ? (
                  <ul>
                    {questionAnswers[question.question_id].map((answer) => (
                      <li key={answer.answer_id}>
                        {answer.answer_content} - {answer.is_correct ? "Correct" : "Incorrect"} - Score: {answer.score}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No answers yet.</p>
                )}
                
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
