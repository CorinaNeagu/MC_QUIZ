import React, { useState } from "react";
import "./CreateQuestion.css";

const CreateQuestion = () => {
  const [question, setQuestion] = useState("");
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [answers, setAnswers] = useState([{ answerContent: "", isCorrect: false }]);
  const [warning, setWarning] = useState("");

  const handleQuestionSubmit = (e) => {
    e.preventDefault();

    const correctAnswersCount = answers.filter((answer) => answer.isCorrect).length;

    if (!isMultipleChoice && correctAnswersCount !== 1) {
      setWarning("You must select exactly one correct answer.");
      return;
    }

    setWarning("");
    alert("Question added successfully!");
  };

  const handleAddAnswer = () => {
    setAnswers([...answers, { answerContent: "", isCorrect: false }]);
  };

  const handleAnswerChange = (index, e) => {
    const { name, value } = e.target;
    setAnswers((prevAnswers) =>
      prevAnswers.map((answer, i) => (i === index ? { ...answer, [name]: value } : answer))
    );
  };

  const handleCorrectAnswerChange = (index) => {
    setAnswers((prevAnswers) =>
      prevAnswers.map((answer, i) =>
        isMultipleChoice
          ? i === index
            ? { ...answer, isCorrect: !answer.isCorrect }
            : answer
          : { ...answer, isCorrect: i === index } // Only one correct answer allowed
      )
    );
  };

  const handleMultipleChoiceChange = () => {
    setIsMultipleChoice(!isMultipleChoice);
    if (!isMultipleChoice) {
      // Reset multiple correct answers when switching to single choice
      setAnswers((prevAnswers) =>
        prevAnswers.map((answer, i) => ({ ...answer, isCorrect: i === 0 }))
      );
    }
  };

  return (
    <div className="create-quiz-container">
      <h2>Add Questions to Quiz</h2>
      <div className="create-quiz-form-wrapper">
        <form onSubmit={handleQuestionSubmit} className="create-quiz-form">
          <div className="form-group">
            <label htmlFor="question">Question Content</label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              placeholder="Enter your question here"
            />
          </div>

          <div className="multiple-choice-label">
            <label htmlFor="isMultipleChoice">Multiple Choice?</label>
            <input
              type="checkbox"
              id="isMultipleChoice"
              checked={isMultipleChoice}
              onChange={handleMultipleChoiceChange}
            />
          </div>

          {answers.map((answer, index) => (
            <div key={index} className="answer-container">
              <label htmlFor={`answer-${index}`}>Answer {index + 1}</label>
              <input
                type="text"
                name="answerContent"
                id={`answer-${index}`}
                value={answer.answerContent}
                onChange={(e) => handleAnswerChange(index, e)}
                required
                placeholder={`Enter answer ${index + 1}`}
              />
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={answer.isCorrect}
                  onChange={() => handleCorrectAnswerChange(index)}
                />
                Mark as Correct
              </label>
            </div>
          ))}

          <button type="button" onClick={handleAddAnswer}>
            Add Another Answer
          </button>

          {warning && <div className="warning">{warning}</div>}

          <button type="submit" className="submit-button">
            Submit Question
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateQuestion;
