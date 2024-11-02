// PasswordToggle.tsx
import React, { useState, useEffect, RefObject } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

interface PasswordToggleProps {
  inputRef: RefObject<HTMLInputElement>;
}

const PasswordToggle: React.FC<PasswordToggleProps> = ({ inputRef }) => {
  const [visible, setVisible] = useState(false);

  const toggleVisibility = () => {
    setVisible(!visible);
  };

  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.type = visible ? "text" : "password";
    }
  }, [visible, inputRef]);

  return (
    <FontAwesomeIcon
      icon={visible ? faEyeSlash : faEye}
      onClick={toggleVisibility}
      style={{ cursor: 'pointer', position: 'absolute', right: '1rem', top: '40%', transform: 'translateY(-50%)' }}
    />
  );
};

export default PasswordToggle;
