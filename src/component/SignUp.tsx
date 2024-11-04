import React, { useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./styles.css";
import Password from "./Password";
import PopupMessage from "./PopupMessage";
import CapitalizeName from "./CapitalizeName";
import { useUser } from "./UserContext";
import { baseUrl } from "./constants";
import { User } from "./UserContext";
import { auth, googleProvider } from "../config/firebase";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";

export default function SignUp() {
  const [email, setEmail] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorEmail, setErrorEmail] = useState<string>("");
  const [errorFullName, setErrorFullName] = useState<string>("");
  const [errorPassword, setErrorPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>("");
  const navigate = useNavigate();
  const { setUser } = useUser();

  // Function to register user on Firebase
  const signIn = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      if (err instanceof Error) {
        setApiError(getFirebaseErrorMessage(err));
      } else {
        setApiError("An unexpected error occurred. Please try again.");
      }
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (user) {
        const userData: User = {
          email: user.email || "",
          fullName: user.displayName || "User",
          token: await user.getIdToken(),
        };

        setUser(userData);
        localStorage.setItem(
          "user",
          JSON.stringify({ email: user.email, fullName: user.displayName })
        );
        localStorage.setItem("token", userData.token);

        navigate("/ameerchatbox");
      }
    } catch (err) {
      if (err instanceof Error) {
        setApiError(getFirebaseErrorMessage(err));
      } else {
        setApiError("An unexpected error occurred. Please try again.");
      }
    }
  };

  const getFirebaseErrorMessage = (error: Error): string => {
    switch (error.message) {
      case "Firebase: Error (auth/email-already-in-use).":
        return "This email is already in use. Please choose another.";
      case "Firebase: Error (auth/invalid-email).":
        return "The email address is not valid.";
      case "Firebase: Error (auth/weak-password).":
        return "The password is too weak. Please use a stronger password.";
      default:
        return "An unknown error occurred. Please try again.";
    }
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) =>
    setEmail(e.target.value);
  const handleFullNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    setFullName(CapitalizeName(e.target.value));
  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) =>
    setPassword(e.target.value);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    let valid = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setErrorEmail("Please enter a valid email.");
      valid = false;
    } else {
      setErrorEmail("");
    }

    if (!fullName) {
      setErrorFullName("Please enter your full name.");
      valid = false;
    } else {
      setErrorFullName("");
    }

    if (!password || password.length < 6) {
      setErrorPassword("Password must be at least 6 characters.");
      valid = false;
    } else {
      setErrorPassword("");
    }

    if (!valid) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${baseUrl}/api/v1/auth/user/register`,
        {
          full_name: fullName,
          email,
          password,
        }
      );

      const responseData = response.data.data;
      const userToken = responseData.token;

      if (!response.data.error) {
        setShowPopup(true);
        const userData: User = { email, fullName, token: userToken };
        setUser(userData);

        localStorage.setItem("user", JSON.stringify({ email, fullName }));
        localStorage.setItem("token", userToken);

        setTimeout(() => {
          setShowPopup(false);
          navigate("/ameerchatbox");
        }, 2000);
      }
    } catch (error: any) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setApiError(error.response.data.message);
      } else {
        setApiError("An error occurred while registering. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <h1 className="heading">Create an account</h1>
        <p className="first--paragraph">
          Gain unlimited access to ameerchatbot today!
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form--container">
            <div className="input--container">
              <p className="labels">Email Address</p>
              <input
                className="input--box"
                type="text"
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
              />
              {errorEmail && <p className="error-message">{errorEmail}</p>}
            </div>
            <div className="input--container">
              <p className="labels">Full Name</p>
              <input
                placeholder="Enter your full name"
                className="input--box"
                value={fullName}
                onChange={handleFullNameChange}
              />
              {errorFullName && (
                <p className="error-message">{errorFullName}</p>
              )}
            </div>
            <Password value={password} onChange={handlePasswordChange} />
            {errorPassword && <p className="error-message">{errorPassword}</p>}
            <div className="check-box-container">
              <div className="remember-me">
                <input type="checkbox" checked readOnly />
                <label className="rem">Remember Me</label>
              </div>
              <p className="forgot-pass">Forgot Password</p>
            </div>
            <button
              className="btn"
              type="submit"
              onClick={signIn}
              disabled={isLoading}
            >
              {isLoading ? "loading .." : "Sign Up"}
            </button>
            {apiError && <div className="error-message">{apiError}</div>}
            <div className="horizontal-wrapper">
              <hr className="horizontal-line" />
              <p className="horizontal-para">Or With</p>
            </div>
          </div>
          <div className="registration-alternatives">
            {/* <div className="btn-container" onClick={signInWithGoogle}>
              <img
                className="btns"
                src="./images/Google-icon.png"
                alt="google"
              />
              <p className="btn-text">Google</p>
            </div> */}
          </div>
        </form>

        {showPopup && (
          <PopupMessage
            message="Registration Successful🥳, You'll be redirected to the chatbox"
            className="show"
          />
        )}

        <button
          className="have-an-account-login"
          onClick={() => navigate("/login")}
        >
          <span className="have-an-account">Already have an account?</span>
          <span className="login">Login</span>
        </button>
      </div>
    </div>
  );
}
