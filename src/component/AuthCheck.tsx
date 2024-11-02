import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { isJwtExpired } from "jwt-check-expiration";

const AuthCheck: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signup?no-auth=true");
    } else {
      try {
        const hasExpired = isJwtExpired(token);

        if (hasExpired) {
          navigate("/login?no-auth=true");
        }
      } catch (error) {
        alert("An error occurred");
        console.error("Token decoding failed", error);
        navigate("/login?auth-required=true");
      }
    }
  }, [navigate]);

  return <Outlet />;
};

export default AuthCheck;
