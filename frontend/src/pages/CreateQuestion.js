import React, { useState } from "react";
import "./CreateQuestion.css";

const CreateQuestion = () => {
  const [question, setQuestion] = useState("");
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [answers, setAnswers] = useState([{ answerContent: "", isCorrect: false }]);
  const [warning, setWarning] = useState(false);

  const handleQuestionSubmit = (e) => {
    e.preventDefault();

    // Count how many answers are marked as correct
    const correctAnswers = answers.filter((answer) => answer.isCorrect);

    if (!isMultipleChoice && correctAnswers.length > 1) {
      // If multiple choice is not selected and more than 1 answer is correct, show a warning
      setWarning(true);
      return;
    }

    // If form is valid (no more than 1 correct answer when not multiple choice)
    setWarning(false);

    // Here, you would make the request to the backend to save the question and answers
    alert("Question submitted successfully!");
  };

  const handleAddAnswer = () => {
    setAnswers([...answers, { answerContent: "", isCorrect: false }]);
  };

  const handleAnswerChange = (index, e) => {
    const newAnswers = [...answers];
    newAnswers[index][e.target.name] = e.target.value;
    setAnswers(newAnswers);
  };

  const handleCorrectAnswerChange = (index) => {
    const newAnswers = [...answers];
    if (isMultipleChoice) {
      // Multiple choice allows multiple answers to be correct
      newAnswers[index].isCorrect = !newAnswers[index].isCorrect;
    } else {
      // When not multiple choice, only allow 1 correct answer
      newAnswers.forEach((answer, i) => {
        if (i !== index) answer.isCorrect = false;
      });
      newAnswers[index].isCorrect = !newAnswers[index].isCorrect;
    }
    setAnswers(newAnswers);
  };

  return (
    <div className="create-quiz-container">
      <h2>Add Question to Quiz</h2>
      <form onSubmit={handleQuestionSubmit} className="create-quiz-form">
        <div className="form-group">
          <label htmlFor="question">Question Content</label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />
        </div>

        <label htmlFor="isMultipleChoice" className="multiple-choice-label">
          Multiple Choice?
          <input
            type="checkbox"
            id="isMultipleChoice"
            checked={isMultipleChoice}
            onChange={() => setIsMultipleChoice(!isMultipleChoice)}
          />
        </label>

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
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isCorrect"
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

        <button type="submit" className="submit-button">
          Submit Question
        </button>

        {warning && (
          <div className="warning">
            <p>You can only mark one answer as correct when "Multiple Choice" is not selected.</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateQuestion;
