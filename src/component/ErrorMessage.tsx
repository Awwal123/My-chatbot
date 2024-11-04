import React from "react";
import "./styles.css";

interface ErrorMessageProps {
  message?: string; // message is optional
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  return <div className="error-message">{message}</div>;
};

export default ErrorMessage;
