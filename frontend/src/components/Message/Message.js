import React from 'react';

export const ErrorMessage = ({ message }) => (
  <div className="message message-error" role="alert" aria-live="assertive">
    <svg
      className="message-icon"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
    <span>{message}</span>
  </div>
);

export const SuccessMessage = ({ message }) => (
  <div className="message message-success" role="alert" aria-live="polite">
    <svg
      className="message-icon"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
    <span>{message}</span>
  </div>
);
