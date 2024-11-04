import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { isJwtExpired } from "jwt-check-expiration";

const AuthCheck: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkTokenValidity = () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/signup?no-auth=true");
        return;
      }

      try {
        if (isJwtExpired(token)) {
          navigate("/login?no-auth=true");
        }
      } catch (error) {
        console.error("Token decoding failed:", error);
        alert("An error occurred while checking your session. Please log in again.");
        navigate("/login?auth-required=true");
      }
    };

    checkTokenValidity();
  }, [navigate]);

  return <Outlet />;
};

export default AuthCheck;
