import React from "react";
import "./styles.css";

interface PopupMessageProps {
    message: string;
    // Add className to the props
    className?: string; // Make it optional if not always required
  }

  const PopupMessage: React.FC<PopupMessageProps> = ({ message, className }) => {
    return (
      <div className={`popup-message ${className}`}>
        {message}
      </div>
    );
  };

export default PopupMessage;
