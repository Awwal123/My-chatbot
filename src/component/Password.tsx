import React, { useRef } from "react";
import PasswordToggle from "./PasswordToggle";

interface PasswordProps {
  value: string;
  required?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Password: React.FC<PasswordProps> = ({ value, onChange }) => {
  const passwordRef = useRef<HTMLInputElement>(null);

  return (
    <div className="input--container">
      <p className="labels">Password</p>
      <div className="password--wrapper">
        <input
          className="input-box"
          type="password"
          placeholder="Enter your password"
          value={value}
          onChange={onChange}
          ref={passwordRef}
        />
        <PasswordToggle inputRef={passwordRef} />
      </div>
    </div>
  );
};

export default Password;
