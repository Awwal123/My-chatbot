import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { isJwtExpired } from "jwt-check-expiration";
import "./styles.css";
import Password from "./Password";
import { useUser } from "./UserContext";
import { baseUrl } from "./constants";

interface LoginProps {
  switchToSignUp: () => void;
}

interface UserData {
  email: string;
  fullName: string;
  token: string;
}

const Login: React.FC<LoginProps> = ({ switchToSignUp }) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { setUser } = useUser();

  // UseEffect to check JWT token expiration
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        if (isJwtExpired(token)) {
          setErrorMessage("Your session has expired. Please log in again.");
          setTimeout(() => {
            setErrorMessage("");
          }, 4000);
          navigate("/login");
        }
      } catch (error: any) {
        console.error(
          "An error occurred while checking the token expiration:",
          error.message
        );
        setErrorMessage(
          "An error occurred while checking your session. Please log in again."
        );
        setTimeout(() => {
          setErrorMessage("");
        }, 4000);
        navigate("/login");
      }
    }
  }, [navigate]);

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) =>
    setEmail(e.target.value);

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) =>
    setPassword(e.target.value);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${baseUrl}/api/v1/auth/user/authenticate`, {
        email,
        password,
      });

      const responseData = response.data.data;
      const userToken: string = responseData.token;
      const fullName: string = responseData.fullName;

      if (response.data.error) {
        setErrorMessage(response.data.message);
        setTimeout(() => {
          setErrorMessage("");
        }, 4000);
      } else {
        const userData: UserData = { email, fullName, token: userToken };
        setUser(userData);

        // Store user data in local storage
        localStorage.setItem("email", email);
        localStorage.setItem("fullName", fullName);
        localStorage.setItem("token", userToken);

        navigate("/ameerchatbox");
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("An error occurred. Please try again.");
      }

      setTimeout(() => {
        setErrorMessage("");
      }, 4000);
    }

    setIsLoading(false);
  };

  return (
    <div className="page">
      <div className="container">
        <h1 className="heading">Hi, Welcome Back!👋</h1>
        <p className="first--paragraph">
          Login to continue to ameerchatbot today!
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form--container">
            <div className="input--container">
              <p className="labels">Email</p>
              <input
                className="input--box"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
                required
              />
            </div>
          </div>

          <Password value={password} onChange={handlePasswordChange} required />

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <div className="check-box-container">
            <div className="remember-me">
              <input type="checkbox" checked readOnly />
              <label className="rem">Remember Me</label>
            </div>
            <p className="forgot-pass">Forgot Password</p>
          </div>

          <button className="btn" type="submit" disabled={isLoading}>
            {isLoading ? "loading .." : "Login"}
          </button>
        </form>

        <div className="horizontal-wrapper">
          <hr className="horizontal-line" />
          <p className="horizontal-para">Or With</p>
        </div>

        <button
          className="have-an-account-login"
          onClick={() => navigate("/signup")}
        >
          <span className="have-an-account">Don't have an account yet?</span>
          <span className="login">Sign Up</span>
        </button>
      </div>
    </div>
  );
};

export default Login;
