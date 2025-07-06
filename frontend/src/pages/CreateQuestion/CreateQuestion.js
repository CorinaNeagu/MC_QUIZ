import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import './CreateQuestion.css';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';

const CreateQuestion = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { quizId, professor_id, noQuestions, category} = location.state;
  const modalGroupId = location.state?.assignToGroupId;

  const [questionContent, setQuestionContent] = React.useState("");

  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [answers, setAnswers] = useState([
    { answerContent: "", isCorrect: false, score: 0 },
    { answerContent: "", isCorrect: false, score: 0 },
  ]);
  const [questions, setQuestions] = useState([]);
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [pointsPerQuestion, setPointsPerQuestion] = useState(0);
  const [error, setError] = useState("");
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [originalQuestionData, setOriginalQuestionData] = useState(null); // Store the original data

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
  
    // Validation
    if (!questionContent) {
      return setError("Question content is required.");
    }
  
    if (questions.length >= noQuestions) return;
  
    const isAnyAnswerCorrect = answers.some((a) => a.isCorrect);
    if (!isAnyAnswerCorrect) {
      return alert("At least one answer must be marked as correct.");
    }
  
    try {
      const token = localStorage.getItem("token");
  
      // Create the question
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
  
      // Calculate score for correct answers only
      const correctCount = answers.filter((a) => a.isCorrect).length;
      const scorePerCorrect = correctCount > 0 ? pointsPerQuestion / correctCount : 0;
  
      console.log(`Correct Answers Count: ${correctCount}`);
      console.log(`Score Per Correct Answer: ${scorePerCorrect}`);
  
      for (let a of answers) {
        console.log('Sending answer: ', a); 
  
        await axios.post(
          "http://localhost:5000/api/answers",
          {
            questionId,
            answerContent: a.answerContent,
            isCorrect: !!a.isCorrect,
            score: a.isCorrect ? scorePerCorrect : 0, 
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
  
      setQuestionContent("");
      setAnswers([
        { answerContent: "", isCorrect: false, score: 0 },
        { answerContent: "", isCorrect: false, score: 0 },
      ]);
      setIsMultipleChoice(false);
      setError("");
  
      fetchQuestions(); // Refresh list
    } catch (err) {
      console.error("Error: ", err);
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
    }
  };

  const handleEditQuestion = (questionId) => {
    setEditingQuestionId(questionId);
    const questionToEdit = questions.find(q => q.question_id === questionId);
    
    if (questionToEdit) {
      setQuestionContent(questionToEdit.question_content);
      setIsMultipleChoice(questionToEdit.is_multiple_choice);
      setPointsPerQuestion(questionToEdit.points_per_question);
  
      const currentAnswers = questionAnswers[questionId] || [];
      setAnswers(currentAnswers.map(answer => ({
        answerContent: answer.answer_content,
        isCorrect: answer.is_correct,
        score: answer.score,
      })));
    }
  };

  const handleSaveEdit = async () => {
    if (!questionContent) {
      return setError("Question content is required.");
    }

    if (!answers.some((a) => a.isCorrect)) {
      return alert("At least one answer must be marked as correct.");
    }

    const correctAnswers = answers.filter(a => a.isCorrect);
    const scorePerCorrectAnswer = correctAnswers.length > 0
      ? pointsPerQuestion / correctAnswers.length
      : 0;

    const updatedAnswers = answers.map(a => ({
      ...a,
      score: a.isCorrect ? scorePerCorrectAnswer : 0,
    }));

    try {
      const token = localStorage.getItem("token");

      const res = await axios.put(
        `http://localhost:5000/api/questions/${editingQuestionId}`,
        {
          questionContent,
          isMultipleChoice,
          pointsPerQuestion,
          answers: updatedAnswers.map((answer, index) => ({
            answerId: questionAnswers[editingQuestionId][index]?.answer_id,
            answerContent: answer.answerContent,
            isCorrect: answer.isCorrect,
            score: answer.score,
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(res.data.message);
      setQuestionContent(""); // Clear question content
      setAnswers([
        { answerContent: "", isCorrect: false, score: 0 },
        { answerContent: "", isCorrect: false, score: 0 }
      ]); // Clear answers
      setIsMultipleChoice(false); // Reset multiple choice
      setError(""); // Clear any error messages
      setEditingQuestionId(null); // Reset editing mode
      fetchQuestions(); // Refresh the questions list
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update question.");
    }
};

const handleDiscardChanges = () => {
  setQuestionContent(originalQuestionData?.questionContent);
  setAnswers(originalQuestionData?.answers || []);
  setEditingQuestionId(null); 
  setQuestionContent("");
  setIsMultipleChoice(false)
  setError("")
  setAnswers([
    { answerContent: "", isCorrect: false, score: 0 },
    { answerContent: "", isCorrect: false, score: 0 }
  ]); 
}

  const handleSubmitQuiz = () => {
    if (questions.length !== noQuestions) {
      alert(`You must add exactly ${noQuestions} question(s) before submitting.`);
      return;
    }
    navigate("/quizPreview", { state: { assignToGroupId: modalGroupId, quizId } });
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
        <CodeMirror
          value={questionContent}
          height="200px"
          width="500px"
          extensions={[html()]} 
          onChange={(value) => setQuestionContent(value)}
          basicSetup={{ lineNumbers: true }}
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
                className="checkbox-custom"
              />
                Yes
            </div>
          </div>

          {answers.map((answer, index) => (
            <div key={index} className="answer-group">
              <CodeMirror
                value={answer.answerContent}
                height="100px"
                width="700px"
                extensions={[html()]}
                onChange={(value) => {
                  const newAnswers = [...answers];
                  newAnswers[index].answerContent = value;
                  setAnswers(newAnswers);
                }}
                basicSetup={{ lineNumbers: true }}
              />
              <label className="checkboxLabel">
                
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id={`correctCheckbox-${index}`}
                    checked={answer.isCorrect}
                    onChange={() => handleCheckboxChange(index)}
                          className="checkbox-input"
                  />
                  Correct:
                  <label htmlFor={`correctCheckbox-${index}`} className="checkbox-custom"></label>
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
            <button 
              type="submit" 
              disabled={!canAddMore}>
              {canAddMore ? "Submit Question" : "Maximum Questions Reached"}
            </button>

            <button type="button" onClick={handleSubmitQuiz}>
              Submit Quiz
            </button>
          </div>

          {error && <p className="error-message">{error}</p>}

            
        </form>

      

    <div className="added-questions">
  <h3>Added Questions:</h3>

  {questions.length > 0 ? (
    <ul className="questions-list">
      {questions.map((q, index) => (
        <li key={q.question_id} className="question-item">
          <div className="question-content-wrapper">
            <pre className="question-text preformatted">{q.question_content}</pre>

            <div className="buttons-container">
              {editingQuestionId === q.question_id ? (
                <>
                  <button onClick={handleSaveEdit} className="btn btn-save">
                    Save Changes
                  </button>
                  <button onClick={handleDiscardChanges} className="btn btn-discard">
                    Discard Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleEditQuestion(q.question_id)}
                    className="btn btn-edit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(q.question_id)}
                    className="btn btn-delete"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          <ul className="answers-list">
            {(questionAnswers[q.question_id] || []).map((a) => (
              <li key={a.answer_id} className={`answer-item ${a.is_correct ? "correct" : "incorrect"}`}>
                <pre className="answer-text preformatted">{a.answer_content}</pre>
                <div className="answer-meta">
                  <span className="answer-correctness">{a.is_correct ? "Correct" : "Incorrect"}</span> - 
                  <span className="answer-score"> Score: {a.score}</span>
                </div>
              </li>
            ))}
          </ul>

          {index < questions.length - 1 && <hr className="question-divider" />}
        </li>
      ))}
    </ul>
  ) : (
    <p className="no-questions-msg">No questions added yet.</p>
  )}
</div>




      </div>
    </div>
  );
};

export default CreateQuestion;