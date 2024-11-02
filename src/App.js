import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SignUp from "./component/SignUp";
import Login from "./component/Login";
import Ameerchatbox from "./component/Ameerchatbox";
import { UserProvider } from "./component/UserContext";
import "./component/styles.css";
import AuthCheck from "./component/AuthCheck";

export default function AppRouter() {
  const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    return token != null;
  };

  return (
    <Router>
      <UserProvider>
        <div className="App">
          <Routes>
            {/* Redirect from root path to signup */}
            <Route path="/" element={<Navigate to="/signup" />} />
            {/* SignUp route */}
            <Route path="/signup" element={<SignUp />} />
            {/* Login route */}
            <Route path="/login" element={<Login />} />
            {/* Authenticated routes */}
            <Route element={<AuthCheck />}>
              <Route path="ameerchatbox" element={<Ameerchatbox />} />
              <Route path="ameerchatbox/:id" element={<Ameerchatbox />} />
            </Route>
            {/* Redirect any other paths to signup */}
            <Route path="*" element={<Navigate to="/signup" />} />
          </Routes>
        </div>
      </UserProvider>
    </Router>
  );
}
